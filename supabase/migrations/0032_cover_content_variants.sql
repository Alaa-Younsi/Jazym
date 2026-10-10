-- Two more required option groups on every cahier: Couverture (3 values, each
-- can carry its own photo) and Contenu (3 values). Values are placeholders —
-- rename them and attach the cover photos ONCE for every product from
-- /admin/products/shared-options, which calls bulk_replace_variant_group below.
--
-- Target = every product that already has the "Palier scolaire" group (the
-- cahiers). Both groups are inserted right after it, so the product page reads
-- Palier scolaire → Couverture → Contenu → Nombre de pages → Personnalisation.
-- Products that already have a "Couverture" group are skipped — safe to re-run.
--
-- place_order needs no change: it already requires a valid pick for every
-- non-optional group the product defines.

update public.products p
set variants = (
  select jsonb_agg(x.e order by x.ord, x.sub)
  from (
    select t.e, t.ord, 0 as sub
      from jsonb_array_elements(p.variants) with ordinality as t(e, ord)
    union all
    select g.e, anchor.ord, g.sub
      from (
        select t.ord
          from jsonb_array_elements(p.variants) with ordinality as t(e, ord)
         where t.e->>'name_fr' = 'Palier scolaire'
         limit 1
      ) as anchor
      cross join (values
        ('{
          "name_fr": "Couverture",
          "name_ar": "الغلاف",
          "before_price_variant": true,
          "values": [
            { "value_fr": "Couverture 1", "value_ar": "الغلاف 1" },
            { "value_fr": "Couverture 2", "value_ar": "الغلاف 2" },
            { "value_fr": "Couverture 3", "value_ar": "الغلاف 3" }
          ]
        }'::jsonb, 1),
        ('{
          "name_fr": "Contenu",
          "name_ar": "المحتوى",
          "before_price_variant": true,
          "values": [
            { "value_fr": "Contenu 1", "value_ar": "المحتوى 1" },
            { "value_fr": "Contenu 2", "value_ar": "المحتوى 2" },
            { "value_fr": "Contenu 3", "value_ar": "المحتوى 3" }
          ]
        }'::jsonb, 2)
      ) as g(e, sub)
  ) as x
)
where p.variants @> '[{"name_fr": "Palier scolaire"}]'::jsonb
  and not p.variants @> '[{"name_fr": "Couverture"}]'::jsonb;

-- Replace one option group (matched by its current French name) on EVERY
-- product that has it, in place — same position, same neighbours. Lets the
-- admin rename values / attach images once instead of on 600+ product pages.
-- SECURITY INVOKER: the products RLS write policy (has_section('products'))
-- still applies; the explicit check just gives a readable error.
create or replace function public.bulk_replace_variant_group(p_name_fr text, p_group jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_new_name text := btrim(coalesce(p_group->>'name_fr', ''));
  v_count    integer;
begin
  if not public.has_section('products') then
    raise exception 'ERR_FORBIDDEN';
  end if;
  if jsonb_typeof(p_group) <> 'object'
     or v_new_name = ''
     or jsonb_typeof(p_group->'values') <> 'array'
     or jsonb_array_length(p_group->'values') = 0 then
    raise exception 'ERR_INVALID_INPUT: group';
  end if;

  -- Renaming onto a name the product already uses for ANOTHER group would
  -- leave two groups with the same key (picks are matched by name_fr).
  if v_new_name <> p_name_fr and exists (
    select 1 from public.products
     where variants @> jsonb_build_array(jsonb_build_object('name_fr', p_name_fr))
       and variants @> jsonb_build_array(jsonb_build_object('name_fr', v_new_name))
  ) then
    raise exception 'ERR_INVALID_INPUT: duplicate group name';
  end if;

  update public.products p
     set variants = (
       select jsonb_agg(case when t.e->>'name_fr' = p_name_fr then p_group else t.e end
                        order by t.ord)
         from jsonb_array_elements(p.variants) with ordinality as t(e, ord)
     )
   where p.variants @> jsonb_build_array(jsonb_build_object('name_fr', p_name_fr));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.bulk_replace_variant_group(text, jsonb) from public;
grant execute on function public.bulk_replace_variant_group(text, jsonb) to authenticated;
