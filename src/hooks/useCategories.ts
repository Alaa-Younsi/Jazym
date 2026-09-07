import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/types/db";
import { DEMO_CATEGORIES } from "@/data/demo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Category[]> => {
      if (!isSupabaseConfigured) return DEMO_CATEGORIES;
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as Category[]) ?? [];
    },
  });
}
