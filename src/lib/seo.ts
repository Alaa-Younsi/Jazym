/**
 * Production origin. Keep in sync with the placeholder in index.html,
 * middleware.ts, scripts/generate-sitemap.mjs, public/robots.txt. Grep
 * `PLACEHOLDER-DOMAIN.tld` before go-live — it lives in ~6 files.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://PLACEHOLDER-DOMAIN.tld").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "Jazym";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function canonicalUrl(pathname: string): string {
  return `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;
}
