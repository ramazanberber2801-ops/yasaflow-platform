alter table if exists public.settings
add column if not exists branding_primary_color text,
add column if not exists branding_secondary_color text,
add column if not exists branding_background_color text,
add column if not exists branding_text_color text;
