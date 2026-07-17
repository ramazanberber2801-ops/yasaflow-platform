alter table public.organization_membership_requests
  add column if not exists custom_answers jsonb not null default '{}'::jsonb,
  add column if not exists received_email_sent_at timestamptz,
  add column if not exists decision_email_sent_at timestamptz;

alter table public.organization_settings
  add column if not exists membership_welcome_message text,
  add column if not exists membership_custom_fields jsonb not null default '[]'::jsonb;

create table if not exists public.membership_email_jobs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.organization_membership_requests(id) on delete cascade,
  event_type text not null check (event_type in ('received','approved','rejected')),
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(request_id,event_type)
);

alter table public.membership_email_jobs enable row level security;

create or replace function public.submit_membership_request(
  p_organization_id text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text default null,
  p_birth_date date default null,
  p_address text default null,
  p_comment text default null,
  p_custom_answers jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if nullif(trim(p_first_name),'') is null or nullif(trim(p_last_name),'') is null or nullif(trim(p_email),'') is null then
    raise exception 'required_fields_missing';
  end if;
  insert into public.organization_membership_requests(organization_id,first_name,last_name,email,phone,birth_date,address,comment,custom_answers)
  values(p_organization_id,trim(p_first_name),trim(p_last_name),lower(trim(p_email)),nullif(trim(p_phone),''),p_birth_date,nullif(trim(p_address),''),nullif(trim(p_comment),''),coalesce(p_custom_answers,'{}'::jsonb))
  returning id into v_id;
  insert into public.membership_email_jobs(request_id,event_type) values(v_id,'received') on conflict do nothing;
  return v_id;
end;$$;

grant execute on function public.submit_membership_request(text,text,text,text,text,date,text,text,jsonb) to anon, authenticated;

create or replace function public.review_membership_request(p_request_id uuid, p_decision text)
returns void language plpgsql security definer set search_path = public
as $$
declare r public.organization_membership_requests%rowtype; v_person_id uuid;
begin
  if p_decision not in ('approved','rejected') then raise exception 'invalid_decision'; end if;
  select * into r from public.organization_membership_requests where id=p_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'request_not_pending'; end if;
  if not exists (
    select 1 from public.organization_admins a
    where a.organization_id=r.organization_id and a.user_id=auth.uid()
  ) then raise exception 'not_authorized'; end if;
  if p_decision='approved' then
    insert into public.people(full_name,primary_email,primary_phone,updated_at)
    values(trim(r.first_name||' '||r.last_name),r.email,r.phone,now()) returning id into v_person_id;
    insert into public.organization_memberships(organization_id,person_id,email,phone,address,join_date,status,internal_notes,updated_at)
    values(r.organization_id,v_person_id,r.email,r.phone,r.address,current_date,'active',r.comment,now());
  end if;
  update public.organization_membership_requests set status=p_decision,reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now() where id=p_request_id;
  insert into public.membership_email_jobs(request_id,event_type) values(p_request_id,p_decision) on conflict do nothing;
end;$$;

grant execute on function public.review_membership_request(uuid,text) to authenticated;
