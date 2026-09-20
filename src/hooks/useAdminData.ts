import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category, ClientReview, DeliveryPrice, Product, ProductVariant } from "@/types/db";
import { DEMO_CATEGORIES, DEMO_DELIVERY_PRICES, DEMO_PRODUCTS, DEMO_REVIEWS } from "@/data/demo";
import { normalizeProduct } from "@/lib/normalize";
import { invalidateProductCaches, invalidateTaxonomyCaches } from "@/lib/queryCache";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const PRODUCT_SELECT = "*, category:categories(*), product_images(*), product_variants(*)";

/* ---------------- products ---------------- */

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) return DEMO_PRODUCTS;
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizeProduct);
    },
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-product", id],
    enabled: !!id && id !== "new",
    queryFn: async (): Promise<Product | null> => {
      if (!isSupabaseConfigured) {
        return DEMO_PRODUCTS.find((p) => p.id === id) ?? null;
      }
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeProduct(data as Record<string, unknown>) : null;
    },
  });
}

/** Editable columns only — an explicit mapper, NEVER a spread of the loaded row
    (the select("*") / PGRST204 trap). See skill Phase 8. */
export type ProductFormState = Omit<
  Product,
  "id" | "created_at" | "updated_at" | "category" | "product_images" | "product_variants"
>;

export function toProductFormState(row: Product): ProductFormState {
  return {
    slug: row.slug,
    name_fr: row.name_fr,
    name_ar: row.name_ar,
    description_fr: row.description_fr,
    description_ar: row.description_ar,
    details_fr: row.details_fr,
    details_ar: row.details_ar,
    price: row.price,
    compare_at_price: row.compare_at_price,
    category_id: row.category_id,
    stock: row.stock,
    style_code: row.style_code,
    colors: row.colors,
    sizes: row.sizes,
    variants: row.variants,
    quantity_offers: row.quantity_offers,
    video_url: row.video_url,
    featured: row.featured,
    status: row.status,
  };
}

/** Editable columns only — an explicit mapper, NEVER a spread of the loaded row. */
export type ProductVariantFormState = Omit<
  ProductVariant,
  "id" | "product_id" | "created_at" | "updated_at"
>;

export function toProductVariantFormState(row: ProductVariant): ProductVariantFormState {
  return {
    option1_name_fr: row.option1_name_fr,
    option1_name_ar: row.option1_name_ar,
    option1_value_fr: row.option1_value_fr,
    option1_value_ar: row.option1_value_ar,
    option2_name_fr: row.option2_name_fr,
    option2_name_ar: row.option2_name_ar,
    option2_value_fr: row.option2_value_fr,
    option2_value_ar: row.option2_value_ar,
    price: row.price,
    compare_at_price: row.compare_at_price,
    stock: row.stock,
    sku: row.sku,
    image_url: row.image_url,
    sort_order: row.sort_order,
  };
}

export interface SaveProductInput {
  id?: string;
  form: ProductFormState;
  /** ordered image URLs; index 0 is the main/thumbnail image */
  imageUrls: string[];
  /** priced/stocked variant rows — empty for a variant-less product */
  variantRows: ProductVariantFormState[];
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form, imageUrls, variantRows }: SaveProductInput): Promise<string> => {
      let productId = id;
      if (productId) {
        const { error } = await supabase.from("products").update(form).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(form).select("id").single();
        if (error) throw error;
        productId = (data as { id: string }).id;
      }

      // Replace image rows (delete then insert — check BOTH legs).
      const { error: delErr } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);
      if (delErr) throw delErr;

      if (imageUrls.length > 0) {
        const rows = imageUrls.map((url, i) => ({
          product_id: productId,
          url,
          alt: form.name_fr,
          sort_order: i,
        }));
        const { error: insErr } = await supabase.from("product_images").insert(rows);
        if (insErr) throw insErr;
      }

      // Replace variant rows (delete then insert — same convention as images).
      const { error: delVarErr } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId);
      if (delVarErr) throw delVarErr;

      if (variantRows.length > 0) {
        const rows = variantRows.map((v, i) => ({ ...v, product_id: productId, sort_order: i }));
        const { error: insVarErr } = await supabase.from("product_variants").insert(rows);
        if (insVarErr) throw insVarErr;
      }
      return productId as string;
    },
    onSuccess: () => invalidateProductCaches(qc),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateProductCaches(qc),
  });
}

/* ---------------- categories ---------------- */

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async (): Promise<Category[]> => {
      if (!isSupabaseConfigured) return DEMO_CATEGORIES;
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data as Category[]) ?? [];
    },
  });
}

export type CategoryFormState = Omit<Category, "id" | "created_at">;

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id?: string; form: CategoryFormState }) => {
      if (id) {
        const { error } = await supabase.from("categories").update(form).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidateTaxonomyCaches(qc),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTaxonomyCaches(qc),
  });
}

/* ---------------- reviews ---------------- */

export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async (): Promise<ClientReview[]> => {
      if (!isSupabaseConfigured) return DEMO_REVIEWS;
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ClientReview[]) ?? [];
    },
  });
}

export type ReviewFormState = Omit<ClientReview, "id" | "created_at">;

export function useSaveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id?: string; form: ReviewFormState }) => {
      if (id) {
        const { error } = await supabase.from("client_reviews").update(form).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_reviews").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

/* ---------------- delivery prices ---------------- */

export function useAdminDeliveryPrices() {
  return useQuery({
    queryKey: ["admin-delivery-prices"],
    queryFn: async (): Promise<DeliveryPrice[]> => {
      if (!isSupabaseConfigured) return DEMO_DELIVERY_PRICES;
      const { data, error } = await supabase.from("delivery_prices").select("*").order("wilaya");
      if (error) throw error;
      return (data as DeliveryPrice[]) ?? [];
    },
  });
}

export function useUpdateDeliveryPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<DeliveryPrice, "home_price" | "office_price" | "active">>;
    }) => {
      const { error } = await supabase
        .from("delivery_prices")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-delivery-prices"] });
      qc.invalidateQueries({ queryKey: ["delivery-prices"] });
    },
  });
}
