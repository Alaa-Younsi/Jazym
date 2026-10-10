-- Show the "Couverture" choices as a checkbox list (like the "Couverture
-- personnalisée" opt-in) instead of pills. Display-only flag on the group
-- jsonb (`as_checkboxes`); it is still ONE required pick, so place_order is
-- unchanged. Run after 0032. Idempotent. Toggle it later per group from
-- /admin/products/shared-options ("Afficher en cases à cocher").

update public.products p
set variants = (
  select jsonb_agg(
           case when t.e->>'name_fr' = 'Couverture'
                then t.e || '{"as_checkboxes": true}'::jsonb
                else t.e end
           order by t.ord)
    from jsonb_array_elements(p.variants) with ordinality as t(e, ord)
)
where p.variants @> '[{"name_fr": "Couverture"}]'::jsonb;
