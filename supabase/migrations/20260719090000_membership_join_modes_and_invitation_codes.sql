alter table public.organization_settings
  add column if not exists membership_join_mode text not null default 'manual' check (membership_join_mode in ('manual','automatic','invitation')),
  add column if not exists membership_registration_open boolean not null default true;

create table if not exists public.organization_membership_invitation_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  code text not null,
  label text,
  active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

alter table public.organization_membership_invitation_codes enable row level security;
drop policy if exists membership_invitation_codes_admin_all on public.organization_membership_invitation_codes;
create policy membership_invitation_codes_admin_all on public.organization_membership_invitation_codes
for all to authenticated
using (exists (select 1 from public.organization_admins a where a.organization_id=organization_membership_invitation_codes.organization_id and a.user_id=auth.uid()))
with check (exists (select 1 from public.organization_admins a where a.organization_id=organization_membership_invitation_codes.organization_id and a.user_id=auth.uid()));

create or replace function public.submit_membership_request_v2(
  p_organization_id text,p_first_name text,p_last_name text,p_email text,p_phone text default null,p_birth_date date default null,p_address text default null,p_comment text default null,p_custom_answers jsonb default '{}'::jsonb,p_invitation_code text default null
) returns table(request_id uuid,event_type text,membership_status text)
language plpgsql security definer set search_path=public as $$
declare v_mode text;v_open boolean;v_request_id uuid;v_person_id uuid;v_code_id uuid;v_email text:=lower(trim(p_email));
begin
  if nullif(trim(p_first_name),'') is null or nullif(trim(p_last_name),'') is null or nullif(v_email,'') is null then raise exception 'required_fields_missing'; end if;
  if not exists (select 1 from public.organization_modules m where m.organization_id=p_organization_id and m.module_id='members' and m.enabled=true) then raise exception 'members_module_disabled'; end if;
  select coalesce(s.membership_join_mode,'manual'),coalesce(s.membership_registration_open,true) into v_mode,v_open from public.organization_settings s where s.organization_id=p_organization_id;
  if not found then v_mode:='manual';v_open:=true;end if;
  if not v_open then raise exception 'membership_registration_closed'; end if;
  if exists (select 1 from public.organization_memberships m where m.organization_id=p_organization_id and lower(coalesce(m.email,''))=v_email and m.status='active') then raise exception 'already_active_member'; end if;
  if v_mode='invitation' then
    select c.id into v_code_id from public.organization_membership_invitation_codes c where c.organization_id=p_organization_id and upper(c.code)=upper(trim(coalesce(p_invitation_code,''))) and c.active=true and (c.valid_from is null or c.valid_from<=now()) and (c.valid_until is null or c.valid_until>=now()) and (c.max_uses is null or c.use_count<c.max_uses) for update;
    if v_code_id is null then raise exception 'invalid_invitation_code'; end if;
  end if;
  insert into public.organization_membership_requests(organization_id,first_name,last_name,email,phone,birth_date,address,comment,custom_answers,status,reviewed_at,updated_at)
  values(p_organization_id,trim(p_first_name),trim(p_last_name),v_email,nullif(trim(p_phone),''),p_birth_date,nullif(trim(p_address),''),nullif(trim(p_comment),''),coalesce(p_custom_answers,'{}'::jsonb),case when v_mode='manual' then 'pending' else 'approved' end,case when v_mode='manual' then null else now() end,now()) returning id into v_request_id;
  if v_mode='manual' then insert into public.membership_email_jobs(request_id,event_type) values(v_request_id,'received') on conflict do nothing;return query select v_request_id,'received'::text,'pending'::text;return;end if;
  insert into public.people(full_name,primary_email,primary_phone,updated_at) values(trim(p_first_name)||' '||trim(p_last_name),v_email,nullif(trim(p_phone),''),now()) returning id into v_person_id;
  insert into public.organization_memberships(organization_id,person_id,email,phone,address,join_date,status,internal_notes,updated_at) values(p_organization_id,v_person_id,v_email,nullif(trim(p_phone),''),nullif(trim(p_address),''),current_date,'active',nullif(trim(p_comment),''),now());
  if v_code_id is not null then update public.organization_membership_invitation_codes set use_count=use_count+1,updated_at=now() where id=v_code_id;end if;
  insert into public.membership_email_jobs(request_id,event_type) values(v_request_id,'approved') on conflict do nothing;
  return query select v_request_id,'approved'::text,'active'::text;
end;$$;
grant execute on function public.submit_membership_request_v2(text,text,text,text,text,date,text,text,jsonb,text) to anon,authenticated;

create or replace function public.prepare_membership_email(p_request_id uuid,p_event_type text)
returns table(job_id uuid,recipient_email text,recipient_name text,organization_name text,reply_to_email text,welcome_message text)
language plpgsql security definer set search_path=public as $$
begin
  if p_event_type not in ('received','approved','rejected') then raise exception 'invalid_event_type';end if;
  if p_event_type<>'received' and not exists(select 1 from public.organization_membership_requests r where r.id=p_request_id and (exists(select 1 from public.organization_admins a where a.organization_id=r.organization_id and a.user_id=auth.uid()) or (p_event_type='approved' and r.status='approved' and r.reviewed_by is null))) then raise exception 'not_authorized';end if;
  return query select j.id,r.email,trim(r.first_name||' '||r.last_name),coalesce(s.display_name,s.short_name,o.name,'Yasaflow'),s.email,s.membership_welcome_message from public.membership_email_jobs j join public.organization_membership_requests r on r.id=j.request_id join public.organizations o on o.id=r.organization_id left join public.organization_settings s on s.organization_id=r.organization_id where j.request_id=p_request_id and j.event_type=p_event_type and j.status in ('pending','failed','processing') limit 1;
end;$$;