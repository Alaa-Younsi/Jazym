-- Admin-managed multi-pixel tracking (Meta + TikTok). See skill Phase 8.6.

create table if not exists public.tracking_pixels (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null default 'meta' check (provider in ('meta','tiktok')),
  label        text not null,
  pixel_id     text not null,
  active       boolean not null default true,
  scope        text not null default 'all' check (scope in ('all','paths','products','landing')),
  match_values text[] not null default '{}',
  events       jsonb not null default
    '{"page_view":true,"view_content":true,"add_to_cart":true,"initiate_checkout":true,"purchase":true}',
  currency     text not null default 'DZD',
  sort_order   integer not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger tracking_pixels_updated_at
  before update on public.tracking_pixels
  for each row execute function public.update_updated_at();

alter table public.tracking_pixels enable row level security;

-- Storefront reads ONLY active rows (a paused campaign's id must not leak).
create policy "anon read active pixels" on public.tracking_pixels
  for select to anon using (active = true);

create policy "admin manage pixels" on public.tracking_pixels
  for all to authenticated using (has_section('pixels')) with check (has_section('pixels'));
