import { useQuery } from "@tanstack/react-query";
import type { Category, Product } from "@/types/db";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/data/demo";
import { descendantIds } from "@/lib/categoryTree";
import { normalizeProduct } from "@/lib/normalize";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sanitizeSearchTerm } from "@/lib/utils";

const SELECT = "*, category:categories(*), product_images(*), product_variants(*)";

export type ProductSort = "new" | "price-asc" | "price-desc";

export interface ProductFilters {
  categorySlug?: string | null;
  search?: string;
  sort?: ProductSort;
}

function applyClientFilters(list: Product[], filters: ProductFilters): Product[] {
  let out = list.filter((p) => p.status === "active");
  if (filters.categorySlug) {
    const ids = descendantIds(DEMO_CATEGORIES, filters.categorySlug);
    out = out.filter((p) => p.category_id && ids.has(p.category_id));
  }
  const term = (filters.search ?? "").trim().toLowerCase();
  if (term) {
    out = out.filter(
      (p) =>
        p.name_fr.toLowerCase().includes(term) ||
        p.name_ar.includes(term) ||
        (p.style_code ?? "").toLowerCase().includes(term),
    );
  }
  switch (filters.sort) {
    case "price-asc":
      out = [...out].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      out = [...out].sort((a, b) => b.price - a.price);
      break;
    default:
      out = [...out].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
  return out;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) return applyClientFilters(DEMO_PRODUCTS, filters);

      let query = supabase.from("products").select(SELECT).eq("status", "active");

      if (filters.categorySlug) {
        const { data: cats, error: catErr } = await supabase
          .from("categories")
          .select("id,slug,parent_id");
        if (catErr) throw catErr;
        const ids = descendantIds((cats ?? []) as unknown as Category[], filters.categorySlug);
        query = query.in("category_id", ids.size > 0 ? Array.from(ids) : ["__none__"]);
      }
      const term = sanitizeSearchTerm(filters.search ?? "");
      if (term) {
        query = query.or(`name_fr.ilike.%${term}%,name_ar.ilike.%${term}%`);
      }
      switch (filters.sort) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
      query = query.limit(200);

      const { data, error } = await query;
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizeProduct);
    },
  });
}

export function useFeaturedProducts(limit = 6) {
  return useQuery({
    queryKey: ["featured-products", limit],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) {
        return DEMO_PRODUCTS.filter((p) => p.featured).slice(0, limit);
      }
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("status", "active")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizeProduct);
    },
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<Product | null> => {
      if (!isSupabaseConfigured) {
        return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
      }
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeProduct(data as Record<string, unknown>) : null;
    },
  });
}

export function useRelatedProducts(product: Product | null | undefined, limit = 4) {
  return useQuery({
    queryKey: ["related-products", product?.id, limit],
    enabled: !!product,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Product[]> => {
      if (!product) return [];
      if (!isSupabaseConfigured) {
        return DEMO_PRODUCTS.filter(
          (p) => p.id !== product.id && p.category_id === product.category_id,
        ).slice(0, limit);
      }
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("status", "active")
        .eq("category_id", product.category_id ?? "")
        .neq("id", product.id)
        .limit(limit);
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizeProduct);
    },
  });
}
