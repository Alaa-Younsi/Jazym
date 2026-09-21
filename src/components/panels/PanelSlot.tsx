import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { usePanel } from "@/hooks/usePromoPanels";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { responsiveSrcSet } from "@/lib/image";
import { safeLinkHref } from "@/lib/utils";
import type { PanelSlot as PanelSlotKey } from "@/types/db";

/** Admin-managed promo banner at a fixed, code-defined slot. Renders nothing
    when the slot has no active/in-schedule panel — RLS already did that
    filtering server-side, so a row coming back at all means "show it". */
export function PanelSlot({ slot }: { slot: PanelSlotKey }) {
  const { lang } = useI18n();
  const { data: panel } = usePanel(slot);
  const reduced = usePrefersReducedMotion();
  if (!panel) return null;

  const title = lang === "ar" ? panel.title_ar : panel.title_fr;
  const subtitle = lang === "ar" ? panel.subtitle_ar : panel.subtitle_fr;
  const hasText = !!(title || subtitle);
  if (!panel.image_url && !hasText) return null;

  // The admin types this by hand — never render it as an href unmodified.
  const linkHref = safeLinkHref(panel.link_url);
  const isLink = !!linkHref;

  const content = (
    <div
      className={
        panel.image_url
          ? "group relative overflow-hidden rounded-card border border-line"
          : "group relative overflow-hidden rounded-card border border-brand/25 bg-gradient-to-br from-brand via-violet to-brand/80"
      }
    >
      {panel.image_url ? (
        <img
          src={panel.image_url}
          srcSet={responsiveSrcSet(panel.image_url)}
          sizes="(max-width: 1024px) 100vw, 1024px"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <motion.div
          className="pointer-events-none absolute -end-6 -top-6 h-36 w-36 text-white/15"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ duration: 50, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <FlowerMark className="h-full w-full" />
        </motion.div>
      )}
      {hasText && (
        <div
          className={
            panel.image_url
              ? "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 to-transparent p-5 text-white sm:p-7"
              : "relative flex flex-col gap-1 p-5 text-white sm:p-7"
          }
        >
          {title && <p className="fx-display text-xl sm:text-2xl">{title}</p>}
          {subtitle && <p className="max-w-md text-sm opacity-90">{subtitle}</p>}
          {isLink && (
            <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-90 transition group-hover:gap-2.5">
              {lang === "ar" ? "اكتشف" : "Découvrir"}
              <ArrowRight size={13} className="rtl:rotate-180" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!linkHref) return content;
  const linkClassName = "block transition hover:-translate-y-0.5 hover:shadow-lift";
  if (linkHref.startsWith("/")) {
    return (
      <Link to={linkHref} className={linkClassName}>
        {content}
      </Link>
    );
  }
  return (
    <a href={linkHref} target="_blank" rel="noopener noreferrer" className={linkClassName}>
      {content}
    </a>
  );
}
