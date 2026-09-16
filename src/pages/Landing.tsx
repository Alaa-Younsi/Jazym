import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  MapPin,
  PackageCheck,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedCounter } from "@/components/effects/AnimatedCounter";
import { HeroArt } from "@/components/effects/HeroArt";
import { ParallaxTilt } from "@/components/effects/ParallaxTilt";
import { Reveal } from "@/components/effects/Reveal";
import { StaggerText } from "@/components/effects/StaggerText";
import { PanelSlot } from "@/components/panels/PanelSlot";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductPlaceholder } from "@/components/product/ProductPlaceholder";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Stars } from "@/components/ui/Stars";
import { useCategories } from "@/hooks/useCategories";
import { childrenOf } from "@/lib/categoryTree";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
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
  const reducedMotion = usePrefersReducedMotion();
  // Top-level only, capped — the homepage showcases the main lines, not the
  // full matière/thème tree underneath "Cahiers de l'enseignant".
  const topCategories = childrenOf(categories, null).slice(0, 6);

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
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {reducedMotion ? (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 50% at 100% 0%, rgb(var(--c-brand-soft) / 0.5) 0%, transparent 60%)",
              }}
            />
          ) : (
            <>
              <motion.div
                className="absolute -top-24 -start-24 h-80 w-80 rounded-full bg-brand/40 blur-3xl"
                animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-10 -end-20 h-96 w-96 rounded-full bg-violet/35 blur-3xl"
                animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
                transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-0 start-1/3 h-72 w-72 rounded-full bg-gold/25 blur-3xl"
                animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
            </>
          )}
        </div>
        <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col gap-6">
            <Reveal>
              <span className="relative inline-flex w-fit items-center gap-2.5 rounded-full border border-brand/30 bg-brand-soft/40 px-3.5 py-1.5 text-xs font-medium text-brand shadow-soft backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                {t("heroKicker")}
              </span>
            </Reveal>
            <h1 className="fx-display text-4xl text-ink sm:text-5xl lg:text-[3.4rem]">
              <StaggerText text={t("heroTitle")} />
            </h1>
            <Reveal delay={0.16}>
              <p className="max-w-lg text-base leading-relaxed text-muted">{t("heroSubtitle")}</p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="flex flex-wrap gap-3">
                <ButtonLink to="/boutique" size="lg">
                  {t("heroCtaShop")}
                  <ArrowRight size={18} className="rtl:rotate-180" />
                </ButtonLink>
                <ButtonLink to="/boutique/strategies" size="lg" variant="secondary">
                  {t("heroCtaStrategies")}
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <dl className="mt-2 grid max-w-md grid-cols-3 divide-x divide-line rtl:divide-x-reverse">
                {[
                  { Icon: MapPin, value: 69, suffix: "", l: t("heroStatWilayas") },
                  { Icon: Wallet, value: 100, suffix: "%", l: t("heroStatCod") },
                  {
                    Icon: Sparkles,
                    value: 0,
                    suffix: lang === "ar" ? " دج" : " DA",
                    l: t("heroStatCustom"),
                  },
                ].map((s, i) => (
                  <div
                    key={s.l}
                    className="group flex flex-col gap-1.5 px-4 transition-transform first:ps-0 hover:-translate-y-0.5 last:pe-0"
                  >
                    <s.Icon size={16} className="text-brand/70 transition group-hover:text-brand" />
                    <dt className="num-ltr fx-display text-2xl text-brand">
                      <AnimatedCounter
                        value={s.value}
                        suffix={s.suffix}
                        duration={1000 + i * 200}
                      />
                    </dt>
                    <dd className="text-xs leading-tight text-muted">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <ParallaxTilt>
            <HeroArt />
          </ParallaxTilt>
        </Container>

        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-4 hidden justify-center sm:flex"
          animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-muted/60" />
        </motion.div>
      </section>

      <Container className="pb-6">
        <PanelSlot slot="home_hero" />
      </Container>

      {/* ---------- categories ---------- */}
      <Container as="section" className="py-16">
        <SectionHeading
          kicker={t("navCategories")}
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {topCategories.map((c, i) => (
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
            <Reveal key={step.t} delay={i * 0.1}>
              <div className="group relative h-full rounded-card border border-line bg-panel p-6 transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift">
                <span className="fx-display absolute end-5 top-3 text-5xl text-brand/15 transition group-hover:text-brand/25">
                  {i + 1}
                </span>
                <h3 className="fx-display text-lg text-ink">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      <Container className="pb-16">
        <PanelSlot slot="home_mid" />
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
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.08}>
                <div className="group flex flex-col gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft/70 text-brand transition duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                    <f.Icon size={20} />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{f.t}</h3>
                  <p className="text-sm leading-relaxed text-muted">{f.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ---------- testimonials ---------- */}
      {reviews.length > 0 && (
        <Container as="section" className="py-16">
          <SectionHeading kicker="★★★★★" title={t("testimonialsTitle")} />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r, i) => (
              <Reveal key={r.id} delay={(i % 3) * 0.08}>
                <figure className="flex h-full flex-col gap-3 rounded-card border border-line bg-panel p-6 transition hover:-translate-y-1 hover:shadow-lift">
                  <Stars value={r.stars} />
                  <blockquote className="text-sm leading-relaxed text-ink/90">
                    “{r.review_text}”
                  </blockquote>
                  <figcaption className="mt-auto text-xs text-muted">{r.client_name}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      )}

      {/* ---------- closing CTA ---------- */}
      <Container as="section" className="pb-24">
        <Reveal className="relative overflow-hidden rounded-card border border-line bg-ink px-8 py-14 text-center text-bg">
          <motion.div
            className="absolute -end-8 -top-8 h-40 w-40 text-brand/25"
            animate={reducedMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 40, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <FlowerMark className="h-full w-full" />
          </motion.div>
          <h2 className="fx-display relative text-3xl sm:text-4xl">{t("brandTagline")}</h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-bg/70">
            {t("brandTaglineLong")}
          </p>
          <ButtonLink variant="gold" size="lg" className="relative mt-6" to="/boutique">
            {t("heroCtaShop")}
          </ButtonLink>
        </Reveal>
      </Container>
    </>
  );
}
