# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is the active owner panel. Organization creation, deployment links, module library, hosting and status settings are complete. The platform architecture now explicitly separates Owner, Administrator and Member roles.

## Current phase

Owner-created onboarding in Owner Dashboard V2.

Current priority order:

1. Complete the categorized and collapsible module library.
2. Add provisioning timeline.
3. Complete remaining Owner Dashboard V2 overview work.
4. Start design and development of `yasaflow.com` and the public onboarding portal after Owner Dashboard V2 is complete.

## User and role architecture

Yasaflow has three separate user types. They must never be mixed.

### Owner

- Belongs to Yasaflow, not to an organization.
- Manages the platform.
- Can create organizations, invite the first administrator, manage modules, subscriptions, deployments and organization status.
- Can view all organizations.

### Administrator

- Belongs to one organization.
- Manages that organization.
- Can manage members, content, activities, notifications, volunteers and statistics.
- Is not automatically a Member.
- May also be registered as a Member, but that is a separate relationship.

### Member

- Represents a person connected to an organization.
- Is not a Yasaflow Owner.
- Is not automatically an Administrator.
- Examples include congregation members, association members, players, parents, volunteers, employees or board members.

A person may have independent memberships in multiple organizations. Each organization owns its own membership data.

## Core modules

The following modules are always enabled:

- News
- Activities
- Members
- Administration
- Settings

The Members module is a core module and cannot be disabled.

## Members module architecture

- There is exactly one Members module per organization.
- Members are organization-specific records, not global Yasaflow users.
- Administrators are managed separately.
- A person may be both an Administrator and a Member, but those records and permissions remain separate.
- A person can belong to several organizations through independent membership records.

Typical member data:

- Member number
- Name
- Email
- Phone
- Profile image
- Address
- Join date
- Active/inactive status
- Group
- Internal role
- Internal notes

Future member features may include QR membership cards, family relationships, membership fees, attendance history, tags, skills, volunteer status and import/export.

## Hosting and repository strategy

- All standard and sponsored organizations use the shared Yasaflow GitHub codebase.
- GitHub is not a customer-specific setting.
- Standard and sponsored organizations may have their own Vercel and Supabase projects when required.
- Do not create one GitHub repository per organization.

## Owner Dashboard V2 – working now

- Owner Dashboard V2 renders as the main owner panel.
- Organizations load from Supabase.
- Search filters by name, type, domain, country, status, hosting and admin email.
- Existing organizations can be selected and loaded into the editor.
- Existing organizations show `Lagre endringer`.
- `Opprett organisasjon` starts a clean creation mode.
- Creation mode shows `Opprett organisasjon` and `Avbryt`.
- `Avbryt` restores the previously selected organization.
- Admin name and admin email are visible.
- `Inviter administrator` is preserved.
- Live App, Vercel Project and Supabase Project URLs are editable and saved.
- GitHub is not shown as a per-customer setting.
- Module selections save to `organization_modules`.
- Saved module selections load when an existing organization is selected.
- New organizations start with the default module configuration.
- Hosting supports `Managed` and `Self Hosted`.
- Status supports `Prøve`, `Aktiv` and `Pause`.
- Hosting and status save to Supabase and load with the selected organization.
- Service worker uses network-first behavior for the app shell, JavaScript and CSS.

## Database status

Supabase onboarding foundation:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

Membership data must be modeled as organization-owned memberships, not as one global Members table tied directly to Yasaflow users.

Migrations:

- `supabase/migrations/20260709_owner_onboarding.sql`
- `supabase/migrations/20260710_organization_deployment_links.sql`

Required unique keys for upserts:

- `organization_modules (organization_id, module_id)`
- `organization_admins (organization_id, email)`
- `organization_provisioning_steps (organization_id, step_key)`

## Admin invitation flow

The working flow must not be broken:

1. Owner creates or edits an organization.
2. Owner enters admin name and admin email.
3. Owner clicks `Inviter administrator`.
4. Edge Function `invite-organization-admin` sends the invitation.
5. Admin receives the email and sets a password.
6. Admin logs in.

## Remaining Owner Dashboard V2 work

### Categorized module library

The module library must be organized into collapsible categories. Core modules remain always enabled and locked. Optional modules may be activated per organization.

### Provisioning timeline

Display onboarding and provisioning progress from `organization_provisioning_steps`.

### Later owner overview

Add overview cards after the core flows are complete:

- Total organizations
- Active organizations
- Trial organizations
- Active modules
- Pending admin invitations

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. Future database, UI and permission work must follow the role and membership model described in `DEVELOPMENT_RULES.md`, `DATABASE_GUIDE.md` and `UI_COMPONENTS.md`.
