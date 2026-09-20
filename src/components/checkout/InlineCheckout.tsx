import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Minus, Plus, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { usePixel } from "@/components/TrackingProvider";
import { useLineQuote } from "@/hooks/useCartQuote";
import { useDeliveryPrices } from "@/hooks/useDeliveryPrices";
import { useHoneypot } from "@/hooks/useHoneypot";
import { usePlaceOrder } from "@/hooks/useOrders";
import { resolveShipping, useStoreSettings } from "@/hooks/useStoreSettings";
import { useI18n } from "@/i18n/LanguageProvider";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/checkoutSchema";
import { orderErrorKey } from "@/lib/orderErrors";
import type { CartVariantPick, Product } from "@/types/db";
import { CheckoutFields } from "./CheckoutFields";

interface InlineCheckoutProps {
  product: Product;
  unitPrice: number;
  color: string | null;
  size: string | null;
  variants: CartVariantPick[];
  image_url: string | null;
  selectionComplete: boolean;
  onBlockedSubmit: () => void;
  variantId?: string | null;
  /** optional per-line note the shopper attached to this product */
  note?: string | null;
  /** effective stock to cap quantity against — defaults to product.stock */
  stock?: number;
}

export function InlineCheckout({
  product,
  unitPrice,
  color,
  size,
  variants,
  selectionComplete,
  onBlockedSubmit,
  variantId = null,
  note = null,
  stock,
}: InlineCheckoutProps) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { track } = usePixel();
  const { isSpam, elapsedMs } = useHoneypot();
  const { data: settings } = useStoreSettings();
  const { data: deliveryPrices = [] } = useDeliveryPrices(true);
  const placeOrder = usePlaceOrder();

  const [qty, setQty] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const trackedCheckoutId = useRef<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_type: "home", company: "" },
    mode: "onBlur",
  });

  const wilaya = form.watch("wilaya");
  const deliveryType = form.watch("delivery_type");
  const wilayaRow = deliveryPrices.find((d) => d.wilaya === wilaya) ?? null;
  const wilayaFee = wilayaRow
    ? deliveryType === "office"
      ? wilayaRow.office_price
      : wilayaRow.home_price
    : null;

  const effectiveStock = stock ?? product.stock;
  const maxQty = Math.max(1, Math.min(effectiveStock || 20, 20));
  const quote = useLineQuote({
    key: product.id,
    productId: product.id,
    categoryId: product.category_id,
    variantId,
    unitPrice,
    quantity: qty,
    quantityOffers: product.quantity_offers,
  });
  const shipping = resolveShipping(wilayaFee, quote.total, settings);
  const estimatedTotal = quote.total + shipping.amount;

  function handleFormFocus() {
    if (trackedCheckoutId.current === product.id) return;
    trackedCheckoutId.current = product.id;
    track("initiate_checkout", {
      content_ids: [product.id],
      content_type: "product",
      value: quote.total,
      currency: "DZD",
      num_items: qty,
    });
  }

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);
    if (!selectionComplete) {
      onBlockedSubmit();
      return;
    }
    const parsed = checkoutSchema.parse(values);
    if (isSpam(parsed.company)) return;

    try {
      const orderNumber = await placeOrder.mutateAsync({
        items: [
          {
            product_id: product.id,
            variant_id: variantId,
            quantity: qty,
            color,
            size,
            variants,
            note,
          },
        ],
        customer: {
          customer_name: parsed.customer_name,
          customer_phone: parsed.customer_phone,
          wilaya: parsed.wilaya,
          city: parsed.city,
          address: parsed.address || null,
          notes: null,
          delivery_type: parsed.delivery_type,
          language: lang,
          elapsed_ms: elapsedMs(),
        },
      });
      track(
        "purchase",
        {
          content_ids: [product.id],
          content_type: "product",
          value: estimatedTotal,
          currency: "DZD",
          num_items: qty,
        },
        orderNumber,
      );
      navigate(`/commande/${orderNumber}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setServerError(t(orderErrorKey(message)));
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onFocus={handleFormFocus}
      className="relative flex flex-col gap-4 rounded-card border border-line bg-panel p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{t("productBuyNow")}</span>
        <div className="inline-flex items-center rounded-full border border-line">
          <button
            type="button"
            aria-label="-"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-8 w-8 place-items-center text-muted hover:text-ink"
          >
            <Minus size={13} />
          </button>
          <span className="num-ltr w-8 text-center text-sm">{qty}</span>
          <button
            type="button"
            aria-label="+"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="grid h-8 w-8 place-items-center text-muted hover:text-ink disabled:opacity-40"
            disabled={qty >= maxQty}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <CheckoutFields form={form} idPrefix={`inline-${product.slug}`} />

      <dl className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
        <Row label={t("cartSubtotal")}>
          <Price value={quote.subtotal} />
        </Row>
        {quote.discount > 0 && (
          <Row label={t("cartDiscount")} tone="success">
            <Price value={quote.discount} prefix="-" />
          </Row>
        )}
        <Row label={t("cartShipping")}>
          {shipping.isPending ? (
            <span className="text-muted">{t("checkoutShippingPending")}</span>
          ) : shipping.isFree ? (
            <span className="text-success">{t("checkoutFreeShip")}</span>
          ) : (
            <Price value={shipping.amount} />
          )}
        </Row>
        <Row label={t("cartTotal")} strong>
          <Price value={estimatedTotal} className="text-base font-semibold text-ink" />
        </Row>
      </dl>

      {serverError && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={placeOrder.isPending}>
        {placeOrder.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t("checkoutPlacing")}
          </>
        ) : (
          t("checkoutPlaceOrder")
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck size={13} />
        {t("checkoutSecure")}
      </p>
    </form>
  );
}

function Row({
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
      className={`flex items-center justify-between ${
        tone === "success" ? "text-success" : strong ? "text-ink" : "text-muted"
      }`}
    >
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
