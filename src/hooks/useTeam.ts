import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FunctionsHttpError } from "@supabase/supabase-js";
import type { AdminProfile } from "@/types/db";
import type { TranslationKey } from "@/i18n/translations";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useTeam() {
  return useQuery({
    queryKey: ["admin-team"],
    retry: 0,
    queryFn: async (): Promise<AdminProfile[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as AdminProfile[]) ?? []).filter((p) => !p.is_owner);
    },
  });
}

/** Read the coded error out of a FunctionsHttpError (body is on .context). */
export async function readFnError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = (await ctx.json()) as { code?: string };
      return body.code ?? "generic";
    } catch {
      return "generic";
    }
  }
  return "generic";
}

export function fnErrorKey(code: string): TranslationKey {
  switch (code) {
    case "email_exists":
      return "teamErrEmailExists";
    case "weak_password":
      return "teamErrWeakPassword";
    case "forbidden":
    case "forbidden_target":
      return "teamErrForbidden";
    case "not_found":
      return "teamErrNotFound";
    default:
      return "teamErrGeneric";
  }
}

export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      password: string;
      sections: string[];
    }) => {
      const { error } = await supabase.functions.invoke("create-worker", {
        body: input,
      });
      if (error) throw error as FunctionsHttpError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-team"] }),
  });
}

export function useUpdateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      patch,
    }: {
      userId: string;
      patch: Partial<Pick<AdminProfile, "sections" | "active">>;
    }) => {
      const { error } = await supabase.from("admin_profiles").update(patch).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-team"] }),
  });
}

export function useSetWorkerPassword() {
  return useMutation({
    mutationFn: async (input: { userId: string; password: string }) => {
      const { error } = await supabase.functions.invoke("set-worker-password", {
        body: input,
      });
      if (error) throw error as FunctionsHttpError;
    },
  });
}
