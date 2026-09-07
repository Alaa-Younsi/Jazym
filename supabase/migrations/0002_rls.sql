-- Row Level Security. Public storefront reads; writes go through RPCs or the
-- authenticated admin role. NOTE: blanket `TO authenticated` is only safe while
-- public sign-up is DISABLED in Supabase Auth settings — 0004 replaces these
-- policies with per-section checks (has_section) and closes that hole.

alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.store_settings   enable row level security;
alter table public.delivery_prices  enable row level security;
alter table public.client_reviews   enable row level security;

-- Public (anon) reads -----------------------------------------------------
create policy "anon read categories" on public.categories
  for select to anon using (true);

create policy "anon read active products" on public.products
  for select to anon using (status = 'active');

create policy "anon read product images" on public.product_images
  for select to anon using (true);

create policy "anon read store settings" on public.store_settings
  for select to anon using (true);

create policy "anon read delivery prices" on public.delivery_prices
  for select to anon using (true);

create policy "anon read active reviews" on public.client_reviews
  for select to anon using (active = true);

-- orders / order_items: NO anon policy at all. Anon writes go exclusively
-- through place_order() (SECURITY DEFINER); anon reads go through
-- get_order_by_number() (SECURITY DEFINER). Both defined in 0003.

-- Authenticated admin (superseded by 0004) -----------------------------
create policy "auth manage categories" on public.categories
  for all to authenticated using (true) with check (true);

create policy "auth read all products" on public.products
  for select to authenticated using (true);
create policy "auth manage products" on public.products
  for all to authenticated using (true) with check (true);

create policy "auth manage product images" on public.product_images
  for all to authenticated using (true) with check (true);

create policy "auth manage orders" on public.orders
  for all to authenticated using (true) with check (true);
create policy "auth manage order items" on public.order_items
  for all to authenticated using (true) with check (true);

create policy "auth manage store settings" on public.store_settings
  for all to authenticated using (true) with check (true);

create policy "auth manage delivery prices" on public.delivery_prices
  for all to authenticated using (true) with check (true);

create policy "auth manage reviews" on public.client_reviews
  for all to authenticated using (true) with check (true);
