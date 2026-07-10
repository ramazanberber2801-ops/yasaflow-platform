# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is complete. The organization Administrator Portal resolves administrators to the correct organization. The Members database foundation is now implemented in GitHub and awaits execution in Supabase before the Members UI can be activated. The invitation Edge Function deployment remains deferred until after July 29, 2026.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Run the Members migration in Supabase.
2. Build the first Members list and create/edit flow.
3. Complete organization-scoped News.
4. Complete organization-scoped Activities.
5. After July 29, deploy and verify the administrator invitation Edge Function.

## Completed phase: Owner Dashboard V2

Owner Dashboard V2 is complete for the current product phase and should receive only focused bug fixes.

## User and role architecture

- Owner belongs to Yasaflow and manages all organizations.
- Administrator belongs to one organization and is not automatically a Member.
- Member represents an organization-owned membership and may exist independently in several organizations.

## Administrator Portal status

Completed:

- Separate non-Owner Administrator Portal shell.
- Responsive dashboard and core module navigation.
- Supabase authenticated user lookup.
- Resolution through `organization_admins`.
- Organization identity, logo and status.
- Refusal of organization data access when no valid administrator relationship exists.

Current limitations:

- `AppContext.login` still begins with the legacy `admins` profile lookup.
- The invitation Edge Function is not yet deployed.
- Members, News and Activities UI are not yet operational.

## Members database foundation

Implemented in:

- `supabase/migrations/20260710_members_foundation.sql`
- `MEMBERS_FOUNDATION.md`

The foundation contains:

- `people`
- `organization_memberships`
- organization-scoped member-number uniqueness
- active/inactive membership status
- organization administrator RLS policies
- strict separation between members and administrators

The migration has not been run automatically. It must be executed in Supabase SQL Editor before the Members UI can use these tables.

## Deferred task — after July 29, 2026

- Deploy `invite-organization-admin` to Supabase.
- Verify invitation email, redirect and password setup.
- Verify `organization_admins.user_id` and invitation status.
- Remove the temporary email fallback after verified migration.

## Active implementation target

After the migration is applied, build the first organization-scoped Members list and create/edit flow.

## Database status

Current onboarding tables:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

Members foundation prepared:

- `people`
- `organization_memberships`

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. Future work must follow `DEVELOPMENT_RULES.md`, `DATABASE_GUIDE.md`, `UI_COMPONENTS.md`, `ADMIN_PORTAL_REVIEW.md` and `MEMBERS_FOUNDATION.md`.
