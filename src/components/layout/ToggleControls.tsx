import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/cn";

export function LangToggle({ className }: { className?: string }) {
  const { lang, toggleLang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLang}
      className={cn(
        "inline-flex h-9 items-center rounded-full border border-line px-3 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand",
        className,
      )}
      aria-label={lang === "fr" ? t("switchToArabic") : t("switchToFrench")}
    >
      {lang === "fr" ? "العربية" : "FR"}
    </button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition hover:border-brand hover:text-brand",
        className,
      )}
      aria-label={theme === "dark" ? t("themeLight") : t("themeDark")}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
