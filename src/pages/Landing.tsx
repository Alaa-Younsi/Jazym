import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, PackageCheck, Truck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroArt } from "@/components/effects/HeroArt";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductPlaceholder } from "@/components/product/ProductPlaceholder";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Stars } from "@/components/ui/Stars";
import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { useReviews } from "@/hooks/useReviews";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { responsiveSrcSet } from "@/lib/image";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { pick } from "@/lib/utils";

export default function Landing() {
  const { t, lang } = useI18n();
  const { data: featured = [] } = useFeaturedProducts(8);
  const { data: categories = [] } = useCategories();
  const { data: reviews = [] } = useReviews();

  useSeo({
    title: `${t("brandTagline")} — ${SITE_NAME}`,
    description: t("brandTaglineLong"),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Store",
      name: SITE_NAME,
      url: SITE_URL,
      description: t("brandTaglineLong"),
      areaServed: "DZ",
      paymentAccepted: "Cash on delivery",
    },
  });

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 100% 0%, rgb(var(--c-brand-soft) / 0.5) 0%, transparent 60%)",
          }}
        />
        <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-brand">
              <FlowerMark className="h-3.5 w-3.5" />
              {t("heroKicker")}
            </span>
            <h1 className="fx-display text-4xl text-ink sm:text-5xl lg:text-[3.4rem]">
              {t("heroTitle")}
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted">{t("heroSubtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/boutique" size="lg">
                {t("heroCtaShop")}
                <ArrowRight size={18} className="rtl:rotate-180" />
              </ButtonLink>
              <ButtonLink to="/boutique/strategies" size="lg" variant="secondary">
                {t("heroCtaStrategies")}
              </ButtonLink>
            </div>
            <dl className="mt-2 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-5">
              {[
                { v: "69", l: t("heroStatWilayas") },
                { v: "100%", l: t("heroStatCod") },
                { v: lang === "ar" ? "0 دج" : "0 DA", l: t("heroStatCustom") },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="num-ltr fx-display text-2xl text-brand">{s.v}</dt>
                  <dd className="text-xs leading-tight text-muted">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroArt />
        </Container>
      </section>

      {/* ---------- categories ---------- */}
      <Container as="section" className="py-16">
        <SectionHeading
          kicker={t("navCategories")}
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {categories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ y: 16 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <Link
                to={`/boutique/${c.slug}`}
                className="group relative flex h-52 flex-col justify-end overflow-hidden rounded-card border border-line p-5"
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    srcSet={responsiveSrcSet(c.image_url)}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <ProductPlaceholder name={pick(lang, c, "name")} className="absolute inset-0" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="relative z-10">
                  <h3 className="fx-display text-xl text-white drop-shadow">
                    {pick(lang, c, "name")}
                  </h3>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/90">
                    {t("seeAll")}
                    <ArrowRight size={13} className="rtl:rotate-180" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>

      {/* ---------- featured ---------- */}
      {featured.length > 0 && (
        <div className="bg-panel py-16">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                align="start"
                kicker={t("brandName")}
                title={t("featuredTitle")}
                subtitle={t("featuredSubtitle")}
              />
              <ButtonLink to="/boutique" variant="ghost" size="sm">
                {t("seeAll")}
                <ArrowRight size={15} className="rtl:rotate-180" />
              </ButtonLink>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} eager={i < 4} />
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ---------- how it works ---------- */}
      <Container as="section" className="py-16">
        <SectionHeading kicker="1 · 2 · 3" title={t("howTitle")} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { t: t("howStep1Title"), b: t("howStep1Body") },
            { t: t("howStep2Title"), b: t("howStep2Body") },
            { t: t("howStep3Title"), b: t("howStep3Body") },
          ].map((step, i) => (
            <div key={step.t} className="relative rounded-card border border-line bg-panel p-6">
              <span className="fx-display absolute end-5 top-3 text-5xl text-brand/15">
                {i + 1}
              </span>
              <h3 className="fx-display text-lg text-ink">{step.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.b}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* ---------- features ---------- */}
      <div className="bg-panel py-16">
        <Container>
          <SectionHeading kicker={t("brandName")} title={t("featuresTitle")} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: BadgeCheck, t: t("feature1Title"), b: t("feature1Body") },
              { Icon: Truck, t: t("feature2Title"), b: t("feature2Body") },
              { Icon: Wallet, t: t("feature3Title"), b: t("feature3Body") },
              { Icon: PackageCheck, t: t("feature4Title"), b: t("feature4Body") },
            ].map((f) => (
              <div key={f.t} className="flex flex-col gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft/70 text-brand">
                  <f.Icon size={20} />
                </span>
                <h3 className="text-sm font-semibold text-ink">{f.t}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ---------- testimonials ---------- */}
      {reviews.length > 0 && (
        <Container as="section" className="py-16">
          <SectionHeading kicker="★★★★★" title={t("testimonialsTitle")} />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <figure
                key={r.id}
                className="flex flex-col gap-3 rounded-card border border-line bg-panel p-6"
              >
                <Stars value={r.stars} />
                <blockquote className="text-sm leading-relaxed text-ink/90">
                  “{r.review_text}”
                </blockquote>
                <figcaption className="mt-auto text-xs text-muted">{r.client_name}</figcaption>
              </figure>
            ))}
          </div>
        </Container>
      )}

      {/* ---------- closing CTA ---------- */}
      <Container as="section" className="pb-24">
        <div className="relative overflow-hidden rounded-card border border-line bg-ink px-8 py-14 text-center text-bg">
          <FlowerMark className="absolute -end-8 -top-8 h-40 w-40 text-brand/25" />
          <h2 className="fx-display relative text-3xl sm:text-4xl">{t("brandTagline")}</h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-bg/70">
            {t("brandTaglineLong")}
          </p>
          <ButtonLink variant="gold" size="lg" className="relative mt-6" to="/boutique">
            {t("heroCtaShop")}
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
