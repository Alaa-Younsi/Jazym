-- Two fixes to the leaf-category enforcement introduced in 0009:
--
-- 1. products_leaf_category_check fired on every product save (because it's
--    declared "before update of category_id" and useSaveProduct always
--    includes category_id in the update payload), not just when the category
--    was actually being changed. Once a category gained subcategories, simply
--    re-saving an unrelated field on an existing product in that category
--    would start failing even though its category_id never changed. Now it
--    only validates on insert or an actual category_id change.
--
-- 2. Converting an existing flat category that already holds products (e.g.
--    "Cahiers de l'enseignant") into a branch — by adding subcategories
--    underneath it — is the normal admin workflow here, not an error case.
--    Drop the trigger that blocked it. New products still can't be attached
--    to a non-leaf category (fix 1 above keeps that rule), so the tree stays
--    correct going forward; the admin moves the legacy products into the new
--    leaf subcategories at their own pace via the product form.

create or replace function public.enforce_category_leaf_only()
returns trigger language plpgsql as $$
begin
  if new.category_id is not null
     and (tg_op = 'INSERT' or new.category_id is distinct from old.category_id)
     and exists (
       select 1 from public.categories where parent_id = new.category_id
     ) then
    raise exception 'ERR_CATEGORY_NOT_LEAF: category has subcategories, cannot hold products';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_leaf_parent_check on public.categories;
drop function if exists public.enforce_category_no_children_if_has_products();
