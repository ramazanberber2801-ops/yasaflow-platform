alter table public.organization_invitations
  add column if not exists accepted_by uuid references auth.users(id) on delete set null;

create index if not exists organization_invitations_accepted_by_idx
  on public.organization_invitations (accepted_by);
