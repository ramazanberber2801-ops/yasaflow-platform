create or replace function public.get_public_member_card(p_token text)
returns table(
  organization_id text,
  organization_name text,
  organization_logo_url text,
  member_name text,
  member_number text,
  membership_status text,
  card_token text
)
language sql
security definer
set search_path = public
as $$
  select
    m.organization_id::text,
    o.name::text,
    coalesce(o.logo_url, os.logo_url)::text,
    p.full_name::text,
    m.member_number::text,
    m.status::text,
    m.card_token::text
  from public.organization_memberships m
  join public.people p on p.id = m.person_id
  join public.organizations o on o.id = m.organization_id
  left join public.organization_settings os on os.organization_id = m.organization_id
  join public.organization_modules mm
    on mm.organization_id = m.organization_id
   and mm.module_id = 'members'
   and mm.enabled = true
  where m.card_token::text = p_token
    and m.status = 'active'
  limit 1;
$$;

revoke all on function public.get_public_member_card(text) from public;
grant execute on function public.get_public_member_card(text) to anon, authenticated;

create or replace function public.membership_requests_enabled(p_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.organization_modules
    where organization_id::text = p_organization_id
      and module_id = 'members'
      and enabled = true
  );
$$;

revoke all on function public.membership_requests_enabled(text) from public;
grant execute on function public.membership_requests_enabled(text) to anon, authenticated;