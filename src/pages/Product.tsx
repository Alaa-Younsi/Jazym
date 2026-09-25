import { Check, ChevronRight, ImagePlus, Loader2, Minus, Plus, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { InlineCheckout } from "@/components/checkout/InlineCheckout";
import { Gallery, type GalleryImage } from "@/components/product/Gallery";
import { OfferBadges } from "@/components/product/OfferBadges";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Field";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { usePixel } from "@/components/TrackingProvider";
import { useProduct, useRelatedProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { SITE_URL } from "@/lib/seo";
import { compressUntrustedImage, UntrustedImageError, uploadToBucket } from "@/lib/storage";
import { cn } from "@/lib/cn";
import { useCart } from "@/store/cart";
import type { CartVariantPick, ProductVariant, VariantGroup, VariantOption } from "@/types/db";
import type { TranslationKey } from "@/i18n/translations";

interface AxisOption {
  fr: string;
  ar: string;
}

function dedupeAxisValues(
  rows: ProductVariant[],
  valueKey: "option1_value_fr" | "option2_value_fr",
  valueArKey: "option1_value_ar" | "option2_value_ar",
): AxisOption[] {
  const seen = new Set<string>();
  const out: AxisOption[] = [];
  for (const row of rows) {
    const fr = row[valueKey];
    if (!fr || seen.has(fr)) continue;
    seen.add(fr);
    out.push({ fr, ar: row[valueArKey] ?? fr });
  }
  return out;
}

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
  const [optionPicks, setOptionPicks] = useState<{ option1?: string; option2?: string }>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [customUploads, setCustomUploads] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [showGate, setShowGate] = useState(false);
  // An image that only EXISTS once state has settled (a just-uploaded custom
  // cover). swapToImage runs against the gallery of the render it was called
  // in, where that url is not there yet, so the focus is deferred to the
  // effect below instead of silently doing nothing.
  const [pendingFocusUrl, setPendingFocusUrl] = useState<string | null>(null);
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
    for (const v of product.product_variants ?? []) {
      if (v.image_url && !seen.has(v.image_url)) {
        seen.add(v.image_url);
        extra.push({ key: `variant-${v.id}`, url: v.image_url });
      }
    }
    for (const [groupName, url] of Object.entries(customUploads)) {
      if (url && !seen.has(url)) {
        seen.add(url);
        extra.push({ key: `upload-${groupName}`, url });
      }
    }
    return [...base, ...extra];
  }, [product, customUploads]);

  useEffect(() => {
    if (!pendingFocusUrl) return;
    const idx = galleryImages.findIndex((g) => g.url === pendingFocusUrl);
    if (idx >= 0) setActiveImage(idx);
    setPendingFocusUrl(null);
  }, [pendingFocusUrl, galleryImages]);

  if (isLoading) return <PageLoader />;
  if (!product || isError) return <Navigate to="/boutique" replace />;

  const variantRows = product.product_variants ?? [];
  const hasVariantRows = variantRows.length > 0;
  const axis1Row = variantRows[0];
  const axis1Values = dedupeAxisValues(variantRows, "option1_value_fr", "option1_value_ar");
  const axis2Values = dedupeAxisValues(variantRows, "option2_value_fr", "option2_value_ar");
  const resolvedVariant = hasVariantRows
    ? (variantRows.find(
        (v) =>
          (v.option1_value_fr ?? undefined) === optionPicks.option1 &&
          (v.option2_value_fr ?? undefined) === optionPicks.option2,
      ) ?? null)
    : null;
  const needsVariant1 = hasVariantRows && !optionPicks.option1;
  const needsVariant2 = hasVariantRows && axis2Values.length > 0 && !optionPicks.option2;
  const comboSoldOut = hasVariantRows && !!resolvedVariant && resolvedVariant.stock <= 0;
  const isOption1InStock = (value: string) =>
    variantRows.some(
      (v) =>
        v.option1_value_fr === value &&
        v.stock > 0 &&
        (optionPicks.option2 === undefined ||
          (v.option2_value_fr ?? undefined) === optionPicks.option2),
    );
  const isOption2InStock = (value: string) =>
    variantRows.some(
      (v) =>
        v.option2_value_fr === value &&
        v.stock > 0 &&
        (optionPicks.option1 === undefined || v.option1_value_fr === optionPicks.option1),
    );

  const needsColor = product.colors.length > 0 && !color;
  const needsSize = product.sizes.length > 0 && !size;

  const groupIncomplete = (g: VariantGroup) => {
    const pickedValue = variantPicks[g.name_fr];
    // An optional group the shopper ignored is fine. Once they DO pick, the
    // value's own text/upload payload is required exactly as before — which
    // mirrors place_order's rule (migration 0027).
    if (!pickedValue) return !g.optional;
    const opt = g.values.find((v) => v.value_fr === pickedValue);
    if (opt?.requires_text && !customTexts[g.name_fr]?.trim()) return true;
    if (opt?.requires_upload && !customUploads[g.name_fr]) return true;
    return false;
  };
  const missingGroups = product.variants.filter(groupIncomplete);
  const groupsBeforePrice = product.variants.filter((g) => g.before_price_variant);
  const groupsAfterPrice = product.variants.filter((g) => !g.before_price_variant);

  const selectionComplete =
    !needsColor &&
    !needsSize &&
    missingGroups.length === 0 &&
    !needsVariant1 &&
    !needsVariant2 &&
    (!hasVariantRows || !!resolvedVariant);
  const effectivePrice = resolvedVariant?.price ?? product.price;
  const effectiveStock = hasVariantRows ? (resolvedVariant?.stock ?? 0) : product.stock;
  const allVariantsSoldOut = hasVariantRows && variantRows.every((v) => v.stock <= 0);
  const soldOut = hasVariantRows ? allVariantsSoldOut || comboSoldOut : product.stock <= 0;
  const maxQty = Math.max(1, Math.min(effectiveStock || 20, 20));
  // Switching to a thinner-stocked variant must not leave a quantity the cart
  // will silently clamp — show the real number the shopper is about to add.
  const effectiveQty = Math.min(qty, maxQty);

  const picks: CartVariantPick[] = product.variants
    .filter((g) => variantPicks[g.name_fr])
    .map((g) => {
      const opt = g.values.find((v) => v.value_fr === variantPicks[g.name_fr]);
      return {
        name_fr: g.name_fr,
        name_ar: g.name_ar,
        value_fr: opt?.value_fr ?? variantPicks[g.name_fr],
        value_ar: opt?.value_ar ?? variantPicks[g.name_fr],
        custom_text: opt?.requires_text ? customTexts[g.name_fr]?.trim() || undefined : undefined,
        custom_upload_url: opt?.requires_upload ? customUploads[g.name_fr] || undefined : undefined,
      };
    });

  const effectiveCompareAt = resolvedVariant
    ? resolvedVariant.compare_at_price
    : product.compare_at_price;
  const onSale = effectiveCompareAt != null && effectiveCompareAt > effectivePrice;
  const image0 = resolvedVariant?.image_url ?? product.product_images?.[0]?.url ?? null;

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
      unitPrice: effectivePrice,
      quantity: effectiveQty,
      color,
      size,
      variants: picks,
      image_url: image0,
      variantId: resolvedVariant?.id ?? null,
      stockOverride: hasVariantRows ? effectiveStock : undefined,
      note: note.trim() || null,
    });
    setAdded(true);
    track("add_to_cart", {
      content_ids: [product.id],
      content_type: "product",
      value: effectivePrice * effectiveQty,
      currency: "DZD",
      num_items: effectiveQty,
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
              <Price value={effectivePrice} className="text-2xl font-semibold text-ink" />
              {onSale && effectiveCompareAt != null && (
                <Price value={effectiveCompareAt} className="text-base text-muted line-through" />
              )}
              {product.style_code && (
                <span className="ms-auto text-xs text-muted">
                  {t("productReference")} {product.style_code}
                </span>
              )}
            </div>
          </div>

          <OfferBadges product={product} />

          {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}

          {/* custom variant groups pinned before the priced picker (e.g. theme, stage) */}
          {groupsBeforePrice.map((group) => (
            <VariantGroupPicker
              key={group.name_fr}
              group={group}
              picked={variantPicks[group.name_fr]}
              onClear={() => {
                setVariantPicks((prev) => {
                  const next = { ...prev };
                  delete next[group.name_fr];
                  return next;
                });
                setCustomTexts((prev) => ({ ...prev, [group.name_fr]: "" }));
                setCustomUploads((prev) => {
                  const next = { ...prev };
                  delete next[group.name_fr];
                  return next;
                });
              }}
              onPick={(opt) => {
                setVariantPicks((prev) => ({ ...prev, [group.name_fr]: opt.value_fr }));
                if (!opt.requires_text) {
                  setCustomTexts((prev) => ({ ...prev, [group.name_fr]: "" }));
                }
                if (!opt.requires_upload) {
                  setCustomUploads((prev) => {
                    const next = { ...prev };
                    delete next[group.name_fr];
                    return next;
                  });
                }
                swapToImage(opt.image_url);
              }}
              customText={customTexts[group.name_fr] ?? ""}
              onCustomText={(v) => setCustomTexts((prev) => ({ ...prev, [group.name_fr]: v }))}
              customUpload={customUploads[group.name_fr]}
              onCustomUpload={(url) => {
                setCustomUploads((prev) => ({ ...prev, [group.name_fr]: url }));
                setPendingFocusUrl(url);
              }}
              showGate={showGate}
              incomplete={groupIncomplete(group)}
            />
          ))}

          {/* priced/stocked variants (e.g. page-count options) */}
          {hasVariantRows && axis1Values.length > 0 && (
            <Picker
              label={
                lang === "ar"
                  ? (axis1Row?.option1_name_ar ?? axis1Row?.option1_name_fr ?? "")
                  : (axis1Row?.option1_name_fr ?? "")
              }
              required
              invalid={showGate && needsVariant1}
            >
              <div className="flex flex-wrap gap-2">
                {axis1Values.map((opt) => {
                  const picked = optionPicks.option1 === opt.fr;
                  const inStock = isOption1InStock(opt.fr);
                  return (
                    <button
                      key={opt.fr}
                      type="button"
                      disabled={!inStock}
                      onClick={() => {
                        setOptionPicks((prev) => ({ ...prev, option1: opt.fr }));
                        const match = variantRows.find(
                          (v) =>
                            v.option1_value_fr === opt.fr &&
                            (v.option2_value_fr ?? undefined) === optionPicks.option2,
                        );
                        swapToImage(match?.image_url);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                        picked
                          ? "border-brand ring-2 ring-brand/30"
                          : "border-line hover:border-brand/50",
                      )}
                    >
                      {lang === "ar" ? opt.ar : opt.fr}
                    </button>
                  );
                })}
              </div>
            </Picker>
          )}

          {hasVariantRows && axis2Values.length > 0 && (
            <Picker
              label={
                lang === "ar"
                  ? (axis1Row?.option2_name_ar ?? axis1Row?.option2_name_fr ?? "")
                  : (axis1Row?.option2_name_fr ?? "")
              }
              required
              invalid={showGate && needsVariant2}
            >
              <div className="flex flex-wrap gap-2">
                {axis2Values.map((opt) => {
                  const picked = optionPicks.option2 === opt.fr;
                  const inStock = isOption2InStock(opt.fr);
                  return (
                    <button
                      key={opt.fr}
                      type="button"
                      disabled={!inStock}
                      onClick={() => {
                        setOptionPicks((prev) => ({ ...prev, option2: opt.fr }));
                        const match = variantRows.find(
                          (v) =>
                            v.option2_value_fr === opt.fr &&
                            (v.option1_value_fr ?? undefined) === optionPicks.option1,
                        );
                        swapToImage(match?.image_url);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                        picked
                          ? "border-brand ring-2 ring-brand/30"
                          : "border-line hover:border-brand/50",
                      )}
                    >
                      {lang === "ar" ? opt.ar : opt.fr}
                    </button>
                  );
                })}
              </div>
            </Picker>
          )}

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

          {/* custom variant groups pinned after the priced picker (e.g. personalization) */}
          {groupsAfterPrice.map((group) => (
            <VariantGroupPicker
              key={group.name_fr}
              group={group}
              picked={variantPicks[group.name_fr]}
              onClear={() => {
                setVariantPicks((prev) => {
                  const next = { ...prev };
                  delete next[group.name_fr];
                  return next;
                });
                setCustomTexts((prev) => ({ ...prev, [group.name_fr]: "" }));
                setCustomUploads((prev) => {
                  const next = { ...prev };
                  delete next[group.name_fr];
                  return next;
                });
              }}
              onPick={(opt) => {
                setVariantPicks((prev) => ({ ...prev, [group.name_fr]: opt.value_fr }));
                if (!opt.requires_text) {
                  setCustomTexts((prev) => ({ ...prev, [group.name_fr]: "" }));
                }
                if (!opt.requires_upload) {
                  setCustomUploads((prev) => {
                    const next = { ...prev };
                    delete next[group.name_fr];
                    return next;
                  });
                }
                swapToImage(opt.image_url);
              }}
              customText={customTexts[group.name_fr] ?? ""}
              onCustomText={(v) => setCustomTexts((prev) => ({ ...prev, [group.name_fr]: v }))}
              customUpload={customUploads[group.name_fr]}
              onCustomUpload={(url) => {
                setCustomUploads((prev) => ({ ...prev, [group.name_fr]: url }));
                setPendingFocusUrl(url);
              }}
              showGate={showGate}
              incomplete={groupIncomplete(group)}
            />
          ))}

          {/* optional per-product note — never required */}
          <div>
            <span className="mb-2 block text-sm font-medium text-ink">{t("productNoteLabel")}</span>
            <Textarea
              rows={2}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("productNotePlaceholder")}
            />
          </div>

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
                onClick={() => setQty(Math.max(1, effectiveQty - 1))}
                className="grid h-11 w-11 place-items-center text-muted hover:text-ink"
              >
                <Minus size={15} />
              </button>
              <span className="num-ltr w-10 text-center text-sm">{effectiveQty}</span>
              <button
                type="button"
                aria-label="+"
                onClick={() => setQty(Math.min(maxQty, effectiveQty + 1))}
                disabled={effectiveQty >= maxQty}
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

          <VideoPlayer url={product.video_url} poster={image0} />

          {!soldOut && (
            <InlineCheckout
              product={product}
              unitPrice={effectivePrice}
              color={color}
              size={size}
              variants={picks}
              selectionComplete={selectionComplete}
              onBlockedSubmit={() => setShowGate(true)}
              variantId={resolvedVariant?.id ?? null}
              note={note.trim() || null}
              stock={hasVariantRows ? effectiveStock : undefined}
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

function VariantGroupPicker({
  group,
  picked,
  onPick,
  onClear,
  customText,
  onCustomText,
  customUpload,
  onCustomUpload,
  showGate,
  incomplete,
}: {
  group: VariantGroup;
  picked: string | undefined;
  onPick: (opt: VariantOption) => void;
  /** Un-tick an optional group — onPick can only ever set a value. */
  onClear: () => void;
  customText: string;
  onCustomText: (v: string) => void;
  customUpload: string | undefined;
  onCustomUpload: (url: string) => void;
  showGate: boolean;
  incomplete: boolean;
}) {
  const { t, lang } = useI18n();
  const pickedOption = group.values.find((v) => v.value_fr === picked);
  const label = lang === "ar" ? group.name_ar : group.name_fr;

  // A single-value optional group is an opt-in, not a choice between things —
  // a lone pill that toggles reads as a broken radio. Render it as a checkbox
  // and let the payload fields appear underneath once it is ticked.
  const asCheckbox = !!group.optional && group.values.length === 1;
  const only = group.values[0];

  if (asCheckbox && only) {
    const checked = picked === only.value_fr;
    return (
      <Picker label={label} invalid={showGate && incomplete}>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => (checked ? onClear() : onPick(only))}
            className="h-4 w-4 shrink-0 accent-[rgb(var(--c-brand))]"
          />
          {lang === "ar" ? only.value_ar : only.value_fr}
        </label>

        {checked && only.requires_text && (
          <input
            type="text"
            value={customText}
            onChange={(e) => onCustomText(e.target.value)}
            placeholder={t("productCustomTextPlaceholder")}
            maxLength={60}
            className={cn(
              "mt-2 h-10 w-full rounded-lg border bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted",
              showGate && !customText.trim() ? "border-danger" : "border-line focus:border-brand",
            )}
          />
        )}
        {checked && only.requires_upload && (
          <CustomCoverUpload
            value={customUpload}
            onChange={onCustomUpload}
            invalid={showGate && !customUpload}
          />
        )}
      </Picker>
    );
  }

  return (
    <Picker label={label} required invalid={showGate && incomplete}>
      <div className="flex flex-wrap gap-2">
        {group.values.map((opt) => {
          const optLabel = lang === "ar" ? opt.value_ar : opt.value_fr;
          const isPicked = picked === opt.value_fr;
          return (
            <button
              key={opt.value_fr}
              type="button"
              onClick={() => onPick(opt)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                isPicked
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-line hover:border-brand/50",
              )}
            >
              {opt.swatch_hex && (
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-line"
                  style={{ backgroundColor: opt.swatch_hex }}
                />
              )}
              {optLabel}
            </button>
          );
        })}
      </div>

      {pickedOption?.requires_text && (
        <input
          type="text"
          value={customText}
          onChange={(e) => onCustomText(e.target.value)}
          placeholder={t("productCustomTextPlaceholder")}
          maxLength={60}
          className={cn(
            "mt-2 h-10 w-full rounded-lg border bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted",
            showGate && !customText.trim() ? "border-danger" : "border-line focus:border-brand",
          )}
        />
      )}

      {pickedOption?.requires_upload && (
        <CustomCoverUpload
          value={customUpload}
          onChange={onCustomUpload}
          invalid={showGate && !customUpload}
        />
      )}
    </Picker>
  );
}

function CustomCoverUpload({
  value,
  onChange,
  invalid,
}: {
  value: string | undefined;
  onChange: (url: string) => void;
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErrorKey(null);
    try {
      const compressed = await compressUntrustedImage(file);
      const url = await uploadToBucket("customer-uploads", compressed, "custom-covers/");
      onChange(url);
    } catch (err) {
      if (err instanceof UntrustedImageError && err.reason === "invalid-type") {
        setErrorKey("productUploadInvalidType");
      } else if (
        err instanceof UntrustedImageError &&
        (err.reason === "too-large" || err.reason === "too-large-after-compress")
      ) {
        setErrorKey("productUploadTooLarge");
      } else {
        setErrorKey("adminUploadError");
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-14 w-14 rounded-lg border border-line object-cover"
          />
        ) : (
          <span
            className={cn(
              "grid h-14 w-14 place-items-center rounded-lg border border-dashed text-muted",
              invalid ? "border-danger" : "border-line",
            )}
          >
            <ImagePlus size={18} />
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {value ? t("productReplaceUpload") : t("productUploadCover")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {errorKey ? (
        <span className="text-xs text-danger">{t(errorKey)}</span>
      ) : (
        <span className="text-xs text-muted">{t("productUploadHint")}</span>
      )}
    </div>
  );
}
