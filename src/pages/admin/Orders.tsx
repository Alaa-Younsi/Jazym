import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { DeleteAllOrdersModal } from "@/components/admin/DeleteAllOrdersModal";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminOrders, useDeleteAllOrders } from "@/hooks/useOrders";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatDateTime } from "@/lib/format";
import { exportOrdersToXlsx } from "@/lib/exportOrders";
import { ORDER_STATUSES, orderStatusKey, orderStatusTone } from "@/lib/orderStatus";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { OrderStatus } from "@/types/db";

export default function Orders() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const { data, isLoading, isError } = useAdminOrders(status);
  const deleteAll = useDeleteAllOrders();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <LoadError message={t("adminLoadError")} />;

  const orders = data.rows;

  async function onExport() {
    try {
      await exportOrdersToXlsx(orders);
    } catch {
      toast.error(t("adminExportError"));
    }
  }

  async function onDeleteAll() {
    if (!isSupabaseConfigured) {
      toast.error(t("adminDeleteError"));
      return;
    }
    try {
      await deleteAll.mutateAsync();
      toast.success(t("adminDeleted"));
    } catch {
      toast.error(t("adminDeleteError"));
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t("ordListTitle")}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={onExport} disabled={orders.length === 0}>
              <Download size={14} />
              {t("ordExport")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setModalOpen(true)}
              disabled={orders.length === 0}
            >
              <Trash2 size={14} />
              {t("ordDeleteAll")}
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted">{t("ordFilterStatus")}</span>
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          className="h-9 w-auto py-0 text-sm"
        >
          <option value="all">{t("all")}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(orderStatusKey(s))}
            </option>
          ))}
        </NativeSelect>
      </div>

      {data.capped && (
        <p className="mb-3 rounded-lg bg-gold/15 px-3 py-2 text-xs text-ink">
          {t("ordShowingRecent", { count: orders.length })}
        </p>
      )}

      {orders.length === 0 ? (
        <EmptyState title={t("dashNoOrders")} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel-2 text-xs uppercase text-muted">
              <tr>
                {[
                  t("ordNumber"),
                  t("ordCustomer"),
                  t("ordPhone"),
                  t("ordWilaya"),
                  t("ordTotal"),
                  t("ordFilterStatus"),
                  t("ordDate"),
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-start">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-panel-2/40">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="font-mono text-xs text-brand hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink">{o.customer_name}</td>
                  <td className="num-ltr whitespace-nowrap px-4 py-3 text-muted">
                    {o.customer_phone}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{o.wilaya}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Price value={o.total} className="text-ink" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${orderStatusTone(o.status)}`}
                    >
                      {t(orderStatusKey(o.status))}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDateTime(o.created_at, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteAllOrdersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={orders}
        onConfirm={onDeleteAll}
      />
    </div>
  );
}
