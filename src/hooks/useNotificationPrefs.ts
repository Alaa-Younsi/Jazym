import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** One admin's notification settings. RLS lets an account see only its own. */
export interface NotificationPrefs {
  user_id: string;
  email_enabled: boolean;
  notify_email: string | null;
  updated_at: string;
}

export type NotificationPrefsInput = Omit<NotificationPrefs, "user_id" | "updated_at">;

export const EMPTY_PREFS: NotificationPrefsInput = {
  email_enabled: false,
  notify_email: null,
};

/**
 * The signed-in admin's own row. `retry: 0` so a project whose DB has not run
 * migration 0025 yet degrades to "notifications off" instead of hammering
 * PostgREST on every visit to the account page.
 */
export function useNotificationPrefs() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  return useQuery({
    queryKey: ["notification-prefs", userId],
    enabled: !!userId && isSupabaseConfigured,
    retry: 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<NotificationPrefs | null> => {
      const { data, error } = await supabase
        .from("admin_notification_prefs")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as NotificationPrefs | null) ?? null;
    },
  });
}

export function useSaveNotificationPrefs() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  return useMutation({
    mutationFn: async (input: NotificationPrefsInput) => {
      if (!userId) throw new Error("no session");
      // upsert, never update: an admin who has never opened this panel has no
      // row yet, and the RLS check is on user_id either way.
      const { error } = await supabase.from("admin_notification_prefs").upsert(
        {
          user_id: userId,
          ...input,
          // Turning notifications off keeps the address, so switching them
          // back on doesn't mean retyping it — but an ENABLED channel with a
          // blank address would be skipped in silence by the edge function, so
          // normalise an empty string to null and let the form require it.
          notify_email: input.notify_email?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-prefs", userId] });
    },
  });
}
