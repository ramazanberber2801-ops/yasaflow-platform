# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is complete. The active development phase is now the customer Administrator Portal. The public yasaflow.com website and self-service onboarding will be built after the core product is mature.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Review the existing Administrator Portal.
2. Complete the Members module.
3. Complete News.
4. Complete Activities.
5. Complete roles and access control.

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

The existing Owner Dashboard V2 should now receive only focused bug fixes or clearly justified improvements. Do not redesign or refactor it while developing the Administrator Portal.

## User and role architecture

Yasaflow has three separate user types. They must never be mixed.

### Owner

- Belongs to Yasaflow.
- Manages the platform and all organizations.
- Is not part of any customer organization.

### Administrator

- Belongs to one organization.
- Manages that organization's content, members, activities, notifications and settings.
- Is not automatically a Member.

### Member

- Represents a person connected to an organization.
- Is not automatically an Administrator or Yasaflow user.
- May have independent memberships in several organizations.

Each organization owns its own membership data.

## Core modules

The following modules are always enabled and locked:

- News
- Activities
- Members
- Administration
- Settings

The Members module is organization-scoped and cannot be disabled.

## Active phase: Administrator Portal

The Administrator Portal is the operational product used by each organization.

The next development work should establish and complete:

- Organization-scoped navigation and dashboard.
- Members management.
- News publishing.
- Activities management.
- Roles and permissions.
- Push notifications and other active modules after the core flows are stable.

All Administrator Portal data access must be scoped to the administrator's organization.

## Database status

Current onboarding tables:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

Membership data must be modeled as organization-owned memberships, not as one global Members table tied directly to Yasaflow users.

## Admin invitation flow

The working flow must not be broken:

1. Owner creates or edits an organization.
2. Owner enters admin name and admin email.
3. Owner clicks `Inviter administrator`.
4. Edge Function `invite-organization-admin` sends the invitation.
5. Administrator receives the email and sets a password.
6. Administrator logs in to the organization-scoped portal.

## Later phases

After the Administrator Portal and core modules are mature:

- yasaflow.com public website.
- Public self-service onboarding.
- Payments and packages.
- Automated provisioning.
- Broader integrations and premium modules.

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. Future work must follow `DEVELOPMENT_RULES.md`, `DATABASE_GUIDE.md` and `UI_COMPONENTS.md`.
