import { Lock, RefreshCw, ShoppingBag, Truck, Wallet, type LucideIcon } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { PageLoader } from "@/components/ui/Spinner";
import { useResolvedPolicy } from "@/hooks/usePolicyContent";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { CONTACT_PHONE, CONTACT_PHONE_HREF, CONTACT_WHATSAPP_HREF } from "@/lib/contact";

const ICONS: Record<string, LucideIcon> = {
  ShoppingBag,
  Truck,
  Wallet,
  RefreshCw,
  Lock,
};

export default function Policy() {
  const { t } = useI18n();
  const { data, isLoading } = useResolvedPolicy();

  useSeo({ title: data.title || t("policyTitle"), description: data.intro || t("policyIntro") });

  if (isLoading) return <PageLoader />;

  return (
    <Container className="py-14">
      <SectionHeading
        kicker={data.tag || t("footerPolicy")}
        title={data.title || t("policyTitle")}
        subtitle={data.intro || t("policyIntro")}
      />

      <div className="mx-auto mt-12 max-w-2xl">
        <ol className="flex flex-col gap-8">
          {data.sections.map((section, i) => {
            const Icon = section.icon ? ICONS[section.icon] : undefined;
            return (
              <li key={section.id} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft/60 text-brand">
                  {Icon ? (
                    <Icon size={18} />
                  ) : (
                    <span className="num-ltr text-sm font-semibold">{i + 1}</span>
                  )}
                </span>
                <div>
                  <h2 className="fx-display text-xl text-ink">
                    <span className="num-ltr me-2 text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                    {section.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 rounded-card border border-line bg-panel p-6">
          <div className="flex items-center gap-2">
            <FlowerMark className="h-4 w-4 text-brand" />
            <h2 className="fx-display text-lg text-ink">
              {data.contactTitle || t("policyContactTitle")}
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted">{data.contactBody || t("policyContactBody")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={CONTACT_PHONE_HREF}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-brand hover:text-brand"
            >
              {CONTACT_PHONE}
            </a>
            <a
              href={CONTACT_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
