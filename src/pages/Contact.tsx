import { Facebook, Instagram, MapPin, Phone } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/Container";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import {
  CONTACT_ADDRESS_AR,
  CONTACT_ADDRESS_FR,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_WHATSAPP_HREF,
  SOCIAL_LINKS,
} from "@/lib/contact";

export default function Contact() {
  const { t, lang } = useI18n();
  useSeo({ title: t("contactTitle"), description: t("contactBody") });

  const rows = [
    { Icon: Phone, label: t("contactPhone"), value: CONTACT_PHONE, href: CONTACT_PHONE_HREF },
    {
      Icon: MapPin,
      label: t("contactAddress"),
      value: lang === "ar" ? CONTACT_ADDRESS_AR : CONTACT_ADDRESS_FR,
      href: undefined,
    },
  ];

  return (
    <Container className="py-14">
      <SectionHeading
        kicker={t("brandName")}
        title={t("contactTitle")}
        subtitle={t("contactBody")}
      />

      <div className="mx-auto mt-10 grid max-w-2xl gap-4">
        {rows.map(({ Icon, label, value, href }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-card border border-line bg-panel p-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft/60 text-brand">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
              {href ? (
                <a href={href} className="text-sm font-medium text-ink hover:text-brand">
                  {value}
                </a>
              ) : (
                <p className="text-sm font-medium text-ink">{value}</p>
              )}
            </div>
          </div>
        ))}

        <div className="mt-2 flex flex-wrap gap-3">
          <a
            href={CONTACT_WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
          >
            {t("contactWhatsapp")}
          </a>
          <a
            href={SOCIAL_LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink hover:border-brand hover:text-brand"
          >
            <Facebook size={16} /> Facebook
          </a>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink hover:border-brand hover:text-brand"
          >
            <Instagram size={16} /> Instagram
          </a>
        </div>
      </div>
    </Container>
  );
}
