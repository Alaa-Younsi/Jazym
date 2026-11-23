import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

/** "By confirming you accept the CGV and the privacy policy" — shown under
    every confirm-order button (cart checkout and the inline/landing form). */
export function LegalAcceptLine({ className }: { className?: string }) {
  const { t } = useI18n();
  const link = "text-ink underline underline-offset-2 hover:text-brand";
  return (
    <p className={cn("text-center text-[11px] leading-relaxed text-muted", className)}>
      {t("checkoutAcceptPrefix")}{" "}
      <Link to="/cgv" target="_blank" className={link}>
        {t("checkoutAcceptTerms")}
      </Link>{" "}
      {t("checkoutAcceptAnd")}{" "}
      <Link to="/confidentialite" target="_blank" className={link}>
        {t("checkoutAcceptPrivacy")}
      </Link>
      .
    </p>
  );
}
