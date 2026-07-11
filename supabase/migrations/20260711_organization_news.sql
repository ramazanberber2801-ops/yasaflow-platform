-- Yasaflow organization-scoped News foundation

create extension if not exists pgcrypto;

create table if not exists public.organization_news (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  title text not null,
  summary text,
  content text,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_news_org_status_idx
  on public.organization_news (organization_id, status, published_at desc);

alter table public.organization_news enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_news'
      and policyname = 'Organization admins manage own news'
  ) then
    create policy "Organization admins manage own news"
      on public.organization_news
      for all
      to authenticated
      using (
        exists (
          select 1 from public.organization_admins oa
          where oa.organization_id = organization_news.organization_id
            and oa.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.organization_admins oa
          where oa.organization_id = organization_news.organization_id
            and oa.user_id = auth.uid()
        )
      );
  end if;
end $$;

comment on table public.organization_news is
  'Organization-owned news. Separate from the legacy global news table.';
