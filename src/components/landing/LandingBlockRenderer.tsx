import { useEffect, useState } from "react";
import { InlineCheckout } from "@/components/checkout/InlineCheckout";
import { Gallery, type GalleryImage } from "@/components/product/Gallery";
import { ProductPlaceholder } from "@/components/product/ProductPlaceholder";
import { Container } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stars } from "@/components/ui/Stars";
import { useReviews } from "@/hooks/useReviews";
import { useI18n } from "@/i18n/LanguageProvider";
import { responsiveSrcSet } from "@/lib/image";
import { safeLinkHref } from "@/lib/utils";
import type { LandingBlock, Product } from "@/types/db";
import { list, localized, num, str } from "./blockData";

interface RendererProps {
  block: LandingBlock;
  product: Product | null;
}

export function LandingBlockRenderer({ block, product }: RendererProps) {
  switch (block.type) {
    case "hero":
      return <HeroBlock data={block.data} />;
    case "text":
      return <TextBlock data={block.data} />;
    case "image":
      return <ImageBlock data={block.data} />;
    case "features":
      return <FeaturesBlock data={block.data} />;
    case "gallery":
      return <GalleryBlock data={block.data} />;
    case "reviews":
      return <ReviewsBlock data={block.data} />;
    case "faq":
      return <FaqBlock data={block.data} />;
    case "countdown":
      return <CountdownBlock data={block.data} />;
    case "cta":
      return <CtaBlock data={block.data} />;
    case "product":
      return <ProductBlock data={block.data} product={product} />;
    default:
      return null;
  }
}

function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const { lang } = useI18n();
  const bg = str(data, "image_url");
  return (
    <section className="relative overflow-hidden">
      {bg ? (
        <img
          src={bg}
          srcSet={responsiveSrcSet(bg)}
          sizes="100vw"
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <ProductPlaceholder
          name={localized(data, "title", lang) || "Jazym"}
          className="absolute inset-0"
        />
      )}
      <div className="absolute inset-0 bg-ink/45" />
      <Container className="relative flex min-h-[52vh] flex-col items-center justify-center gap-4 py-20 text-center text-white">
        <h1 className="fx-display text-4xl sm:text-5xl">{localized(data, "title", lang)}</h1>
        {localized(data, "subtitle", lang) && (
          <p className="max-w-xl text-sm text-white/90 sm:text-base">
            {localized(data, "subtitle", lang)}
          </p>
        )}
      </Container>
    </section>
  );
}

function TextBlock({ data }: { data: Record<string, unknown> }) {
  const { lang } = useI18n();
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl text-center">
        {localized(data, "title", lang) && (
          <h2 className="fx-display text-3xl text-ink">{localized(data, "title", lang)}</h2>
        )}
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
          {localized(data, "body", lang)}
        </p>
      </div>
    </Container>
  );
}

function ImageBlock({ data }: { data: Record<string, unknown> }) {
  const url = str(data, "image_url");
  if (!url) return null;
  return (
    <Container className="py-8">
      <SmartImage
        src={url}
        alt={str(data, "alt")}
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="mx-auto w-full max-w-4xl rounded-card border border-line object-cover"
      />
    </Container>
  );
}

function FeaturesBlock({ data }: { data: Record<string, unknown> }) {
  const { lang } = useI18n();
  const items = list(data, "items");
  if (items.length === 0) return null;
  return (
    <Container className="py-12">
      {localized(data, "title", lang) && (
        <h2 className="fx-display mb-8 text-center text-3xl text-ink">
          {localized(data, "title", lang)}
        </h2>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-card border border-line bg-panel p-6">
            <FlowerMark className="mb-3 h-6 w-6 text-brand" />
            <h3 className="text-sm font-semibold text-ink">{localized(item, "title", lang)}</h3>
            <p className="mt-2 text-sm text-muted">{localized(item, "body", lang)}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

function GalleryBlock({ data }: { data: Record<string, unknown> }) {
  const images: GalleryImage[] = list(data, "items")
    .map((it, i) => ({ key: `g${i}`, url: str(it, "image_url"), alt: str(it, "alt") }))
    .filter((g) => g.url);
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-xl">
        <Gallery
          images={images}
          activeIndex={active}
          onActiveChange={setActive}
          placeholderName="Jazym"
        />
      </div>
    </Container>
  );
}

function ReviewsBlock({ data }: { data: Record<string, unknown> }) {
  const { t, lang } = useI18n();
  const { data: reviews = [] } = useReviews();
  const custom = list(data, "items");
  const rows =
    custom.length > 0
      ? custom.map((r, i) => ({
          id: `c${i}`,
          client_name: str(r, "name"),
          stars: num(r, "stars") ?? 5,
          review_text: localized(r, "text", lang),
        }))
      : reviews.slice(0, 6);
  if (rows.length === 0) return null;
  return (
    <Container className="py-12">
      <h2 className="fx-display mb-8 text-center text-3xl text-ink">
        {localized(data, "title", lang) || t("testimonialsTitle")}
      </h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <figure key={r.id} className="rounded-card border border-line bg-panel p-6">
            <Stars value={r.stars} />
            <blockquote className="mt-3 text-sm leading-relaxed text-ink/90">
              “{r.review_text}”
            </blockquote>
            <figcaption className="mt-3 text-xs text-muted">{r.client_name}</figcaption>
          </figure>
        ))}
      </div>
    </Container>
  );
}

function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const { lang } = useI18n();
  const items = list(data, "items");
  if (items.length === 0) return null;
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        {localized(data, "title", lang) && (
          <h2 className="fx-display mb-6 text-center text-3xl text-ink">
            {localized(data, "title", lang)}
          </h2>
        )}
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <details key={i} className="rounded-card border border-line bg-panel p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink">
                {localized(item, "q", lang)}
              </summary>
              <p className="mt-2 text-sm text-muted">{localized(item, "a", lang)}</p>
            </details>
          ))}
        </div>
      </div>
    </Container>
  );
}

function CountdownBlock({ data }: { data: Record<string, unknown> }) {
  const { lang } = useI18n();
  const target = str(data, "target");
  const [remaining, setRemaining] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setRemaining(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target || remaining <= 0) return null;
  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-md rounded-card border border-line bg-ink p-6 text-center text-bg">
        {localized(data, "title", lang) && (
          <p className="mb-3 text-sm text-bg/80">{localized(data, "title", lang)}</p>
        )}
        <div className="flex justify-center gap-3">
          {[
            { v: d, l: lang === "ar" ? "ي" : "j" },
            { v: h, l: lang === "ar" ? "س" : "h" },
            { v: m, l: "m" },
            { v: s, l: "s" },
          ].map((u, i) => (
            <div key={i} className="rounded-lg bg-white/10 px-3 py-2">
              <span className="num-ltr fx-display block text-2xl">
                {String(u.v).padStart(2, "0")}
              </span>
              <span className="text-[0.65rem] text-bg/70">{u.l}</span>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

function diff(target: string): number {
  const t = new Date(target).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((t - Date.now()) / 1000));
}

function CtaBlock({ data }: { data: Record<string, unknown> }) {
  const { lang } = useI18n();
  // Admin-typed — a javascript: URL here would run in every visitor's page.
  const href = safeLinkHref(str(data, "href")) ?? "#commander";
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl rounded-card border border-line bg-brand-soft/40 p-8 text-center">
        <h2 className="fx-display text-2xl text-ink">{localized(data, "title", lang)}</h2>
        {localized(data, "subtitle", lang) && (
          <p className="mt-2 text-sm text-muted">{localized(data, "subtitle", lang)}</p>
        )}
        <a
          href={href}
          className="mt-5 inline-flex h-12 items-center rounded-full bg-brand px-8 text-sm font-medium text-white hover:bg-brand/90"
        >
          {localized(data, "button", lang) || (lang === "ar" ? "اطلب الآن" : "Commander")}
        </a>
      </div>
    </Container>
  );
}

function ProductBlock({
  data,
  product,
}: {
  data: Record<string, unknown>;
  product: Product | null;
}) {
  const { t, lang } = useI18n();
  const [active, setActive] = useState(0);
  if (!product) {
    return (
      <Container className="py-12">
        <p className="text-center text-sm text-muted">
          {lang === "ar" ? "لم يُربط أي منتج بعد." : "Aucun produit associé."}
        </p>
      </Container>
    );
  }
  const images: GalleryImage[] = (product.product_images ?? []).map((img) => ({
    key: img.id,
    url: img.url,
    alt: img.alt ?? undefined,
  }));
  const name = lang === "ar" ? product.name_ar : product.name_fr;
  const desc = lang === "ar" ? product.description_ar : product.description_fr;
  const hasOptions =
    product.colors.length > 0 || product.sizes.length > 0 || product.variants.length > 0;

  return (
    <Container className="py-12" id="commander">
      {localized(data, "title", lang) && (
        <h2 className="fx-display mb-8 text-center text-3xl text-ink">
          {localized(data, "title", lang)}
        </h2>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Gallery
            images={images}
            activeIndex={active}
            onActiveChange={setActive}
            placeholderName={name}
          />
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="fx-display text-2xl text-ink">{name}</h3>
          {desc && <p className="text-sm leading-relaxed text-muted">{desc}</p>}
          {hasOptions ? (
            <a
              href={`/produit/${product.slug}`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-medium text-white hover:bg-brand/90"
            >
              {t("productBuyNow")}
            </a>
          ) : (
            <InlineCheckout
              product={product}
              unitPrice={product.price}
              color={null}
              size={null}
              variants={[]}
              selectionComplete
              onBlockedSubmit={() => {}}
            />
          )}
          <a
            href={`/produit/${product.slug}`}
            className="text-center text-xs text-muted hover:text-brand"
          >
            {t("productDetails")}
          </a>
        </div>
      </div>
    </Container>
  );
}
