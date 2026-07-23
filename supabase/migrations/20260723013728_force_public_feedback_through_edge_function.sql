drop policy if exists "Anyone can submit public feedback" on public.public_feedback;
revoke insert on table public.public_feedback from anon, authenticated;
grant all on table public.public_feedback to service_role;
comment on table public.public_feedback is 'Public feedback is accepted only through the submit-public-feedback Edge Function; direct client inserts are disabled.';
