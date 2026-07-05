alter table if exists public.settings
add column if not exists vipps_button_enabled boolean not null default true;
