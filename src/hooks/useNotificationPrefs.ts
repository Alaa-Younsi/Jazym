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

/** One alert recipient as the OWNER sees it (migration 0034). */
export interface NotificationRecipient {
  user_id: string;
  email_enabled: boolean;
  notify_email: string | null;
  /** The admin account the address is saved on (its login e-mail). */
  account_email: string | null;
  account_active: boolean;
  is_owner: boolean;
}

interface RecipientRow {
  user_id: string;
  email_enabled: boolean;
  notify_email: string | null;
  admin_profiles: { email: string | null; active: boolean; is_owner: boolean } | null;
}

/**
 * Every account's alert address — owner only. This is the list the `notify`
 * edge function actually sends to (enabled rows of active accounts), so it is
 * the answer to "who is receiving the order e-mails?".
 */
export function useNotificationRecipients(enabled: boolean) {
  return useQuery({
    queryKey: ["notification-recipients"],
    enabled: enabled && isSupabaseConfigured,
    retry: 0,
    queryFn: async (): Promise<NotificationRecipient[]> => {
      const { data, error } = await supabase
        .from("admin_notification_prefs")
        .select(
          "user_id, email_enabled, notify_email, admin_profiles!inner(email, active, is_owner)",
        );
      if (error) throw error;
      return ((data ?? []) as unknown as RecipientRow[]).map((r) => ({
        user_id: r.user_id,
        email_enabled: r.email_enabled,
        notify_email: r.notify_email,
        account_email: r.admin_profiles?.email ?? null,
        account_active: r.admin_profiles?.active ?? false,
        is_owner: r.admin_profiles?.is_owner ?? false,
      }));
    },
  });
}

export function useSetRecipientEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      // .select() so an RLS-filtered update (0 rows) is reported, not "saved".
      const { data, error } = await supabase
        .from("admin_notification_prefs")
        .update({ email_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select("user_id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("not_updated");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-recipients"] });
      qc.invalidateQueries({ queryKey: ["notification-prefs"] });
    },
  });
}
