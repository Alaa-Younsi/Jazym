import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/Button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { useAdminProducts } from "@/hooks/useAdminData";
import { useAdminCreateOrder, type AdminOrderLine } from "@/hooks/useOrders";
import { useI18n } from "@/i18n/LanguageProvider";
import { ORDER_STATUSES, orderStatusKey } from "@/lib/orderStatus";
import { isSupabaseConfigured } from "@/lib/supabase";
import { WILAYAS } from "@/lib/wilayas";
import type { DeliveryType, OrderStatus } from "@/types/db";

interface LineDraft {
  productId: string;
  variantId: string;
  name_fr: string;
  name_ar: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

function emptyLine(): LineDraft {
  return {
    productId: "",
    variantId: "",
    name_fr: "",
    name_ar: "",
    price: 0,
    quantity: 1,
    image_url: null,
  };
}

export default function OrderNew() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const navigate = useNavigate();
  const { data: products = [] } = useAdminProducts();
  const create = useAdminCreateOrder();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");
  const [shipping, setShipping] = useState(0);
  const [status, setStatus] = useState<OrderStatus>("confirmed");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);

  const activeProducts = products.filter((p) => p.status === "active");
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = subtotal + shipping;

  function updateLine(i: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function onSelectProduct(i: number, productId: string) {
    const product = activeProducts.find((p) => p.id === productId);
    if (!product) {
      updateLine(i, { productId: "", variantId: "" });
      return;
    }
    updateLine(i, {
      productId,
      variantId: "",
      name_fr: product.name_fr,
      name_ar: product.name_ar,
      price: product.price,
      image_url: product.product_images?.[0]?.url ?? null,
    });
  }

  function onSelectVariant(i: number, variantId: string) {
    const line = lines[i];
    const product = activeProducts.find((p) => p.id === line.productId);
    const variant = product?.product_variants?.find((v) => v.id === variantId);
    if (!variant) {
      updateLine(i, { variantId: "" });
      return;
    }
    updateLine(i, {
      variantId,
      price: variant.price,
      image_url: variant.image_url ?? line.image_url,
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    if (!customerName.trim() || !wilaya.trim()) {
      toast.error(t("ordManualBlockedFields"));
      return;
    }
    const validLines = lines.filter((l) => l.name_fr.trim() && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error(t("ordManualBlockedEmpty"));
      return;
    }
    const items: AdminOrderLine[] = validLines.map((l) => ({
      product_id: l.productId || null,
      variant_id: l.variantId || null,
      name_fr: l.name_fr.trim(),
      name_ar: l.name_ar.trim() || l.name_fr.trim(),
      price: l.price,
      quantity: l.quantity,
      image_url: l.image_url,
    }));

    try {
      const orderNumber = await create.mutateAsync({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        wilaya: wilaya.trim(),
        city: city.trim(),
        address: address.trim() || null,
        notes: notes.trim() || null,
        delivery_type: deliveryType,
        shipping,
        status,
        items,
      });
      toast.success(`${t("adminSaved")} (${orderNumber})`);
      navigate("/admin/orders");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message || t("adminSaveError"));
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <AdminPageHeader
        title={t("ordManualTitle")}
        description={t("ordManualHint")}
        actions={
          <>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink"
            >
              <ArrowLeft size={14} className="rtl:rotate-180" />
              {t("back")}
            </Link>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                t("ordManualCreate")
              )}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <AdminCard className="flex flex-col gap-3">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">{t("ordManualItems")}</h2>
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="inline-flex items-center gap-1 text-xs text-brand"
              >
                <Plus size={13} />
                {t("ordManualAddLine")}
              </button>
            </div>
            {lines.map((line, i) => {
              const product = activeProducts.find((p) => p.id === line.productId);
              const hasVariants = (product?.product_variants?.length ?? 0) > 0;
              return (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label={t("ordManualProduct")}>
                      <NativeSelect
                        value={line.productId}
                        onChange={(e) => onSelectProduct(i, e.target.value)}
                      >
                        <option value="">{t("ordManualProductNone")}</option>
                        {activeProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {lang === "ar" ? p.name_ar : p.name_fr}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    {hasVariants && (
                      <Field label={t("ordManualVariant")}>
                        <NativeSelect
                          value={line.variantId}
                          onChange={(e) => onSelectVariant(i, e.target.value)}
                        >
                          <option value="">—</option>
                          {product?.product_variants?.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.option1_value_fr}
                              {v.option2_value_fr ? ` / ${v.option2_value_fr}` : ""}
                            </option>
                          ))}
                        </NativeSelect>
                      </Field>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                    <Field label={t("ordManualItemName")}>
                      <Input
                        value={line.name_fr}
                        onChange={(e) => updateLine(i, { name_fr: e.target.value })}
                      />
                    </Field>
                    <Field label={t("ordManualUnitPrice")} className="w-28">
                      <Input
                        type="number"
                        min={0}
                        step={50}
                        value={line.price}
                        onChange={(e) => updateLine(i, { price: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label={t("productQuantity")} className="w-20">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(i, { quantity: Math.max(1, Number(e.target.value)) })
                        }
                      />
                    </Field>
                    <div className="flex items-end pb-2.5">
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                        disabled={lines.length === 1}
                        className="text-muted hover:text-danger disabled:opacity-30"
                        aria-label={t("delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </AdminCard>

          <AdminCard className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-ink">{t("checkoutContact")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("checkoutName")} required>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </Field>
              <Field label={t("checkoutPhone")}>
                <Input
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("checkoutWilaya")} required>
                <NativeSelect value={wilaya} onChange={(e) => setWilaya(e.target.value)}>
                  <option value="">{t("checkoutWilayaPlaceholder")}</option>
                  {WILAYAS.map((w) => (
                    <option key={w.code} value={w.name_fr}>
                      {lang === "ar" ? w.name_ar : w.name_fr}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label={t("checkoutCity")}>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
            </div>
            <Field label={t("checkoutAddress")}>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field label={t("checkoutNotes")}>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard className="flex flex-col gap-3">
            <Field label={t("ordManualInitialStatus")}>
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(orderStatusKey(s))}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("checkoutDelivery")}>
              <NativeSelect
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
              >
                <option value="home">{t("checkoutDeliveryHome")}</option>
                <option value="office">{t("checkoutDeliveryOffice")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("ordManualShipping")}>
              <Input
                type="number"
                min={0}
                step={50}
                value={shipping}
                onChange={(e) => setShipping(Math.max(0, Number(e.target.value)))}
              />
            </Field>
          </AdminCard>

          <AdminCard className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-muted">
              <span>{t("cartSubtotal")}</span>
              <Price value={subtotal} className="text-ink" />
            </div>
            <div className="flex justify-between text-muted">
              <span>{t("cartShipping")}</span>
              <Price value={shipping} className="text-ink" />
            </div>
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
              <span>{t("cartTotal")}</span>
              <Price value={total} />
            </div>
          </AdminCard>
        </div>
      </div>
    </form>
  );
}
