/**
 * Production origin. VITE_SITE_URL wins; the fallback is the live domain.
 * Keep it in sync with middleware.ts and scripts/generate-sitemap.mjs.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://jazym.shop").replace(/\/$/, "");

export const SITE_NAME = "Jazym";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function canonicalUrl(pathname: string): string {
  return `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;
}
