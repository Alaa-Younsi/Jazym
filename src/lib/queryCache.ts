import type { QueryClient } from "@tanstack/react-query";

/**
 * One product row lives under several React Query keys. A product write must
 * invalidate ALL of them or the storefront serves a stale price for the rest of
 * the session ("it saved but the site didn't change"). See skill Phase 8.
 */
export function invalidateProductCaches(qc: QueryClient): void {
  for (const key of [
    "admin-products",
    // the edit form's own row — "product" does NOT match ["admin-product", id]
    "admin-product",
    "products",
    "product",
    "related-products",
    "featured-products",
    // a price change moves the cart total, so the server quote must re-run
    "cart-quote",
  ]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

/** Taxonomy edits also touch product caches (listings embed category:*). */
export function invalidateTaxonomyCaches(qc: QueryClient): void {
  for (const key of ["admin-categories", "categories"]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
  invalidateProductCaches(qc);
}

export function invalidateOrderCaches(qc: QueryClient): void {
  for (const key of ["orders", "order", "admin-order-stats"]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}
