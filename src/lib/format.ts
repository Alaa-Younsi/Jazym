import type { Lang } from "@/i18n/translations";
import type { CartVariantPick } from "@/types/db";

/**
 * DZD formatting — "12 500 DA" style (narrow no-break space thousands
 * separator, "DA" suffix). Cash-on-delivery only, no gateway.
 *
 * NEVER render the raw output directly in JSX — always go through <Price/>,
 * which wraps it in dir="ltr". Under an RTL layout a bare "4 500 DA" gets
 * visually reordered to "DA 500 4" by the Unicode bidi algorithm. See skill
 * Phase 4.
 */
export function formatPrice(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(safe);
  const grouped = rounded.toLocaleString("fr-FR").replace(/ | /g, " ");
  return `${grouped} DA`;
}

export function formatNumber(value: number, lang: Lang): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString(lang === "ar" ? "ar-DZ" : "fr-FR");
}

export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang === "ar" ? "ar-DZ" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Render a shopper's custom-variant picks as one muted line, FR/AR aware.
 * Tolerates the pre-upgrade `{ name_fr, name_ar, value }` shape as well as the
 * current `{ ..., value_fr, value_ar }`. Never re-implement this join per site.
 */
export function variantSummary(picks: CartVariantPick[] | null | undefined, lang: Lang): string {
  if (!picks || picks.length === 0) return "";
  return picks
    .map((p) => {
      const name = lang === "ar" ? p.name_ar || p.name_fr : p.name_fr;
      const legacyValue = (p as { value?: string }).value;
      const value =
        lang === "ar"
          ? p.value_ar || p.value_fr || legacyValue || ""
          : p.value_fr || legacyValue || p.value_ar || "";
      if (!name || !value) return "";
      const label = p.custom_text ? `${value} (${p.custom_text})` : value;
      return `${name}: ${label}`;
    })
    .filter(Boolean)
    .join(" · ");
}
