-- Harden sensitive RPC entry points while preserving intentionally public flows.

-- Administrative activity functions: signed-in organization admins only.
revoke all on function public.check_in_registration_group_by_ticket(text, uuid, uuid, integer) from public, anon;
grant execute on function public.check_in_registration_group_by_ticket(text, uuid, uuid, integer) to authenticated, service_role;
revoke all on function public.get_registration_ticket_checkin_status(text, uuid, uuid) from public, anon;
grant execute on function public.get_registration_ticket_checkin_status(text, uuid, uuid) to authenticated, service_role;
revoke all on function public.get_activity_attendance(uuid) from public, anon;
grant execute on function public.get_activity_attendance(uuid) to authenticated, service_role;
revoke all on function public.get_activity_registration_overview(uuid) from public, anon;
grant execute on function public.get_activity_registration_overview(uuid) to authenticated, service_role;
revoke all on function public.manage_activity_series(uuid, text, text, text, date, time without time zone, time without time zone, text, integer, text) from public, anon;
grant execute on function public.manage_activity_series(uuid, text, text, text, date, time without time zone, time without time zone, text, integer, text) to authenticated, service_role;
revoke all on function public.process_activity_waitlist(uuid) from public, anon;
grant execute on function public.process_activity_waitlist(uuid) to authenticated, service_role;
revoke all on function public.promote_activity_waitlist_registration(uuid) from public, anon;
grant execute on function public.promote_activity_waitlist_registration(uuid) to authenticated, service_role;
revoke all on function public.set_activity_registration_payment(uuid, boolean) from public, anon;
grant execute on function public.set_activity_registration_payment(uuid, boolean) to authenticated, service_role;
revoke all on function public.issue_activity_certificate(uuid) from public, anon;
grant execute on function public.issue_activity_certificate(uuid) to authenticated, service_role;
revoke all on function public.create_activity_evaluation_invites(uuid) from public, anon;
grant execute on function public.create_activity_evaluation_invites(uuid) to authenticated, service_role;

-- Membership/group administration: authenticated admins only.
revoke all on function public.add_member_to_group(uuid, uuid) from public, anon;
grant execute on function public.add_member_to_group(uuid, uuid) to authenticated, service_role;
revoke all on function public.remove_member_from_group(uuid, uuid) from public, anon;
grant execute on function public.remove_member_from_group(uuid, uuid) to authenticated, service_role;
revoke all on function public.set_organization_group_members(text, uuid, uuid[]) from public, anon;
grant execute on function public.set_organization_group_members(text, uuid, uuid[]) to authenticated, service_role;
revoke all on function public.review_membership_request(uuid, text) from public, anon;
grant execute on function public.review_membership_request(uuid, text) to authenticated, service_role;

-- Internal job/trigger helpers must not be callable from the exposed API.
revoke all on function public.activity_waitlist_after_registration_change() from public, anon, authenticated;
grant execute on function public.activity_waitlist_after_registration_change() to service_role;
revoke all on function public.offer_next_activity_waitlist(uuid) from public, anon, authenticated;
grant execute on function public.offer_next_activity_waitlist(uuid) to service_role;
revoke all on function public.queue_activity_ticket_email() from public, anon, authenticated;
grant execute on function public.queue_activity_ticket_email() to service_role;
revoke all on function public.complete_membership_email(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.complete_membership_email(uuid, uuid, text) to service_role;
revoke all on function public.fail_membership_email(uuid, text) from public, anon, authenticated;
grant execute on function public.fail_membership_email(uuid, text) to service_role;

-- Used by authenticated admins and server-side jobs.
revoke all on function public.prepare_membership_email(uuid, text) from public, anon;
grant execute on function public.prepare_membership_email(uuid, text) to authenticated, service_role;

-- Lock the immutable helper's search path.
alter function public.normalize_organization_slug(text) set search_path = pg_catalog;

-- Public object URLs do not require a broad object-listing policy.
drop policy if exists contact_images_read on storage.objects;
