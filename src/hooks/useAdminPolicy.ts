import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PolicySection, PolicySettings } from "@/types/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useAdminPolicySettings() {
  return useQuery({
    queryKey: ["admin-policy-settings"],
    retry: 0,
    queryFn: async (): Promise<PolicySettings | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("policy_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return (data as PolicySettings | null) ?? null;
    },
  });
}

export function useAdminPolicySections() {
  return useQuery({
    queryKey: ["admin-policy-sections"],
    retry: 0,
    queryFn: async (): Promise<PolicySection[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("policy_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data as PolicySection[]) ?? [];
    },
  });
}

export function useSavePolicySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<PolicySettings>) => {
      const { error } = await supabase
        .from("policy_settings")
        .upsert({ id: true, ...patch, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-policy-settings"] });
      qc.invalidateQueries({ queryKey: ["policy-content"] });
    },
  });
}

export function useSavePolicySection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (section: Partial<PolicySection> & { id?: string }) => {
      if (section.id) {
        const { id, ...patch } = section;
        const { error } = await supabase
          .from("policy_sections")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("policy_sections").insert(section);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-policy-sections"] });
      qc.invalidateQueries({ queryKey: ["policy-content"] });
    },
  });
}

export function useDeletePolicySection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("policy_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-policy-sections"] });
      qc.invalidateQueries({ queryKey: ["policy-content"] });
    },
  });
}
