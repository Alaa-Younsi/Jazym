import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, PackageCheck, Truck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroScene } from "@/components/effects/HeroScene";
import { Magnetic } from "@/components/effects/Magnetic";
import { Marquee } from "@/components/effects/Marquee";
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

  // Ticker copy: the real catalogue when it has loaded, the brand promises
  // otherwise — the band must never render empty or half-width.
  const categoryWords = topCategories.map((c) => pick(lang, c, "name"));
  const marqueeWords =
    categoryWords.length >= 3
      ? categoryWords
      : [t("heroStatCod"), t("heroStatCustom"), t("brandTagline"), t("feature2Title")];

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
      {/* ---------- hero ----------
          The page opens as a sheet of ruled cahier paper — ruling, grain, a
          single aurora wash — with the notebook itself sitting on it in 3D.
          One animated backdrop element, not three blurred blobs: same depth,
          a fraction of the compositing cost on a mid-range phone. */}
      {/* Height budget: 100svh minus the sticky header (4rem) and the
          announcement bar (~2.1rem), capped at 52rem so a very tall window
          doesn't stretch the hero into a field of emptiness. `min-h` rather
          than `h`, so a short window or a long translation grows instead of
          clipping. The content centres in whatever is left and the ticker
          sits on the bottom edge, which is what lands the whole hero inside
          the first screen. */}
      <section className="fx-grain relative isolate flex min-h-[min(calc(100svh-6.1rem),52rem)] flex-col overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="fx-ruled absolute inset-0 opacity-70" />
          <div
            className="absolute -top-1/3 start-[-10%] h-[130%] w-[120%] opacity-80"
            style={{
              background:
                "radial-gradient(38% 42% at 22% 28%, rgb(var(--c-brand) / 0.30) 0%, transparent 70%)," +
                "radial-gradient(40% 46% at 78% 22%, rgb(var(--c-violet) / 0.26) 0%, transparent 72%)," +
                "radial-gradient(34% 38% at 58% 88%, rgb(var(--c-gold) / 0.22) 0%, transparent 70%)",
              filter: "blur(28px)",
              animation: reducedMotion ? undefined : "fx-aurora 26s ease-in-out infinite",
              willChange: reducedMotion ? undefined : "transform",
            }}
          />
          {/* dissolve the paper into the page below it */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-bg" />
        </div>

        <Container className="relative flex flex-1 items-center">
          <div className="grid w-full items-center gap-[clamp(0.75rem,1.9svh,2rem)] py-[clamp(0.75rem,1.9svh,2.5rem)] lg:grid-cols-[1.18fr_0.82fr] lg:gap-8 xl:gap-12">
            {/* --- art: first on mobile so the page opens on something to look
                at, second on desktop where it balances the type.
                No tilt wrapper here — the notebook is real 3D that turns on
                its own and responds to dragging, so a CSS mouse-tilt on its
                container only fights it (and skews the pointer coordinates
                the drag gesture reads). --- */}
            <div className="order-first w-full lg:order-last">
              <HeroScene />
            </div>

            <div className="flex flex-col items-center gap-[clamp(0.85rem,2svh,1.75rem)] text-center lg:items-start lg:text-start">
              {/* Editorial eyebrow, not a pill badge: a hairline rule, the
                  flower mark, and letter-spaced small caps — the masthead
                  convention a printed cahier would use. */}
              <Reveal duration={0.5}>
                <span className="flex w-full items-center justify-center gap-2.5 text-center text-[0.56rem] font-semibold uppercase leading-none tracking-[0.16em] text-muted xs:text-[0.62rem] xs:tracking-[0.2em] sm:gap-3 sm:text-[0.7rem] sm:tracking-[0.3em] lg:w-fit lg:justify-start lg:text-start">
                  <span className="hidden h-px w-8 shrink-0 bg-gradient-to-r from-transparent to-brand/60 lg:block rtl:lg:bg-gradient-to-l" />
                  <FlowerMark className="h-3 w-3 shrink-0 text-brand sm:h-3.5 sm:w-3.5" />
                  {t("heroKicker")}
                </span>
              </Reveal>

              <div className="flex flex-col items-center gap-2 lg:items-start">
                <h1 className="fx-display text-balance text-[clamp(1.95rem,4.8svh,2.7rem)] leading-[1.03] tracking-[-0.015em] text-ink sm:text-[clamp(2.5rem,5.2svh,3.4rem)] lg:text-[min(3.9rem,7.2vh)] xl:text-[min(4.5rem,7.8vh)]">
                  <StaggerText text={t("heroTitle")} />
                </h1>
                {/* ink swash, drawn in just after the headline settles */}
                <motion.svg
                  aria-hidden
                  viewBox="0 0 320 14"
                  preserveAspectRatio="none"
                  className="fx-underline-draw mt-1.5 h-3 w-48 text-gold xs:w-56 sm:w-72 lg:w-80 [@media(max-height:760px)]:hidden lg:[@media(max-height:760px)]:block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <path
                    d="M3 9.5C54 3.5 106 2.5 158 5.5c52 3 104 5 159 1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    pathLength={1}
                  />
                </motion.svg>
              </div>

              <Reveal delay={0.14}>
                <p className="max-w-md text-pretty text-[1.02rem] leading-relaxed text-muted sm:text-[1.12rem] lg:max-w-xl lg:border-s-2 lg:border-brand/35 lg:ps-5">
                  {t("heroSubtitle")}
                </p>
              </Reveal>

              <Reveal delay={0.22} className="w-full lg:w-auto">
                <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:justify-center lg:justify-start">
                  <Magnetic className="w-full sm:w-auto">
                    <ButtonLink
                      to="/boutique"
                      size="lg"
                      className="h-12 w-full sm:h-[3.25rem] sm:w-auto"
                    >
                      {t("heroCtaShop")}
                      <ArrowRight size={18} className="rtl:rotate-180" />
                    </ButtonLink>
                  </Magnetic>
                  <Magnetic className="w-full sm:w-auto" strength={0.18}>
                    <ButtonLink
                      to="/boutique/strategies"
                      size="lg"
                      variant="secondary"
                      className="h-12 w-full sm:h-[3.25rem] sm:w-auto"
                    >
                      {t("heroCtaStrategies")}
                    </ButtonLink>
                  </Magnetic>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>

        {/* --- running band: the catalogue, read as a ticker --- */}
        <div className="relative border-y border-line/70 bg-panel/50 backdrop-blur-sm">
          <Marquee speed={34} itemClassName="gap-8 pe-8 py-3 sm:gap-12 sm:pe-12">
            {marqueeWords.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="fx-display flex shrink-0 items-center gap-8 whitespace-nowrap text-lg text-ink/70 sm:gap-12 sm:text-2xl"
              >
                {word}
                <FlowerMark className="h-3.5 w-3.5 shrink-0 text-brand/70 sm:h-4 sm:w-4" />
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      <Container className="pb-8 pt-10 sm:pt-14">
        <PanelSlot slot="home_hero" />
      </Container>

      {/* ---------- categories ---------- */}
      <Container as="section" className="py-16">
        <Reveal variant="blur">
          <SectionHeading
            kicker={t("navCategories")}
            title={t("categoriesTitle")}
            subtitle={t("categoriesSubtitle")}
          />
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {topCategories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`/boutique/${c.slug}`}
                className="fx-curl group relative flex h-60 flex-col justify-end overflow-hidden rounded-card border border-line p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-lift sm:h-72"
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    srcSet={responsiveSrcSet(c.image_url)}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                  />
                ) : (
                  <ProductPlaceholder name={pick(lang, c, "name")} className="absolute inset-0" />
                )}
                {/* Fixed black, NOT the --c-ink token: `ink` flips to near-white in the
                    dark theme, which turned this scrim light and left the white
                    label unreadable on pale category photos. */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-all duration-500 group-hover:from-black/90" />
                <div className="relative z-10">
                  <h3 className="fx-display text-2xl text-white drop-shadow">
                    {pick(lang, c, "name")}
                  </h3>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/90">
                    {t("seeAll")}
                    <ArrowRight
                      size={13}
                      className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    />
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
        <Reveal variant="blur">
          <SectionHeading kicker="1 · 2 · 3" title={t("howTitle")} />
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { t: t("howStep1Title"), b: t("howStep1Body") },
            { t: t("howStep2Title"), b: t("howStep2Body") },
            { t: t("howStep3Title"), b: t("howStep3Body") },
          ].map((step, i) => (
            <Reveal key={step.t} delay={i * 0.1}>
              <div className="fx-curl group relative h-full overflow-hidden rounded-card border border-line bg-panel p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-lift">
                {/* faint ruling, so each step reads as a torn-out page */}
                <span
                  aria-hidden
                  className="fx-ruled pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                />
                <span className="fx-display absolute end-5 top-3 text-6xl text-brand/15 transition-all duration-500 group-hover:scale-110 group-hover:text-brand/30">
                  {i + 1}
                </span>
                <h3 className="fx-display relative text-lg text-ink">{step.t}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted">{step.b}</p>
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
          <Reveal variant="blur">
            <SectionHeading kicker={t("brandName")} title={t("featuresTitle")} />
          </Reveal>
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
          <Reveal variant="blur">
            <SectionHeading kicker="★★★★★" title={t("testimonialsTitle")} />
          </Reveal>
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
        <Reveal
          variant="scale"
          className="fx-grain relative overflow-hidden rounded-card border border-line bg-ink px-6 py-14 text-center text-bg sm:px-8"
        >
          <span aria-hidden className="fx-ruled pointer-events-none absolute inset-0 opacity-25" />
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
