-- Security audit hardening
-- 1) Restrict organization contact image writes to organization managers.
-- 2) Add file size and MIME type limits.
-- 3) Require accepted organization-admin invitations for management access.

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'organization-contact-images';

drop policy if exists contact_images_write on storage.objects;
drop policy if exists contact_images_change on storage.objects;
drop policy if exists contact_images_remove on storage.objects;

create policy contact_images_write
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization-contact-images'
  and (storage.foldername(name))[1] is not null
  and private.can_manage_organization((storage.foldername(name))[1])
);

create policy contact_images_change
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization-contact-images'
  and (storage.foldername(name))[1] is not null
  and private.can_manage_organization((storage.foldername(name))[1])
)
with check (
  bucket_id = 'organization-contact-images'
  and (storage.foldername(name))[1] is not null
  and private.can_manage_organization((storage.foldername(name))[1])
);

create policy contact_images_remove
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization-contact-images'
  and (storage.foldername(name))[1] is not null
  and private.can_manage_organization((storage.foldername(name))[1])
);

create or replace function private.can_manage_organization(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_admins oa
    where oa.organization_id = target_organization_id
      and oa.user_id = auth.uid()
      and oa.invitation_status = 'accepted'
      and oa.role in ('admin', 'owner', 'super_admin', 'superadmin')
  )
  or exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
      and a.role in ('owner', 'super_admin', 'superadmin')
  );
$$;

revoke all on function private.can_manage_organization(text) from public, anon, authenticated;
grant execute on function private.can_manage_organization(text) to authenticated, service_role;
