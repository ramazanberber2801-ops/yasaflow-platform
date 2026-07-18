-- Arrangement Pro core schema. Applied to production on 2026-07-18.
-- Adds certificate, evaluation, reporting and recurrence support without changing existing registrations.

alter table public.organization_activities
 add column if not exists certificate_enabled boolean not null default false,
 add column if not exists certificate_title text,
 add column if not exists certificate_signature_name text,
 add column if not exists evaluation_enabled boolean not null default false,
 add column if not exists recurrence_series_id uuid,
 add column if not exists recurrence_rule jsonb,
 add column if not exists recurrence_parent_id uuid references public.organization_activities(id) on delete set null;

alter table public.activity_registrations
 add column if not exists certificate_token uuid default gen_random_uuid(),
 add column if not exists certificate_issued_at timestamptz,
 add column if not exists certificate_email_sent_at timestamptz,
 add column if not exists wallet_token uuid default gen_random_uuid();

update public.activity_registrations set certificate_token=gen_random_uuid() where certificate_token is null;
update public.activity_registrations set wallet_token=gen_random_uuid() where wallet_token is null;
create unique index if not exists activity_registrations_certificate_token_uidx on public.activity_registrations(certificate_token);
create unique index if not exists activity_registrations_wallet_token_uidx on public.activity_registrations(wallet_token);
create index if not exists organization_activities_recurrence_series_idx on public.organization_activities(recurrence_series_id,activity_date);

create table if not exists public.activity_evaluations(
 id uuid primary key default gen_random_uuid(), organization_id text not null,
 activity_id uuid not null references public.organization_activities(id) on delete cascade,
 registration_id uuid references public.activity_registrations(id) on delete cascade,
 response_token uuid not null default gen_random_uuid(), rating smallint check(rating between 1 and 5),
 nps smallint check(nps between 0 and 10), comment text, submitted_at timestamptz,
 created_at timestamptz not null default now(), unique(activity_id,registration_id), unique(response_token)
);
alter table public.activity_evaluations enable row level security;
drop policy if exists "Organization admins can read evaluations" on public.activity_evaluations;
create policy "Organization admins can read evaluations" on public.activity_evaluations for select to authenticated using(
 exists(select 1 from public.organization_admins oa where oa.organization_id=activity_evaluations.organization_id and oa.user_id=(select auth.uid()) and oa.invitation_status='accepted')
 or exists(select 1 from public.admins a where a.auth_user_id=(select auth.uid()) and a.role in('owner','super_admin','superadmin'))
);

create or replace function public.set_activity_registration_payment(p_registration_id uuid,p_confirmed boolean) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.activity_registrations%rowtype; begin
 select * into r from public.activity_registrations where id=p_registration_id; if not found then raise exception 'registration_not_found'; end if;
 if not exists(select 1 from public.organization_admins oa where oa.organization_id=r.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted') and not exists(select 1 from public.admins a where a.auth_user_id=auth.uid() and a.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
 update public.activity_registrations set payment_confirmed=p_confirmed,payment_confirmed_at=case when p_confirmed then now() else null end,updated_at=now() where id=p_registration_id;
 return jsonb_build_object('registration_id',p_registration_id,'payment_confirmed',p_confirmed); end$$;
revoke all on function public.set_activity_registration_payment(uuid,boolean) from public;
grant execute on function public.set_activity_registration_payment(uuid,boolean) to authenticated;

create or replace function public.issue_activity_certificate(p_registration_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.activity_registrations%rowtype; has_checkin boolean; begin
 select * into r from public.activity_registrations where id=p_registration_id; if not found then raise exception 'registration_not_found'; end if;
 if not exists(select 1 from public.organization_admins oa where oa.organization_id=r.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted') and not exists(select 1 from public.admins a where a.auth_user_id=auth.uid() and a.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
 select exists(select 1 from public.activity_checkins c where c.activity_id=r.activity_id and c.registration_id=r.id) into has_checkin;
 if r.status<>'confirmed' or not has_checkin then raise exception 'attendance_required'; end if;
 update public.activity_registrations set certificate_issued_at=coalesce(certificate_issued_at,now()),certificate_token=coalesce(certificate_token,gen_random_uuid()),updated_at=now() where id=p_registration_id returning * into r;
 return jsonb_build_object('registration_id',r.id,'certificate_token',r.certificate_token,'issued_at',r.certificate_issued_at); end$$;
revoke all on function public.issue_activity_certificate(uuid) from public;
grant execute on function public.issue_activity_certificate(uuid) to authenticated;

create or replace function public.create_activity_evaluation_invites(p_activity_id uuid) returns integer language plpgsql security definer set search_path=public as $$
declare a public.organization_activities%rowtype; n integer; begin
 select * into a from public.organization_activities where id=p_activity_id; if not found then raise exception 'activity_not_found'; end if;
 if not exists(select 1 from public.organization_admins oa where oa.organization_id=a.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted') and not exists(select 1 from public.admins x where x.auth_user_id=auth.uid() and x.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
 insert into public.activity_evaluations(organization_id,activity_id,registration_id) select a.organization_id,p_activity_id,r.id from public.activity_registrations r where r.activity_id=p_activity_id and r.status='confirmed' and exists(select 1 from public.activity_checkins c where c.activity_id=r.activity_id and c.registration_id=r.id) on conflict(activity_id,registration_id) do nothing;
 get diagnostics n=row_count; return n; end$$;
revoke all on function public.create_activity_evaluation_invites(uuid) from public;
grant execute on function public.create_activity_evaluation_invites(uuid) to authenticated;

create or replace function public.submit_activity_evaluation(p_token uuid,p_rating smallint,p_nps smallint,p_comment text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare e public.activity_evaluations%rowtype; begin
 if p_rating not between 1 and 5 or p_nps not between 0 and 10 then raise exception 'invalid_evaluation'; end if;
 update public.activity_evaluations set rating=p_rating,nps=p_nps,comment=nullif(trim(p_comment),''),submitted_at=now() where response_token=p_token and submitted_at is null returning * into e;
 if not found then raise exception 'evaluation_not_found_or_submitted'; end if; return jsonb_build_object('ok',true,'activity_id',e.activity_id); end$$;
revoke all on function public.submit_activity_evaluation(uuid,smallint,smallint,text) from public;
grant execute on function public.submit_activity_evaluation(uuid,smallint,smallint,text) to anon,authenticated;

create or replace function public.create_recurring_activity_instances(p_activity_id uuid,p_frequency text,p_interval integer,p_occurrences integer) returns integer language plpgsql security definer set search_path=public as $$
declare s public.organization_activities%rowtype; series uuid:=gen_random_uuid(); i integer; d date; begin
 if p_frequency not in('daily','weekly','monthly') or p_interval<1 or p_occurrences<2 or p_occurrences>104 then raise exception 'invalid_recurrence'; end if;
 select * into s from public.organization_activities where id=p_activity_id; if not found then raise exception 'activity_not_found'; end if;
 if not exists(select 1 from public.organization_admins oa where oa.organization_id=s.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted') and not exists(select 1 from public.admins a where a.auth_user_id=auth.uid() and a.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
 update public.organization_activities set recurrence_series_id=series,recurrence_rule=jsonb_build_object('frequency',p_frequency,'interval',p_interval,'occurrences',p_occurrences) where id=p_activity_id;
 for i in 1..p_occurrences-1 loop d:=case p_frequency when 'daily' then s.activity_date+(i*p_interval) when 'weekly' then s.activity_date+(i*p_interval*7) else (s.activity_date+make_interval(months=>i*p_interval))::date end;
 insert into public.organization_activities(organization_id,title,description,activity_date,start_time,end_time,location,capacity,status,published_at,contact_person_id,visibility,allowed_group_ids,category,registration_enabled,registration_deadline,is_paid,price_amount,price_currency,payment_url,payment_confirmation_required,certificate_enabled,certificate_title,certificate_signature_name,evaluation_enabled,recurrence_series_id,recurrence_rule,recurrence_parent_id)
 values(s.organization_id,s.title,s.description,d,s.start_time,s.end_time,s.location,s.capacity,s.status,case when s.status='published' then now() end,s.contact_person_id,s.visibility,s.allowed_group_ids,s.category,s.registration_enabled,null,s.is_paid,s.price_amount,s.price_currency,s.payment_url,s.payment_confirmation_required,s.certificate_enabled,s.certificate_title,s.certificate_signature_name,s.evaluation_enabled,series,jsonb_build_object('frequency',p_frequency,'interval',p_interval,'occurrences',p_occurrences),p_activity_id); end loop; return p_occurrences; end$$;
revoke all on function public.create_recurring_activity_instances(uuid,text,integer,integer) from public;
grant execute on function public.create_recurring_activity_instances(uuid,text,integer,integer) to authenticated;

create or replace view public.activity_report_summary with(security_invoker=true) as
select a.id activity_id,a.organization_id,a.title,a.activity_date,count(r.id) filter(where r.status='confirmed') confirmed_registrations,coalesce(sum(r.attendees) filter(where r.status='confirmed'),0) registered_attendees,coalesce(sum(r.attendees) filter(where r.status='waitlist'),0) waitlist_attendees,count(r.id) filter(where r.status='confirmed' and r.payment_confirmed) paid_registrations,count(distinct c.registration_id) checked_in_registrations,round(avg(e.rating)::numeric,2) average_rating,round(avg(e.nps)::numeric,2) average_nps,count(e.id) filter(where e.submitted_at is not null) evaluation_responses
from public.organization_activities a left join public.activity_registrations r on r.activity_id=a.id left join public.activity_checkins c on c.activity_id=a.id and c.registration_id=r.id left join public.activity_evaluations e on e.activity_id=a.id and e.registration_id=r.id group by a.id;
grant select on public.activity_report_summary to authenticated;