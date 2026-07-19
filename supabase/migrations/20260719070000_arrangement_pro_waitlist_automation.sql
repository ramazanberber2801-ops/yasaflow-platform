-- Applied to production on 2026-07-19.
-- Automatic queue ordering, timed offers and public accept/decline responses.

create table if not exists public.activity_waitlist_notifications(
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  activity_id uuid not null references public.organization_activities(id) on delete cascade,
  registration_id uuid not null references public.activity_registrations(id) on delete cascade,
  notification_type text not null check(notification_type in ('offer','accepted','expired','declined')),
  status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.activity_waitlist_notifications enable row level security;
create index if not exists activity_waitlist_notifications_pending_idx on public.activity_waitlist_notifications(status,created_at);

create or replace function public.resequence_activity_waitlist(p_activity_id uuid)
returns void language sql security definer set search_path=public as $$
  with ranked as (
    select id,row_number() over(order by created_at,id)::integer pos
    from public.activity_registrations
    where activity_id=p_activity_id and status='waitlist'
  )
  update public.activity_registrations r set waitlist_position=ranked.pos
  from ranked where r.id=ranked.id;
$$;

create or replace function public.offer_next_activity_waitlist(p_activity_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare a public.organization_activities%rowtype; r public.activity_registrations%rowtype; used integer; free_places integer;
begin
  select * into a from public.organization_activities where id=p_activity_id for update;
  if not found or not a.automatic_waitlist_promotion or a.status<>'published' then return null; end if;
  update public.activity_registrations set waitlist_offer_status='expired',status='waitlist',waitlist_offered_at=null,waitlist_offer_expires_at=null
    where activity_id=p_activity_id and waitlist_offer_status='offered' and waitlist_offer_expires_at<=now();
  select coalesce(sum(attendees),0) into used from public.activity_registrations where activity_id=p_activity_id and status='confirmed';
  free_places:=case when a.capacity is null then 2147483647 else greatest(a.capacity-used,0) end;
  if free_places<=0 or exists(select 1 from public.activity_registrations where activity_id=p_activity_id and waitlist_offer_status='offered' and waitlist_offer_expires_at>now()) then return null; end if;
  select * into r from public.activity_registrations where activity_id=p_activity_id and status='waitlist' and attendees<=free_places order by created_at,id limit 1 for update skip locked;
  if not found then perform public.resequence_activity_waitlist(p_activity_id); return null; end if;
  update public.activity_registrations set waitlist_offer_status='offered',waitlist_offered_at=now(),waitlist_offer_expires_at=now()+make_interval(mins=>a.waitlist_offer_minutes),waitlist_offer_token=gen_random_uuid() where id=r.id;
  insert into public.activity_waitlist_notifications(organization_id,activity_id,registration_id,notification_type) values(a.organization_id,a.id,r.id,'offer');
  perform public.resequence_activity_waitlist(p_activity_id);
  return r.id;
end$$;

create or replace function public.respond_activity_waitlist_offer(p_token uuid,p_decision text)
returns table(result text,activity_id uuid,registration_id uuid) language plpgsql security definer set search_path=public as $$
declare r public.activity_registrations%rowtype; a public.organization_activities%rowtype; used integer;
begin
  if p_decision not in('accept','decline') then raise exception 'invalid_decision'; end if;
  select * into r from public.activity_registrations where waitlist_offer_token=p_token for update;
  if not found then raise exception 'offer_not_found'; end if;
  select * into a from public.organization_activities where id=r.activity_id for update;
  if r.waitlist_offer_status<>'offered' then return query select r.waitlist_offer_status,r.activity_id,r.id; return; end if;
  if r.waitlist_offer_expires_at<=now() then
    update public.activity_registrations set waitlist_offer_status='expired',waitlist_offered_at=null,waitlist_offer_expires_at=null where id=r.id;
    insert into public.activity_waitlist_notifications(organization_id,activity_id,registration_id,notification_type) values(r.organization_id,r.activity_id,r.id,'expired');
    perform public.offer_next_activity_waitlist(r.activity_id);
    return query select 'expired'::text,r.activity_id,r.id; return;
  end if;
  if p_decision='decline' then
    update public.activity_registrations set waitlist_offer_status='declined',waitlist_offered_at=null,waitlist_offer_expires_at=null where id=r.id;
    insert into public.activity_waitlist_notifications(organization_id,activity_id,registration_id,notification_type) values(r.organization_id,r.activity_id,r.id,'declined');
    perform public.offer_next_activity_waitlist(r.activity_id);
    return query select 'declined'::text,r.activity_id,r.id; return;
  end if;
  select coalesce(sum(attendees),0) into used from public.activity_registrations where activity_id=r.activity_id and status='confirmed';
  if a.capacity is not null and used+r.attendees>a.capacity then
    update public.activity_registrations set waitlist_offer_status='expired',waitlist_offered_at=null,waitlist_offer_expires_at=null where id=r.id;
    perform public.offer_next_activity_waitlist(r.activity_id);
    return query select 'full'::text,r.activity_id,r.id; return;
  end if;
  update public.activity_registrations set status='confirmed',waitlist_offer_status='accepted',waitlist_position=null,waitlist_offered_at=null,waitlist_offer_expires_at=null where id=r.id;
  insert into public.activity_waitlist_notifications(organization_id,activity_id,registration_id,notification_type) values(r.organization_id,r.activity_id,r.id,'accepted');
  perform public.resequence_activity_waitlist(r.activity_id);
  return query select 'accepted'::text,r.activity_id,r.id;
end$$;
revoke all on function public.respond_activity_waitlist_offer(uuid,text) from public;
grant execute on function public.respond_activity_waitlist_offer(uuid,text) to anon,authenticated;

create or replace function public.process_activity_waitlist(p_activity_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare a public.organization_activities%rowtype;
begin
  select * into a from public.organization_activities where id=p_activity_id;
  if not found then raise exception 'activity_not_found'; end if;
  if not exists(select 1 from public.organization_admins oa where oa.organization_id=a.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted')
     and not exists(select 1 from public.admins x where x.auth_user_id=auth.uid() and x.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
  return public.offer_next_activity_waitlist(p_activity_id);
end$$;
revoke all on function public.process_activity_waitlist(uuid) from public;
grant execute on function public.process_activity_waitlist(uuid) to authenticated;

create or replace function public.activity_waitlist_after_registration_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' and new.status='waitlist' then perform public.resequence_activity_waitlist(new.activity_id); end if;
  if tg_op='UPDATE' and old.status='confirmed' and new.status<>'confirmed' then perform public.offer_next_activity_waitlist(new.activity_id); end if;
  if tg_op='UPDATE' and old.status='waitlist' and new.status<>'waitlist' then perform public.resequence_activity_waitlist(new.activity_id); end if;
  return new;
end$$;
drop trigger if exists activity_waitlist_after_registration_change on public.activity_registrations;
create trigger activity_waitlist_after_registration_change after insert or update of status on public.activity_registrations for each row execute function public.activity_waitlist_after_registration_change();