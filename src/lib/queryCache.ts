import type { QueryClient } from "@tanstack/react-query";

/**
 * One product row lives under several React Query keys. A product write must
 * invalidate ALL of them or the storefront serves a stale price for the rest of
 * the session ("it saved but the site didn't change"). See skill Phase 8.
 */
export function invalidateProductCaches(qc: QueryClient): void {
  for (const key of [
    "admin-products",
    "products",
    "product",
    "related-products",
    "featured-products",
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
