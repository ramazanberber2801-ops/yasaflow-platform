-- Yasaflow Members database foundation
-- Run this migration in Supabase before enabling the Members UI.
-- Members remain separate from organization administrators and platform owners.

create extension if not exists pgcrypto;

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  primary_email text,
  primary_phone text,
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  member_number text,
  email text,
  phone text,
  address text,
  join_date date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  group_id uuid,
  internal_role text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, person_id)
);

create unique index if not exists organization_memberships_member_number_unique
  on public.organization_memberships (organization_id, member_number)
  where member_number is not null and btrim(member_number) <> '';

create index if not exists organization_memberships_organization_idx
  on public.organization_memberships (organization_id);

create index if not exists organization_memberships_person_idx
  on public.organization_memberships (person_id);

create index if not exists organization_memberships_status_idx
  on public.organization_memberships (organization_id, status);

create index if not exists people_name_idx
  on public.people (lower(full_name));

alter table public.people enable row level security;
alter table public.organization_memberships enable row level security;

-- An organization administrator can access only memberships in their organization.
-- The related person row is accessible only when that person has a membership in
-- an organization managed by the authenticated administrator.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_memberships'
      and policyname = 'Organization admins manage own memberships'
  ) then
    create policy "Organization admins manage own memberships"
      on public.organization_memberships
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.organization_admins oa
          where oa.organization_id = organization_memberships.organization_id
            and oa.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.organization_admins oa
          where oa.organization_id = organization_memberships.organization_id
            and oa.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'people'
      and policyname = 'Organization admins access related people'
  ) then
    create policy "Organization admins access related people"
      on public.people
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.organization_memberships om
          join public.organization_admins oa
            on oa.organization_id = om.organization_id
          where om.person_id = people.id
            and oa.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'people'
      and policyname = 'Authenticated admins create people'
  ) then
    create policy "Authenticated admins create people"
      on public.people
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.organization_admins oa
          where oa.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'people'
      and policyname = 'Organization admins update related people'
  ) then
    create policy "Organization admins update related people"
      on public.people
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.organization_memberships om
          join public.organization_admins oa
            on oa.organization_id = om.organization_id
          where om.person_id = people.id
            and oa.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.organization_memberships om
          join public.organization_admins oa
            on oa.organization_id = om.organization_id
          where om.person_id = people.id
            and oa.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'people'
      and policyname = 'Organization admins delete related people'
  ) then
    create policy "Organization admins delete related people"
      on public.people
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.organization_memberships om
          join public.organization_admins oa
            on oa.organization_id = om.organization_id
          where om.person_id = people.id
            and oa.user_id = auth.uid()
        )
      );
  end if;
end $$;

comment on table public.people is
  'Person identity/contact layer. Contains no organization-specific membership status or role.';

comment on table public.organization_memberships is
  'One independent membership relationship between a person and an organization.';

comment on column public.organization_memberships.internal_role is
  'Internal member role only. This does not grant administrator access.';
