/* Image pipeline — TWO independent fixes, both required (skill Phase 9.5).
   1. compressImage(): shrink what gets STORED (call before every admin upload).
   2. responsiveSrcSet(): shrink what gets SENT (the egress fix — matters more). */

const SUPABASE_PUBLIC_MARKER = "/storage/v1/object/public/";
const SUPABASE_RENDER_MARKER = "/storage/v1/render/image/public/";
const STORAGE_SRCSET_WIDTHS = [200, 400, 600, 900, 1400];
const STORAGE_QUALITY = 70;
const MAX_EDGE = 1400;

export function isSupabaseStorageUrl(src: string): boolean {
  return src.includes(SUPABASE_PUBLIC_MARKER);
}

export function supabaseRenderUrl(src: string, width: number): string {
  const base = src.replace(SUPABASE_PUBLIC_MARKER, SUPABASE_RENDER_MARKER);
  const sep = base.includes("?") ? "&" : "?";
  // resize=contain is NOT optional — width alone returns the requested width at
  // the ORIGINAL height (a silently squashed image).
  return `${base}${sep}width=${width}&resize=contain&quality=${STORAGE_QUALITY}`;
}

export function supabaseSrcSet(src: string): string | undefined {
  if (!isSupabaseStorageUrl(src)) return undefined;
  return STORAGE_SRCSET_WIDTHS.map((w) => `${supabaseRenderUrl(src, w)} ${w}w`).join(", ");
}

function unsplashSrcSet(src: string): string | undefined {
  if (!src.includes("images.unsplash.com")) return undefined;
  return STORAGE_SRCSET_WIDTHS.map((w) => {
    const u = new URL(src);
    u.searchParams.set("w", String(w));
    u.searchParams.set("q", "70");
    u.searchParams.set("auto", "format");
    return `${u.toString()} ${w}w`;
  }).join(", ");
}

/** srcset for whichever host the image lives on, or undefined for neither. */
export function responsiveSrcSet(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return unsplashSrcSet(src) ?? supabaseSrcSet(src);
}

/**
 * Downscale to ~1400px max edge and re-encode as WebP q0.82 on a canvas; keep
 * whichever of original / webp is smaller. Falls back to the original file on
 * any failure. Call in EVERY admin upload handler before `.upload(...)`.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", 0.82),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export const IMMUTABLE_CACHE_CONTROL = "31536000";
