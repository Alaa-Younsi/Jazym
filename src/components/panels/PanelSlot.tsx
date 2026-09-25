import { motion } from "framer-motion";
import { ArrowRight, Download, FileArchive, FileText, Film, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { usePanel } from "@/hooks/usePromoPanels";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { freebieDownloadUrl, freebieKind, type FreebieKind } from "@/lib/freebies";
import { responsiveSrcSet } from "@/lib/image";
import { safeLinkHref } from "@/lib/utils";
import { formatBytes } from "@/lib/video";
import type { PanelFile, PanelSlot as PanelSlotKey } from "@/types/db";

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
  const files = panel.files ?? [];
  // A panel that carries only downloads is still worth rendering.
  if (!panel.image_url && !hasText && files.length === 0) return null;

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

  const linkClassName = "block transition hover:-translate-y-0.5 hover:shadow-lift";

  // With downloads attached the banner must NOT be wrapped in a link — an
  // <a> inside an <a> is invalid and swallows the download clicks. The files
  // become the call to action, and link_url (if any) rides along beneath them.
  if (files.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        {content}
        <FreebieList files={files} linkHref={linkHref} />
      </div>
    );
  }

  if (!linkHref) return content;
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

const FILE_ICONS: Record<FreebieKind, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  video: Film,
  archive: FileArchive,
  doc: FileText,
};

/** The download strip. Free, ungated — one tap per file. */
function FreebieList({ files, linkHref }: { files: PanelFile[]; linkHref: string | null }) {
  const { t, lang } = useI18n();
  return (
    <div className="rounded-card border border-line bg-panel p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
        <Download size={13} />
        {t("panelFreebiesTitle")}
      </p>
      <ul className="flex flex-col gap-2">
        {files.map((file) => {
          const label = (lang === "ar" ? file.name_ar : file.name_fr) || file.name_fr;
          const Icon = FILE_ICONS[freebieKind(file.mime)];
          return (
            <li key={file.url}>
              <a
                href={freebieDownloadUrl(file, label)}
                download
                className="group/file flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition hover:border-brand hover:bg-brand-soft/30"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-panel-2 text-brand">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{label}</span>
                  {file.size_bytes ? (
                    <span className="num-ltr block text-xs text-muted">
                      {formatBytes(file.size_bytes)}
                    </span>
                  ) : null}
                </span>
                <Download
                  size={15}
                  className="shrink-0 text-muted transition group-hover/file:text-brand"
                />
              </a>
            </li>
          );
        })}
      </ul>
      {linkHref &&
        (linkHref.startsWith("/") ? (
          <Link
            to={linkHref}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            {lang === "ar" ? "اكتشف" : "Découvrir"}
            <ArrowRight size={13} className="rtl:rotate-180" />
          </Link>
        ) : (
          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            {lang === "ar" ? "اكتشف" : "Découvrir"}
            <ArrowRight size={13} className="rtl:rotate-180" />
          </a>
        ))}
    </div>
  );
}
