-- Strengthen tenant isolation for organization administrators.

drop policy if exists "Authenticated users can read organizations" on public.organizations;
create policy "Users read permitted organizations"
on public.organizations for select
to authenticated
using (private.is_platform_admin() or private.can_manage_organization(id));

drop policy if exists "Authenticated users can read organization modules" on public.organization_modules;
create policy "Public reads organization modules"
on public.organization_modules for select
to anon
using (true);
create policy "Users read permitted organization modules"
on public.organization_modules for select
to authenticated
using (private.is_platform_admin() or private.can_manage_organization(organization_id));

drop policy if exists "Admins delete push messages" on public.push_messages;
drop policy if exists "Admins insert push messages" on public.push_messages;
drop policy if exists "Admins read all push messages" on public.push_messages;
drop policy if exists "Admins update push messages" on public.push_messages;

create policy "Organization admins delete push messages"
on public.push_messages for delete
to authenticated
using (private.can_manage_organization(organization_id));

create policy "Organization admins insert push messages"
on public.push_messages for insert
to authenticated
with check (private.can_manage_organization(organization_id));

create policy "Organization admins read push messages"
on public.push_messages for select
to authenticated
using (private.can_manage_organization(organization_id));

create policy "Organization admins update push messages"
on public.push_messages for update
to authenticated
using (private.can_manage_organization(organization_id))
with check (private.can_manage_organization(organization_id));

-- Provision an organization, modules, administrator record and checklist atomically.
create or replace function public.provision_organization(
  organization_input jsonb,
  modules_input jsonb default '[]'::jsonb,
  provisioning_steps_input jsonb default '[]'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  organization_id_value text;
  organization_name_value text;
  admin_email_value text;
  module_row jsonb;
  step_row jsonb;
begin
  if not private.is_platform_admin() then
    raise exception 'Only platform administrators can provision organizations';
  end if;

  organization_id_value := nullif(btrim(organization_input->>'id'), '');
  organization_name_value := nullif(btrim(organization_input->>'name'), '');
  if organization_id_value is null or organization_name_value is null then
    raise exception 'Organization id and name are required';
  end if;

  insert into public.organizations (
    id, name, organization_type, country, language, status, hosting, hosting_mode,
    domain, live_url, vercel_url, supabase_url, theme_id, onboarding_step,
    admin_name, admin_email, member_count, trial_started_at, trial_ends_at,
    subscription_status, subscription_plan, updated_at
  ) values (
    organization_id_value,
    organization_name_value,
    nullif(organization_input->>'organization_type',''),
    coalesce(nullif(organization_input->>'country',''),'Norge'),
    coalesce(nullif(organization_input->>'language',''),'Norsk'),
    coalesce(nullif(organization_input->>'status',''),'Prøve'),
    coalesce(nullif(organization_input->>'hosting_mode',''),'Managed'),
    coalesce(nullif(organization_input->>'hosting_mode',''),'Managed'),
    nullif(organization_input->>'domain',''),
    nullif(organization_input->>'live_url',''),
    nullif(organization_input->>'vercel_url',''),
    nullif(organization_input->>'supabase_url',''),
    coalesce(nullif(organization_input->>'theme_id',''),'yasaflow-standard'),
    coalesce(nullif(organization_input->>'onboarding_step',''),'Bestilling'),
    nullif(organization_input->>'admin_name',''),
    nullif(lower(btrim(organization_input->>'admin_email')),''),
    coalesce((organization_input->>'member_count')::integer,0),
    coalesce((organization_input->>'trial_started_at')::timestamptz, now()),
    coalesce((organization_input->>'trial_ends_at')::timestamptz, now() + interval '7 days'),
    coalesce(nullif(organization_input->>'subscription_status',''),'trial'),
    coalesce(nullif(organization_input->>'subscription_plan',''),'core'),
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    organization_type = excluded.organization_type,
    country = excluded.country,
    language = excluded.language,
    status = excluded.status,
    hosting = excluded.hosting,
    hosting_mode = excluded.hosting_mode,
    domain = excluded.domain,
    live_url = excluded.live_url,
    vercel_url = excluded.vercel_url,
    supabase_url = excluded.supabase_url,
    theme_id = excluded.theme_id,
    onboarding_step = excluded.onboarding_step,
    admin_name = excluded.admin_name,
    admin_email = excluded.admin_email,
    member_count = excluded.member_count,
    subscription_status = excluded.subscription_status,
    subscription_plan = excluded.subscription_plan,
    updated_at = now();

  for module_row in select value from jsonb_array_elements(coalesce(modules_input,'[]'::jsonb)) loop
    insert into public.organization_modules (organization_id,module_id,enabled,status,updated_at)
    values (
      organization_id_value,
      module_row->>'module_id',
      coalesce((module_row->>'enabled')::boolean,false),
      coalesce(nullif(module_row->>'status',''),'Av'),
      now()
    )
    on conflict (organization_id,module_id) do update set
      enabled = excluded.enabled,
      status = excluded.status,
      updated_at = now();
  end loop;

  admin_email_value := nullif(lower(btrim(organization_input->>'admin_email')),'');
  if admin_email_value is not null then
    insert into public.organization_admins (organization_id,display_name,email,role,invitation_status,updated_at)
    values (
      organization_id_value,
      coalesce(nullif(organization_input->>'admin_name',''),admin_email_value),
      admin_email_value,
      'admin',
      coalesce(nullif(organization_input->>'invitation_status',''),'pending'),
      now()
    )
    on conflict (organization_id,email) do update set
      display_name = excluded.display_name,
      invitation_status = excluded.invitation_status,
      updated_at = now();
  end if;

  for step_row in select value from jsonb_array_elements(coalesce(provisioning_steps_input,'[]'::jsonb)) loop
    insert into public.organization_provisioning_steps (organization_id,step_key,label,status,updated_at)
    values (
      organization_id_value,
      step_row->>'step_key',
      coalesce(nullif(step_row->>'label',''),step_row->>'step_key'),
      coalesce(nullif(step_row->>'status',''),'pending'),
      now()
    )
    on conflict (organization_id,step_key) do update set
      label = excluded.label,
      status = excluded.status,
      updated_at = now();
  end loop;

  return organization_id_value;
end;
$$;

revoke all on function public.provision_organization(jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.provision_organization(jsonb,jsonb,jsonb) to authenticated;
