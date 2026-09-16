import { Link } from "react-router-dom";
import { usePanel } from "@/hooks/usePromoPanels";
import { useI18n } from "@/i18n/LanguageProvider";
import { responsiveSrcSet } from "@/lib/image";
import type { PanelSlot as PanelSlotKey } from "@/types/db";

/** Admin-managed promo banner at a fixed, code-defined slot. Renders nothing
    when the slot has no active/in-schedule panel — RLS already did that
    filtering server-side, so a row coming back at all means "show it". */
export function PanelSlot({ slot }: { slot: PanelSlotKey }) {
  const { lang } = useI18n();
  const { data: panel } = usePanel(slot);
  if (!panel) return null;

  const title = lang === "ar" ? panel.title_ar : panel.title_fr;
  const subtitle = lang === "ar" ? panel.subtitle_ar : panel.subtitle_fr;
  const hasText = !!(title || subtitle);
  if (!panel.image_url && !hasText) return null;

  const content = (
    <div className="relative overflow-hidden rounded-card border border-line">
      {panel.image_url && (
        <img
          src={panel.image_url}
          srcSet={responsiveSrcSet(panel.image_url)}
          sizes="(max-width: 1024px) 100vw, 1024px"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
      {hasText && (
        <div
          className={
            panel.image_url
              ? "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 to-transparent p-5 text-white"
              : "flex flex-col gap-1 bg-panel p-5"
          }
        >
          {title && <p className="fx-display text-xl">{title}</p>}
          {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
        </div>
      )}
    </div>
  );

  if (!panel.link_url) return content;
  if (panel.link_url.startsWith("/")) {
    return (
      <Link to={panel.link_url} className="block">
        {content}
      </Link>
    );
  }
  return (
    <a href={panel.link_url} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  );
}
