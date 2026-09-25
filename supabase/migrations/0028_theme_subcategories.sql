-- Themes become a CATEGORY level instead of a variant group.
--
-- Before:  Cahiers de l'enseignant → matière (13) → 8 kinds
--          with a mandatory "Thème" picker (6 colours + Couverture
--          personnalisée) on every product.
--
-- After:   Cahiers de l'enseignant → matière (14) → theme (6) → 8 kinds
--          with the colours gone from the variants jsonb and only an OPTIONAL
--          "Couverture personnalisée" checkbox left behind (see 0027).
--
-- Consequences worth stating before anyone runs this:
--
--  * A product can only sit in ONE category, so a browsable theme level means
--    the catalogue is duplicated six times: 112 cahiers become 672. Each copy
--    is a distinct SKU with its own stock, price and photos — which is correct,
--    a violet cahier and a red one are different physical objects.
--  * Stock is COPIED to each theme, not divided. Total on-hand therefore reads
--    6× higher until the client re-counts it. Say so at handoff.
--  * The theme moves OUT of order_items.variants (it is no longer a variant),
--    so it has to survive in the line's name or the shop cannot tell which
--    cover to pack. Every product name gains a " · <Theme>" suffix for exactly
--    that reason.
--  * The 8 matière-less legacy products that sat directly on "Cahiers de
--    l'enseignant" move under a new "Toutes matières" branch rather than being
--    deleted. That also retires the mixed products-and-subcategories state the
--    leaf-only rule (0009/0013) was meant to prevent.
--
-- Idempotent: re-running adds nothing, because every insert is guarded on the
-- derived slug and the variants rewrite is a no-op once "Thème" is gone.

do $$
declare
  v_cahiers    uuid;
  v_generic    uuid;
  v_matiere    record;
  v_theme      record;
  v_theme_cat  uuid;
  v_product    record;
  v_new_id     uuid;
  v_base_slug  text;
  v_variants   jsonb;
  v_custom     jsonb := jsonb_build_object(
    'name_fr', 'Couverture personnalisée',
    'name_ar', 'غلاف مخصص',
    'optional', true,
    'values', jsonb_build_array(
      jsonb_build_object(
        'value_fr', 'Oui',
        'value_ar', 'نعم',
        'requires_upload', true
      )
    )
  );
begin
  select id into v_cahiers from public.categories where slug = 'cahiers';
  if v_cahiers is null then
    raise notice 'no "cahiers" category — nothing to restructure';
    return;
  end if;

  -- 1. A home for the matière-less legacy products ------------------------
  -- sort_order 0 so it leads the matière list; rename or delete it later if
  -- the client would rather those 8 rows lived somewhere else.
  insert into public.categories (slug, name_fr, name_ar, parent_id, sort_order)
  select 'toutes-matieres', 'Toutes matières', 'كل المواد', v_cahiers, 0
  where not exists (select 1 from public.categories where slug = 'toutes-matieres');

  select id into v_generic from public.categories where slug = 'toutes-matieres';

  -- Move them BEFORE any theme exists under that branch: the leaf-only
  -- trigger refuses a product whose target category already has children.
  update public.products
     set category_id = v_generic
   where category_id = v_cahiers;

  -- 2. Six themes under every matière -------------------------------------
  for v_matiere in
    select id, slug from public.categories where parent_id = v_cahiers order by sort_order, slug
  loop
    for v_theme in
      select * from (values
        ('violet', 'Violet', 'بنفسجي', 1),
        ('bleu',   'Bleu',   'أزرق',   2),
        ('rouge',  'Rouge',  'أحمر',   3),
        ('rose',   'Rose',   'وردي',   4),
        ('marron', 'Marron', 'بني',    5),
        ('jaune',  'Jaune',  'أصفر',   6)
      ) as t(slug, name_fr, name_ar, ord)
    loop
      insert into public.categories (slug, name_fr, name_ar, parent_id, sort_order)
      select v_matiere.slug || '-' || v_theme.slug,
             v_theme.name_fr, v_theme.name_ar, v_matiere.id, v_theme.ord
      where not exists (
        select 1 from public.categories
         where slug = v_matiere.slug || '-' || v_theme.slug
      );
    end loop;
  end loop;

  -- 3. Fan every product out across its matière's six themes --------------
  for v_matiere in
    select id, slug from public.categories where parent_id = v_cahiers order by sort_order, slug
  loop
    -- Snapshot first: the loop below moves rows out of this category, and a
    -- cursor over a set we are mutating would skip or revisit them.
    for v_product in
      select * from public.products where category_id = v_matiere.id
    loop
      v_base_slug := v_product.slug;

      -- Strip the old colour picker; leave every other group untouched.
      v_variants := coalesce((
        select jsonb_agg(g)
          from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb)) as g
         where g->>'name_fr' is distinct from 'Thème'
      ), '[]'::jsonb);

      -- Re-attach the custom cover as an optional checkbox, once.
      if not exists (
        select 1 from jsonb_array_elements(v_variants) as g
         where g->>'name_fr' = 'Couverture personnalisée'
      ) then
        v_variants := v_variants || jsonb_build_array(v_custom);
      end if;

      for v_theme in
        select * from (values
          ('violet', 'Violet', 'بنفسجي', 1),
          ('bleu',   'Bleu',   'أزرق',   2),
          ('rouge',  'Rouge',  'أحمر',   3),
          ('rose',   'Rose',   'وردي',   4),
          ('marron', 'Marron', 'بني',    5),
          ('jaune',  'Jaune',  'أصفر',   6)
        ) as t(slug, name_fr, name_ar, ord)
      loop
        select id into v_theme_cat
          from public.categories
         where slug = v_matiere.slug || '-' || v_theme.slug;

        if v_theme.ord = 1 then
          -- The original row BECOMES the violet one rather than being
          -- replaced, so order_items.product_id keeps pointing at something
          -- real for every order already placed.
          update public.products
             set category_id = v_theme_cat,
                 slug        = v_base_slug || '-' || v_theme.slug,
                 name_fr     = v_product.name_fr || ' · ' || v_theme.name_fr,
                 name_ar     = v_product.name_ar || ' · ' || v_theme.name_ar,
                 variants    = v_variants
           where id = v_product.id;
          continue;
        end if;

        -- The other five are copies. Guarded on slug so a re-run is a no-op.
        if exists (
          select 1 from public.products where slug = v_base_slug || '-' || v_theme.slug
        ) then
          continue;
        end if;

        insert into public.products (
          slug, name_fr, name_ar, description_fr, description_ar,
          details_fr, details_ar, price, compare_at_price, category_id, stock,
          style_code, colors, sizes, variants, quantity_offers, video_url,
          featured, status
        ) values (
          v_base_slug || '-' || v_theme.slug,
          v_product.name_fr || ' · ' || v_theme.name_fr,
          v_product.name_ar || ' · ' || v_theme.name_ar,
          v_product.description_fr, v_product.description_ar,
          v_product.details_fr, v_product.details_ar,
          v_product.price, v_product.compare_at_price, v_theme_cat,
          v_product.stock,   -- copied, NOT divided — see the header note
          v_product.style_code, v_product.colors, v_product.sizes,
          v_variants, v_product.quantity_offers, v_product.video_url,
          v_product.featured, v_product.status
        )
        returning id into v_new_id;

        insert into public.product_images (product_id, url, alt, sort_order)
        select v_new_id, pi.url, pi.alt, pi.sort_order
          from public.product_images pi
         where pi.product_id = v_product.id;

        insert into public.product_variants (
          product_id,
          option1_name_fr, option1_name_ar, option1_value_fr, option1_value_ar,
          option2_name_fr, option2_name_ar, option2_value_fr, option2_value_ar,
          price, compare_at_price, stock, sku, image_url, sort_order
        )
        select v_new_id,
               pv.option1_name_fr, pv.option1_name_ar,
               pv.option1_value_fr, pv.option1_value_ar,
               pv.option2_name_fr, pv.option2_name_ar,
               pv.option2_value_fr, pv.option2_value_ar,
               pv.price, pv.compare_at_price, pv.stock,
               -- SKU is unique per physical item; a copied one would collide
               -- in the client's own stock sheet.
               case when pv.sku is null then null
                    else pv.sku || '-' || upper(left(v_theme.slug, 3)) end,
               pv.image_url, pv.sort_order
          from public.product_variants pv
         where pv.product_id = v_product.id;
      end loop;
    end loop;
  end loop;
end $$;

-- 4. Anything outside the cahiers branch that still carries a "Thème" group
-- (accessoires, stratégies — none today, but a later product could) loses it
-- too, so the picker cannot reappear on one stray product.
update public.products p
   set variants = coalesce((
         select jsonb_agg(g)
           from jsonb_array_elements(p.variants) as g
          where g->>'name_fr' is distinct from 'Thème'
       ), '[]'::jsonb)
 where exists (
   select 1 from jsonb_array_elements(p.variants) as g where g->>'name_fr' = 'Thème'
 );
