drop index if exists public.organization_admins_org_email_unique;
drop index if exists public.organization_modules_org_module_unique;
drop index if exists public.organization_provisioning_steps_org_step_unique;

alter policy "Admins can manage people"
on public.people
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.organization_admins oa
    where oa.user_id = (select auth.uid())
      and oa.invitation_status = 'accepted'
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1
    from public.organization_admins oa
    where oa.user_id = (select auth.uid())
      and oa.invitation_status = 'accepted'
  )
);
