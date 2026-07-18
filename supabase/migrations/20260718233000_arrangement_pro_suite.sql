-- Arrangement Pro suite: certificates, wallet links, reporting, evaluations and recurrence

alter table if exists public.organization_activities
  add column if not exists certificate_enabled boolean not null default false,
  add column if not exists certificate_title text,
  add column if not exists certificate_signature_name text,
  add column if not exists evaluation_enabled boolean not null default false,
  add column if not exists evaluation_send_at timestamptz,
  add column if not exists recurrence_series_id uuid,
  add column if not exists recurrence_rule text,
  add column if not exists recurrence_parent_id uuid references public.organization_activities(id) on delete set null;

alter table if exists public.activity_registrations
  add column if not exists certificate_token uuid default gen_random_uuid(),
  add column if not exists certificate_issued_at timestamptz,
  add column if not exists certificate_email_sent_at timestamptz,
  add column if not exists wallet_token uuid default gen_random_uuid();

create unique index if not exists activity_registrations_certificate_token_uidx
  on public.activity_registrations(certificate_token);
create unique index if not exists activity_registrations_wallet_token_uidx
  on public.activity_registrations(wallet_token);
create index if not exists organization_activities_recurrence_series_idx
  on public.organization_activities(recurrence_series_id, activity_date);

create table if not exists public.activity_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  activity_id uuid not null references public.organization_activities(id) on delete cascade,
  registration_id uuid references public.activity_registrations(id) on delete set null,
  response_token uuid not null default gen_random_uuid(),
  rating smallint check (rating between 1 and 5),
  nps smallint check (nps between 0 and 10),
  comment text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(activity_id, registration_id),
  unique(response_token)
);

alter table public.activity_evaluations enable row level security;

create policy if not exists "Public can submit evaluation by token"
on public.activity_evaluations for update
to anon, authenticated
using (submitted_at is null)
with check (rating between 1 and 5 and nps between 0 and 10 and submitted_at is not null);

create policy if not exists "Organization admins can read evaluations"
on public.activity_evaluations for select
to authenticated
using (
  exists (
    select 1 from public.organization_admins oa
    where oa.organization_id = activity_evaluations.organization_id
      and oa.user_id = auth.uid()
      and oa.invitation_status = 'accepted'
  )
  or exists (
    select 1 from public.admins a
    where a.auth_user_id = auth.uid()
      and a.role in ('owner','super_admin','superadmin')
  )
);

create or replace function public.set_activity_registration_payment(
  p_registration_id uuid,
  p_confirmed boolean
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_registration public.activity_registrations%rowtype;
  v_activity public.organization_activities%rowtype;
begin
  select * into v_registration from public.activity_registrations where id = p_registration_id;
  if not found then raise exception 'registration_not_found'; end if;
  select * into v_activity from public.organization_activities where id = v_registration.activity_id;
  if not exists (
    select 1 from public.organization_admins oa
    where oa.organization_id = v_activity.organization_id and oa.user_id = auth.uid() and oa.invitation_status = 'accepted'
  ) and not exists (
    select 1 from public.admins a where a.auth_user_id = auth.uid() and a.role in ('owner','super_admin','superadmin')
  ) then raise exception 'not_authorized'; end if;
  update public.activity_registrations set payment_confirmed = p_confirmed where id = p_registration_id;
  return jsonb_build_object('registration_id',p_registration_id,'payment_confirmed',p_confirmed);
end $$;

grant execute on function public.set_activity_registration_payment(uuid,boolean) to authenticated;

create or replace function public.issue_activity_certificate(p_registration_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_registration public.activity_registrations%rowtype;
  v_activity public.organization_activities%rowtype;
begin
  select * into v_registration from public.activity_registrations where id = p_registration_id;
  if not found then raise exception 'registration_not_found'; end if;
  select * into v_activity from public.organization_activities where id = v_registration.activity_id;
  if not exists (
    select 1 from public.organization_admins oa
    where oa.organization_id = v_activity.organization_id and oa.user_id = auth.uid() and oa.invitation_status = 'accepted'
  ) and not exists (
    select 1 from public.admins a where a.auth_user_id = auth.uid() and a.role in ('owner','super_admin','superadmin')
  ) then raise exception 'not_authorized'; end if;
  if v_registration.status <> 'confirmed' or coalesce(v_registration.checked_in,false) = false then
    raise exception 'attendance_required';
  end if;
  update public.activity_registrations
  set certificate_issued_at = coalesce(certificate_issued_at, now()),
      certificate_token = coalesce(certificate_token, gen_random_uuid())
  where id = p_registration_id
  returning * into v_registration;
  return jsonb_build_object(
    'registration_id', v_registration.id,
    'certificate_token', v_registration.certificate_token,
    'issued_at', v_registration.certificate_issued_at
  );
end $$;

grant execute on function public.issue_activity_certificate(uuid) to authenticated;

create or replace function public.create_activity_evaluation_invites(p_activity_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_activity public.organization_activities%rowtype;
  v_count integer;
begin
  select * into v_activity from public.organization_activities where id = p_activity_id;
  if not found then raise exception 'activity_not_found'; end if;
  if not exists (
    select 1 from public.organization_admins oa
    where oa.organization_id = v_activity.organization_id and oa.user_id = auth.uid() and oa.invitation_status = 'accepted'
  ) and not exists (
    select 1 from public.admins a where a.auth_user_id = auth.uid() and a.role in ('owner','super_admin','superadmin')
  ) then raise exception 'not_authorized'; end if;
  insert into public.activity_evaluations(organization_id,activity_id,registration_id)
  select v_activity.organization_id, p_activity_id, r.id
  from public.activity_registrations r
  where r.activity_id = p_activity_id and r.status='confirmed' and coalesce(r.checked_in,false)=true
  on conflict(activity_id,registration_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

grant execute on function public.create_activity_evaluation_invites(uuid) to authenticated;

create or replace function public.create_recurring_activity_instances(
  p_activity_id uuid,
  p_frequency text,
  p_interval integer,
  p_occurrences integer
) returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_source public.organization_activities%rowtype;
  v_series uuid := gen_random_uuid();
  v_i integer;
  v_date date;
begin
  if p_frequency not in ('daily','weekly','monthly') then raise exception 'invalid_frequency'; end if;
  if p_interval < 1 or p_occurrences < 2 or p_occurrences > 104 then raise exception 'invalid_recurrence'; end if;
  select * into v_source from public.organization_activities where id=p_activity_id;
  if not found then raise exception 'activity_not_found'; end if;
  if not exists (
    select 1 from public.organization_admins oa
    where oa.organization_id=v_source.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted'
  ) and not exists (
    select 1 from public.admins a where a.auth_user_id=auth.uid() and a.role in ('owner','super_admin','superadmin')
  ) then raise exception 'not_authorized'; end if;
  update public.organization_activities
    set recurrence_series_id=v_series,
        recurrence_rule=jsonb_build_object('frequency',p_frequency,'interval',p_interval,'occurrences',p_occurrences)::text
    where id=p_activity_id;
  for v_i in 1..(p_occurrences-1) loop
    v_date := case p_frequency
      when 'daily' then v_source.activity_date + (v_i*p_interval)
      when 'weekly' then v_source.activity_date + (v_i*p_interval*7)
      else (v_source.activity_date + make_interval(months => v_i*p_interval))::date
    end;
    insert into public.organization_activities(
      organization_id,title,description,activity_date,start_time,end_time,location,capacity,status,
      category,registration_enabled,registration_deadline,is_paid,price_amount,price_currency,payment_url,
      payment_confirmation_required,visibility,published_at,certificate_enabled,certificate_title,
      certificate_signature_name,evaluation_enabled,recurrence_series_id,recurrence_rule,recurrence_parent_id
    ) values (
      v_source.organization_id,v_source.title,v_source.description,v_date,v_source.start_time,v_source.end_time,
      v_source.location,v_source.capacity,v_source.status,v_source.category,v_source.registration_enabled,null,
      v_source.is_paid,v_source.price_amount,v_source.price_currency,v_source.payment_url,
      v_source.payment_confirmation_required,v_source.visibility,
      case when v_source.status='published' then now() else null end,
      v_source.certificate_enabled,v_source.certificate_title,v_source.certificate_signature_name,
      v_source.evaluation_enabled,v_series,
      jsonb_build_object('frequency',p_frequency,'interval',p_interval,'occurrences',p_occurrences)::text,
      p_activity_id
    );
  end loop;
  return p_occurrences;
end $$;

grant execute on function public.create_recurring_activity_instances(uuid,text,integer,integer) to authenticated;

create or replace view public.activity_report_summary as
select
  a.id as activity_id,
  a.organization_id,
  a.title,
  a.activity_date,
  count(r.id) filter (where r.status='confirmed') as confirmed_registrations,
  coalesce(sum(r.attendees) filter (where r.status='confirmed'),0) as registered_attendees,
  coalesce(sum(r.attendees) filter (where r.status='waitlist'),0) as waitlist_attendees,
  count(r.id) filter (where r.status='confirmed' and r.payment_confirmed) as paid_registrations,
  count(r.id) filter (where r.status='confirmed' and r.checked_in) as checked_in_registrations,
  round(avg(e.rating)::numeric,2) as average_rating,
  round(avg(e.nps)::numeric,2) as average_nps,
  count(e.id) filter (where e.submitted_at is not null) as evaluation_responses
from public.organization_activities a
left join public.activity_registrations r on r.activity_id=a.id
left join public.activity_evaluations e on e.activity_id=a.id and e.registration_id=r.id
group by a.id;
