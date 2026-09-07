import { useQuery } from "@tanstack/react-query";
import type { AdminProfile } from "@/types/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface AdminProfileState {
  profile: AdminProfile | null;
  isOwner: boolean;
  isActive: boolean;
  hasSection: (key: string) => boolean;
  isLoading: boolean;
}

/**
 * Mirrors the RLS gate so the UI hides what the DB would refuse. NEVER the
 * boundary itself. See skill Phase 8.5.
 *
 * Fallback when Supabase is not wired: treat the local session as a full owner
 * so the dashboard is explorable during development.
 */
export function useAdminProfile(): AdminProfileState {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-profile", userId],
    enabled: !!userId && isSupabaseConfigured,
    staleTime: 1000 * 60 * 5,
    retry: 0,
    queryFn: async (): Promise<AdminProfile | null> => {
      const { data: row, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (row as AdminProfile | null) ?? null;
    },
  });

  if (!isSupabaseConfigured) {
    const devOwner = !!session;
    return {
      profile: devOwner
        ? {
            user_id: session.user.id,
            email: session.user.email ?? null,
            is_owner: true,
            sections: [],
            active: true,
            created_at: new Date().toISOString(),
          }
        : null,
      isOwner: devOwner,
      isActive: devOwner,
      hasSection: () => devOwner,
      isLoading: false,
    };
  }

  const profile = data ?? null;
  const isOwner = !!profile?.is_owner && profile.active;
  const isActive = !!profile?.active;
  return {
    profile,
    isOwner,
    isActive,
    hasSection: (key: string) => isOwner || (isActive && (profile?.sections ?? []).includes(key)),
    isLoading,
  };
}
