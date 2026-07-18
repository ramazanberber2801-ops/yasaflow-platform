create table if not exists public.activity_checkins (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  activity_id uuid not null references public.organization_activities(id) on delete cascade,
  membership_id uuid not null references public.organization_memberships(id) on delete cascade,
  registration_id uuid null references public.activity_registrations(id) on delete set null,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid null,
  source text not null default 'qr' check (source in ('qr','manual','import')),
  created_at timestamptz not null default now(),
  unique(activity_id, membership_id)
);

create index if not exists activity_checkins_org_activity_idx on public.activity_checkins(organization_id, activity_id, checked_in_at desc);
create index if not exists activity_checkins_membership_idx on public.activity_checkins(membership_id, checked_in_at desc);

alter table public.activity_checkins enable row level security;
revoke all on public.activity_checkins from anon;
grant select, insert, update, delete on public.activity_checkins to authenticated;

drop policy if exists "organization admins manage activity checkins" on public.activity_checkins;
create policy "organization admins manage activity checkins"
on public.activity_checkins
for all
to authenticated
using (
  exists (
    select 1 from public.organization_admins oa
    where oa.organization_id = activity_checkins.organization_id
      and oa.user_id = (select auth.uid())
      and oa.invitation_status = 'accepted'
  )
)
with check (
  exists (
    select 1 from public.organization_admins oa
    where oa.organization_id = activity_checkins.organization_id
      and oa.user_id = (select auth.uid())
      and oa.invitation_status = 'accepted'
  )
);

create or replace function public.check_in_member_by_card(
  p_organization_id text,
  p_activity_id uuid,
  p_card_token uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_membership public.organization_memberships%rowtype;
  v_registration_id uuid;
  v_checkin public.activity_checkins%rowtype;
begin
  if not exists (
    select 1 from public.organization_admins oa
    where oa.organization_id = p_organization_id
      and oa.user_id = auth.uid()
      and oa.invitation_status = 'accepted'
  ) then
    raise exception 'not_authorized';
  end if;

  select * into v_membership
  from public.organization_memberships
  where organization_id = p_organization_id
    and card_token = p_card_token
  limit 1;

  if v_membership.id is null then
    raise exception 'member_not_found';
  end if;

  if v_membership.status <> 'active' then
    raise exception 'member_not_active';
  end if;

  if not exists (
    select 1 from public.organization_activities a
    where a.id = p_activity_id
      and a.organization_id = p_organization_id
  ) then
    raise exception 'activity_not_found';
  end if;

  select ar.id into v_registration_id
  from public.activity_registrations ar
  where ar.organization_id = p_organization_id
    and ar.activity_id = p_activity_id
    and lower(ar.email) = lower(coalesce(v_membership.email, ''))
    and ar.status <> 'cancelled'
  order by ar.created_at desc
  limit 1;

  insert into public.activity_checkins(
    organization_id, activity_id, membership_id, registration_id, checked_in_by, source
  ) values (
    p_organization_id, p_activity_id, v_membership.id, v_registration_id, auth.uid(), 'qr'
  )
  on conflict (activity_id, membership_id) do nothing
  returning * into v_checkin;

  if v_checkin.id is null then
    return jsonb_build_object(
      'status','already_checked_in',
      'membership_id',v_membership.id,
      'member_number',v_membership.member_number
    );
  end if;

  return jsonb_build_object(
    'status','checked_in',
    'checkin_id',v_checkin.id,
    'membership_id',v_membership.id,
    'member_number',v_membership.member_number,
    'checked_in_at',v_checkin.checked_in_at
  );
end;
$$;

revoke all on function public.check_in_member_by_card(text,uuid,uuid) from public, anon;
grant execute on function public.check_in_member_by_card(text,uuid,uuid) to authenticated;

create or replace function public.get_activity_attendance(p_activity_id uuid)
returns table(
  checkin_id uuid,
  membership_id uuid,
  member_number text,
  full_name text,
  email text,
  checked_in_at timestamptz,
  source text
)
language sql
security invoker
set search_path = public
as $$
  select
    c.id,
    m.id,
    m.member_number,
    p.full_name,
    coalesce(m.email,p.primary_email),
    c.checked_in_at,
    c.source
  from public.activity_checkins c
  join public.organization_memberships m on m.id = c.membership_id
  join public.people p on p.id = m.person_id
  where c.activity_id = p_activity_id
    and exists (
      select 1 from public.organization_admins oa
      where oa.organization_id = c.organization_id
        and oa.user_id = auth.uid()
        and oa.invitation_status = 'accepted'
    )
  order by c.checked_in_at desc;
$$;

revoke all on function public.get_activity_attendance(uuid) from public, anon;
grant execute on function public.get_activity_attendance(uuid) to authenticated;
