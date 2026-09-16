-- Category tree — categories can now nest arbitrarily deep (category > matière > thème > ...).
-- Products may only be attached to a leaf category (one with no subcategories); a category may
-- only be given a subcategory if it does not already hold products. Both directions are enforced
-- here as a backstop — the admin UI is the primary gate and should never let either state occur.

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete restrict;

create index if not exists categories_parent_idx on public.categories (parent_id);

create or replace function public.enforce_category_leaf_only()
returns trigger language plpgsql as $$
begin
  if new.category_id is not null and exists (
    select 1 from public.categories where parent_id = new.category_id
  ) then
    raise exception 'ERR_CATEGORY_NOT_LEAF: category has subcategories, cannot hold products';
  end if;
  return new;
end;
$$;

drop trigger if exists products_leaf_category_check on public.products;
create trigger products_leaf_category_check
  before insert or update of category_id on public.products
  for each row execute function public.enforce_category_leaf_only();

create or replace function public.enforce_category_no_children_if_has_products()
returns trigger language plpgsql as $$
begin
  if new.parent_id is not null and exists (
    select 1 from public.products where category_id = new.parent_id
  ) then
    raise exception 'ERR_CATEGORY_NOT_LEAF: parent category has products, cannot add a subcategory';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_leaf_parent_check on public.categories;
create trigger categories_leaf_parent_check
  before insert or update of parent_id on public.categories
  for each row execute function public.enforce_category_no_children_if_has_products();
