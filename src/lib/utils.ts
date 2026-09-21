import type { Lang } from "@/i18n/translations";

/** Latin slug; returns "" for scripts with no Latin transliteration (Arabic). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * PostgREST `.or()` filter-grammar injection guard. Strip reserved chars, escape
 * ILIKE wildcards, cap length. See skill Phase 6 (Shop search).
 */
export function sanitizeSearchTerm(term: string): string {
  // Truncate BEFORE escaping: slicing afterwards can cut an escape sequence in
  // half and ship a dangling backslash to PostgREST.
  return term
    .trim()
    .slice(0, 100)
    .replace(/[,()]/g, "")
    .replace(/[\\%_]/g, "\\$&");
}

/** Pick a `${base}_fr` / `${base}_ar` field off a row, FR-fallback. */
export function pick(lang: Lang, row: object, base: string): string {
  const record = row as Record<string, unknown>;
  const value = record[`${base}_${lang}`] ?? record[`${base}_fr`];
  return typeof value === "string" ? value : "";
}

/** DZ mobile `0xxxxxxxxxx` → E.164 `+213xxxxxxxxx` for wa.me / tel: links. */
export function toIntlPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("213")) return `+${digits}`;
  if (digits.startsWith("0")) return `+213${digits.slice(1)}`;
  return `+213${digits}`;
}

export const DZ_PHONE_RE = /^0[5-7][0-9]{8}$/;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Stable, order-independent identity key for a cart line's custom picks. */
export function variantPickKey(
  picks: { name_fr: string; value_fr?: string; value?: string }[],
): string {
  return picks
    .map((p) => `${p.name_fr}:${p.value_fr ?? p.value ?? ""}`)
    .sort()
    .join("|");
}

/**
 * Admin-supplied link guard. A panel `link_url` or a landing-page CTA `href`
 * is typed by staff and rendered straight into an `<a href>`; without this a
 * worker holding only the `panels` (or `landing`) section could store a
 * `javascript:` URL and run script in the owner's session. Allows a
 * same-site path, a hash/query target, http(s), and tel:/mailto:.
 */
export function safeLinkHref(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^[/#?]/.test(value)) return value;
  try {
    const { protocol } = new URL(value);
    return ["http:", "https:", "tel:", "mailto:"].includes(protocol) ? value : null;
  } catch {
    // Not an absolute URL and not a path — a bare "example.com" or worse.
    return null;
  }
}
