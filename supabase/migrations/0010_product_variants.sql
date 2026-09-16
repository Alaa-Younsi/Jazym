-- Priced/stocked product variants (e.g. page-count options on a "Cahier"),
-- distinct from the existing cosmetic colors/sizes/variants jsonb on products
-- (those only ever swap the displayed photo). A product should use one or the
-- other for a given axis, never both.

create table if not exists public.product_variants (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  option1_name_fr   text,
  option1_name_ar   text,
  option1_value_fr  text,
  option1_value_ar  text,
  option2_name_fr   text,
  option2_name_ar   text,
  option2_value_fr  text,
  option2_value_ar  text,
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2),
  stock             integer not null default 0 check (stock >= 0),
  sku               text,
  image_url         text,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists product_variants_product_idx on public.product_variants (product_id, sort_order);

-- One row per distinct option combination for a given product.
create unique index if not exists product_variants_unique_combo
  on public.product_variants (
    product_id,
    coalesce(option1_value_fr, ''),
    coalesce(option2_value_fr, '')
  );

create trigger product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.update_updated_at();

alter table public.product_variants enable row level security;

-- Matches the existing "anon read product images" policy (using (true)) —
-- storefront reads variants unauthenticated, same as product photos.
create policy "anon read product variants" on public.product_variants
  for select to anon using (true);

create policy "admin manage product variants" on public.product_variants
  for all to authenticated using (has_section('products')) with check (has_section('products'));

-- A historical order keeps its name/price snapshot even if the variant row is
-- later deleted, same convention as order_items.product_id.
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
