# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is the active owner panel. Organization creation, deployment links, categorized module library, hosting/status settings and provisioning timeline are complete. The platform architecture explicitly separates Owner, Administrator and Member roles.

## Current phase

Owner-created onboarding in Owner Dashboard V2.

Current priority order:

1. Complete remaining Owner Dashboard V2 overview work.
2. Start design and development of `yasaflow.com` and the public onboarding portal after Owner Dashboard V2 is complete.

## User and role architecture

Yasaflow has three separate user types. They must never be mixed.

- Owner belongs to Yasaflow and manages the platform.
- Administrator belongs to one organization and manages that organization.
- Member represents a person connected to an organization and is not automatically an Administrator.

A person may have independent memberships in multiple organizations. Each organization owns its own membership data.

## Core modules

The following modules are always enabled and locked:

- News
- Activities
- Members
- Administration
- Settings

The Members module is organization-scoped and cannot be disabled.

## Owner Dashboard V2 – working now

- Organizations load from Supabase and can be searched and selected.
- Existing organizations show `Lagre endringer`.
- `Opprett organisasjon` starts a clean creation mode with `Avbryt`.
- Admin invitation is preserved.
- Live App, Vercel Project and Supabase Project URLs are editable and saved.
- Hosting supports `Managed` and `Self Hosted`.
- Status supports `Prøve`, `Aktiv` and `Pause`.
- The module library is divided into collapsible categories.
- Core modules are collapsible, always enabled and cannot be switched off.
- Optional modules can be enabled per organization.
- Future modules are marked `Senere` and cannot be enabled yet.
- Module selections save to `organization_modules` and load for the selected organization.
- Provisioning Timeline loads organization-specific status from `organization_provisioning_steps`.
- Missing provisioning rows fall back to the standard step order.
- Saving an organization updates provisioning status for order, organization, administrator, domain, modules, testing, readiness and publication.

## Provisioning steps

- Bestilling mottatt
- Organisasjon opprettet
- Administrator
- Domene konfigurert
- Moduler konfigurert
- Testing
- Klar for publisering
- Publisert

Status values are displayed as Fullført, Pågår, Venter or Ikke startet.

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
5. Admin receives the email and sets a password.
6. Admin logs in.

## Remaining Owner Dashboard V2 work

### Owner overview

Add overview cards after the core flows are complete.

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. Future work must follow `DEVELOPMENT_RULES.md`, `DATABASE_GUIDE.md` and `UI_COMPONENTS.md`.
