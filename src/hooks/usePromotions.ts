import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PackItem, Promotion, PromotionScope, PromotionType } from "@/types/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Read-side normaliser: a DB missing migration 0019 must not crash the cart. */
export function normalizePromotion(row: Record<string, unknown>): Promotion {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    type: (row.type as PromotionType) ?? "category_percent",
    active: Boolean(row.active),
    priority: Number(row.priority ?? 0),
    starts_at: (row.starts_at as string | null) ?? null,
    ends_at: (row.ends_at as string | null) ?? null,
    scope: (row.scope as PromotionScope) ?? "all",
    category_ids: Array.isArray(row.category_ids) ? (row.category_ids as string[]) : [],
    product_ids: Array.isArray(row.product_ids) ? (row.product_ids as string[]) : [],
    buy_qty: Number(row.buy_qty ?? 0),
    get_qty: Number(row.get_qty ?? 0),
    percent: Number(row.percent ?? 0),
    pack_items: Array.isArray(row.pack_items) ? (row.pack_items as PackItem[]) : [],
    pack_price: row.pack_price == null ? null : Number(row.pack_price),
    label_fr: (row.label_fr as string | null) ?? null,
    label_ar: (row.label_ar as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
  };
}

/**
 * Storefront read. RLS already drops anything inactive or outside its window,
 * so whatever comes back here is live — `isPromotionLive` re-checks anyway so
 * an open tab doesn't keep showing an offer that expired ten minutes ago.
 * `retry: 0` keeps a store whose DB predates 0019 from stalling the cart.
 */
export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    staleTime: 1000 * 60 * 5,
    retry: 0,
    queryFn: async (): Promise<Promotion[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizePromotion);
    },
  });
}

export function useAdminPromotions() {
  return useQuery({
    queryKey: ["admin-promotions"],
    retry: 0,
    queryFn: async (): Promise<Promotion[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizePromotion);
    },
  });
}

export function useAdminPromotion(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-promotion", id],
    enabled: !!id && id !== "new",
    retry: 0,
    queryFn: async (): Promise<Promotion | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizePromotion(data as Record<string, unknown>) : null;
    },
  });
}

/** Editable columns only — never a spread of the loaded row (PGRST204 trap). */
export type PromotionFormState = Omit<Promotion, "id" | "created_at" | "updated_at">;

export function toPromotionFormState(row: Promotion): PromotionFormState {
  return {
    name: row.name,
    type: row.type,
    active: row.active,
    priority: row.priority,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    scope: row.scope,
    category_ids: row.category_ids,
    product_ids: row.product_ids,
    buy_qty: row.buy_qty,
    get_qty: row.get_qty,
    percent: row.percent,
    pack_items: row.pack_items,
    pack_price: row.pack_price,
    label_fr: row.label_fr,
    label_ar: row.label_ar,
  };
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  for (const key of ["admin-promotions", "admin-promotion", "promotions", "cart-quote"]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

export function useSavePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id?: string; form: PromotionFormState }) => {
      if (id) {
        const { error } = await supabase.from("promotions").update(form).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from("promotions").insert(form).select("id").single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}
