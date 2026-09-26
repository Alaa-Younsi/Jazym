-- Remove the "Toutes matières" branch.
--
-- 0028 parked the 8 original matière-less cahiers (cahier journal, cahier de
-- notes, registre d'appel, …) under a new "Cahiers de l'enseignant → Toutes
-- matières" branch instead of deleting them, and then fanned them out across
-- the six themes like every other matière: 6 theme categories, 48 products.
-- The client does not want them: every kind of cahier already exists per
-- matière → theme, so the branch is a duplicate of the real catalogue.
--
-- What goes, and what it takes with it:
--  * every product in the branch — product_images and product_variants
--    cascade;
--  * the six theme categories, then "Toutes matières" itself (parent_id is
--    ON DELETE RESTRICT, so children first);
--  * the branch's ids inside promotions.category_ids, which is a plain uuid[]
--    with no foreign key and would otherwise keep pointing at nothing.
--
-- Past orders are safe: order_items snapshots name, price and variants at
-- purchase time and its product_id is ON DELETE SET NULL, so an order for one
-- of these cahiers keeps its lines, it just stops linking to the product page.
-- Landing pages pointing at one of them fall back the same way (SET NULL).
--
-- Idempotent: once the branch is gone this does nothing.

do $$
declare
  v_root    uuid;
  v_branch  uuid[];
begin
  select id into v_root from public.categories where slug = 'toutes-matieres';
  if v_root is null then
    raise notice '"toutes-matieres" not found — nothing to remove';
    return;
  end if;

  -- The branch root plus everything under it, however deep.
  with recursive branch as (
    select id from public.categories where id = v_root
    union all
    select c.id from public.categories c join branch b on c.parent_id = b.id
  )
  select array_agg(id) into v_branch from branch;

  delete from public.products where category_id = any (v_branch);

  update public.promotions
     set category_ids = (
           select coalesce(array_agg(x), '{}')
             from unnest(category_ids) as x
            where x <> all (v_branch)
         )
   where category_ids && v_branch;

  -- Leaves first, one layer at a time: RESTRICT is checked per row, so a
  -- parent may never go in the same statement as its children.
  loop
    delete from public.categories c
     where c.id = any (v_branch)
       and not exists (select 1 from public.categories k where k.parent_id = c.id);
    exit when not found;
  end loop;
end $$;
