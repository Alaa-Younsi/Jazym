-- Custom landing / sales pages built from blocks. See src/types/db.ts.

create table if not exists public.landing_pages (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  title_fr            text not null,
  title_ar            text not null,
  status              text not null default 'draft' check (status in ('draft','published')),
  product_id          uuid references public.products(id) on delete set null,
  blocks              jsonb not null default '[]',
  theme               text not null default 'auto' check (theme in ('light','dark','auto')),
  seo_title_fr        text,
  seo_title_ar        text,
  seo_description_fr  text,
  seo_description_ar  text,
  og_image_url        text,
  pixel_ids           uuid[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger landing_pages_updated_at
  before update on public.landing_pages
  for each row execute function public.update_updated_at();

alter table public.landing_pages enable row level security;

create policy "anon read published landing" on public.landing_pages
  for select to anon using (status = 'published');

create policy "admin manage landing" on public.landing_pages
  for all to authenticated using (has_section('landing')) with check (has_section('landing'));
