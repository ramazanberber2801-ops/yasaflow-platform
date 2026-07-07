create table if not exists public.organization_modules (
  organization_id text not null references public.organizations(id) on delete cascade,
  module_id text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, module_id)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_organization_modules_updated_at on public.organization_modules;

create trigger set_organization_modules_updated_at
before update on public.organization_modules
for each row
execute function public.set_updated_at();

alter table public.organization_modules enable row level security;

drop policy if exists "Authenticated admins can read organization modules" on public.organization_modules;
drop policy if exists "Authenticated admins can manage organization modules" on public.organization_modules;

create policy "Authenticated admins can read organization modules"
on public.organization_modules
for select
to authenticated
using (true);

create policy "Authenticated admins can manage organization modules"
on public.organization_modules
for all
to authenticated
using (true)
with check (true);

insert into public.organization_modules (organization_id, module_id, enabled)
values
  ('dtim', 'news', true),
  ('dtim', 'events', true),
  ('dtim', 'contact', true),
  ('dtim', 'donation', true),
  ('dtim', 'push', true),
  ('dtim', 'prayer', false),
  ('dtim', 'ayet-hadis', false),
  ('dtim', 'admin-chat', false)
on conflict (organization_id, module_id) do nothing;
