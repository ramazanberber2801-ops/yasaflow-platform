alter table public.settings
  add column if not exists kurban_enabled boolean not null default false,
  add column if not exists kurban_start_date date;
