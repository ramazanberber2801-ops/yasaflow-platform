-- Temporary MVP write policies for owner onboarding.
-- These allow authenticated owner/admin users to create and update onboarding records.
-- Later we should replace them with stricter organization-scoped and superadmin-only policies.

drop policy if exists "authenticated insert organizations" on public.organizations;
create policy "authenticated insert organizations"
  on public.organizations for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update organizations" on public.organizations;
create policy "authenticated update organizations"
  on public.organizations for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated insert organization modules" on public.organization_modules;
create policy "authenticated insert organization modules"
  on public.organization_modules for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update organization modules" on public.organization_modules;
create policy "authenticated update organization modules"
  on public.organization_modules for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated insert organization admins" on public.organization_admins;
create policy "authenticated insert organization admins"
  on public.organization_admins for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update organization admins" on public.organization_admins;
create policy "authenticated update organization admins"
  on public.organization_admins for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated insert organization provisioning" on public.organization_provisioning_steps;
create policy "authenticated insert organization provisioning"
  on public.organization_provisioning_steps for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update organization provisioning" on public.organization_provisioning_steps;
create policy "authenticated update organization provisioning"
  on public.organization_provisioning_steps for update
  to authenticated
  using (true)
  with check (true);
