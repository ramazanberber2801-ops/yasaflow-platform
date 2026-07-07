create table if not exists public.organizations (
  id text primary key,
  name text not null,
  status text not null default 'Prøve' check (status in ('Aktiv', 'Prøve', 'Frosset')),
  hosting text not null default 'Managed' check (hosting in ('Managed', 'Self Hosted')),
  domain text default '',
  live_url text default '',
  vercel_url text default '',
  supabase_url text default '',
  github_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

alter table public.organizations enable row level security;

create policy if not exists "Authenticated admins can read organizations"
on public.organizations
for select
to authenticated
using (true);

create policy if not exists "Authenticated admins can manage organizations"
on public.organizations
for all
to authenticated
using (true)
with check (true);

insert into public.organizations (
  id,
  name,
  status,
  hosting,
  domain,
  live_url,
  github_url
)
values (
  'dtim',
  'DTIM',
  'Aktiv',
  'Managed',
  'dtim.no',
  '/',
  'https://github.com/ramazanberber2801-ops/dtim'
)
on conflict (id) do nothing;
