-- Staff accounts with per-section permissions, enforced in the DB.
-- AFTER THIS MIGRATION RUNS, ONLY SEEDED ADMINS CAN WRITE. Any stray
-- authenticated user loses god-mode; a self-registered account has no
-- admin_profiles row and gets nothing. See skill Phase 8.5.
--
-- >>> EDIT THE OWNER EMAIL BELOW BEFORE RUNNING <<<

create table if not exists public.admin_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  is_owner   boolean not null default false,
  sections   text[]  not null default '{}',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_profiles enable row level security;

-- SECURITY DEFINER is REQUIRED: these read admin_profiles with the definer's
-- rights, bypassing that table's own RLS (otherwise infinite recursion).
create or replace function public.has_section(s text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active and (is_owner or s = any(sections))
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles where user_id = auth.uid() and active
  );
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active and is_owner
  );
$$;

-- admin_profiles policies: a user reads ONLY their own row; owner manages all.
create policy "read own admin profile" on public.admin_profiles
  for select to authenticated using (user_id = auth.uid());
create policy "owner manages admin profiles" on public.admin_profiles
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Seed the owner in the SAME migration or the client is locked out ---------
insert into public.admin_profiles (user_id, email, is_owner, sections)
select id, email, true, '{}'
from auth.users
where email = 'owner@jazym.dz'   -- <<< CHANGE to the real owner email
on conflict (user_id) do update set is_owner = true, active = true;

-- Rewrite every admin policy: blanket TO authenticated -> per-section --------
drop policy if exists "auth manage categories"     on public.categories;
drop policy if exists "auth read all products"     on public.products;
drop policy if exists "auth manage products"       on public.products;
drop policy if exists "auth manage product images" on public.product_images;
drop policy if exists "auth manage orders"         on public.orders;
drop policy if exists "auth manage order items"    on public.order_items;
drop policy if exists "auth manage store settings" on public.store_settings;
drop policy if exists "auth manage delivery prices" on public.delivery_prices;
drop policy if exists "auth manage reviews"        on public.client_reviews;

create policy "admin manage categories" on public.categories
  for all to authenticated using (has_section('categories')) with check (has_section('categories'));

create policy "admin read products" on public.products
  for select to authenticated
  using (has_section('products') or has_section('orders') or has_section('landing'));
create policy "admin write products" on public.products
  for all to authenticated using (has_section('products')) with check (has_section('products'));

create policy "admin manage product images" on public.product_images
  for all to authenticated using (has_section('products')) with check (has_section('products'));

create policy "admin manage orders" on public.orders
  for all to authenticated using (has_section('orders')) with check (has_section('orders'));
create policy "admin manage order items" on public.order_items
  for all to authenticated using (has_section('orders')) with check (has_section('orders'));

-- Global config: every admin needs it, nobody is "granted" it.
create policy "admin manage store settings" on public.store_settings
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin manage delivery prices" on public.delivery_prices
  for all to authenticated using (has_section('delivery')) with check (has_section('delivery'));

create policy "admin manage reviews" on public.client_reviews
  for all to authenticated using (has_section('reviews')) with check (has_section('reviews'));
