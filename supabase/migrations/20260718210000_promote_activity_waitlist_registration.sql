create or replace function public.promote_activity_waitlist_registration(p_registration_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.activity_registrations%rowtype;
  v_activity public.organization_activities%rowtype;
  v_confirmed integer;
begin
  select * into v_registration
  from public.activity_registrations
  where id = p_registration_id
  for update;

  if v_registration.id is null then
    raise exception 'registration_not_found';
  end if;

  if not exists (
    select 1
    from public.organization_admins oa
    where oa.organization_id = v_registration.organization_id
      and oa.user_id = auth.uid()
      and oa.invitation_status = 'accepted'
  ) and not exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
      and a.role in ('owner','super_admin','superadmin')
  ) then
    raise exception 'not_authorized';
  end if;

  if v_registration.status <> 'waitlist' then
    raise exception 'registration_not_waitlisted';
  end if;

  select * into v_activity
  from public.organization_activities
  where id = v_registration.activity_id
  for update;

  if v_activity.id is null then
    raise exception 'activity_not_found';
  end if;

  select coalesce(sum(attendees), 0)
  into v_confirmed
  from public.activity_registrations
  where activity_id = v_registration.activity_id
    and status = 'confirmed';

  if v_activity.capacity is not null
     and v_confirmed + v_registration.attendees > v_activity.capacity then
    raise exception 'capacity_exceeded';
  end if;

  update public.activity_registrations
  set status = 'confirmed',
      confirmation_email_sent_at = null,
      updated_at = now()
  where id = v_registration.id;

  return jsonb_build_object(
    'status', 'confirmed',
    'registration_id', v_registration.id,
    'full_name', v_registration.full_name,
    'email', v_registration.email,
    'attendees', v_registration.attendees,
    'available_capacity', case when v_activity.capacity is null then null else v_activity.capacity - (v_confirmed + v_registration.attendees) end
  );
end;
$$;

grant execute on function public.promote_activity_waitlist_registration(uuid) to authenticated;
