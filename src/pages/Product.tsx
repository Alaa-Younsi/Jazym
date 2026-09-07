import { Check, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { InlineCheckout } from "@/components/checkout/InlineCheckout";
import { Gallery, type GalleryImage } from "@/components/product/Gallery";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { usePixel } from "@/components/TrackingProvider";
import { useProduct, useRelatedProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { offerLabel } from "@/lib/offers";
import { SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/cn";
import { useCart } from "@/store/cart";
import type { CartVariantPick } from "@/types/db";

export default function Product() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const { track, setContext } = usePixel();
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: related = [] } = useRelatedProducts(product);
  const addLine = useCart((s) => s.addLine);

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [variantPicks, setVariantPicks] = useState<Record<string, string>>({});
  const [showGate, setShowGate] = useState(false);
  const [added, setAdded] = useState(false);
  const viewedRef = useRef<string | null>(null);

  const name = product ? (lang === "ar" ? product.name_ar : product.name_fr) : "";
  const description = product
    ? lang === "ar"
      ? product.description_ar
      : product.description_fr
    : null;
  const details = product ? (lang === "ar" ? product.details_ar : product.details_fr) : [];

  useSeo({
    title: name || t("shopTitle"),
    description: description ?? t("brandTaglineLong"),
    image: product?.product_images?.[0]?.url ?? null,
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: description ?? undefined,
          image: (product.product_images ?? []).map((i) => i.url),
          sku: product.style_code ?? product.slug,
          offers: {
            "@type": "Offer",
            priceCurrency: "DZD",
            price: product.price,
            availability:
              product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/produit/${product.slug}`,
          },
        }
      : null,
  });

  useEffect(() => {
    if (!product) return;
    setContext({ productSlug: product.slug });
    if (viewedRef.current === product.id) return;
    viewedRef.current = product.id;
    track("view_content", {
      content_ids: [product.id],
      content_type: "product",
      content_name: product.name_fr,
      value: product.price,
      currency: "DZD",
    });
  }, [product, track, setContext]);

  const galleryImages = useMemo<GalleryImage[]>(() => {
    if (!product) return [];
    const base = (product.product_images ?? []).map((img) => ({
      key: img.id,
      url: img.url,
      alt: img.alt ?? undefined,
    }));
    const seen = new Set(base.map((g) => g.url));
    const extra: GalleryImage[] = [];
    for (const c of product.colors) {
      if (c.image_url && !seen.has(c.image_url)) {
        seen.add(c.image_url);
        extra.push({ key: `color-${c.hex}`, url: c.image_url, alt: c.label_fr });
      }
    }
    for (const group of product.variants) {
      for (const opt of group.values) {
        if (opt.image_url && !seen.has(opt.image_url)) {
          seen.add(opt.image_url);
          extra.push({ key: `opt-${group.name_fr}-${opt.value_fr}`, url: opt.image_url });
        }
      }
    }
    return [...base, ...extra];
  }, [product]);

  if (isLoading) return <PageLoader />;
  if (!product || isError) return <Navigate to="/boutique" replace />;

  const needsColor = product.colors.length > 0 && !color;
  const needsSize = product.sizes.length > 0 && !size;
  const missingGroups = product.variants.filter((g) => !variantPicks[g.name_fr]);
  const selectionComplete = !needsColor && !needsSize && missingGroups.length === 0;
  const soldOut = product.stock <= 0;
  const maxQty = Math.max(1, Math.min(product.stock || 20, 20));

  const picks: CartVariantPick[] = product.variants
    .filter((g) => variantPicks[g.name_fr])
    .map((g) => {
      const opt = g.values.find((v) => v.value_fr === variantPicks[g.name_fr]);
      return {
        name_fr: g.name_fr,
        name_ar: g.name_ar,
        value_fr: opt?.value_fr ?? variantPicks[g.name_fr],
        value_ar: opt?.value_ar ?? variantPicks[g.name_fr],
      };
    });

  const onSale = product.compare_at_price != null && product.compare_at_price > product.price;
  const image0 = product.product_images?.[0]?.url ?? null;

  const swapToImage = (url: string | null | undefined) => {
    if (!url) return;
    const idx = galleryImages.findIndex((g) => g.url === url);
    if (idx >= 0) setActiveImage(idx);
  };

  const handleAddToCart = () => {
    if (!selectionComplete) {
      setShowGate(true);
      return;
    }
    addLine({
      product,
      unitPrice: product.price,
      quantity: qty,
      color,
      size,
      variants: picks,
      image_url: image0,
    });
    setAdded(true);
    track("add_to_cart", {
      content_ids: [product.id],
      content_type: "product",
      value: product.price * qty,
      currency: "DZD",
      num_items: qty,
    });
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Container className="py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link to="/boutique" className="hover:text-brand">
          {t("navShop")}
        </Link>
        {product.category && (
          <>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <Link to={`/boutique/${product.category.slug}`} className="hover:text-brand">
              {lang === "ar" ? product.category.name_ar : product.category.name_fr}
            </Link>
          </>
        )}
        <ChevronRight size={12} className="rtl:rotate-180" />
        <span className="text-ink">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Gallery
            images={galleryImages}
            activeIndex={activeImage}
            onActiveChange={setActiveImage}
            placeholderName={name}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            {product.category && (
              <span className="text-xs font-medium uppercase tracking-wider text-brand">
                {lang === "ar" ? product.category.name_ar : product.category.name_fr}
              </span>
            )}
            <h1 className="fx-display mt-1 text-3xl text-ink sm:text-4xl">{name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <Price value={product.price} className="text-2xl font-semibold text-ink" />
              {onSale && product.compare_at_price != null && (
                <Price
                  value={product.compare_at_price}
                  className="text-base text-muted line-through"
                />
              )}
              {product.style_code && (
                <span className="ms-auto text-xs text-muted">
                  {t("productReference")} {product.style_code}
                </span>
              )}
            </div>
          </div>

          {product.quantity_offers.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {product.quantity_offers.map((offer, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-ink"
                >
                  <FlowerMark className="h-3.5 w-3.5 text-gold" />
                  {offerLabel(offer, lang)}
                </li>
              ))}
            </ul>
          )}

          {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}

          {/* colours */}
          {product.colors.length > 0 && (
            <Picker label={t("productChooseColor")} required invalid={showGate && needsColor}>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const label = lang === "ar" ? c.label_ar : c.label_fr;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setColor(label);
                        swapToImage(c.image_url);
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                        color === label
                          ? "border-brand ring-2 ring-brand/30"
                          : "border-line hover:border-brand/50",
                      )}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-line"
                        style={{ backgroundColor: c.hex }}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Picker>
          )}

          {/* sizes */}
          {product.sizes.length > 0 && (
            <Picker label={t("productChooseSize")} required invalid={showGate && needsSize}>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const label = lang === "ar" ? s.label_ar : s.label_fr;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSize(label)}
                      className={cn(
                        "min-w-11 rounded-lg border px-3 py-1.5 text-sm transition",
                        size === label
                          ? "border-brand ring-2 ring-brand/30"
                          : "border-line hover:border-brand/50",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Picker>
          )}

          {/* custom variant groups */}
          {product.variants.map((group) => {
            const invalid = showGate && !variantPicks[group.name_fr];
            return (
              <Picker
                key={group.name_fr}
                label={lang === "ar" ? group.name_ar : group.name_fr}
                required
                invalid={invalid}
              >
                <div className="flex flex-wrap gap-2">
                  {group.values.map((opt) => {
                    const label = lang === "ar" ? opt.value_ar : opt.value_fr;
                    const picked = variantPicks[group.name_fr] === opt.value_fr;
                    return (
                      <button
                        key={opt.value_fr}
                        type="button"
                        onClick={() => {
                          setVariantPicks((prev) => ({
                            ...prev,
                            [group.name_fr]: opt.value_fr,
                          }));
                          swapToImage(opt.image_url);
                        }}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition",
                          picked
                            ? "border-brand ring-2 ring-brand/30"
                            : "border-line hover:border-brand/50",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Picker>
            );
          })}

          {showGate && !selectionComplete && (
            <p className="rounded-lg bg-brand-soft/50 px-3 py-2 text-sm text-brand">
              {t("productSelectionRequired")}
            </p>
          )}

          {/* qty + add to cart */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-line">
              <button
                type="button"
                aria-label="-"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-11 w-11 place-items-center text-muted hover:text-ink"
              >
                <Minus size={15} />
              </button>
              <span className="num-ltr w-10 text-center text-sm">{qty}</span>
              <button
                type="button"
                aria-label="+"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="grid h-11 w-11 place-items-center text-muted hover:text-ink disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              size="lg"
              variant="secondary"
              disabled={soldOut}
              className="flex-1"
            >
              {added ? (
                <>
                  <Check size={16} /> {t("productAdded")}
                </>
              ) : soldOut ? (
                t("outOfStock")
              ) : (
                t("productAddToCart")
              )}
            </Button>
          </div>

          {details.length > 0 && (
            <div className="rounded-card border border-line bg-panel p-5">
              <h2 className="text-sm font-semibold text-ink">{t("productDetails")}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <FlowerMark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.video_url && (
            <video
              controls
              preload="none"
              poster={image0 ?? undefined}
              className="w-full rounded-card border border-line"
              aria-label={t("productVideo")}
            >
              <source src={product.video_url} />
            </video>
          )}

          {!soldOut && (
            <InlineCheckout
              product={product}
              unitPrice={product.price}
              color={color}
              size={size}
              variants={picks}
              image_url={image0}
              selectionComplete={selectionComplete}
              onBlockedSubmit={() => setShowGate(true)}
            />
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="fx-display text-2xl text-ink">{t("productRelated")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function Picker({
  label,
  required,
  invalid,
  children,
}: {
  label: string;
  required?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl", invalid && "-m-2 bg-danger/5 p-2 ring-1 ring-danger/40")}>
      <span className="mb-2 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ms-0.5 text-brand">*</span>}
      </span>
      {children}
    </div>
  );
}
