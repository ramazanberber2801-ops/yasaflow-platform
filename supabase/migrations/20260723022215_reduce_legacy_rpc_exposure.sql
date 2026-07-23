-- Keep only the hardened v2 membership request endpoint public.
revoke execute on function public.submit_membership_request(text,text,text,text,text,date,text,text) from public, anon, authenticated;
revoke execute on function public.submit_membership_request(text,text,text,text,text,date,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_membership_request(text,text,text,text,text,date,text,text) to service_role;
grant execute on function public.submit_membership_request(text,text,text,text,text,date,text,text,jsonb) to service_role;

-- This helper is used internally by trusted database functions and policies;
-- clients do not need to invoke it directly through PostgREST.
revoke execute on function public.can_view_organization_content(text,text,uuid[]) from public, anon, authenticated;
grant execute on function public.can_view_organization_content(text,text,uuid[]) to service_role;
