import type { QuantityOffer } from "@/types/db";

/**
 * Client-side MIRROR of the quantity-offer pricing done authoritatively in the
 * `place_order` RPC (skill Phase 5, step 4). Used ONLY for optimistic cart /
 * checkout totals. If the offer math changes here, change it in the RPC too.
 *
 * For each line: start from `price * qty`, compute a candidate per offer, keep
 * the cheapest.
 *   - "free":  every full group of (buy + get) units contains `get` free units.
 *   - "price": floor(qty / qty) * price + (qty % qty) * unitPrice.
 */
export function lineTotal(
  unitPrice: number,
  qty: number,
  offers: QuantityOffer[] | null | undefined,
): number {
  const base = safe(unitPrice) * safe(qty);
  if (!offers || offers.length === 0) return base;

  let best = base;
  for (const offer of offers) {
    if (offer.type === "free") {
      const buy = Math.max(0, Math.floor(safe(offer.buy)));
      const get = Math.max(0, Math.floor(safe(offer.get)));
      const group = buy + get;
      if (group <= 0 || get <= 0) continue;
      const freeUnits = Math.floor(safe(qty) / group) * get;
      const paidUnits = Math.max(0, safe(qty) - freeUnits);
      best = Math.min(best, paidUnits * safe(unitPrice));
    } else if (offer.type === "price") {
      const bundleQty = Math.max(0, Math.floor(safe(offer.qty)));
      const bundlePrice = Math.max(0, safe(offer.price));
      // > 1, not > 0 — a "bundle of 1" is just a price override and the SQL
      // engine ignores it. Accepting it here would quote a total the server
      // never charges.
      if (bundleQty <= 1 || bundlePrice <= 0) continue;
      const bundles = Math.floor(safe(qty) / bundleQty);
      const remainder = safe(qty) % bundleQty;
      best = Math.min(best, bundles * bundlePrice + remainder * safe(unitPrice));
    }
  }
  return best;
}

export function lineDiscount(
  unitPrice: number,
  qty: number,
  offers: QuantityOffer[] | null | undefined,
): number {
  const base = safe(unitPrice) * safe(qty);
  return Math.max(0, base - lineTotal(unitPrice, qty, offers));
}

/** Short human label for an offer, FR/AR. */
export function offerLabel(offer: QuantityOffer, lang: "fr" | "ar"): string {
  if (offer.type === "free") {
    return lang === "ar"
      ? `اشترِ ${offer.buy} واحصل على ${offer.get} مجانًا`
      : `Achetez ${offer.buy}, ${offer.get} offert${offer.get > 1 ? "s" : ""}`;
  }
  return lang === "ar"
    ? `${offer.qty} مقابل ${Math.round(offer.price)} دج`
    : `${offer.qty} pour ${Math.round(offer.price)} DA`;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}
