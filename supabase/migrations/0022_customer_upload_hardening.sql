-- Harden the customer-facing "custom cover" upload (0021): a tighter,
-- realistic bucket size cap, and server-side proof that a submitted
-- custom_upload_url actually points into OUR bucket rather than being an
-- arbitrary string. The client already re-encodes through a <canvas> and
-- fails closed on anything it can't decode (see compressUntrustedImage in
-- src/lib/storage.ts) — this is the belt-and-suspenders check for whoever
-- calls place_order() directly, bypassing the UI entirely.

do $$
begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets
    set file_size_limit = 5242880 -- 5 MB: comfortably above any realistic
                                   -- compressed cover image, well below abuse
    where id = 'customer-uploads';
  end if;
end $$;

create or replace function public.place_order(items jsonb, customer jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
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
  v_priced      jsonb := '[]'::jsonb;
  v_quote       jsonb;
  v_subtotal    numeric(12,2) := 0;
  v_discount    numeric(12,2) := 0;

  -- Resolved priced/stocked variant, kept as plain scalars (not a record) so
  -- a variant-less item later in the same cart can't accidentally inherit an
  -- earlier item's variant fields.
  v_variant_id       uuid;
  v_variant_price    numeric(10,2);
  v_variant_stock    integer;
  v_variant_image    text;
  v_price            numeric(10,2);

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

  -- Custom-variant group/value cross-check (theme/stage/personalization…).
  v_vgroup      jsonb;
  v_value_def   jsonb;
  v_pick_name   text;
  v_pick_value  text;
  v_item_note   text;
  v_upload_url  text;
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

  -- Pass 1: validate every item and resolve its true unit price ----------
  for v_item in select * from jsonb_array_elements(items) loop
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

    -- Cap the custom-variant array up front — everything below iterates it.
    v_variants := coalesce(v_item->'variants', '[]'::jsonb);
    if jsonb_array_length(v_variants) > 10 then
      raise exception 'ERR_INVALID_INPUT: too many variants';
    end if;

    -- Every group the product defines must have a matching, valid pick; a
    -- picked value that itself demands typed text or an uploaded file must
    -- carry that payload too (theme/custom-cover, stage, personalization…).
    for v_vgroup in select * from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb)) loop
      v_pick_name := v_vgroup->>'name_fr';
      select value into v_velem
        from jsonb_array_elements(v_variants) as value
        where value->>'name_fr' = v_pick_name
        limit 1;
      if v_velem is null then
        raise exception 'ERR_MISSING_SELECTION: variants';
      end if;
      v_pick_value := v_velem->>'value_fr';
      select value into v_value_def
        from jsonb_array_elements(coalesce(v_vgroup->'values', '[]'::jsonb)) as value
        where value->>'value_fr' = v_pick_value
        limit 1;
      if v_value_def is null then
        raise exception 'ERR_INVALID_INPUT: variant value';
      end if;
      if coalesce((v_value_def->>'requires_text')::boolean, false)
         and nullif(btrim(coalesce(v_velem->>'custom_text', '')), '') is null then
        raise exception 'ERR_MISSING_SELECTION: custom_text';
      end if;
      if coalesce((v_value_def->>'requires_upload')::boolean, false) then
        v_upload_url := nullif(btrim(coalesce(v_velem->>'custom_upload_url', '')), '');
        if v_upload_url is null then
          raise exception 'ERR_MISSING_SELECTION: custom_upload';
        end if;
        -- Must be a real link into our own storage bucket, not an arbitrary
        -- string or external URL — the bucket name is stable across
        -- environments even though the project domain isn't, so we check for
        -- that segment rather than hardcoding a host.
        if left(v_upload_url, 8) <> 'https://'
           or position('/customer-uploads/' in v_upload_url) = 0
           or char_length(v_upload_url) > 500 then
          raise exception 'ERR_INVALID_INPUT: custom_upload_url';
        end if;
      end if;
    end loop;

    -- Priced/stocked variant row (page-count style options). Reset every
    -- iteration first — see the declaration comment above.
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_variant_price := null;
    v_variant_stock := null;
    v_variant_image := null;
    if v_variant_id is not null then
      select price, stock, image_url into v_variant_price, v_variant_stock, v_variant_image
        from public.product_variants
        where id = v_variant_id and product_id = v_product.id
        for update;
      if not found then
        raise exception 'ERR_PRODUCT_UNAVAILABLE: variant %', v_variant_id;
      end if;
    elsif exists (select 1 from public.product_variants where product_id = v_product.id) then
      -- This product only sells through variants — picking one is mandatory.
      raise exception 'ERR_MISSING_SELECTION: variant';
    end if;

    v_price := coalesce(v_variant_price, v_product.price);

    -- Stock sufficiency: reject, never clamp
    if v_variant_id is not null then
      if v_variant_stock < v_qty then
        raise exception 'ERR_STOCK: %', v_product.slug;
      end if;
    else
      if v_product.stock < v_qty then
        raise exception 'ERR_STOCK: %', v_product.slug;
      end if;
    end if;

    v_priced := v_priced || jsonb_build_object(
      'product_id',      v_product.id,
      'category_id',     v_product.category_id,
      'unit_price',      v_price,
      'quantity',        v_qty,
      'quantity_offers', coalesce(v_product.quantity_offers, '[]'::jsonb)
    );
  end loop;

  -- Single source of pricing truth, shared with price_cart().
  v_quote    := public.apply_promotions(v_priced);
  v_subtotal := (v_quote->>'subtotal')::numeric;
  v_discount := (v_quote->>'discount')::numeric;

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

    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_variant_price := null;
    v_variant_stock := null;
    v_variant_image := null;
    if v_variant_id is not null then
      select price, stock, image_url into v_variant_price, v_variant_stock, v_variant_image
        from public.product_variants where id = v_variant_id for update;
    end if;
    v_price := coalesce(v_variant_price, v_product.price);

    v_color := left(nullif(btrim(coalesce(v_item->>'color','')), ''), 40);
    v_size  := left(nullif(btrim(coalesce(v_item->>'size','')), ''), 40);
    v_item_note := left(nullif(btrim(coalesce(v_item->>'note','')), ''), 300);

    v_variants_out := '[]'::jsonb;
    for v_velem in select * from jsonb_array_elements(coalesce(v_item->'variants','[]'::jsonb)) loop
      v_variants_out := v_variants_out || jsonb_build_object(
        'name_fr',  left(coalesce(v_velem->>'name_fr',''), 40),
        'name_ar',  left(coalesce(v_velem->>'name_ar', v_velem->>'name_fr', ''), 40),
        'value_fr', left(coalesce(v_velem->>'value_fr', v_velem->>'value', ''), 40),
        'value_ar', left(coalesce(v_velem->>'value_ar', v_velem->>'value_fr', v_velem->>'value', ''), 40),
        'custom_text', left(nullif(btrim(coalesce(v_velem->>'custom_text', '')), ''), 60),
        'custom_upload_url', left(nullif(btrim(coalesce(v_velem->>'custom_upload_url', '')), ''), 500)
      );
    end loop;

    insert into public.order_items (
      order_id, product_id, variant_id, name_fr, name_ar, price, quantity, color, size, variants, image_url, note
    ) values (
      v_order_id, v_product.id, v_variant_id, v_product.name_fr, v_product.name_ar, v_price,
      v_qty, v_color, v_size, v_variants_out,
      coalesce(
        v_variant_image,
        (select url from public.product_images where product_id = v_product.id order by sort_order limit 1)
      ),
      v_item_note
    );

    if v_variant_id is not null then
      update public.product_variants set stock = stock - v_qty where id = v_variant_id;
    else
      update public.products set stock = stock - v_qty where id = v_product.id;
    end if;
  end loop;

  return v_order_no;
end;
$fn$;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
