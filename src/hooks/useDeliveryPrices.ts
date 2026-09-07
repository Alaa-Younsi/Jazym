import { useQuery } from "@tanstack/react-query";
import type { DeliveryPrice } from "@/types/db";
import { DEMO_DELIVERY_PRICES } from "@/data/demo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** @param activeOnly checkout passes true; admin passes false. */
export function useDeliveryPrices(activeOnly = false) {
  return useQuery({
    queryKey: ["delivery-prices", activeOnly],
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<DeliveryPrice[]> => {
      if (!isSupabaseConfigured) {
        return activeOnly ? DEMO_DELIVERY_PRICES.filter((d) => d.active) : DEMO_DELIVERY_PRICES;
      }
      let query = supabase.from("delivery_prices").select("*").order("wilaya");
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data as DeliveryPrice[]) ?? [];
    },
  });
}
