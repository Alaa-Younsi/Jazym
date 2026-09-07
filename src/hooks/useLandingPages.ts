import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LandingBlock, LandingPage } from "@/types/db";
import { normalizeProduct } from "@/lib/normalize";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const SELECT = "*, product:products(*, product_images(*))";

function normalizeLanding(row: Record<string, unknown>): LandingPage {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title_fr: String(row.title_fr ?? ""),
    title_ar: String(row.title_ar ?? row.title_fr ?? ""),
    status: row.status === "published" ? "published" : "draft",
    product_id: (row.product_id as string | null) ?? null,
    blocks: Array.isArray(row.blocks) ? (row.blocks as LandingBlock[]) : [],
    theme: (row.theme as LandingPage["theme"]) ?? "auto",
    seo_title_fr: (row.seo_title_fr as string | null) ?? null,
    seo_title_ar: (row.seo_title_ar as string | null) ?? null,
    seo_description_fr: (row.seo_description_fr as string | null) ?? null,
    seo_description_ar: (row.seo_description_ar as string | null) ?? null,
    og_image_url: (row.og_image_url as string | null) ?? null,
    pixel_ids: Array.isArray(row.pixel_ids) ? (row.pixel_ids as string[]) : [],
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    product: row.product ? normalizeProduct(row.product as Record<string, unknown>) : null,
  };
}

export function useLandingPage(slug: string | undefined) {
  return useQuery({
    queryKey: ["landing-page", slug],
    enabled: !!slug,
    retry: 0,
    queryFn: async (): Promise<LandingPage | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("landing_pages")
        .select(SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeLanding(data as Record<string, unknown>) : null;
    },
  });
}

export function useAdminLandingPages() {
  return useQuery({
    queryKey: ["admin-landing-pages"],
    retry: 0,
    queryFn: async (): Promise<LandingPage[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("landing_pages")
        .select(SELECT)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(normalizeLanding);
    },
  });
}

export function useAdminLandingPage(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-landing-page", id],
    enabled: !!id && id !== "new",
    retry: 0,
    queryFn: async (): Promise<LandingPage | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("landing_pages")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeLanding(data as Record<string, unknown>) : null;
    },
  });
}

export type LandingPageInput = Omit<LandingPage, "id" | "created_at" | "updated_at" | "product"> & {
  id?: string;
};

export function useSaveLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LandingPageInput) => {
      const payload = {
        slug: input.slug,
        title_fr: input.title_fr,
        title_ar: input.title_ar,
        status: input.status,
        product_id: input.product_id,
        blocks: input.blocks,
        theme: input.theme,
        seo_title_fr: input.seo_title_fr,
        seo_title_ar: input.seo_title_ar,
        seo_description_fr: input.seo_description_fr,
        seo_description_ar: input.seo_description_ar,
        og_image_url: input.og_image_url,
        pixel_ids: input.pixel_ids,
      };
      if (input.id) {
        const { error } = await supabase.from("landing_pages").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("landing_pages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-landing-pages"] });
      qc.invalidateQueries({ queryKey: ["admin-landing-page"] });
      qc.invalidateQueries({ queryKey: ["landing-page"] });
    },
  });
}

export function useDeleteLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landing_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-landing-pages"] }),
  });
}
