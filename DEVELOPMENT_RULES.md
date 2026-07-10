# Yasaflow – Development Rules

## Role separation is mandatory

Yasaflow has exactly three distinct user types:

1. Owner
2. Administrator
3. Member

These concepts must never be merged in database schemas, permissions, UI labels, API contracts or business logic.

## Owner

- Belongs to Yasaflow.
- Does not belong to any customer organization.
- Manages the platform and all organizations.
- May create organizations, invite the first administrator, manage modules, subscriptions, deployments and suspensions.

Do not store Owner as an organization member or organization administrator.

## Administrator

- Belongs to one organization.
- Manages that organization's data and features.
- May manage members, news, activities, notifications, volunteers, statistics and additional administrators when permitted.

An Administrator is not automatically a Member.

If the same person is also a Member, keep the administration access and membership record separate.

## Member

- Represents a person connected to an organization.
- Does not represent a Yasaflow platform user.
- Does not automatically have system access.
- May represent a congregation member, association member, player, parent, volunteer, employee or board member.

## Multi-organization membership rule

A person may belong to multiple organizations.

Each membership is independent and owned by the relevant organization.

Do not design Members as one global user table with one shared organization-independent member record.

Future implementations should model membership as a relationship between a person and an organization.

## Core module rule

The following modules are always enabled:

- News
- Activities
- Members
- Administration
- Settings

Core modules must not be switchable off in the Owner Dashboard.

## Members module rule

- There is exactly one Members module per organization.
- The module manages the organization's people and membership records.
- It does not manage platform Owners.
- It does not manage Administrator permissions.
- An Administrator appears in Members only when that person is also a member of the organization.

## Working discipline

- Keep changes small and focused.
- One feature per commit.
- Do not refactor unrelated working code.
- Preserve the existing admin invitation flow.
- Update `PROJECT_STATUS.md` after completed feature work.
- Keep `TODO.md` limited to the next 3–5 concrete tasks.
- Use `ROADMAP.md` for later phases and future ideas.
