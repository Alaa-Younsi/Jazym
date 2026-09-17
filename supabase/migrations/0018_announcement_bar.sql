-- Admin-controlled announcement bar (the strip above the header).
-- Replaces the single announcement_fr/announcement_ar pair with a list of
-- rotating messages, each with its own leading/trailing emoji, plus a visual
-- style and rotation speed. The legacy columns are KEPT and used as the
-- fallback when no items exist, so a half-applied deploy never blanks the bar.

alter table public.store_settings
  add column if not exists announcement_enabled boolean not null default true,
  add column if not exists announcement_items   jsonb   not null default '[]'::jsonb,
  add column if not exists announcement_speed   integer not null default 6,
  add column if not exists announcement_style   text    not null default 'gradient';

alter table public.store_settings
  drop constraint if exists store_settings_announcement_style_check;
alter table public.store_settings
  add constraint store_settings_announcement_style_check
  check (announcement_style in ('gradient', 'solid', 'soft'));

alter table public.store_settings
  drop constraint if exists store_settings_announcement_speed_check;
alter table public.store_settings
  add constraint store_settings_announcement_speed_check
  check (announcement_speed between 2 and 60);

-- Shape guard: an array of at most 8 objects. Content is sanitised in the
-- admin form; this only stops a malformed payload from reaching the header.
alter table public.store_settings
  drop constraint if exists store_settings_announcement_items_check;
alter table public.store_settings
  add constraint store_settings_announcement_items_check
  check (
    jsonb_typeof(announcement_items) = 'array'
    and jsonb_array_length(announcement_items) <= 8
  );

-- Seed the list from the legacy single message so the bar looks identical
-- the moment this migration lands.
update public.store_settings
set announcement_items = jsonb_build_array(
      jsonb_build_object(
        'text_fr', coalesce(announcement_fr, ''),
        'text_ar', coalesce(announcement_ar, ''),
        'emoji_start', '🚚',
        'emoji_end', '🌼'
      )
    )
where id = 1
  and announcement_items = '[]'::jsonb
  and coalesce(announcement_fr, announcement_ar) is not null;

-- Tighten store_settings writes. Until now ANY active admin could PATCH this
-- row (the blanket is_admin() policy from 0004) even with no section granted.
-- Reads stay open to everyone; writing is the announcement section's job.
drop policy if exists "admin manage store settings" on public.store_settings;

create policy "admin read store settings" on public.store_settings
  for select to authenticated using (is_admin());
create policy "admin write store settings" on public.store_settings
  for update to authenticated
  using (has_section('announcement')) with check (has_section('announcement'));
