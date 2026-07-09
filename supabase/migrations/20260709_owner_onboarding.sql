-- Yasaflow owner onboarding database foundation
-- Run this in Supabase SQL Editor if these tables/columns are missing.

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  organization_type text,
  country text default 'Norge',
  language text default 'Norsk',
  status text default 'Prøve',
  hosting_mode text default 'Managed',
  domain text,
  live_url text,
  logo_url text,
  theme_id text default 'classic-mosque',
  onboarding_step text default 'Bestilling',
  admin_name text,
  admin_email text,
  member_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.organizations add column if not exists organization_type text;
alter table public.organizations add column if not exists country text default 'Norge';
alter table public.organizations add column if not exists language text default 'Norsk';
alter table public.organizations add column if not exists status text default 'Prøve';
alter table public.organizations add column if not exists hosting_mode text default 'Managed';
alter table public.organizations add column if not exists domain text;
alter table public.organizations add column if not exists live_url text;
alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists theme_id text default 'classic-mosque';
alter table public.organizations add column if not exists onboarding_step text default 'Bestilling';
alter table public.organizations add column if not exists admin_name text;
alter table public.organizations add column if not exists admin_email text;
alter table public.organizations add column if not exists member_count integer default 0;
alter table public.organizations add column if not exists created_at timestamptz default now();
alter table public.organizations add column if not exists updated_at timestamptz default now();

create table if not exists public.organization_admins (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  user_id uuid,
  display_name text,
  email text not null,
  role text not null default 'admin',
  invitation_status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, email)
);

alter table public.organization_admins add column if not exists user_id uuid;
alter table public.organization_admins add column if not exists display_name text;
alter table public.organization_admins add column if not exists role text not null default 'admin';
alter table public.organization_admins add column if not exists invitation_status text not null default 'pending';
alter table public.organization_admins add column if not exists created_at timestamptz default now();
alter table public.organization_admins add column if not exists updated_at timestamptz default now();

create table if not exists public.organization_modules (
  organization_id text not null references public.organizations(id) on delete cascade,
  module_id text not null,
  enabled boolean not null default false,
  status text default 'Av',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (organization_id, module_id)
);

alter table public.organization_modules add column if not exists enabled boolean not null default false;
alter table public.organization_modules add column if not exists status text default 'Av';
alter table public.organization_modules add column if not exists created_at timestamptz default now();
alter table public.organization_modules add column if not exists updated_at timestamptz default now();

create table if not exists public.organization_provisioning_steps (
  organization_id text not null references public.organizations(id) on delete cascade,
  step_key text not null,
  label text not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (organization_id, step_key)
);

alter table public.organization_provisioning_steps add column if not exists label text;
alter table public.organization_provisioning_steps add column if not exists status text not null default 'pending';
alter table public.organization_provisioning_steps add column if not exists created_at timestamptz default now();
alter table public.organization_provisioning_steps add column if not exists updated_at timestamptz default now();

alter table public.organizations enable row level security;
alter table public.organization_admins enable row level security;
alter table public.organization_modules enable row level security;
alter table public.organization_provisioning_steps enable row level security;

-- Owner/superadmin policies for current client-side owner panel.
-- Tighten these further before broad production rollout.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'Owner can manage organizations'
  ) then
    create policy "Owner can manage organizations" on public.organizations
      for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_admins' and policyname = 'Owner can manage organization admins'
  ) then
    create policy "Owner can manage organization admins" on public.organization_admins
      for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_modules' and policyname = 'Owner can manage organization modules'
  ) then
    create policy "Owner can manage organization modules" on public.organization_modules
      for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_provisioning_steps' and policyname = 'Owner can manage provisioning steps'
  ) then
    create policy "Owner can manage provisioning steps" on public.organization_provisioning_steps
      for all using (true) with check (true);
  end if;
end $$;
