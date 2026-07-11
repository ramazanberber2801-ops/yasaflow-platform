# Yasaflow – Project Status

Last updated: July 11, 2026

## One-line summary

Yasaflow now has organization-scoped Administrator Portal modules for Members V1 and News V1. Owner Dashboard V2 remains complete. Real administrator invitation and end-to-end testing remain deferred until the Supabase Edge Function is deployed after July 29, 2026.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Run pending Members and News migrations in Supabase.
2. Build organization-scoped Activities V1.
3. Build organization Settings.
4. Build roles and access control.
5. After July 29, deploy and verify the administrator invitation Edge Function.

## Completed

- Owner Dashboard V2.
- Organization Administrator Portal shell.
- Administrator-to-organization resolution.
- Members database foundation and Members V1 UI.
- Organization News database foundation and News V1 UI.

## News V1

Implemented:

- Dedicated `organization_news` table, separate from the legacy global `news` table.
- Organization-scoped RLS.
- News list and search.
- Draft/published filtering.
- Create and edit news.
- Title, summary, content, image URL and status.
- Automatic `published_at` when publishing.
- Clear migration error state.

Current limitations:

- `supabase/migrations/20260711_organization_news.sql` must be run in Supabase before News V1 can store data.
- No delete, scheduling, push notification, rich text editor or image upload yet.
- The public application still reads the legacy global `news` table; public organization-news delivery is a later focused task.
- Real administrator testing remains blocked until the invitation Edge Function is deployed.

## Deferred task — after July 29, 2026

- Deploy `invite-organization-admin` to Supabase.
- Verify invitation email, redirect and password setup.
- Verify `organization_admins.user_id` and invitation status.
- Test Members V1 and News V1 as a real organization administrator.

## Active implementation target

Build Activities V1 using the same dedicated organization-scoped architecture.

## Architecture guidance

Keep changes small and focused. Do not modify the legacy global content tables while organization modules are being introduced. All customer data must be scoped by `organization_id` and protected by RLS.
