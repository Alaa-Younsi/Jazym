import type { ProductColor, ProductSize, QuantityOffer, VariantGroup } from "@/types/db";
import { supabase } from "./supabase";
import { slugify } from "./utils";

/** Fall back to a base word when slugify() returns "" (Arabic-only title),
    probe the table, suffix -2, -3… until free. Skill Phase 8. */
export async function uniqueSlug(
  name: string,
  currentId: string | undefined,
  fallback = "produit",
): Promise<string> {
  const base = slugify(name) || fallback;
  let candidate = base;
  let n = 2;
  // Cap the probe loop.
  for (let i = 0; i < 50; i += 1) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) return candidate; // fail open — the unique constraint still guards
    if (!data || (currentId && (data as { id: string }).id === currentId)) {
      return candidate;
    }
    candidate = `${base}-${n}`;
    n += 1;
  }
  return `${base}-${Date.now()}`;
}

export function sanitizeVariantGroups(groups: VariantGroup[]): VariantGroup[] {
  return groups
    .map((g) => ({
      name_fr: g.name_fr.trim(),
      name_ar: (g.name_ar || g.name_fr).trim(),
      before_price_variant: !!g.before_price_variant,
      values: g.values
        .map((v) => ({
          value_fr: v.value_fr.trim(),
          value_ar: (v.value_ar || v.value_fr).trim(),
          image_url: v.image_url || null,
          swatch_hex: v.swatch_hex || null,
          // A value needs at most one of these — text wins if both were set.
          requires_text: !!v.requires_text,
          requires_upload: !v.requires_text && !!v.requires_upload,
        }))
        .filter((v) => v.value_fr.length > 0),
    }))
    .filter((g) => g.name_fr.length > 0 && g.values.length > 0);
}

export function sanitizeColors(colors: ProductColor[]): ProductColor[] {
  return colors
    .map((c) => ({
      label_fr: c.label_fr.trim(),
      label_ar: (c.label_ar || c.label_fr).trim(),
      hex: c.hex || "#000000",
      image_url: c.image_url || null,
    }))
    .filter((c) => c.label_fr.length > 0);
}

export function sanitizeSizes(sizes: ProductSize[]): ProductSize[] {
  return sizes
    .map((s) => ({ label_fr: s.label_fr.trim(), label_ar: (s.label_ar || s.label_fr).trim() }))
    .filter((s) => s.label_fr.length > 0);
}

export function sanitizeOffers(offers: QuantityOffer[]): QuantityOffer[] {
  return offers
    .map((o): QuantityOffer | null => {
      if (o.type === "free") {
        const buy = Math.max(0, Math.floor(Number(o.buy) || 0));
        const get = Math.max(0, Math.floor(Number(o.get) || 0));
        if (buy <= 0 || get <= 0) return null;
        return { type: "free", buy, get };
      }
      const qty = Math.max(0, Math.floor(Number(o.qty) || 0));
      const price = Math.max(0, Number(o.price) || 0);
      if (qty <= 1 || price <= 0) return null;
      return { type: "price", qty, price };
    })
    .filter((o): o is QuantityOffer => o !== null);
}

export function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
