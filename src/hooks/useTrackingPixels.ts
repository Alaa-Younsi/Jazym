import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TrackingPixel } from "@/types/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const DEFAULT_EVENTS: TrackingPixel["events"] = {
  page_view: true,
  view_content: true,
  add_to_cart: true,
  initiate_checkout: true,
  purchase: true,
};

function normalizePixel(row: Record<string, unknown>): TrackingPixel {
  const events = (row.events ?? {}) as Partial<TrackingPixel["events"]>;
  return {
    id: String(row.id ?? ""),
    provider: row.provider === "tiktok" ? "tiktok" : "meta",
    label: String(row.label ?? ""),
    pixel_id: String(row.pixel_id ?? ""),
    active: Boolean(row.active),
    scope: (row.scope as TrackingPixel["scope"]) ?? "all",
    match_values: Array.isArray(row.match_values) ? (row.match_values as string[]) : [],
    events: { ...DEFAULT_EVENTS, ...events },
    currency: String(row.currency ?? "DZD"),
    sort_order: Number(row.sort_order ?? 0),
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/** Storefront — only active rows (RLS also filters, this is belt-and-braces). */
export function useActivePixels() {
  return useQuery({
    queryKey: ["active-pixels"],
    staleTime: 1000 * 60 * 60,
    retry: 0,
    queryFn: async (): Promise<TrackingPixel[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("tracking_pixels")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) return [];
      return (data as Record<string, unknown>[]).map(normalizePixel);
    },
  });
}

export function useAllPixelsAdmin() {
  return useQuery({
    queryKey: ["admin-pixels"],
    retry: 0,
    queryFn: async (): Promise<TrackingPixel[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("tracking_pixels")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizePixel);
    },
  });
}

export type PixelInput = Omit<TrackingPixel, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export function useSavePixel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PixelInput) => {
      const payload = {
        provider: input.provider,
        label: input.label,
        pixel_id: input.pixel_id,
        active: input.active,
        scope: input.scope,
        match_values: input.match_values,
        events: input.events,
        currency: input.currency,
        sort_order: input.sort_order,
        notes: input.notes,
      };
      if (input.id) {
        const { error } = await supabase.from("tracking_pixels").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tracking_pixels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pixels"] });
      qc.invalidateQueries({ queryKey: ["active-pixels"] });
    },
  });
}

export function useDeletePixel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracking_pixels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pixels"] });
      qc.invalidateQueries({ queryKey: ["active-pixels"] });
    },
  });
}
