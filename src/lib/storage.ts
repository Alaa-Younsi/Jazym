import { IMMUTABLE_CACHE_CONTROL } from "./image";
import { supabase } from "./supabase";

/** Uploads a file to a Supabase Storage bucket under a fresh uuid name (never
    collides, so `upsert: false` is safe) and returns its public URL. Shared
    by admin uploads (product photos, variant images) and customer uploads
    (custom cover designs) — kept out of the admin-only hooks module so the
    storefront bundle doesn't pull in admin query/mutation code. */
export async function uploadToBucket(bucket: string, file: File, prefix = ""): Promise<string> {
  const ext = file.name.split(".").pop() || "webp";
  const path = `${prefix}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    // A year of CDN cache: the path is a fresh uuid on every upload, so a
    // replaced image is a NEW url and can never be served stale.
    cacheControl: IMMUTABLE_CACHE_CONTROL,
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
