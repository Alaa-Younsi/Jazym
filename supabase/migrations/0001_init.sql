-- Jazym — core schema. Run migrations in order.
-- Cash-on-delivery store: products / orders / per-wilaya delivery / reviews.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger fn -------------------------------------------------
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Categories ----------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name_fr       text not null,
  name_ar       text not null,
  description_fr text,
  description_ar text,
  image_url     text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Products ----------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name_fr          text not null,
  name_ar          text not null,
  description_fr    text,
  description_ar    text,
  details_fr        text[] not null default '{}',
  details_ar        text[] not null default '{}',
  price            numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  category_id      uuid references public.categories(id) on delete set null,
  stock            integer not null default 0,
  style_code       text,
  colors           jsonb not null default '[]',   -- [{label_fr,label_ar,label_en?,hex,image_url?}]
  sizes            jsonb not null default '[]',   -- [{label_fr,label_ar}]
  variants         jsonb not null default '[]',   -- [{name_fr,name_ar,values:[{value_fr,value_ar,image_url}]}]
  quantity_offers  jsonb not null default '[]',   -- [{type:'free',buy,get} | {type:'price',qty,price}]
  video_url        text,
  featured         boolean not null default false,
  status           text not null default 'active' check (status in ('active','draft')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

-- Product images --------------------------------------------------------
create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  alt        text,
  sort_order integer not null default 0
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

-- Orders ----------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   text unique not null,
  customer_name  text not null,
  customer_phone text not null,
  wilaya         text not null,
  city           text not null,
  address        text,          -- nullable from day one (see skill Phase 5)
  notes          text,
  subtotal       numeric(10,2) not null default 0,
  shipping       numeric(10,2) not null default 0,
  discount       numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  status         text not null default 'pending'
                 check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  language       text not null default 'fr' check (language in ('fr','ar')),
  delivery_type  text not null default 'home' check (delivery_type in ('home','office')),
  created_at     timestamptz not null default now()
);
create index if not exists orders_phone_created_idx on public.orders (customer_phone, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- Order items (price/name SNAPSHOTTED at purchase) --------------------
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_fr    text not null,
  name_ar    text not null,
  price      numeric(10,2) not null,
  quantity   integer not null check (quantity > 0),
  color      text,
  size       text,
  variants   jsonb not null default '[]',  -- [{name_fr,name_ar,value_fr,value_ar}]
  image_url  text
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- Store settings (singleton) ------------------------------------------
create table if not exists public.store_settings (
  id                  integer primary key default 1 check (id = 1),
  shipping_fee        numeric(10,2) not null default 500,
  free_ship_threshold numeric(10,2),  -- NULL = no free-shipping offer (NEVER default a number)
  store_phone         text,
  store_email         text,
  store_address_fr    text,
  store_address_ar    text,
  announcement_fr     text,
  announcement_ar     text
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- Delivery prices (one row per wilaya) ------------------------------
create table if not exists public.delivery_prices (
  id          uuid primary key default gen_random_uuid(),
  wilaya      text unique not null,
  home_price  numeric(10,2) not null default 0,
  office_price numeric(10,2) not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- Client reviews ----------------------------------------------------
create table if not exists public.client_reviews (
  id          uuid primary key default gen_random_uuid(),
  client_name text not null,
  stars       integer not null check (stars between 1 and 5),
  review_text text not null,
  image_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
