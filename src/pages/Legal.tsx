import { Link } from "react-router-dom";
import { Container, SectionHeading } from "@/components/ui/Container";
import {
  LEGAL_DOCS,
  LEGAL_NAV_KEYS,
  LEGAL_ORDER,
  LEGAL_UPDATED,
  type LegalSlug,
} from "@/content/legal";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { LEGAL_IDENTITY } from "@/lib/contact";
import { cn } from "@/lib/cn";
import { useConsent } from "@/store/consent";

/** Identity lines required by loi 18-05 art. 11. Empty values are skipped. */
const IDENTITY_ROWS: { key: keyof typeof LEGAL_IDENTITY; fr: string; ar: string }[] = [
  { key: "owner", fr: "Exploitant", ar: "المستغل" },
  { key: "rc", fr: "Registre du commerce (RC)", ar: "السجل التجاري" },
  { key: "nif", fr: "NIF", ar: "رقم التعريف الجبائي" },
  { key: "nis", fr: "NIS", ar: "رقم التعريف الإحصائي" },
  { key: "ai", fr: "Article d'imposition", ar: "مادة الضريبة" },
];

/** One component for the four legal pages; the text lives in content/legal.ts. */
export default function Legal({ slug }: { slug: LegalSlug }) {
  const { t, lang } = useI18n();
  const openPanel = useConsent((s) => s.openPanel);
  const doc = LEGAL_DOCS[slug];
  const l = lang === "ar" ? "ar" : "fr";

  useSeo({ title: doc.title[l], description: doc.intro[l] });

  const identity = IDENTITY_ROWS.filter((r) => LEGAL_IDENTITY[r.key]);

  return (
    <Container className="py-12">
      <SectionHeading title={doc.title[l]} subtitle={doc.intro[l]} />
      <p className="mt-3 text-center text-xs text-muted">
        {t("legalUpdated")} : <span className="num-ltr">{LEGAL_UPDATED}</span>
      </p>

      <div className="mx-auto mt-10 max-w-2xl">
        {slug === "mentions-legales" && identity.length > 0 && (
          <dl className="mb-8 grid gap-x-6 gap-y-2 rounded-card border border-line bg-panel p-5 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
            {identity.map((r) => (
              <div key={r.key} className="contents">
                <dt className="text-muted">{r[l]}</dt>
                <dd className="num-ltr text-ink">{LEGAL_IDENTITY[r.key]}</dd>
              </div>
            ))}
          </dl>
        )}

        <ol className="flex flex-col gap-8">
          {doc.sections.map((section, i) => (
            <li key={section.title.fr}>
              <h2 className="fx-display flex items-baseline gap-2 text-xl text-ink">
                <span className="num-ltr text-muted">{String(i + 1).padStart(2, "0")}</span>
                {section.title[l]}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                {section.body[l]}
              </p>
            </li>
          ))}
        </ol>

        {slug === "cookies" && (
          <button
            type="button"
            onClick={openPanel}
            className="mt-8 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
          >
            {t("footerManageCookies")}
          </button>
        )}

        <nav className="mt-12 border-t border-line pt-6" aria-label={t("legalOtherPages")}>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink">
            {t("legalOtherPages")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEGAL_ORDER.map((s) => (
              <Link
                key={s}
                to={`/${s}`}
                aria-current={s === slug ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition",
                  s === slug
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line text-muted hover:border-brand hover:text-brand",
                )}
              >
                {t(LEGAL_NAV_KEYS[s])}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </Container>
  );
}
