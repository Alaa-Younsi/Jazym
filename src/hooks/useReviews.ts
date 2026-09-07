import { useQuery } from "@tanstack/react-query";
import type { ClientReview } from "@/types/db";
import { DEMO_REVIEWS } from "@/data/demo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useReviews(activeOnly = true) {
  return useQuery({
    queryKey: ["reviews", activeOnly],
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<ClientReview[]> => {
      if (!isSupabaseConfigured) {
        return activeOnly ? DEMO_REVIEWS.filter((r) => r.active) : DEMO_REVIEWS;
      }
      let query = supabase
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data as ClientReview[]) ?? [];
    },
  });
}
