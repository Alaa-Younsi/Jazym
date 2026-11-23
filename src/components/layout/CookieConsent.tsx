import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { hasValidDecision, useConsent } from "@/store/consent";

/** Wait before showing the banner, so it never competes with the first paint. */
const SHOW_DELAY_MS = 1200;

/**
 * Cookie consent banner. Bottom-left corner (the WhatsApp button owns the
 * right), no overlay, Accept / Refuse the same size, "Personnaliser" reveals
 * the per-category switch. Reopened from "Gérer les cookies" in the footer
 * via `openPanel()`. Portalled to <body> so no transformed ancestor can trap
 * its `position: fixed` (skill bug ledger #26). Hidden on /admin.
 */
export function CookieConsent() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();
  const decidedAt = useConsent((s) => s.decidedAt);
  const savedAds = useConsent((s) => s.ads);
  const panelOpen = useConsent((s) => s.panelOpen);
  const choose = useConsent((s) => s.choose);
  const closePanel = useConsent((s) => s.closePanel);

  const [delayed, setDelayed] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [ads, setAds] = useState(savedAds);

  useEffect(() => {
    const id = window.setTimeout(() => setDelayed(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  // Reopened from the footer: start on the detailed view with the saved choice.
  useEffect(() => {
    if (panelOpen) {
      setAds(savedAds);
      setCustomizing(true);
    }
  }, [panelOpen, savedAds]);

  const needsDecision = !hasValidDecision(decidedAt);
  const visible = !pathname.startsWith("/admin") && (panelOpen || (needsDecision && delayed));

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.section
          key="cookie-consent"
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          initial={reduced ? false : { y: 24 }}
          animate={{ y: 0 }}
          exit={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-3 bottom-3 z-[60] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-card border border-line bg-panel p-5 text-ink shadow-lift sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[24rem]"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft/60 text-brand">
              <Cookie size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="cookie-consent-title" className="text-sm font-semibold">
                {t("consentTitle")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t("consentBody")}{" "}
                <Link to="/cookies" className="text-brand underline underline-offset-2">
                  {t("consentLearnMore")}
                </Link>
              </p>
            </div>
            {panelOpen && !needsDecision && (
              <button
                type="button"
                onClick={closePanel}
                aria-label={t("consentClose")}
                className="-m-2 p-2 text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {customizing && (
            <div className="mt-4 flex flex-col gap-2">
              <CategoryRow
                title={t("consentNecessary")}
                hint={t("consentNecessaryHint")}
                checked
                disabled
                label={t("consentAlwaysOn")}
              />
              <CategoryRow
                title={t("consentAds")}
                hint={t("consentAdsHint")}
                checked={ads}
                onChange={setAds}
                label={t("consentAds")}
              />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" onClick={() => choose(false)}>
              {t("consentRefuse")}
            </Button>
            <Button size="sm" onClick={() => choose(true)}>
              {t("consentAccept")}
            </Button>
          </div>
          {customizing ? (
            <Button
              size="sm"
              variant="ghost"
              fullWidth
              className="mt-2"
              onClick={() => choose(ads)}
            >
              {t("consentSave")}
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setCustomizing(true)}
              className="mt-3 w-full text-center text-xs text-muted underline underline-offset-2 hover:text-brand"
            >
              {t("consentCustomize")}
            </button>
          )}
        </motion.section>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function CategoryRow({
  title,
  hint,
  checked,
  disabled,
  onChange,
  label,
}: {
  title: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-line p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-brand" : "bg-line",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white transition",
            checked ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
