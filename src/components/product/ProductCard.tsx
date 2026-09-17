import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Price } from "@/components/ui/Price";
import { SmartImage } from "@/components/ui/SmartImage";
import { useI18n } from "@/i18n/LanguageProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";
import { useCart } from "@/store/cart";
import type { Product } from "@/types/db";
import { ProductThumb } from "./ProductThumb";

interface ProductCardProps {
  product: Product;
  eager?: boolean;
}

export function ProductCard({ product, eager }: ProductCardProps) {
  const { t, lang } = useI18n();
  const reduced = usePrefersReducedMotion();
  const addLine = useCart((s) => s.addLine);

  const name = lang === "ar" ? product.name_ar : product.name_fr;
  const images = product.product_images ?? [];
  const image = images[0]?.url ?? null;
  // Second photo, revealed on hover — the classic apparel-shop "show me the
  // other angle" move. Only when there genuinely is one.
  const hoverImage = images[1]?.url ?? null;
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price;
  const needsChoice =
    product.colors.length > 0 || product.sizes.length > 0 || product.variants.length > 0;
  const soldOut = product.stock <= 0;
  const priceRange = product.variants.length > 0 || onSale ? t("from") : null;

  return (
    <motion.article
      initial={reduced ? undefined : { y: 14 }}
      whileInView={reduced ? undefined : { y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col"
    >
      <Link
        to={`/produit/${product.slug}`}
        className="relative block overflow-hidden rounded-card border border-line bg-panel transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-lift"
      >
        <div className="fx-curl relative aspect-[4/5] w-full overflow-hidden">
          <ProductThumb
            src={image}
            name={name}
            eager={eager}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
            className={cn(
              "h-full w-full transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              hoverImage
                ? "group-hover:scale-[1.06] group-hover:opacity-0"
                : "group-hover:scale-[1.06]",
            )}
          />
          {hoverImage && (
            // The opacity/scale hover lives on this wrapper, not on SmartImage:
            // SmartImage owns its own opacity for the blur-up, and two
            // competing `opacity-*` utilities on one element resolve by
            // stylesheet order, not by class order.
            <span className="absolute inset-0 scale-105 opacity-0 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-100 group-hover:opacity-100">
              <SmartImage
                src={hoverImage}
                alt=""
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
                className="h-full w-full object-cover"
              />
            </span>
          )}
          {/* ink wash that rises as the card is hovered */}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col gap-1">
            {product.featured && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-semibold text-[#14131A]">
                {t("featuredTitle")}
              </span>
            )}
            {onSale && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                {t("promo")}
              </span>
            )}
          </div>
          {soldOut && (
            <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[0.65rem] font-semibold text-bg">
              {t("outOfStock")}
            </span>
          )}
        </div>

        {!needsChoice && !soldOut && (
          <button
            type="button"
            aria-label={t("productAddToCart")}
            onClick={(e) => {
              e.preventDefault();
              addLine({
                product,
                unitPrice: product.price,
                quantity: 1,
                color: null,
                size: null,
                variants: [],
                image_url: image,
              });
            }}
            className={cn(
              "absolute bottom-3 end-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-soft transition",
              "opacity-100 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100",
            )}
          >
            <Plus size={18} />
          </button>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        {product.category && (
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-brand">
            {lang === "ar" ? product.category.name_ar : product.category.name_fr}
          </span>
        )}
        <Link
          to={`/produit/${product.slug}`}
          className="text-[0.95rem] font-medium leading-snug text-ink transition hover:text-brand"
        >
          {name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          {priceRange && <span className="text-xs text-muted">{priceRange}</span>}
          <Price value={product.price} className="text-sm font-semibold text-ink" />
          {onSale && product.compare_at_price != null && (
            <Price value={product.compare_at_price} className="text-xs text-muted line-through" />
          )}
        </div>
      </div>
    </motion.article>
  );
}
