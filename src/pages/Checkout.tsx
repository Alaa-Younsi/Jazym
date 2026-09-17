import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckoutFields } from "@/components/checkout/CheckoutFields";
import { ProductThumb } from "@/components/product/ProductThumb";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Price } from "@/components/ui/Price";
import { usePixel } from "@/components/TrackingProvider";
import { useCartQuote } from "@/hooks/useCartQuote";
import { useDeliveryPrices } from "@/hooks/useDeliveryPrices";
import { useHoneypot } from "@/hooks/useHoneypot";
import { usePlaceOrder } from "@/hooks/useOrders";
import { resolveShipping, useStoreSettings } from "@/hooks/useStoreSettings";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/checkoutSchema";
import { variantSummary } from "@/lib/format";
import { orderErrorKey } from "@/lib/orderErrors";
import { useCart } from "@/store/cart";

export default function Checkout() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { track } = usePixel();
  const { isSpam, elapsedMs } = useHoneypot();
  const { lines, clear } = useCart();
  const { data: settings } = useStoreSettings();
  const { data: deliveryPrices = [] } = useDeliveryPrices(true);
  const placeOrder = usePlaceOrder();

  const [serverError, setServerError] = useState<string | null>(null);
  const checkoutTracked = useRef(false);

  useSeo({ title: t("checkoutTitle"), noindex: true });

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_type: "home", company: "" },
    mode: "onBlur",
  });

  const wilaya = form.watch("wilaya");
  const deliveryType = form.watch("delivery_type");

  const quote = useCartQuote();

  const wilayaRow = deliveryPrices.find((d) => d.wilaya === wilaya) ?? null;
  const wilayaFee = wilayaRow
    ? deliveryType === "office"
      ? wilayaRow.office_price
      : wilayaRow.home_price
    : null;
  const shipping = resolveShipping(wilayaFee, quote.total, settings);
  const total = quote.total + shipping.amount;

  useEffect(() => {
    if (checkoutTracked.current || lines.length === 0) return;
    checkoutTracked.current = true;
    track("initiate_checkout", {
      content_ids: lines.map((l) => l.productId),
      value: quote.total,
      currency: "DZD",
      num_items: lines.reduce((s, l) => s + l.quantity, 0),
    });
  }, [lines, quote.total, track]);

  if (lines.length === 0 && !placeOrder.isSuccess) {
    return <Navigate to="/boutique" replace />;
  }

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);
    const parsed = checkoutSchema.parse(values);
    if (isSpam(parsed.company)) return;

    try {
      const orderNumber = await placeOrder.mutateAsync({
        items: lines.map((l) => ({
          product_id: l.productId,
          variant_id: l.variantId,
          quantity: l.quantity,
          color: l.color,
          size: l.size,
          variants: l.variants,
        })),
        customer: {
          customer_name: parsed.customer_name,
          customer_phone: parsed.customer_phone,
          wilaya: parsed.wilaya,
          city: parsed.city,
          address: parsed.address || null,
          notes: parsed.notes || null,
          delivery_type: parsed.delivery_type,
          language: lang,
          elapsed_ms: elapsedMs(),
        },
      });
      track(
        "purchase",
        {
          content_ids: lines.map((l) => l.productId),
          value: total,
          currency: "DZD",
          num_items: lines.reduce((s, l) => s + l.quantity, 0),
        },
        orderNumber,
      );
      clear();
      navigate(`/commande/${orderNumber}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setServerError(t(orderErrorKey(message)));
    }
  }

  return (
    <Container className="py-10">
      <h1 className="fx-display text-3xl text-ink">{t("checkoutTitle")}</h1>
      <Link to="/boutique" className="mt-1 inline-block text-sm text-muted hover:text-brand">
        {t("checkoutBackToCart")}
      </Link>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]"
      >
        <div className="rounded-card border border-line bg-panel p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t("checkoutContact")}</h2>
          <CheckoutFields form={form} idPrefix="cart" />
          {serverError && (
            <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-panel p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">{t("checkoutSummary")}</h2>
            <ul className="flex flex-col gap-3">
              {lines.map((l) => {
                const summary = variantSummary(l.variants, lang);
                return (
                  <li key={l.key} className="flex gap-3">
                    <ProductThumb
                      src={l.image_url}
                      name={lang === "ar" ? l.name_ar : l.name_fr}
                      className="h-16 w-14 shrink-0 rounded-lg"
                      sizes="56px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-ink">
                        {lang === "ar" ? l.name_ar : l.name_fr}
                      </p>
                      <p className="text-xs text-muted">
                        {summary ? `${summary} · ` : ""}× {l.quantity}
                      </p>
                    </div>
                    <Price
                      value={quote.lines[l.key]?.net ?? l.unitPrice * l.quantity}
                      className="text-sm text-ink"
                    />
                  </li>
                );
              })}
            </ul>

            <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>{t("cartSubtotal")}</dt>
                <dd>
                  <Price value={quote.subtotal} className="text-ink" />
                </dd>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>{t("cartDiscount")}</dt>
                  <dd>
                    <Price value={quote.discount} prefix="-" />
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <dt>{t("cartShipping")}</dt>
                <dd>
                  {shipping.isPending ? (
                    <span>{t("checkoutShippingPending")}</span>
                  ) : shipping.isFree ? (
                    <span className="text-success">{t("checkoutFreeShip")}</span>
                  ) : (
                    <Price value={shipping.amount} className="text-ink" />
                  )}
                </dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
                <dt>{t("cartTotal")}</dt>
                <dd>
                  <Price value={total} />
                </dd>
              </div>
            </dl>

            <Button
              type="submit"
              size="lg"
              fullWidth
              className="mt-5"
              disabled={placeOrder.isPending}
            >
              {placeOrder.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("checkoutPlacing")}
                </>
              ) : (
                t("checkoutPlaceOrder")
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <ShieldCheck size={13} />
              {t("checkoutSecure")}
            </p>
          </div>
        </aside>
      </form>
    </Container>
  );
}
