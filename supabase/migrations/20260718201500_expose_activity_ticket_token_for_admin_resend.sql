drop function if exists public.get_activity_registration_overview(uuid);

create function public.get_activity_registration_overview(p_activity_id uuid)
returns table(
  registration_id uuid,
  full_name text,
  email text,
  phone text,
  attendees integer,
  status text,
  created_at timestamptz,
  membership_id uuid,
  member_number text,
  checked_in boolean,
  checked_in_at timestamptz,
  payment_confirmed boolean,
  confirmation_email_sent_at timestamptz,
  ticket_token uuid
)
language sql
set search_path='public'
as $$
  select
    ar.id,
    ar.full_name,
    ar.email,
    ar.phone,
    ar.attendees,
    ar.status,
    ar.created_at,
    m.id,
    m.member_number,
    c.id is not null,
    c.checked_in_at,
    coalesce(ar.payment_confirmed,false),
    ar.confirmation_email_sent_at,
    ar.ticket_token
  from public.activity_registrations ar
  left join public.organization_memberships m
    on m.organization_id=ar.organization_id
   and lower(coalesce(m.email,''))=lower(ar.email)
  left join public.activity_checkins c
    on c.activity_id=ar.activity_id
   and (c.registration_id=ar.id or (c.membership_id=m.id and c.registration_id is null))
  where ar.activity_id=p_activity_id
    and exists(
      select 1
      from public.organization_admins oa
      where oa.organization_id=ar.organization_id
        and oa.user_id=auth.uid()
        and oa.invitation_status='accepted'
    )
  order by
    case ar.status when 'confirmed' then 0 when 'waitlist' then 1 when 'cancelled' then 2 else 3 end,
    ar.created_at;
$$;
