# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is complete. The organization Administrator Portal shell is implemented for non-Owner administrators. The next task is to resolve each authenticated administrator to exactly one organization.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Resolve the authenticated administrator to one organization.
2. Add the Members database foundation.
3. Build the first Members list and create/edit flow.
4. Complete organization-scoped News.
5. Complete organization-scoped Activities.

## Completed phase: Owner Dashboard V2

Owner Dashboard V2 is considered complete for the current product phase.

Completed capabilities:

- Owner-only access.
- Organization search and selection.
- Create organization flow with cancel behavior.
- Existing organization editing.
- First administrator invitation flow.
- Live App, Vercel and Supabase links.
- Hosting mode and organization status.
- Categorized and collapsible module library.
- Locked core modules.
- Organization-specific module persistence.
- Provisioning Timeline.
- Owner Overview cards.

The existing Owner Dashboard V2 should now receive only focused bug fixes or clearly justified improvements.

## User and role architecture

Yasaflow has three separate user types. They must never be mixed.

- Owner belongs to Yasaflow and manages all organizations.
- Administrator belongs to one organization and is not automatically a Member.
- Member represents an organization-owned membership and may exist independently in several organizations.

## Core modules

The following modules are always enabled and locked:

- News
- Activities
- Members
- Administration
- Settings

## Administrator Portal status

Completed in the portal shell:

- Non-Owner administrators receive a separate portal instead of the Owner panel.
- Organization header and administrator identity.
- Responsive navigation.
- Dashboard.
- Core navigation entries for Members, News, Activities, Administration and Settings.
- Placeholder states that keep unfinished module logic out of the shell.
- Owner Dashboard V2 remains unchanged in behavior.

Current limitation:

- The shell still uses legacy `settings` data for the displayed organization name.
- The authenticated administrator is not yet resolved through `organization_admins` to an `organization_id`.
- No organization-specific module data is loaded in this commit.

## Active implementation target

Resolve the authenticated Supabase user to exactly one active `organization_admins` record and organization.

The implementation must preserve Owner login, Owner Dashboard V2 and the working invitation flow. It must refuse customer organization data access if no valid organization administrator record exists.

## Database status

Current onboarding tables:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

Legacy app tables include shared content tables that are not yet organization-scoped.

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. Future work must follow `DEVELOPMENT_RULES.md`, `DATABASE_GUIDE.md`, `UI_COMPONENTS.md` and `ADMIN_PORTAL_REVIEW.md`.
