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

/**
 * Turn a Storage failure into something a human can act on. A bare
 * `catch { toast.error("upload failed") }` is what hid a missing bucket and a
 * missing RLS policy behind the same four words for the entire project.
 */
export function uploadErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const m = raw.toLowerCase();
  if (m.includes("bucket not found") || m.includes("nosuchbucket")) {
    return "Bucket de stockage introuvable — appliquez la migration 0024.";
  }
  if (m.includes("row-level security") || m.includes("unauthorized") || m.includes("403")) {
    return "Envoi refusé par la base (droits de stockage) — appliquez la migration 0024.";
  }
  if (m.includes("mime") || m.includes("content type")) {
    return "Type de fichier refusé par le bucket.";
  }
  if (m.includes("maximum allowed size") || m.includes("payload too large") || m.includes("413")) {
    return "Fichier trop volumineux pour le bucket.";
  }
  return raw || "Échec de l'envoi du fichier.";
}

export type UntrustedImageErrorReason =
  | "invalid-type"
  | "too-large"
  | "decode-failed"
  | "too-large-after-compress";

export class UntrustedImageError extends Error {
  reason: UntrustedImageErrorReason;
  constructor(reason: UntrustedImageErrorReason) {
    super(reason);
    this.reason = reason;
  }
}

const UNTRUSTED_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
/** Reject before even attempting to decode — keeps a malicious or oversized
    upload from hanging a customer's (often low-end) phone browser. */
const UNTRUSTED_MAX_RAW_BYTES = 15 * 1024 * 1024;
/** Deliberately UNDER the `customer-uploads` bucket's own `file_size_limit`
    (5 MB, migration 0022), so a file that passes here is never rejected again
    at the Storage API. Raise the bucket first if this ever goes up. */
const UNTRUSTED_MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const UNTRUSTED_MAX_EDGE = 1400;

/**
 * Re-encodes an UNTRUSTED, anonymous-customer-supplied image through a
 * <canvas> before it ever reaches storage. Deliberately NOT the same as
 * compressImage() (used for trusted admin uploads): that one falls back to
 * uploading the ORIGINAL file whenever the browser fails to decode it or
 * compression doesn't shrink it — a reasonable default for staff, but wrong
 * here. This throws instead, so a file the browser can't decode as a genuine
 * raster image (a renamed non-image, a corrupt/crafted payload, a spoofed
 * MIME type) is rejected outright rather than passed through unprocessed.
 * The canvas round-trip also strips any embedded metadata/polyglot payload a
 * crafted file might carry — only real decoded pixels survive re-encoding.
 */
export async function compressUntrustedImage(file: File): Promise<File> {
  if (!UNTRUSTED_ALLOWED_TYPES.has(file.type)) {
    throw new UntrustedImageError("invalid-type");
  }
  if (file.size > UNTRUSTED_MAX_RAW_BYTES) {
    throw new UntrustedImageError("too-large");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UntrustedImageError("decode-failed");
  }

  const scale = Math.min(1, UNTRUSTED_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new UntrustedImageError("decode-failed");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", 0.82),
  );
  if (!blob) throw new UntrustedImageError("decode-failed");
  if (blob.size > UNTRUSTED_MAX_OUTPUT_BYTES) {
    throw new UntrustedImageError("too-large-after-compress");
  }

  return new File([blob], "cover.webp", { type: "image/webp", lastModified: Date.now() });
}
