import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * `true` once real credentials are present. Until the client wires Supabase,
 * hooks fall back to bundled demo data instead of hammering a dead endpoint.
 */
export const isSupabaseConfigured =
  !!url && !!anonKey && !url.includes("YOUR-PROJECT") && !anonKey.includes("YOUR-ANON");

export const supabase: SupabaseClient = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "jazym-auth",
    },
    // No custom global headers: every header rides along on functions.invoke
    // too, and one missing from an edge function's Access-Control-Allow-Headers
    // makes the browser drop the call after the preflight — silently, and
    // only in the browser (curl has no CORS).
  },
);

/** Public URL of the product-images / product-videos storage buckets. */
export function storagePublicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
