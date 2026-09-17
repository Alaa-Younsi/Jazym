import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AnnouncementItem, AnnouncementStyle, StoreSettings } from "@/types/db";
import { DEMO_STORE_SETTINGS } from "@/data/demo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    staleTime: 1000 * 60 * 10,
    retry: 0,
    queryFn: async (): Promise<StoreSettings> => {
      if (!isSupabaseConfigured) return DEMO_STORE_SETTINGS;
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as StoreSettings | null) ?? DEMO_STORE_SETTINGS;
    },
  });
}

/** The announcement-bar columns only — never a spread of the loaded row. */
export interface AnnouncementFormState {
  announcement_enabled: boolean;
  announcement_items: AnnouncementItem[];
  announcement_speed: number;
  announcement_style: AnnouncementStyle;
}

export function useSaveAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: AnnouncementFormState) => {
      const { error } = await supabase.from("store_settings").update(form).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-settings"] }),
  });
}

export interface ResolvedShipping {
  /** Amount to charge for shipping. */
  amount: number;
  /** true when a free-shipping threshold is set AND met. */
  isFree: boolean;
  /** true when no wilaya has been picked yet (render as "—"). */
  isPending: boolean;
}

/**
 * The ONE shared shipping resolver — used by both Checkout and InlineCheckout so
 * the total shown === the total the server charges. Free shipping only when a
 * threshold is set and met (null threshold = offer OFF). See skill Phase 5/6.
 */
export function resolveShipping(
  wilayaFee: number | null | undefined,
  goodsTotalAfterDiscount: number,
  settings: StoreSettings | undefined,
): ResolvedShipping {
  if (wilayaFee == null) return { amount: 0, isFree: false, isPending: true };
  const threshold = settings?.free_ship_threshold ?? null;
  if (threshold != null && goodsTotalAfterDiscount >= threshold) {
    return { amount: 0, isFree: true, isPending: false };
  }
  return { amount: wilayaFee, isFree: false, isPending: false };
}
