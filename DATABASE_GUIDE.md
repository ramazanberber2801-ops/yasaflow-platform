# Yasaflow – Database Guide

## Purpose

This document defines the required role and membership architecture for future database development.

## Three separate domains

### Platform Owners

Owners belong to Yasaflow itself.

Owners manage the platform and must not be stored as organization members or organization administrators.

A future platform-owner table or claims model should be platform-scoped.

### Organization Administrators

Administrators belong to one organization and manage that organization.

The existing `organization_admins` table represents organization-level administration access.

Administrator records must remain separate from membership records.

### Organization Members

Members represent people connected to an organization.

Members are not automatically authenticated users and are not automatically administrators.

## Membership architecture

A person can belong to multiple organizations. Each relationship is independent.

Recommended future model:

### `people`

Optional identity/contact layer for a real-world person.

Possible fields:

- `id`
- `name`
- `primary_email`
- `primary_phone`
- `profile_image_url`

This table must not contain organization-specific membership details.

### `organization_memberships`

Represents one person's membership in one organization.

Recommended fields:

- `id`
- `organization_id`
- `person_id`
- `member_number`
- `email`
- `phone`
- `address`
- `join_date`
- `status`
- `group_id`
- `internal_role`
- `internal_notes`
- `created_at`
- `updated_at`

Organization-specific contact details may live here when organizations own and maintain their own version of the data.

Recommended uniqueness should be based on the organization's business rules, for example:

- unique member number within one organization
- one active membership per person per organization, unless multiple membership types are intentionally supported

## Important separation

`organization_admins` controls administrative access.

`organization_memberships` represents organizational membership.

Do not infer one from the other.

A person may have:

- membership only
- administrator access only
- both membership and administrator access
- memberships in several organizations

All of these cases must be supported.

## Data ownership

Each organization owns its own membership records.

Row-level security and API queries must always scope membership data by `organization_id`.

An administrator must never access another organization's member records.

The Yasaflow Owner may have platform-wide oversight according to platform permissions, but is not a member of those organizations.

## Members module

The Members module is a core module and is always enabled.

There is one Members module configuration per organization, while the module may contain many membership records.

Typical data includes:

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

Future extensions:

- Family relationships
- QR membership cards
- Attendance history
- Membership fees
- Tags
- Skills
- Volunteer status
- Import/export

## Existing tables

Current onboarding tables:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

Do not reuse `organization_admins` as a members table.

Future membership tables should be introduced through dedicated migrations when the Members feature is implemented.
