import type { Category } from "@/types/db";

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

/** Direct children of `parentId`, sorted by sort_order (null = top level). */
export function childrenOf(categories: Category[], parentId: string | null): Category[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function buildTree(categories: Category[], parentId: string | null = null): CategoryNode[] {
  return childrenOf(categories, parentId).map((c) => ({
    ...c,
    children: buildTree(categories, c.id),
  }));
}

/** A category is a leaf once it has no subcategories (it may or may not hold products yet). */
export function isLeaf(categories: Category[], categoryId: string): boolean {
  return !categories.some((c) => c.parent_id === categoryId);
}

/** Root-to-node chain, root first, including the node itself. */
export function pathTo(categories: Category[], categoryId: string | null): Category[] {
  const chain: Category[] = [];
  let current = categories.find((c) => c.id === categoryId) ?? null;
  while (current) {
    chain.unshift(current);
    const parentId: string | null = current.parent_id;
    current = parentId ? (categories.find((c) => c.id === parentId) ?? null) : null;
  }
  return chain;
}

/** This category's id plus every descendant id, resolved from a category slug. */
export function descendantIds(categories: Category[], rootSlug: string): Set<string> {
  const root = categories.find((c) => c.slug === rootSlug);
  if (!root) return new Set();
  const ids = new Set<string>([root.id]);
  let frontier = [root.id];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const c of categories) {
      if (c.parent_id && frontier.includes(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        next.push(c.id);
      }
    }
    frontier = next;
  }
  return ids;
}

export interface FlatCategoryOption {
  category: Category;
  depth: number;
  isLeaf: boolean;
}

/** Depth-first, indent-ready flattening of the whole tree — for a <select>. */
export function flattenForSelect(categories: Category[]): FlatCategoryOption[] {
  const out: FlatCategoryOption[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const c of childrenOf(categories, parentId)) {
      out.push({ category: c, depth, isLeaf: isLeaf(categories, c.id) });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
