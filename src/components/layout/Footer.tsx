import { Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Wordmark } from "@/components/ui/Wordmark";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/i18n/LanguageProvider";
import { childrenOf } from "@/lib/categoryTree";
import { CONTACT_PHONE, CONTACT_PHONE_HREF, SOCIAL_LINKS } from "@/lib/contact";
import { pick } from "@/lib/utils";

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.6c-1.3.1-2.5-.2-3.6-.9v6.3c0 3.4-2.6 5.6-5.7 5.6C7.5 20.5 5 18.2 5 15c0-3.1 2.5-5.4 5.6-5.3.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-1-.2-1.4 0-2.6 1.1-2.6 2.6s1.2 2.6 2.6 2.6c1.5 0 2.7-1.1 2.7-3V3h2.8Z" />
    </svg>
  );
}

export function Footer() {
  const { t, lang } = useI18n();
  const { data: categories = [] } = useCategories();
  const topCategories = childrenOf(categories, null).slice(0, 4);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-panel">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t("footerAbout")}</p>
          <div className="mt-5 flex gap-2">
            <SocialLink href={SOCIAL_LINKS.facebook} label="Facebook">
              <Facebook size={18} />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram">
              <Instagram size={18} />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.tiktok} label="TikTok">
              <TikTokIcon />
            </SocialLink>
          </div>
        </div>

        <FooterCol title={t("footerShop")}>
          <FooterLink to="/boutique">{t("navShop")}</FooterLink>
          {topCategories.map((c) => (
            <FooterLink key={c.id} to={`/boutique/${c.slug}`}>
              {pick(lang, c, "name")}
            </FooterLink>
          ))}
        </FooterCol>

        <FooterCol title={t("footerHelp")}>
          <FooterLink to="/politique">{t("footerPolicy")}</FooterLink>
          <FooterLink to="/contact">{t("footerContact")}</FooterLink>
        </FooterCol>

        <FooterCol title={t("footerContact")}>
          <a href={CONTACT_PHONE_HREF} className="text-sm text-muted transition hover:text-brand">
            {CONTACT_PHONE}
          </a>
        </FooterCol>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <span>
            © {year} {t("brandName")}. {t("footerRights")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FlowerMark className="h-3.5 w-3.5 text-brand" />
            {t("footerMadeIn")}
          </span>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-ink">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted transition hover:text-brand">
      {children}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-brand hover:text-brand"
    >
      {children}
    </a>
  );
}
