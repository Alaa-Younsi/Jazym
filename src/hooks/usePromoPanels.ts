import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PanelFile, PanelSlot, PromoPanel } from "@/types/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function normalizePanelFiles(raw: unknown): PanelFile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f): PanelFile | null => {
      if (!f || typeof f !== "object") return null;
      const o = f as Record<string, unknown>;
      const url = typeof o.url === "string" ? o.url : "";
      if (!url) return null;
      const name_fr = typeof o.name_fr === "string" ? o.name_fr : "";
      const name_ar = typeof o.name_ar === "string" ? o.name_ar : name_fr;
      return {
        url,
        name_fr: name_fr || name_ar,
        name_ar: name_ar || name_fr,
        mime: typeof o.mime === "string" ? o.mime : null,
        size_bytes: typeof o.size_bytes === "number" ? o.size_bytes : null,
      };
    })
    .filter((f): f is PanelFile => f !== null);
}

export function normalizePanel(row: Record<string, unknown>): PromoPanel {
  return {
    id: String(row.id ?? ""),
    slot: row.slot as PanelSlot,
    active: Boolean(row.active),
    title_fr: (row.title_fr as string | null) ?? null,
    title_ar: (row.title_ar as string | null) ?? null,
    subtitle_fr: (row.subtitle_fr as string | null) ?? null,
    subtitle_ar: (row.subtitle_ar as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    link_url: (row.link_url as string | null) ?? null,
    // Every optional field on a row has to be mapped here explicitly or it is
    // silently dropped on the way to the UI — see the variant-flag bug that
    // cost a full debugging session.
    files: normalizePanelFiles(row.files),
    start_at: (row.start_at as string | null) ?? null,
    end_at: (row.end_at as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/** Public read for a single slot — RLS already filters active/scheduled server-side. */
export function usePanel(slot: PanelSlot) {
  return useQuery({
    queryKey: ["panel", slot],
    retry: 0,
    queryFn: async (): Promise<PromoPanel | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("promo_panels")
        .select("*")
        .eq("slot", slot)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizePanel(data as Record<string, unknown>) : null;
    },
  });
}

export function useAdminPanels() {
  return useQuery({
    queryKey: ["admin-panels"],
    retry: 0,
    queryFn: async (): Promise<PromoPanel[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase.from("promo_panels").select("*").order("sort_order");
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizePanel);
    },
  });
}

export function useAdminPanel(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-panel", id],
    enabled: !!id,
    retry: 0,
    queryFn: async (): Promise<PromoPanel | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("promo_panels")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizePanel(data as Record<string, unknown>) : null;
    },
  });
}

/** Editable columns only — the 4 rows always exist, this is always an update. */
export type PanelFormState = Omit<
  PromoPanel,
  "id" | "slot" | "sort_order" | "created_at" | "updated_at"
>;

export function toPanelFormState(row: PromoPanel): PanelFormState {
  return {
    active: row.active,
    title_fr: row.title_fr,
    title_ar: row.title_ar,
    subtitle_fr: row.subtitle_fr,
    subtitle_ar: row.subtitle_ar,
    image_url: row.image_url,
    link_url: row.link_url,
    files: row.files,
    start_at: row.start_at,
    end_at: row.end_at,
  };
}

export function useSavePanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: PanelFormState }) => {
      const { error } = await supabase.from("promo_panels").update(form).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-panels"] });
      qc.invalidateQueries({ queryKey: ["admin-panel"] });
      qc.invalidateQueries({ queryKey: ["panel"] });
    },
  });
}
