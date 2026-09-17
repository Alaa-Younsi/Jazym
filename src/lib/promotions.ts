import type { Lang } from "@/i18n/translations";
import type { Category, Promotion } from "@/types/db";
import { lineTotal } from "@/lib/offers";

/**
 * Client-side MIRROR of `public.apply_promotions(jsonb)` (migration 0019).
 * Used for instant cart/checkout totals; the server re-prices every order and
 * its number is the one charged. CHANGE BOTH OR NEITHER.
 *
 * Resolution order — see the migration header for the same list:
 *   1. Packs consume cart quantities first, highest `priority` first.
 *   2. Whatever quantity is LEFT on a line takes the single BEST of the
 *      product's own `quantity_offers` and every eligible promotion.
 * Discounts never stack on the same unit.
 */

export interface QuoteLineInput {
  /** Stable identity used to read the per-line result back out. */
  key: string;
  productId: string;
  categoryId: string | null;
  unitPrice: number;
  quantity: number;
  quantityOffers: Parameters<typeof lineTotal>[2];
}

export interface QuoteLineResult {
  gross: number;
  discount: number;
  net: number;
}

export interface CartQuote {
  /** Gross goods total, before any discount. */
  subtotal: number;
  discount: number;
  /** Goods after discount — shipping is added on top, elsewhere. */
  total: number;
  lines: Record<string, QuoteLineResult>;
}

export const EMPTY_QUOTE: CartQuote = { subtotal: 0, discount: 0, total: 0, lines: {} };

/** Postgres `round(numeric, 2)` — half away from zero, not banker's rounding. */
function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(n) * 100 + Number.EPSILON)) / 100;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Mirrors `public.expand_categories` — a category always means its subtree. */
export function expandCategories(categories: Category[], ids: string[]): Set<string> {
  const picked = new Set(ids);
  const out = new Set<string>();
  for (const c of categories) if (picked.has(c.id)) out.add(c.id);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (!out.has(c.id) && c.parent_id && out.has(c.parent_id)) {
        out.add(c.id);
        grew = true;
      }
    }
  }
  return out;
}

export function isPromotionLive(promo: Promotion, now: number): boolean {
  if (!promo.active) return false;
  if (promo.starts_at && Date.parse(promo.starts_at) > now) return false;
  if (promo.ends_at && Date.parse(promo.ends_at) < now) return false;
  return true;
}

function byPriority(a: Promotion, b: Promotion): number {
  if (a.priority !== b.priority) return b.priority - a.priority;
  return a.created_at.localeCompare(b.created_at);
}

/** Does this promotion apply to a product sitting in `categoryId`? */
function matchesLine(
  promo: Promotion,
  productId: string,
  categoryId: string | null,
  catSet: Set<string>,
): boolean {
  if (promo.type === "category_percent") return categoryId != null && catSet.has(categoryId);
  if (promo.scope === "all") return true;
  if (promo.scope === "products") return promo.product_ids.includes(productId);
  if (promo.scope === "categories") return categoryId != null && catSet.has(categoryId);
  return false;
}

export function quoteCart(
  lines: QuoteLineInput[],
  promotions: Promotion[],
  categories: Category[],
  nowMs: number = Date.now(),
): CartQuote {
  if (lines.length === 0) return EMPTY_QUOTE;

  const n = lines.length;
  const qty = lines.map((l) => Math.max(0, Math.floor(safe(l.quantity))));
  const price = lines.map((l) => Math.max(0, safe(l.unitPrice)));
  const remain = [...qty];
  const lineDisc = new Array<number>(n).fill(0);

  let subtotal = 0;
  for (let i = 0; i < n; i++) subtotal += qty[i] * price[i];
  let discount = 0;

  const live = promotions.filter((p) => isPromotionLive(p, nowMs)).sort(byPriority);

  // 1. Packs consume quantities first ---------------------------------------
  for (const promo of live) {
    if (promo.type !== "pack") continue;
    if (promo.pack_price == null || promo.pack_items.length === 0) continue;

    let times = Number.POSITIVE_INFINITY;
    for (const item of promo.pack_items) {
      const need = Math.max(1, Math.floor(safe(item.quantity)));
      let have = 0;
      for (let i = 0; i < n; i++) if (lines[i].productId === item.product_id) have += remain[i];
      times = Math.min(times, Math.floor(have / need));
    }
    if (!Number.isFinite(times) || times <= 0) continue;
    times = Math.min(times, 20);

    const packGross = new Array<number>(n).fill(0);
    let gross = 0;
    for (const item of promo.pack_items) {
      let need = Math.max(1, Math.floor(safe(item.quantity))) * times;
      for (let i = 0; i < n && need > 0; i++) {
        if (lines[i].productId !== item.product_id || remain[i] <= 0) continue;
        const take = Math.min(remain[i], need);
        remain[i] -= take;
        packGross[i] += take * price[i];
        gross += take * price[i];
        need -= take;
      }
    }

    const packDisc = Math.max(0, gross - promo.pack_price * times);
    discount += packDisc;
    if (gross > 0 && packDisc > 0) {
      for (let i = 0; i < n; i++) lineDisc[i] += packDisc * (packGross[i] / gross);
    }
  }

  // 2. Best single offer on whatever quantity is left ------------------------
  const best = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    best[i] = lineTotal(price[i], remain[i], lines[i].quantityOffers);
  }

  for (const promo of live) {
    if (promo.type === "pack") continue;
    const catSet =
      promo.type === "category_percent" || promo.scope === "categories"
        ? expandCategories(categories, promo.category_ids)
        : new Set<string>();

    for (let i = 0; i < n; i++) {
      if (remain[i] <= 0) continue;
      if (!matchesLine(promo, lines[i].productId, lines[i].categoryId, catSet)) continue;

      const base = remain[i] * price[i];
      let cand = base;

      if (promo.type === "buy_x_get_y") {
        const group = promo.buy_qty + promo.get_qty;
        if (group > 0 && promo.get_qty > 0) {
          const free = Math.floor(remain[i] / group) * promo.get_qty;
          cand = (remain[i] - free) * price[i];
        }
      } else if (promo.type === "buy_x_percent") {
        if (promo.percent > 0 && remain[i] >= Math.max(1, promo.buy_qty)) {
          cand = base * (1 - promo.percent / 100);
        }
      } else if (promo.type === "category_percent") {
        if (promo.percent > 0) cand = base * (1 - promo.percent / 100);
      }

      if (cand < best[i]) best[i] = cand;
    }
  }

  for (let i = 0; i < n; i++) {
    if (remain[i] <= 0) continue;
    const delta = remain[i] * price[i] - best[i];
    discount += delta;
    lineDisc[i] += delta;
  }

  subtotal = round2(subtotal);
  discount = round2(Math.min(discount, subtotal));

  const out: Record<string, QuoteLineResult> = {};
  for (let i = 0; i < n; i++) {
    const gross = round2(qty[i] * price[i]);
    const d = round2(lineDisc[i]);
    out[lines[i].key] = { gross, discount: d, net: round2(gross - d) };
  }

  return { subtotal, discount, total: round2(subtotal - discount), lines: out };
}

/* -------------------------------------------------------------------------
   Customer-facing labels. A promotion always renders from its own label when
   the admin wrote one; otherwise we generate the sentence from its numbers.
   ------------------------------------------------------------------------- */

export function promotionLabel(promo: Promotion, lang: Lang): string {
  const custom = lang === "ar" ? promo.label_ar : promo.label_fr;
  if (custom?.trim()) return custom.trim();

  const pct = formatPercent(promo.percent);
  switch (promo.type) {
    case "buy_x_get_y":
      return lang === "ar"
        ? `اشترِ ${promo.buy_qty} واحصل على ${promo.get_qty} مجانًا`
        : `Achetez ${promo.buy_qty}, ${promo.get_qty} offert${promo.get_qty > 1 ? "s" : ""}`;
    case "buy_x_percent":
      return lang === "ar"
        ? `اشترِ ${promo.buy_qty} واحصل على ${pct}٪ تخفيض`
        : `${promo.buy_qty} achetés = −${pct}%`;
    case "category_percent":
      return lang === "ar" ? `${pct}٪ تخفيض` : `−${pct}%`;
    case "pack":
      return lang === "ar" ? "عرض الباقة" : "Offre pack";
  }
}

function formatPercent(percent: number): string {
  const rounded = round2(percent);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

/** Live promotions that apply to one product — for the badge on a product card. */
export function promotionsForProduct(
  promotions: Promotion[],
  categories: Category[],
  productId: string,
  categoryId: string | null,
  nowMs: number = Date.now(),
): Promotion[] {
  return promotions
    .filter((p) => isPromotionLive(p, nowMs))
    .filter((p) => {
      if (p.type === "pack") return p.pack_items.some((i) => i.product_id === productId);
      const catSet =
        p.type === "category_percent" || p.scope === "categories"
          ? expandCategories(categories, p.category_ids)
          : new Set<string>();
      return matchesLine(p, productId, categoryId, catSet);
    })
    .sort(byPriority);
}
