-- Server-side order placement. NEVER trust client-sent prices. See skill Phase 5.

create or replace function public.place_order(items jsonb, customer jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name        text := btrim(coalesce(customer->>'customer_name', ''));
  v_phone       text := regexp_replace(coalesce(customer->>'customer_phone',''), '[\s.\-]', '', 'g');
  v_wilaya      text := btrim(coalesce(customer->>'wilaya', ''));
  v_city        text := btrim(coalesce(customer->>'city', ''));
  v_address     text := nullif(btrim(coalesce(customer->>'address', '')), '');
  v_notes       text := nullif(btrim(coalesce(customer->>'notes', '')), '');
  v_delivery    text := coalesce(customer->>'delivery_type', 'home');
  v_language    text := coalesce(customer->>'language', 'fr');

  v_item        jsonb;
  v_product     record;
  v_qty         integer;
  v_line_count  integer := 0;
  v_subtotal    numeric(12,2) := 0;
  v_discount    numeric(12,2) := 0;
  v_line_base   numeric(12,2);
  v_line_best   numeric(12,2);
  v_cand        numeric(12,2);
  v_offer       jsonb;
  v_group       integer;
  v_free_units  integer;
  v_bundle_qty  integer;
  v_bundle_price numeric(12,2);

  v_del         record;
  v_shipping    numeric(12,2);
  v_threshold   numeric(12,2);
  v_order_id    uuid;
  v_order_no    text;
  v_color       text;
  v_size        text;
  v_variants    jsonb;
  v_variants_out jsonb;
  v_velem       jsonb;
  v_recent      integer;
begin
  -- 0. Validate customer -------------------------------------------------
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'ERR_INVALID_INPUT: name';
  end if;
  if v_phone !~ '^0[5-7][0-9]{8}$' then
    raise exception 'ERR_INVALID_INPUT: phone';
  end if;
  if char_length(v_city) < 1 or char_length(v_city) > 80 then
    raise exception 'ERR_INVALID_INPUT: city';
  end if;
  if v_delivery not in ('home','office') then
    raise exception 'ERR_INVALID_INPUT: delivery_type';
  end if;
  if v_language not in ('fr','ar') then
    v_language := 'fr';
  end if;

  -- 1. Rate limits -----------------------------------------------------
  select count(*) into v_recent from public.orders
    where customer_phone = v_phone and created_at > now() - interval '10 minutes';
  if v_recent >= 3 then raise exception 'ERR_RATE_LIMIT: burst'; end if;

  select count(*) into v_recent from public.orders
    where customer_phone = v_phone and created_at > now() - interval '24 hours';
  if v_recent >= 10 then raise exception 'ERR_RATE_LIMIT: daily'; end if;

  -- Global circuit breaker
  select count(*) into v_recent from public.orders
    where created_at > now() - interval '1 minute';
  if v_recent >= 20 then raise exception 'ERR_RATE_LIMIT: global'; end if;
  select count(*) into v_recent from public.orders
    where created_at > now() - interval '1 hour';
  if v_recent >= 200 then raise exception 'ERR_RATE_LIMIT: global-hour'; end if;

  -- 2. Cart shape ----------------------------------------------------
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'ERR_CART_EMPTY';
  end if;
  if jsonb_array_length(items) > 20 then
    raise exception 'ERR_INVALID_INPUT: too many lines';
  end if;

  -- Pass 1: validate every item, price everything --------------------
  for v_item in select * from jsonb_array_elements(items) loop
    v_line_count := v_line_count + 1;
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 or v_qty > 20 then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: quantity';
    end if;

    select * into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid and status = 'active'
      for update;
    if not found then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: %', coalesce(v_item->>'product_id','?');
    end if;

    -- Mandatory selection backstop
    if jsonb_array_length(coalesce(v_product.colors, '[]'::jsonb)) > 0
       and nullif(btrim(coalesce(v_item->>'color','')), '') is null then
      raise exception 'ERR_MISSING_SELECTION: color';
    end if;
    if jsonb_array_length(coalesce(v_product.sizes, '[]'::jsonb)) > 0
       and nullif(btrim(coalesce(v_item->>'size','')), '') is null then
      raise exception 'ERR_MISSING_SELECTION: size';
    end if;
    if jsonb_array_length(coalesce(v_product.variants, '[]'::jsonb)) > 0
       and jsonb_array_length(coalesce(v_item->'variants', '[]'::jsonb))
           < jsonb_array_length(v_product.variants) then
      raise exception 'ERR_MISSING_SELECTION: variants';
    end if;

    -- Stock sufficiency: reject, never clamp
    if v_product.stock < v_qty then
      raise exception 'ERR_STOCK: %', v_product.slug;
    end if;

    -- Cap the custom-variant array
    v_variants := coalesce(v_item->'variants', '[]'::jsonb);
    if jsonb_array_length(v_variants) > 10 then
      raise exception 'ERR_INVALID_INPUT: too many variants';
    end if;

    -- Line pricing: base then best quantity offer
    v_line_base := v_product.price * v_qty;
    v_line_best := v_line_base;
    for v_offer in select * from jsonb_array_elements(coalesce(v_product.quantity_offers, '[]'::jsonb)) loop
      if v_offer->>'type' = 'free' then
        v_group := coalesce((v_offer->>'buy')::int, 0) + coalesce((v_offer->>'get')::int, 0);
        if v_group > 0 and coalesce((v_offer->>'get')::int, 0) > 0 then
          v_free_units := (v_qty / v_group) * coalesce((v_offer->>'get')::int, 0);
          v_cand := (v_qty - v_free_units) * v_product.price;
          if v_cand < v_line_best then v_line_best := v_cand; end if;
        end if;
      elsif v_offer->>'type' = 'price' then
        v_bundle_qty := coalesce((v_offer->>'qty')::int, 0);
        v_bundle_price := coalesce((v_offer->>'price')::numeric, 0);
        if v_bundle_qty > 1 and v_bundle_price > 0 then
          v_cand := (v_qty / v_bundle_qty) * v_bundle_price
                    + (v_qty % v_bundle_qty) * v_product.price;
          if v_cand < v_line_best then v_line_best := v_cand; end if;
        end if;
      end if;
    end loop;

    v_subtotal := v_subtotal + v_line_base;
    v_discount := v_discount + (v_line_base - v_line_best);
  end loop;

  -- 3. Shipping ------------------------------------------------------
  select * into v_del from public.delivery_prices where wilaya = v_wilaya;
  if not found then
    raise exception 'ERR_INVALID_INPUT: wilaya';
  end if;
  if not v_del.active then
    raise exception 'ERR_WILAYA_DISABLED: %', v_wilaya;
  end if;
  v_shipping := case when v_delivery = 'office' then v_del.office_price else v_del.home_price end;

  select free_ship_threshold into v_threshold from public.store_settings where id = 1;
  if v_threshold is not null and (v_subtotal - v_discount) >= v_threshold then
    v_shipping := 0;
  end if;

  -- 4. Insert -----------------------------------------------------
  v_order_no := 'JZ-' || to_char(now(), 'YYYYMMDD') || '-'
                || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  insert into public.orders (
    order_number, customer_name, customer_phone, wilaya, city, address, notes,
    subtotal, shipping, discount, total, status, language, delivery_type
  ) values (
    v_order_no, v_name, v_phone, v_wilaya, v_city, v_address, v_notes,
    v_subtotal, v_shipping, v_discount, v_subtotal - v_discount + v_shipping,
    'pending', v_language, v_delivery
  ) returning id into v_order_id;

  -- Pass 2: insert items + decrement stock (already verified sufficient)
  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid for update;

    v_color := left(nullif(btrim(coalesce(v_item->>'color','')), ''), 40);
    v_size  := left(nullif(btrim(coalesce(v_item->>'size','')), ''), 40);

    v_variants_out := '[]'::jsonb;
    for v_velem in select * from jsonb_array_elements(coalesce(v_item->'variants','[]'::jsonb)) loop
      v_variants_out := v_variants_out || jsonb_build_object(
        'name_fr',  left(coalesce(v_velem->>'name_fr',''), 40),
        'name_ar',  left(coalesce(v_velem->>'name_ar', v_velem->>'name_fr', ''), 40),
        'value_fr', left(coalesce(v_velem->>'value_fr', v_velem->>'value', ''), 40),
        'value_ar', left(coalesce(v_velem->>'value_ar', v_velem->>'value_fr', v_velem->>'value', ''), 40)
      );
    end loop;

    insert into public.order_items (
      order_id, product_id, name_fr, name_ar, price, quantity, color, size, variants, image_url
    ) values (
      v_order_id, v_product.id, v_product.name_fr, v_product.name_ar, v_product.price,
      v_qty, v_color, v_size, v_variants_out,
      (select url from public.product_images where product_id = v_product.id order by sort_order limit 1)
    );

    update public.products set stock = stock - v_qty where id = v_product.id;
  end loop;

  return v_order_no;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- Guest order lookup ----------------------------------------------------
create or replace function public.get_order_by_number(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order  record;
  v_items  jsonb;
begin
  select * into v_order from public.orders where order_number = p_order_number;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name_fr', oi.name_fr,
    'name_ar', oi.name_ar,
    'price', oi.price,
    'quantity', oi.quantity,
    'color', oi.color,
    'size', oi.size,
    'variants', oi.variants,
    'image_url', oi.image_url
  )), '[]'::jsonb) into v_items
  from public.order_items oi where oi.order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'wilaya', v_order.wilaya,
    'city', v_order.city,
    'subtotal', v_order.subtotal,
    'shipping', v_order.shipping,
    'discount', v_order.discount,
    'total', v_order.total,
    'delivery_type', v_order.delivery_type,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_order_by_number(text) from public;
grant execute on function public.get_order_by_number(text) to anon, authenticated;

-- Restock on the transition INTO 'cancelled' --------------------------
create or replace function public.restock_on_cancel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.products p
      set stock = p.stock + oi.quantity
      from public.order_items oi
      where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_restock_on_cancel on public.orders;
create trigger orders_restock_on_cancel
  after update of status on public.orders
  for each row execute function public.restock_on_cancel();
