-- ============================================================================
-- Offers & promotions engine.
--
-- Four campaign types, all scheduled and all priced SERVER-SIDE:
--   buy_x_get_y      buy X units of an eligible product, get Y of them free
--   buy_x_percent    buy X units of an eligible product, take N% off that line
--   category_percent N% off every product in the chosen categories (+ their
--                    whole subtree) for a date window
--   pack             a fixed set of products sold together at a fixed price
--
-- RESOLUTION ORDER (identical in src/lib/promotions.ts — change both or neither)
--   1. Packs consume cart quantities first, highest priority first.
--   2. Whatever quantity is LEFT on a line takes the single BEST of: the
--      product's own quantity_offers, and every eligible promotion.
--   Discounts never stack on the same unit. The customer always gets the
--   cheapest outcome we can express.
-- ============================================================================

create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('buy_x_get_y','buy_x_percent','category_percent','pack')),
  active       boolean not null default false,
  priority     integer not null default 0,
  starts_at    timestamptz,
  ends_at      timestamptz,
  scope        text not null default 'all' check (scope in ('all','categories','products')),
  category_ids uuid[] not null default '{}',
  product_ids  uuid[] not null default '{}',
  buy_qty      integer not null default 0 check (buy_qty >= 0 and buy_qty <= 100),
  get_qty      integer not null default 0 check (get_qty >= 0 and get_qty <= 100),
  percent      numeric(5,2) not null default 0 check (percent >= 0 and percent <= 100),
  pack_items   jsonb not null default '[]'::jsonb,
  pack_price   numeric(12,2) check (pack_price is null or pack_price >= 0),
  label_fr     text,
  label_ar     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint promotions_window_check check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint promotions_pack_items_check check (
    jsonb_typeof(pack_items) = 'array' and jsonb_array_length(pack_items) <= 12
  )
);

create index if not exists promotions_live_idx on public.promotions (active, type);

drop trigger if exists promotions_updated_at on public.promotions;
create trigger promotions_updated_at
  before update on public.promotions
  for each row execute function public.update_updated_at();

alter table public.promotions enable row level security;

-- The storefront reads only what is live right now — the schedule is enforced
-- here, in the policy, not in client code.
drop policy if exists "anon read live promotions" on public.promotions;
create policy "anon read live promotions" on public.promotions
  for select to anon using (
    active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
  );

drop policy if exists "auth read live promotions" on public.promotions;
create policy "auth read live promotions" on public.promotions
  for select to authenticated using (
    has_section('promotions')
    or (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()))
  );

drop policy if exists "admin manage promotions" on public.promotions;
create policy "admin manage promotions" on public.promotions
  for all to authenticated
  using (has_section('promotions')) with check (has_section('promotions'));

-- ---------------------------------------------------------------------------
-- A category selection always means "this category AND everything under it".
-- ---------------------------------------------------------------------------
create or replace function public.expand_categories(ids uuid[])
returns uuid[]
language sql stable security definer set search_path = public as $fn$
  with recursive t as (
    select c.id from public.categories c where c.id = any(ids)
    union
    select c.id from public.categories c join t on c.parent_id = t.id
  )
  select coalesce(array_agg(id), '{}'::uuid[]) from t;
$fn$;

-- ---------------------------------------------------------------------------
-- THE engine. Input lines are already price-resolved (variant price applied).
--   [{ product_id, category_id, unit_price, quantity, quantity_offers }]
-- Output: { subtotal, discount, lines: [{ gross, discount, net }] }
-- ---------------------------------------------------------------------------
create or replace function public.apply_promotions(lines jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public as $fn$
declare
  n              integer;
  i              integer;
  v_line         jsonb;
  qty            integer[] := '{}';
  remain         integer[] := '{}';
  price          numeric[] := '{}';
  prod           uuid[]    := '{}';
  cat            uuid[]    := '{}';
  offers         jsonb[]   := '{}';
  best           numeric[] := '{}';
  line_disc      numeric[] := '{}';
  pack_gross     numeric[] := '{}';
  v_promo        record;
  v_item         jsonb;
  v_offer        jsonb;
  v_need         integer;
  v_have         integer;
  v_times        integer;
  v_take         integer;
  v_target       uuid;
  v_gross        numeric;
  v_pack_disc    numeric;
  v_subtotal     numeric := 0;
  v_discount     numeric := 0;
  v_base         numeric;
  v_cand         numeric;
  v_group        integer;
  v_free         integer;
  v_bundle_qty   integer;
  v_bundle_price numeric;
  v_catset       uuid[];
  v_eligible     boolean;
  v_out          jsonb := '[]'::jsonb;
begin
  if lines is null or jsonb_typeof(lines) <> 'array' or jsonb_array_length(lines) = 0 then
    return jsonb_build_object('subtotal', 0, 'discount', 0, 'lines', '[]'::jsonb);
  end if;
  n := jsonb_array_length(lines);

  for i in 1..n loop
    v_line     := lines->(i-1);
    qty[i]     := greatest(0, coalesce((v_line->>'quantity')::int, 0));
    remain[i]  := qty[i];
    price[i]   := greatest(0, coalesce((v_line->>'unit_price')::numeric, 0));
    prod[i]    := nullif(v_line->>'product_id', '')::uuid;
    cat[i]     := nullif(v_line->>'category_id', '')::uuid;
    offers[i]  := case when jsonb_typeof(v_line->'quantity_offers') = 'array'
                       then v_line->'quantity_offers' else '[]'::jsonb end;
    line_disc[i] := 0;
    v_subtotal := v_subtotal + qty[i] * price[i];
  end loop;

  -- 1. Packs consume quantities first -------------------------------------
  for v_promo in
    select * from public.promotions
    where active and type = 'pack'
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    order by priority desc, created_at
  loop
    continue when v_promo.pack_price is null
              or jsonb_array_length(v_promo.pack_items) = 0;

    v_times := 2147483647;
    for v_item in select * from jsonb_array_elements(v_promo.pack_items) loop
      v_target := nullif(v_item->>'product_id', '')::uuid;
      v_need := greatest(1, coalesce((v_item->>'quantity')::int, 1));
      v_have := 0;
      if v_target is not null then
        for i in 1..n loop
          if prod[i] = v_target then v_have := v_have + remain[i]; end if;
        end loop;
      end if;
      v_times := least(v_times, v_have / v_need);
    end loop;
    continue when v_times <= 0;
    v_times := least(v_times, 20);

    pack_gross := array_fill(0::numeric, array[n]);
    v_gross := 0;
    for v_item in select * from jsonb_array_elements(v_promo.pack_items) loop
      v_target := nullif(v_item->>'product_id', '')::uuid;
      v_need := greatest(1, coalesce((v_item->>'quantity')::int, 1)) * v_times;
      for i in 1..n loop
        exit when v_need <= 0;
        if prod[i] = v_target and remain[i] > 0 then
          v_take := least(remain[i], v_need);
          remain[i] := remain[i] - v_take;
          pack_gross[i] := pack_gross[i] + v_take * price[i];
          v_gross := v_gross + v_take * price[i];
          v_need := v_need - v_take;
        end if;
      end loop;
    end loop;

    v_pack_disc := greatest(0, v_gross - v_promo.pack_price * v_times);
    v_discount := v_discount + v_pack_disc;
    if v_gross > 0 and v_pack_disc > 0 then
      for i in 1..n loop
        line_disc[i] := line_disc[i] + v_pack_disc * (pack_gross[i] / v_gross);
      end loop;
    end if;
  end loop;

  -- 2. Best single offer on whatever quantity is left ----------------------
  for i in 1..n loop
    best[i] := remain[i] * price[i];
    for v_offer in select * from jsonb_array_elements(offers[i]) loop
      if v_offer->>'type' = 'free' then
        v_group := coalesce((v_offer->>'buy')::int, 0) + coalesce((v_offer->>'get')::int, 0);
        if v_group > 0 and coalesce((v_offer->>'get')::int, 0) > 0 then
          v_free := (remain[i] / v_group) * (v_offer->>'get')::int;
          v_cand := (remain[i] - v_free) * price[i];
          if v_cand < best[i] then best[i] := v_cand; end if;
        end if;
      elsif v_offer->>'type' = 'price' then
        v_bundle_qty   := coalesce((v_offer->>'qty')::int, 0);
        v_bundle_price := coalesce((v_offer->>'price')::numeric, 0);
        if v_bundle_qty > 1 and v_bundle_price > 0 then
          v_cand := (remain[i] / v_bundle_qty) * v_bundle_price
                    + (remain[i] % v_bundle_qty) * price[i];
          if v_cand < best[i] then best[i] := v_cand; end if;
        end if;
      end if;
    end loop;
  end loop;

  for v_promo in
    select * from public.promotions
    where active and type in ('buy_x_get_y','buy_x_percent','category_percent')
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    order by priority desc, created_at
  loop
    v_catset := case
      when v_promo.type = 'category_percent' or v_promo.scope = 'categories'
        then public.expand_categories(v_promo.category_ids)
      else '{}'::uuid[]
    end;

    for i in 1..n loop
      continue when remain[i] <= 0;

      v_eligible := case
        when v_promo.type = 'category_percent' then cat[i] is not null and cat[i] = any(v_catset)
        when v_promo.scope = 'all'             then true
        when v_promo.scope = 'products'        then prod[i] = any(v_promo.product_ids)
        when v_promo.scope = 'categories'      then cat[i] is not null and cat[i] = any(v_catset)
        else false
      end;
      continue when not v_eligible;

      v_base := remain[i] * price[i];
      v_cand := v_base;

      if v_promo.type = 'buy_x_get_y' then
        v_group := v_promo.buy_qty + v_promo.get_qty;
        if v_group > 0 and v_promo.get_qty > 0 then
          v_free := (remain[i] / v_group) * v_promo.get_qty;
          v_cand := (remain[i] - v_free) * price[i];
        end if;
      elsif v_promo.type = 'buy_x_percent' then
        if v_promo.percent > 0 and remain[i] >= greatest(1, v_promo.buy_qty) then
          v_cand := v_base * (1 - v_promo.percent / 100);
        end if;
      elsif v_promo.type = 'category_percent' then
        if v_promo.percent > 0 then
          v_cand := v_base * (1 - v_promo.percent / 100);
        end if;
      end if;

      if v_cand < best[i] then best[i] := v_cand; end if;
    end loop;
  end loop;

  for i in 1..n loop
    if remain[i] > 0 then
      v_discount   := v_discount + (remain[i] * price[i] - best[i]);
      line_disc[i] := line_disc[i] + (remain[i] * price[i] - best[i]);
    end if;
  end loop;

  v_subtotal := round(v_subtotal, 2);
  v_discount := round(least(v_discount, v_subtotal), 2);

  for i in 1..n loop
    v_out := v_out || jsonb_build_object(
      'gross',    round(qty[i] * price[i], 2),
      'discount', round(line_disc[i], 2),
      'net',      round(qty[i] * price[i] - line_disc[i], 2)
    );
  end loop;

  return jsonb_build_object('subtotal', v_subtotal, 'discount', v_discount, 'lines', v_out);
end;
$fn$;

revoke all on function public.apply_promotions(jsonb) from public;
grant execute on function public.apply_promotions(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Read-only quote for the cart/checkout screens. Resolves real prices from the
-- DB (the client is never trusted with a price) and returns the same numbers
-- place_order will charge. Shipping is NOT included — that needs the wilaya.
-- ---------------------------------------------------------------------------
create or replace function public.price_cart(items jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public as $fn$
declare
  v_item    jsonb;
  v_lines   jsonb := '[]'::jsonb;
  v_product record;
  v_vprice  numeric;
  v_qty     integer;
begin
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    return jsonb_build_object('subtotal', 0, 'discount', 0, 'lines', '[]'::jsonb);
  end if;
  if jsonb_array_length(items) > 20 then
    raise exception 'ERR_INVALID_INPUT: too many lines';
  end if;

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := least(20, greatest(0, coalesce((v_item->>'quantity')::int, 0)));
    select p.id, p.price, p.category_id, p.quantity_offers into v_product
      from public.products p
      where p.id = nullif(v_item->>'product_id','')::uuid and p.status = 'active';
    continue when not found or v_qty <= 0;

    v_vprice := null;
    if nullif(v_item->>'variant_id','') is not null then
      select pv.price into v_vprice from public.product_variants pv
        where pv.id = (v_item->>'variant_id')::uuid and pv.product_id = v_product.id;
    end if;

    v_lines := v_lines || jsonb_build_object(
      'product_id',      v_product.id,
      'category_id',     v_product.category_id,
      'unit_price',      coalesce(v_vprice, v_product.price),
      'quantity',        v_qty,
      'quantity_offers', coalesce(v_product.quantity_offers, '[]'::jsonb)
    );
  end loop;

  return public.apply_promotions(v_lines);
end;
$fn$;

revoke all on function public.price_cart(jsonb) from public;
grant execute on function public.price_cart(jsonb) to anon, authenticated;
