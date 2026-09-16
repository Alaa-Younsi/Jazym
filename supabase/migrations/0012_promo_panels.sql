-- Admin-managed promo panels at a handful of fixed, code-defined slots
-- (home hero, home mid-page, category top, cart drawer). The admin edits
-- content/schedule per slot but cannot invent new slots — the 4 rows below
-- are the only ones that will ever exist, seeded once here.

create table if not exists public.promo_panels (
  id           uuid primary key default gen_random_uuid(),
  slot         text unique not null check (slot in ('home_hero','home_mid','category_top','cart_drawer')),
  active       boolean not null default false,
  title_fr     text,
  title_ar     text,
  subtitle_fr  text,
  subtitle_ar  text,
  image_url    text,
  link_url     text,
  start_at     timestamptz,
  end_at       timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger promo_panels_updated_at
  before update on public.promo_panels
  for each row execute function public.update_updated_at();

alter table public.promo_panels enable row level security;

-- Schedule/active filtering happens here, server-side, not trusted to the client.
create policy "anon read active panels" on public.promo_panels
  for select to anon using (
    active and (start_at is null or start_at <= now()) and (end_at is null or end_at >= now())
  );

create policy "admin manage panels" on public.promo_panels
  for all to authenticated using (has_section('panels')) with check (has_section('panels'));

insert into public.promo_panels (slot, active, sort_order) values
  ('home_hero', false, 1),
  ('home_mid', false, 2),
  ('category_top', false, 3),
  ('cart_drawer', false, 4)
on conflict (slot) do nothing;
