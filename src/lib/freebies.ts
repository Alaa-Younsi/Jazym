import type { PanelFile } from "@/types/db";

/**
 * Free downloadable samples attached to a promo panel (migration 0029).
 * Shared by the storefront download strip and the admin editor.
 */

/** Matches the `freebies` bucket's own file_size_limit — a file that passes
    here is never rejected again by the Storage API. */
export const MAX_FREEBIE_BYTES = 25 * 1024 * 1024;
/** Above this we still allow it, but the admin form says what it will cost. */
export const WARN_FREEBIE_BYTES = 8 * 1024 * 1024;
/** Mirrors the bucket's allowed_mime_types; keep the two in step. */
export const FREEBIE_ACCEPT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

export type FreebieKind = "pdf" | "image" | "video" | "archive" | "doc";

export function freebieKind(mime: string | null | undefined): FreebieKind {
  const m = (mime ?? "").toLowerCase();
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.includes("zip")) return "archive";
  return "doc";
}

/** Strip anything that would break a Content-Disposition filename. */
function safeFilename(name: string, url: string): string {
  const ext = url.split("?")[0].split(".").pop() ?? "";
  const base = name
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N} ._-]/gu, "")
    .trim()
    .slice(0, 80);
  const stem = base || "fichier";
  return ext && !stem.toLowerCase().endsWith(`.${ext.toLowerCase()}`) ? `${stem}.${ext}` : stem;
}

/**
 * A URL the browser will DOWNLOAD rather than display.
 *
 * The `download` attribute on an `<a>` is ignored cross-origin, and storage
 * lives on a different origin from the site — so without this a PDF opens in
 * a tab and an image just displays, and the "free download" does nothing a
 * visitor recognises. Supabase Storage honours a `?download=<filename>` query
 * parameter by sending `Content-Disposition: attachment`, which is what makes
 * it behave, and it also names the saved file after the admin's label instead
 * of the uuid it was stored under.
 */
export function freebieDownloadUrl(file: PanelFile, label: string): string {
  const sep = file.url.includes("?") ? "&" : "?";
  return `${file.url}${sep}download=${encodeURIComponent(safeFilename(label, file.url))}`;
}
