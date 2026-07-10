# Yasaflow – UI Components and Role Boundaries

## UI terminology

Use role-specific labels consistently.

### Owner UI

Use terms such as:

- Owner Dashboard
- Organization
- First administrator
- Modules
- Subscription
- Deployment
- Hosting
- Status

Do not present the Owner as part of an organization.

### Administrator UI

Use terms such as:

- Organization administrator
- Administrators
- Invite administrator
- Permissions
- Organization settings

Administrator screens manage system access for one organization.

### Member UI

Use terms such as:

- Members
- Member profile
- Member number
- Membership status
- Group
- Internal role
- Join date

Do not label administrators as members unless the person also has a separate membership record.

## Members module UI

The Members module represents organization members and affiliated people, including possible roles such as:

- Ordinary member
- Board member
- Employee
- Volunteer
- Player
- Parent
- Coach
- Teacher
- Committee member

These are organizational roles, not system permissions.

Administrator permissions must remain in the Administration module.

## Core modules in Owner Dashboard

Always-enabled modules:

- News
- Activities
- Members
- Administration
- Settings

Core modules should:

- appear enabled
- appear locked
- not provide an off toggle
- clearly state that they are included for every organization

## Categorized module library

The Owner Dashboard module library should use collapsible categories so it does not fill the entire page.

Recommended behavior:

- Show compact category rows.
- Show the number of active modules in each category.
- Expand or collapse on click.
- Keep modules hidden while a category is collapsed.
- Allow optional modules to be enabled or disabled.
- Mark future modules as unavailable or `Senere`.
- Keep the layout usable on mobile.

Recommended categories:

- Communication
- Activities
- Members
- Finance
- Organization
- Education
- Rooms
- Information
- Faith community
- Administration
- Integrations
- Premium
- AI

The Members category may contain optional extensions such as groups, families and membership cards, while the main Members module itself remains a locked core module.

## Access and visibility

- Owner Dashboard components are platform-level.
- Administrator components are organization-scoped.
- Member records are organization-scoped.
- Public profile or board-member visibility does not grant system access.
- An administrator can be displayed publicly only through a separate member/person profile when appropriate.
