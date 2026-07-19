create extension if not exists pgcrypto;

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'admin' check (role in ('admin', 'owner', 'staff')),
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'sent', 'accepted', 'expired', 'revoked', 'failed')),
  expires_at timestamptz not null,
  invited_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_invitations_organization_id_idx
  on public.organization_invitations (organization_id);

create index if not exists organization_invitations_email_idx
  on public.organization_invitations (lower(email));

create index if not exists organization_invitations_status_expires_at_idx
  on public.organization_invitations (status, expires_at);

create unique index if not exists organization_invitations_active_email_idx
  on public.organization_invitations (organization_id, lower(email))
  where status in ('pending', 'sent');

create or replace function public.set_organization_invitation_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_organization_invitation_updated_at on public.organization_invitations;
create trigger set_organization_invitation_updated_at
before update on public.organization_invitations
for each row execute function public.set_organization_invitation_updated_at();

alter table public.organization_invitations enable row level security;

revoke all on public.organization_invitations from anon;
revoke all on public.organization_invitations from authenticated;

grant select on public.organization_invitations to authenticated;

create policy "Authenticated users can read organization invitations"
on public.organization_invitations
for select
to authenticated
using (true);

comment on table public.organization_invitations is
  'Secure organization administrator invitations. Raw invitation tokens are never stored; only SHA-256 hashes are persisted.';
