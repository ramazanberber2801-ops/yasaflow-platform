# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is the active owner panel. The organization creation flow and deployment links are complete. The admin invitation flow works and must be preserved.

## Current phase

Owner-created onboarding in Owner Dashboard V2.

Current priority order:

1. Restore and complete the module library.
2. Complete hosting and status settings.
3. Add provisioning timeline.
4. Complete remaining Owner Dashboard V2 overview work.
5. Start design and development of `yasaflow.com` and the public onboarding portal after Owner Dashboard V2 is complete.

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
- Live App, Vercel Project and Supabase Project URLs are editable.
- Live App, Vercel Project and Supabase Project URLs save to the `organizations` table.
- Deployment links can be opened directly when configured.
- GitHub is no longer shown or stored as a per-customer setting in Owner Dashboard V2.
- Existing module toggles remain available.
- Service worker uses network-first behavior for the app shell, JavaScript and CSS.

## Database status

Supabase onboarding foundation:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

Migrations:

- `supabase/migrations/20260709_owner_onboarding.sql`
- `supabase/migrations/20260710_organization_deployment_links.sql`

The deployment migration adds:

- `vercel_url`
- `supabase_url`

The migration must be applied in Supabase before Vercel and Supabase project URLs can be saved successfully.

## Admin invitation flow

The working flow must not be broken:

1. Owner creates or edits an organization.
2. Owner enters admin name and admin email.
3. Owner clicks `Inviter administrator`.
4. Edge Function `invite-organization-admin` sends the invitation.
5. Admin receives the email and sets a password.
6. Admin logs in.

## Important solved issue

A previous stale Owner UI was caused by PWA service-worker caching. `public/sw.js` was changed to network-first behavior for the app shell, JavaScript and CSS. Do not restore cache-first handling for these assets.

## Remaining Owner Dashboard V2 work

### Module library

Restore and complete:

- Nyheter
- Aktiviteter
- Kalender
- Push-varsler
- Donasjon
- Medlemmer
- Chat
- Bønnetider
- Ayet/Hadis where relevant

Module selections must save to `organization_modules` and load for the selected organization.

### Hosting and status

Complete:

- Hosting: Managed / Self Hosted
- Status: Prøve / Aktiv / Pause

### Provisioning timeline

Display onboarding and provisioning progress from `organization_provisioning_steps`.

### Later owner overview

Add overview cards after the core flows are complete:

- Total organizations
- Active organizations
- Trial organizations
- Active modules
- Pending admin invitations

## Later phases

- Public self-service onboarding
- Automated Vercel and Supabase provisioning
- Environment variables and domain automation
- Payments and packages
- Public `yasaflow.com` website
- Customer admin portal improvements

## Architecture guidance

Keep changes small and focused. Do not make a large component refactor while completing active product flows. Later, Owner Dashboard V2 may be split into focused components such as `OrganizationSelector`, `OrganizationEditor`, `AdminInvitationCard`, `DeploymentLinks`, `ModuleLibrary`, `HostingSettings` and `ProvisioningTimeline`.
