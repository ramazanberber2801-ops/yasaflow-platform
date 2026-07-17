create table if not exists public.organization_membership_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  birth_date date,
  address text,
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_membership_requests_org_status_idx
  on public.organization_membership_requests (organization_id, status, created_at desc);

alter table public.organization_membership_requests enable row level security;

drop policy if exists "organization admins can read membership requests" on public.organization_membership_requests;
create policy "organization admins can read membership requests"
on public.organization_membership_requests for select to authenticated
using (exists (
  select 1 from public.organization_admins a
  where a.organization_id = organization_membership_requests.organization_id
    and a.user_id = auth.uid()
));

create or replace function public.submit_membership_request(
  p_organization_id text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text default null,
  p_birth_date date default null,
  p_address text default null,
  p_comment text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if nullif(trim(p_first_name),'') is null or nullif(trim(p_last_name),'') is null or nullif(trim(p_email),'') is null then
    raise exception 'required_fields_missing';
  end if;
  insert into public.organization_membership_requests(organization_id,first_name,last_name,email,phone,birth_date,address,comment)
  values(p_organization_id,trim(p_first_name),trim(p_last_name),lower(trim(p_email)),nullif(trim(p_phone),''),p_birth_date,nullif(trim(p_address),''),nullif(trim(p_comment),''))
  returning id into v_id;
  return v_id;
end;$$;

grant execute on function public.submit_membership_request(text,text,text,text,text,date,text,text) to anon, authenticated;

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
end;$$;

grant execute on function public.review_membership_request(uuid,text) to authenticated;
