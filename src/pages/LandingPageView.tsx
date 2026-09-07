import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { LandingBlockRenderer } from "@/components/landing/LandingBlockRenderer";
import { Wordmark } from "@/components/ui/Wordmark";
import { PageLoader } from "@/components/ui/Spinner";
import { usePixel } from "@/components/TrackingProvider";
import { useLandingPage } from "@/hooks/useLandingPages";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";

export default function LandingPageView() {
  const { slug } = useParams();
  const { lang, t } = useI18n();
  const { setTheme } = useTheme();
  const { setContext } = usePixel();
  const { data: page, isLoading } = useLandingPage(slug);

  useEffect(() => {
    if (!page || page.theme === "auto") return;
    setTheme(page.theme);
  }, [page, setTheme]);

  useEffect(() => {
    if (!page) return;
    setContext({ landingSlug: page.slug, extraPixelIds: page.pixel_ids });
  }, [page, setContext]);

  const title = page
    ? (lang === "ar" ? page.seo_title_ar : page.seo_title_fr) ||
      (lang === "ar" ? page.title_ar : page.title_fr)
    : "";
  const description = page
    ? ((lang === "ar" ? page.seo_description_ar : page.seo_description_fr) ?? undefined)
    : undefined;

  useSeo({
    title: title || t("brandName"),
    description,
    image: page?.og_image_url ?? null,
  });

  if (isLoading) return <PageLoader />;

  if (!page) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <Wordmark />
        <p className="text-sm text-muted">{t("notFoundBody")}</p>
        <Link to="/" className="rounded-full bg-brand px-5 py-2 text-sm text-white">
          {t("notFoundCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/">
            <Wordmark />
          </Link>
          <Link to="/boutique" className="text-xs text-muted hover:text-brand">
            {t("navShop")}
          </Link>
        </div>
      </header>

      <main>
        {page.blocks.map((block) => (
          <LandingBlockRenderer key={block.id} block={block} product={page.product ?? null} />
        ))}
      </main>

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        © {new Date().getFullYear()} {t("brandName")} · {t("footerRights")}
      </footer>
    </div>
  );
}
