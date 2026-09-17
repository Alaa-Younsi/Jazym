import { Download, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { DeleteAllOrdersModal } from "@/components/admin/DeleteAllOrdersModal";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminOrders, useDeleteAllOrders } from "@/hooks/useOrders";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatDateTime } from "@/lib/format";
import { exportOrdersToXlsx } from "@/lib/exportOrders";
import { ORDER_STATUSES, orderStatusKey, orderStatusTone } from "@/lib/orderStatus";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types/db";

export default function Orders() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const { data, isLoading, isError } = useAdminOrders("all");
  const deleteAll = useDeleteAllOrders();
  const [modalOpen, setModalOpen] = useState(false);

  const orders = data?.rows ?? [];

  const groups = useMemo(() => {
    const map = new Map<OrderStatus, Order[]>();
    for (const s of ORDER_STATUSES) map.set(s, []);
    for (const o of orders) map.get(o.status)?.push(o);
    return map;
  }, [orders]);

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <LoadError message={t("adminLoadError")} />;

  async function onExport(rows: Order[]) {
    try {
      await exportOrdersToXlsx(rows);
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
            <ButtonLink to="/admin/orders/new" size="sm" variant="secondary">
              <Plus size={14} />
              {t("ordNewOrder")}
            </ButtonLink>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onExport(orders)}
              disabled={orders.length === 0}
            >
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

      {data.capped && (
        <p className="mb-3 rounded-lg bg-gold/15 px-3 py-2 text-xs text-ink">
          {t("ordShowingRecent", { count: orders.length })}
        </p>
      )}

      {orders.length === 0 ? (
        <EmptyState title={t("dashNoOrders")} />
      ) : (
        <div className="flex flex-col gap-8">
          {ORDER_STATUSES.map((status) => {
            const rows = groups.get(status) ?? [];
            if (rows.length === 0) return null;
            return (
              <section key={status}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusTone(status)}`}
                    >
                      {t(orderStatusKey(status))}
                    </span>
                    <span className="text-xs text-muted">
                      {t("ordSectionCount", { count: rows.length })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onExport(rows)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
                  >
                    <Download size={13} />
                    {t("ordExportStatus")}
                  </button>
                </div>

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
                          t("ordDate"),
                        ].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-start">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rows.map((o) => (
                        <tr key={o.id} className="hover:bg-panel-2/40">
                          <td className="whitespace-nowrap px-4 py-3">
                            <Link
                              to={`/admin/orders/${o.id}`}
                              className="font-mono text-xs text-brand hover:underline"
                            >
                              {o.order_number}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-ink">
                            {o.customer_name}
                          </td>
                          <td className="num-ltr whitespace-nowrap px-4 py-3 text-muted">
                            {o.customer_phone}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted">{o.wilaya}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Price value={o.total} className="text-ink" />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted">
                            {formatDateTime(o.created_at, lang)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
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
