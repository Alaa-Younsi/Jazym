import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";

export default function NotFound() {
  const { t } = useI18n();
  useSeo({ title: t("notFoundTitle"), noindex: true });

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <FlowerMark className="h-14 w-14 text-brand/40" />
      <p className="fx-display text-6xl text-ink">404</p>
      <h1 className="fx-display text-2xl text-ink">{t("notFoundTitle")}</h1>
      <p className="max-w-sm text-sm text-muted">{t("notFoundBody")}</p>
      <ButtonLink to="/" className="mt-2">
        {t("notFoundCta")}
      </ButtonLink>
    </Container>
  );
}
