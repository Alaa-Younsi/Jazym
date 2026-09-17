import { useCategories } from "@/hooks/useCategories";
import { usePromotions } from "@/hooks/usePromotions";
import { useI18n } from "@/i18n/LanguageProvider";
import { offerLabel } from "@/lib/offers";
import { promotionLabel, promotionsForProduct } from "@/lib/promotions";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/db";

/**
 * Every offer that currently applies to a product, in one list: the product's
 * own quantity offers plus the live store promotions that reach it. Labels
 * only — the money is computed by the pricing engine, never from these strings.
 */
export function useProductOfferLabels(product: Product): string[] {
  const { lang } = useI18n();
  const { data: promotions = [] } = usePromotions();
  const { data: categories = [] } = useCategories();

  const own = product.quantity_offers.map((offer) => offerLabel(offer, lang));
  const store = promotionsForProduct(promotions, categories, product.id, product.category_id).map(
    (promo) => promotionLabel(promo, lang),
  );

  return [...new Set([...own, ...store])];
}

export function OfferBadges({ product, className }: { product: Product; className?: string }) {
  const labels = useProductOfferLabels(product);
  if (labels.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {labels.map((label) => (
        <li
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-ink"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

/** One-line badge for a product card — the first applicable offer only. */
export function OfferRibbon({ product }: { product: Product }) {
  const labels = useProductOfferLabels(product);
  if (labels.length === 0) return null;

  return (
    <span className="rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-semibold text-[#14131A]">
      {labels[0]}
    </span>
  );
}
