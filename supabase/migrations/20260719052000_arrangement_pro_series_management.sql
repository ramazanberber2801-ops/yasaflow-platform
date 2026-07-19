-- Applied to production on 2026-07-19.
alter table public.organization_activities
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists recurrence_sequence integer;

create index if not exists organization_activities_series_sequence_idx
  on public.organization_activities(recurrence_series_id, recurrence_sequence, activity_date);

create or replace function public.get_activity_series(p_activity_id uuid)
returns table(
  id uuid,title text,activity_date date,start_time time,end_time time,location text,capacity integer,status text,
  cancellation_reason text,recurrence_series_id uuid,recurrence_sequence integer,
  confirmed_registrations bigint,registered_attendees bigint
)
language plpgsql security definer set search_path=public as $$
declare a public.organization_activities%rowtype;
begin
  select * into a from public.organization_activities where organization_activities.id=p_activity_id;
  if not found then raise exception 'activity_not_found'; end if;
  if not exists(select 1 from public.organization_admins oa where oa.organization_id=a.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted')
     and not exists(select 1 from public.admins x where x.auth_user_id=auth.uid() and x.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
  return query
  select x.id,x.title,x.activity_date,x.start_time,x.end_time,x.location,x.capacity,x.status,x.cancellation_reason,
         x.recurrence_series_id,x.recurrence_sequence,
         count(r.id) filter(where r.status='confirmed'),coalesce(sum(r.attendees) filter(where r.status='confirmed'),0)
  from public.organization_activities x left join public.activity_registrations r on r.activity_id=x.id
  where x.id=p_activity_id or (a.recurrence_series_id is not null and x.recurrence_series_id=a.recurrence_series_id)
  group by x.id order by x.activity_date,x.start_time nulls first;
end$$;
revoke all on function public.get_activity_series(uuid) from public;
grant execute on function public.get_activity_series(uuid) to authenticated;

create or replace function public.manage_activity_series(
  p_activity_id uuid,p_scope text,p_action text,p_title text default null,p_activity_date date default null,
  p_start_time time default null,p_end_time time default null,p_location text default null,p_capacity integer default null,
  p_cancellation_reason text default null
) returns uuid[] language plpgsql security definer set search_path=public as $$
declare a public.organization_activities%rowtype; ids uuid[]; new_series uuid; date_delta integer;
begin
  if p_scope not in('single','following','series') then raise exception 'invalid_scope'; end if;
  if p_action not in('update','cancel','reopen') then raise exception 'invalid_action'; end if;
  select * into a from public.organization_activities where id=p_activity_id;
  if not found then raise exception 'activity_not_found'; end if;
  if not exists(select 1 from public.organization_admins oa where oa.organization_id=a.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted')
     and not exists(select 1 from public.admins x where x.auth_user_id=auth.uid() and x.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
  if p_scope='single' or a.recurrence_series_id is null then ids:=array[p_activity_id];
  elsif p_scope='following' then select array_agg(id order by activity_date,start_time) into ids from public.organization_activities where recurrence_series_id=a.recurrence_series_id and activity_date>=a.activity_date;
  else select array_agg(id order by activity_date,start_time) into ids from public.organization_activities where recurrence_series_id=a.recurrence_series_id; end if;
  if p_action='cancel' then update public.organization_activities set status='cancelled',cancellation_reason=nullif(trim(p_cancellation_reason),''),cancelled_at=now() where id=any(ids);
  elsif p_action='reopen' then update public.organization_activities set status='published',cancellation_reason=null,cancelled_at=null where id=any(ids);
  else
    date_delta:=case when p_activity_date is null then 0 else p_activity_date-a.activity_date end;
    update public.organization_activities x set title=coalesce(nullif(trim(p_title),''),x.title),activity_date=case when p_activity_date is null then x.activity_date else x.activity_date+date_delta end,start_time=coalesce(p_start_time,x.start_time),end_time=coalesce(p_end_time,x.end_time),location=case when p_location is null then x.location else nullif(trim(p_location),'') end,capacity=coalesce(p_capacity,x.capacity) where x.id=any(ids);
    if p_scope='following' and a.recurrence_series_id is not null then new_series:=gen_random_uuid(); update public.organization_activities set recurrence_series_id=new_series where id=any(ids); end if;
  end if;
  return ids;
end$$;
revoke all on function public.manage_activity_series(uuid,text,text,text,date,time,time,text,integer,text) from public;
grant execute on function public.manage_activity_series(uuid,text,text,text,date,time,time,text,integer,text) to authenticated;

update public.organization_activities a set recurrence_sequence=s.seq
from (select id,row_number() over(partition by recurrence_series_id order by activity_date,start_time,id)::integer seq from public.organization_activities where recurrence_series_id is not null) s
where a.id=s.id and a.recurrence_sequence is null;