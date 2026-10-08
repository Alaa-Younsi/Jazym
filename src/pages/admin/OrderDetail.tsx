import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, LoadError } from "@/components/admin/AdminUI";
import { ProductThumb } from "@/components/product/ProductThumb";
import { Button } from "@/components/ui/Button";
import { NativeSelect, Textarea } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminOrder, useUpdateOrderNotes, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatDateTime, variantSummary } from "@/lib/format";
import { ORDER_STATUSES, orderStatusKey } from "@/lib/orderStatus";
import { toIntlPhone } from "@/lib/utils";
import type { OrderStatus } from "@/types/db";

export default function OrderDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const { data: order, isLoading, isError } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const updateNotes = useUpdateOrderNotes();
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (order) setNotesDraft(order.notes ?? "");
  }, [order]);

  if (isLoading) return <PageLoader />;
  if (isError || !order) return <LoadError message={t("adminLoadError")} />;

  async function onStatusChange(next: OrderStatus) {
    if (!order) return;
    try {
      await updateStatus.mutateAsync({ id: order.id, status: next });
      toast.success(t("adminSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function onSaveNotes() {
    if (!order) return;
    try {
      await updateNotes.mutateAsync({ id: order.id, notes: notesDraft.trim() || null });
      toast.success(t("adminSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  const waHref = `https://wa.me/${toIntlPhone(order.customer_phone).replace(
    /\D/g,
    "",
  )}?text=${encodeURIComponent(
    `${lang === "ar" ? "طلبكم رقم" : "Votre commande"} ${order.order_number} — ${t(
      orderStatusKey(order.status),
    )} — ${Math.round(order.total)} DA`,
  )}`;

  return (
    <div>
      <AdminPageHeader
        title={`${t("ordDetailTitle")} ${order.order_number}`}
        actions={
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            {t("back")}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <AdminCard>
          <h2 className="mb-3 text-sm font-semibold text-ink">{t("ordItems")}</h2>
          <ul className="divide-y divide-line">
            {(order.order_items ?? []).map((item) => {
              const summary = variantSummary(item.variants, lang);
              const parts = [item.color, item.size, summary].filter(Boolean).join(" · ");
              const uploads = item.variants
                .map((v) => v.custom_upload_url)
                .filter((u): u is string => !!u);
              return (
                <li key={item.id} className="flex gap-3 py-3">
                  <ProductThumb
                    src={item.image_url}
                    name={item.name_fr}
                    sizes="56px"
                    className="h-[70px] w-14 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      {lang === "ar" ? item.name_ar : item.name_fr}
                    </p>
                    {parts && <p className="text-xs text-muted">{parts}</p>}
                    <p className="text-xs text-muted">× {item.quantity}</p>
                    {uploads.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
                      >
                        {t("ordCustomUpload")}
                      </a>
                    ))}
                    {item.note && (
                      <p className="mt-1 rounded-md bg-panel-2 px-2 py-1 text-xs italic text-ink">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                  <Price value={item.price * item.quantity} className="text-sm text-ink" />
                </li>
              );
            })}
          </ul>

          <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
            <Row label={t("cartSubtotal")}>
              <Price value={order.subtotal} className="text-ink" />
            </Row>
            {order.discount > 0 && (
              <Row label={t("cartDiscount")} tone="success">
                <Price value={order.discount} prefix="-" />
              </Row>
            )}
            <Row label={t("cartShipping")}>
              <Price value={order.shipping} className="text-ink" />
            </Row>
            <Row label={t("cartTotal")} strong>
              <Price value={order.total} className="text-base font-semibold text-ink" />
            </Row>
          </dl>
        </AdminCard>

        <div className="flex flex-col gap-6">
          <AdminCard className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-ink">{t("ordUpdateStatus")}</h2>
            <NativeSelect
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(orderStatusKey(s))}
                </option>
              ))}
            </NativeSelect>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-success/90 px-4 py-2 text-sm font-medium text-white hover:bg-success"
            >
              <MessageCircle size={15} />
              {t("ordWhatsapp")}
            </a>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-2 text-sm font-semibold text-ink">{t("ordCustomerInfo")}</h2>
            <dl className="flex flex-col gap-1 text-sm">
              <Info label={t("ordCustomer")} value={order.customer_name} />
              <Info label={t("ordPhone")} value={order.customer_phone} ltr />
              <Info label={t("ordWilaya")} value={order.wilaya} />
              <Info label={t("checkoutCity")} value={order.city} />
              {order.address && <Info label={t("checkoutAddress")} value={order.address} />}
              <Info
                label={t("checkoutDelivery")}
                value={
                  order.delivery_type === "office"
                    ? t("checkoutDeliveryOffice")
                    : t("checkoutDeliveryHome")
                }
              />
              <Info label={t("ordDate")} value={formatDateTime(order.created_at, lang)} />
              {order.delivery_tracking && (
                <Info label={t("dhdTracking")} value={order.delivery_tracking} ltr />
              )}
            </dl>
          </AdminCard>

          <AdminCard className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-ink">{t("ordNotesTitle")}</h2>
            <Textarea
              rows={4}
              value={notesDraft}
              placeholder={t("ordNotesPlaceholder")}
              onChange={(e) => setNotesDraft(e.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={onSaveNotes}
              disabled={updateNotes.isPending || notesDraft === (order.notes ?? "")}
            >
              {updateNotes.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                t("ordNotesSave")
              )}
            </Button>
          </AdminCard>
        </div>
      </div>
    </div>
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
      className={`flex justify-between ${
        tone === "success" ? "text-success" : strong ? "text-ink" : "text-muted"
      }`}
    >
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Info({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-end text-ink ${ltr ? "num-ltr" : ""}`}>{value}</dd>
    </div>
  );
}
