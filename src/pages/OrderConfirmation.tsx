import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FlowerMark } from "@/components/ui/FlowerMark";
import { Price } from "@/components/ui/Price";
import { Spinner } from "@/components/ui/Spinner";
import { useOrderByNumber } from "@/hooks/useOrders";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { variantSummary } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const { t, lang } = useI18n();
  const { data: order, isLoading } = useOrderByNumber(orderNumber);
  const [copied, setCopied] = useState(false);

  useSeo({ title: t("confirmTitle"), noindex: true });

  function copy() {
    if (!orderNumber) return;
    navigator.clipboard?.writeText(orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Container className="flex flex-col items-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-success/12 text-success">
        <CheckCircle2 size={32} />
      </span>
      <h1 className="fx-display mt-5 text-3xl text-ink">{t("confirmTitle")}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">{t("confirmBody")}</p>

      <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-line bg-panel px-5 py-2.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t("confirmOrderNumber")}
        </span>
        <span className="num-ltr font-mono text-sm font-semibold text-ink">{orderNumber}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="copy"
          className="text-muted transition hover:text-brand"
        >
          {copied ? <CheckCircle2 size={15} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>

      {isLoading && isSupabaseConfigured && (
        <div className="mt-10">
          <Spinner />
        </div>
      )}

      {order && (
        <div className="mt-10 w-full max-w-md rounded-card border border-line bg-panel p-6 text-start">
          <h2 className="text-sm font-semibold text-ink">{t("confirmRecap")}</h2>
          <ul className="mt-3 flex flex-col gap-2 border-b border-line pb-4">
            {order.items.map((item, i) => {
              const summary = variantSummary(item.variants, lang);
              const parts = [item.color, item.size, summary].filter(Boolean).join(" · ");
              return (
                <li key={i} className="flex justify-between gap-3 text-sm">
                  <span className="text-ink">
                    {lang === "ar" ? item.name_ar : item.name_fr}
                    <span className="text-muted"> × {item.quantity}</span>
                    {parts && <span className="block text-xs text-muted">{parts}</span>}
                    {item.note && (
                      <span className="block text-xs italic text-muted">"{item.note}"</span>
                    )}
                  </span>
                  <Price value={item.price * item.quantity} className="text-ink" />
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 flex flex-col gap-1.5 text-sm">
            <Line label={t("cartSubtotal")}>
              <Price value={order.subtotal} className="text-ink" />
            </Line>
            {order.discount > 0 && (
              <Line label={t("cartDiscount")} tone="success">
                <Price value={order.discount} prefix="-" />
              </Line>
            )}
            <Line label={t("cartShipping")}>
              {order.shipping === 0 ? (
                <span className="text-success">{t("checkoutFreeShip")}</span>
              ) : (
                <Price value={order.shipping} className="text-ink" />
              )}
            </Line>
            <Line label={t("cartTotal")} strong>
              <Price value={order.total} className="text-base font-semibold text-ink" />
            </Line>
          </dl>
          <p className="mt-4 text-xs text-muted">
            {t("confirmDeliverTo")} : {order.customer_name} — {order.city}, {order.wilaya}
          </p>
        </div>
      )}

      <div className="mt-10 flex items-center gap-2 text-xs text-muted">
        <FlowerMark className="h-4 w-4 text-brand" />
        {t("brandTagline")}
      </div>
      <ButtonLink to="/" variant="secondary" className="mt-4">
        {t("confirmContinue")}
      </ButtonLink>
    </Container>
  );
}

function Line({
  label,
  children,
  tone,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "success";
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        tone === "success" ? "text-success" : strong ? "text-ink" : "text-muted"
      }`}
    >
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
