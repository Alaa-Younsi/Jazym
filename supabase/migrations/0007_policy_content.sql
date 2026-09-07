-- Admin-editable policy page copy. Store OVERRIDES, not a copy: every text
-- column is nullable and NULL means "use the text compiled into the app".
-- The seed inserts identity only (key, icon, order) — never the prose.
-- See skill Phase 8.8.

create table if not exists public.policy_settings (
  id                 boolean primary key default true check (id),
  tag_fr             text, tag_ar text,
  title_fr           text, title_ar text,
  intro_fr           text, intro_ar text,
  contact_title_fr   text, contact_title_ar text,
  contact_body_fr    text, contact_body_ar text,
  updated_label_fr   text, updated_label_ar text,
  updated_at         timestamptz not null default now()
);
insert into public.policy_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.policy_sections (
  id          uuid primary key default gen_random_uuid(),
  builtin_key text unique,   -- 'policy_s1'… = a section the app ships text for; NULL = owner-added
  icon        text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  title_fr    text, title_ar text,
  body_fr     text, body_ar text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger policy_sections_updated_at
  before update on public.policy_sections
  for each row execute function public.update_updated_at();

-- Identity-only seed for the five built-in sections.
insert into public.policy_sections (builtin_key, icon, sort_order) values
  ('policy_s1', 'ShoppingBag', 0),
  ('policy_s2', 'Truck', 1),
  ('policy_s3', 'Wallet', 2),
  ('policy_s4', 'RefreshCw', 3),
  ('policy_s5', 'Lock', 4)
on conflict (builtin_key) do nothing;

alter table public.policy_settings enable row level security;
alter table public.policy_sections enable row level security;

create policy "anon read policy settings" on public.policy_settings
  for select to anon using (true);
create policy "anon read policy sections" on public.policy_sections
  for select to anon using (true);

create policy "admin manage policy settings" on public.policy_settings
  for all to authenticated using (has_section('policy')) with check (has_section('policy'));
create policy "admin manage policy sections" on public.policy_sections
  for all to authenticated using (has_section('policy')) with check (has_section('policy'));
