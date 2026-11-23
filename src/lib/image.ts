/* Image pipeline — TWO independent fixes, both required (skill Phase 9.5).
   1. compressImage(): shrink what gets STORED (call before every admin upload).
   2. responsiveSrcSet(): shrink what gets SENT (the egress fix — matters more). */

const SUPABASE_PUBLIC_MARKER = "/storage/v1/object/public/";
const SUPABASE_RENDER_MARKER = "/storage/v1/render/image/public/";
const STORAGE_SRCSET_WIDTHS = [200, 400, 600, 900, 1400];
// 85, not 70: at 70 the resized card/thumbnail copies looked soft next to the
// originals now kept at upload.
const STORAGE_QUALITY = 85;

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

/** Files at or under this size and edge are uploaded byte-for-byte untouched. */
const KEEP_ORIGINAL_MAX_BYTES = 4 * 1024 * 1024;
const KEEP_ORIGINAL_MAX_EDGE = 3000;
/** Only oversized originals (phone camera shots) are re-encoded, and then
    gently: a long edge of 2560px at WebP q0.92 is visually lossless. */
const HQ_MAX_EDGE = 2560;
const HQ_QUALITY = 0.92;
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Admin uploads keep their ORIGINAL quality (client request, 2026-11-23: the
 * old 1400px / q0.82 re-encode visibly softened product photos). A normal
 * product photo (the client delivers 1080x1350) is uploaded exactly as is.
 * Only a file that is genuinely oversized — over 4 MB or 3000px — is
 * downscaled to 2560px at q0.92, so it still fits the 10 MB bucket limit.
 * Falls back to the original file on any failure.
 * Egress stays under control on the delivery side: cards and thumbnails get
 * a resized srcset (responsiveSrcSet); only the product-page photo is served
 * at full resolution.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);
    if (
      PASSTHROUGH_TYPES.has(file.type) &&
      file.size <= KEEP_ORIGINAL_MAX_BYTES &&
      longEdge <= KEEP_ORIGINAL_MAX_EDGE
    ) {
      bitmap.close?.();
      return file;
    }
    const scale = Math.min(1, HQ_MAX_EDGE / longEdge);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", HQ_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export const IMMUTABLE_CACHE_CONTROL = "31536000";
