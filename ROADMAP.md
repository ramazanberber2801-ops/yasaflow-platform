# Yasaflow – Roadmap

This roadmap contains product phases and later work. Current implementation status belongs in `PROJECT_STATUS.md`, while `TODO.md` contains only the next concrete tasks.

## Completed: Owner Dashboard V2

The internal Yasaflow Owner experience is complete for the current phase.

Completed areas:

- Organization creation and selection.
- Existing organization editing.
- First administrator invitation.
- Live App, Vercel and Supabase links.
- Hosting and organization status.
- Categorized module library.
- Provisioning Timeline.
- Owner Overview.

All organizations continue to use the shared Yasaflow GitHub codebase. Standard and sponsored organizations may have separate Vercel and Supabase projects when needed, but not customer-specific GitHub repositories.

## Current phase: Customer Administrator Portal

Each organization needs an organization-scoped admin experience for daily operations.

Current milestone areas:

- Administrator Portal review and navigation.
- Members module.
- News management.
- Activities management.
- Roles and access control.
- Push notifications.
- Organization settings and branding.
- Operational statistics.

The Administrator Portal must keep Owners, Administrators and Members strictly separated.

## Members module

The Members module is a locked core module.

Planned capabilities:

- Member profile.
- Member number.
- Name, email, phone and optional address.
- Join date.
- Active/inactive status.
- Groups and internal roles.
- Internal notes.
- Search and filtering.

Later extensions:

- Family relationships.
- QR membership card.
- Attendance history.
- Membership fee.
- Tags, skills and volunteer status.
- Import/export.

## News and communication

Planned areas:

- News creation, editing and publishing.
- Push notifications.
- Announcements.
- Targeted communication where supported.

## Activities

Planned areas:

- Activities and events.
- Calendar.
- Registration and waiting list.
- Volunteers and later QR check-in.

## Roles and access control

Planned areas:

- Organization administrators.
- Additional administrators where allowed.
- Role-based permissions.
- Clear separation between administrative access and membership records.

## yasaflow.com public website — later phase

Design and build the public Yasaflow website after the core product and Administrator Portal are mature.

The website should later support:

- Product information.
- Module overview.
- Customer examples.
- Contact and sales entry points.
- Package presentation.
- Access to public onboarding.

## Public self-service onboarding — later phase

Organizations should eventually be able to start onboarding from the public website.

Possible capabilities:

- Organization registration.
- First administrator onboarding.
- Module and theme selection.
- Package selection.
- Deployment preferences.
- Onboarding progress.

## Payments and packages — later phase

Payments and package definitions remain postponed until the core product is stable.

Possible providers to evaluate later:

- Lemon Squeezy.
- Paddle.
- Stripe.

## Automated provisioning — later phase

Later automation may include:

- Vercel project setup where required.
- Supabase project setup where required.
- Environment variables.
- Domain and subdomain configuration.
- Publish and readiness status.

## Future modules and ideas

Potential future modules and ideas should remain here until they become concrete near-term tasks.
