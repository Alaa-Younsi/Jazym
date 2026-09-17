-- Lets an admin log an order that happened outside the site (phone call,
-- in-person sale) directly from the dashboard. Distinct from place_order():
-- no customer rate-limiting, and the admin's own entered price/shipping are
-- trusted as-is (they're recording a real transaction that already
-- happened, not pricing a live cart) — but stock still gets decremented so
-- inventory stays accurate, and it's still gated to staff with the
-- 'orders' section (checked here since this is SECURITY DEFINER and bypasses
-- table RLS, same reasoning as place_order's anon bypass).

create or replace function public.admin_create_order(
  customer jsonb,
  items jsonb,
  order_status text default 'confirmed'
)
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
  v_shipping    numeric(12,2) := coalesce((customer->>'shipping')::numeric, 0);

  v_item        jsonb;
  v_qty         integer;
  v_price       numeric(10,2);
  v_subtotal    numeric(12,2) := 0;
  v_product_id  uuid;
  v_variant_id  uuid;
  v_order_id    uuid;
  v_order_no    text;
begin
  if not has_section('orders') then
    raise exception 'ERR_FORBIDDEN';
  end if;
  if char_length(v_name) < 1 then
    raise exception 'ERR_INVALID_INPUT: name';
  end if;
  if char_length(v_wilaya) < 1 then
    raise exception 'ERR_INVALID_INPUT: wilaya';
  end if;
  if v_delivery not in ('home', 'office') then
    v_delivery := 'home';
  end if;
  if order_status not in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') then
    order_status := 'confirmed';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'ERR_CART_EMPTY';
  end if;
  if jsonb_array_length(items) > 50 then
    raise exception 'ERR_INVALID_INPUT: too many lines';
  end if;

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    v_price := coalesce((v_item->>'price')::numeric, 0);
    if v_qty <= 0 then
      raise exception 'ERR_INVALID_INPUT: quantity';
    end if;
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  v_order_no := 'JZ-' || to_char(now(), 'YYYYMMDD') || '-'
                || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  insert into public.orders (
    order_number, customer_name, customer_phone, wilaya, city, address, notes,
    subtotal, shipping, discount, total, status, language, delivery_type
  ) values (
    v_order_no, v_name, v_phone, v_wilaya, v_city, v_address, v_notes,
    v_subtotal, v_shipping, 0, v_subtotal + v_shipping,
    order_status, 'fr', v_delivery
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := (v_item->>'quantity')::int;
    v_price := coalesce((v_item->>'price')::numeric, 0);
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;

    insert into public.order_items (
      order_id, product_id, variant_id, name_fr, name_ar, price, quantity, image_url
    ) values (
      v_order_id, v_product_id, v_variant_id,
      left(coalesce(v_item->>'name_fr', ''), 200),
      left(coalesce(v_item->>'name_ar', v_item->>'name_fr', ''), 200),
      v_price, v_qty, nullif(v_item->>'image_url', '')
    );

    if v_variant_id is not null then
      update public.product_variants set stock = greatest(0, stock - v_qty) where id = v_variant_id;
    elsif v_product_id is not null then
      update public.products set stock = greatest(0, stock - v_qty) where id = v_product_id;
    end if;
  end loop;

  return v_order_no;
end;
$$;

revoke all on function public.admin_create_order(jsonb, jsonb, text) from public;
grant execute on function public.admin_create_order(jsonb, jsonb, text) to authenticated;

-- Admin editing an order's note (customer-facing "notes" field, now also
-- admin-editable — see useUpdateOrderNotes). Already covered by the existing
-- "admin manage orders" RLS policy (has_section('orders')), no new policy
-- needed — this comment just documents that on purpose.
