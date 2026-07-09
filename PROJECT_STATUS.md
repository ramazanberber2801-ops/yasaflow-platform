# Yasaflow – Project Status

Last updated: July 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is now the main owner panel. Admin invitation now renders correctly and must be preserved.

---

## Product vision

Yasaflow should become a complete app/admin platform for organizations.

Target customers:

- Mosques
- Associations
- Churches
- Sports clubs
- Cultural organizations
- Other membership/community organizations

Each organization should be able to get:

- its own app experience
- its own admin panel
- configurable modules
- push notifications
- news
- activities/events
- donations
- member management
- calendar
- chat
- organization-specific theme/branding

---

## Hosting strategy

### Standard customers

Standard customers use the shared Yasaflow codebase.

For each customer we may create/configure:

- Vercel project
- Supabase project

Important: do not create one GitHub repository per customer. GitHub is Yasaflow's shared codebase.

### Sponsored organizations

The owner may sponsor 1–2 organizations.

Sponsored organizations may get:

- their own Vercel project
- their own Supabase project

They should not get their own GitHub repository. They use the same Yasaflow codebase.

---

## Current technical direction

Use Owner Dashboard V2 as the main owner panel going forward.

Old OwnerPanel caused confusion because the app showed old UI due to service worker caching and duplicated/old owner code. The project now uses OwnerPanelV2 through the OwnerPanel wrapper.

Do not reintroduce the old Owner UI as the main flow.

---

## Important bug that was solved

### Problem

On the Owner page, these fields did not show:

- Admin navn
- Admin e-post
- Inviter administrator

### Investigation

We verified:

- Vercel deployed new commits.
- App.tsx marker changed, proving production was updated.
- Supabase tables existed.
- OwnerPanel.tsx was changed to point to OwnerPanelV2.
- The visible old UI still appeared.

### Root cause

The PWA service worker was caching GET requests cache-first, including JS/CSS bundles. Old AdminPanel/OwnerPanel bundles could stay visible even when App.tsx appeared updated.

### Fix

`public/sw.js` was changed to safer network-first behavior for app shell, JS and CSS.

Commit: `bb0f785`

Current behavior:

- New deploys should show properly.
- JS/CSS should be network-first.
- Old caches are deleted on activate.

---

## Database status

Supabase has the onboarding foundation:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

A migration was added for this foundation:

- `supabase/migrations/20260709_owner_onboarding.sql`

The SQL was run manually in Supabase and the tables were confirmed in Table Editor.

---

## Admin invitation flow

Current intended flow:

1. Owner creates or edits organization.
2. Owner fills in admin name and admin email.
3. Owner clicks `Inviter administrator`.
4. Edge Function `invite-organization-admin` sends the invitation.
5. Admin receives email.
6. Admin sets password.
7. Admin logs in.
8. Organization becomes ready/active.

This flow is a major milestone and must not be broken while rebuilding Owner Dashboard V2.

---

## Owner Dashboard V2 – current state

Working now:

- Owner Dashboard V2 renders.
- Admin invitation form is visible.
- Basic organization fields are visible.
- Basic module count is visible.
- Supabase tables exist.
- Service worker cache issue has been addressed.

Still missing or incomplete:

- Organization search.
- Organization list / selector.
- Load existing organizations from Supabase.
- Select existing organization.
- New organization flow with clear Save and Cancel buttons.
- Deployment links.
- Vercel Project URL.
- Supabase Project URL.
- Live App URL.
- Hosting mode controls.
- Full module library from old Owner dashboard.
- Better dashboard overview cards.
- Provisioning timeline/status.

---

## Immediate next tasks

### 1. Organization search and selector

Add a search field at the top of Owner Dashboard V2.

Owner should be able to search organizations/associations by:

- name
- type
- domain
- country
- status
- admin email

Add an organization list/selector so the owner can pick an existing organization without editing blindly.

### 2. New organization UX

When Owner clicks `Ny`, the UI must show:

- Save/Lagre
- Cancel/Avbryt

The user should not need to use phone/browser back navigation to cancel creating a new organization.

### 3. Deployment links

Add these fields back to V2:

- Live App URL
- Vercel Project URL
- Supabase Project URL

Do not add GitHub Repo as a per-customer setting. All customers use the same Yasaflow codebase.

### 4. Hosting settings

Add back:

- Managed
- Self Hosted

### 5. Status settings

Add back:

- Prøve
- Aktiv
- Pause

### 6. Module library

Move full module library into V2:

- Nyheter
- Aktiviteter
- Kalender
- Push-varsler
- Donasjon
- Medlemmer
- Chat
- Bønnetider
- Ayet/Hadis where relevant
- Future modules later

All module choices should save to Supabase in `organization_modules`.

### 7. Better owner overview cards

Add dashboard cards for:

- total organizations
- active organizations
- trial organizations
- active modules
- pending admin invitations

---

## Later tasks

### Self-service onboarding

Build a public customer signup/start page where a new organization can submit:

- organization name
- organization type
- admin name
- admin email
- language
- theme
- desired modules

The system should then:

- create organization
- save modules
- create admin record
- send invitation
- update provisioning status

### Automated provisioning

Later, automate:

- Vercel project setup where needed
- Supabase project setup where needed
- environment variables
- domain/subdomain configuration
- publish status

### Payments

Payments are postponed until the core platform is stable.

Possible providers:

- Lemon Squeezy
- Paddle
- Stripe

No final decision yet.

### Packages

Packages will be defined later after the product is stable.

Possible structure:

- Free
- Basic
- Pro
- Enterprise

---

## Architecture recommendation

Owner Dashboard V2 should be split into smaller components instead of one large file.

Suggested components:

- `OrganizationSelector`
- `OrganizationSearch`
- `OrganizationEditor`
- `AdminInvitationCard`
- `HostingSettings`
- `ModuleLibrary`
- `DeploymentLinks`
- `ProvisioningTimeline`
- `OwnerStatsCards`

This will make the code easier to maintain as Yasaflow grows.

---

## Important instruction for future chats

When continuing work, start by reading this file and then continue with the immediate next tasks.

Suggested new chat prompt:

"Read PROJECT_STATUS.md in the GitHub repo and continue Yasaflow from the current status. Start with Owner Dashboard V2 organization search, organization selector, cancel button for new organization, and deployment links."
