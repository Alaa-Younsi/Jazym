import { ChevronDown, Download, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { DeleteAllOrdersModal } from "@/components/admin/DeleteAllOrdersModal";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminOrders, useDeleteAllOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { exportOrdersToXlsx } from "@/lib/exportOrders";
import { ORDER_STATUSES, orderStatusKey, orderStatusTone } from "@/lib/orderStatus";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types/db";

/**
 * The orders desk, organised around status rather than one flat list:
 *
 *  - a board rail across the top — one tile per status with its order count and
 *    the money sitting in it, doubling as a filter;
 *  - one collapsible section per status below, each with its own export;
 *  - a per-row status picker, so an order is advanced from here without
 *    opening it.
 *
 * Statuses are rendered in the ORDER_STATUSES pipeline order (pending →
 * confirmed → shipped → delivered → cancelled), which is the order the client
 * actually works through them in.
 */
export default function Orders() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const { data, isLoading, isError } = useAdminOrders("all");
  const deleteAll = useDeleteAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const [focus, setFocus] = useState<OrderStatus | null>(null);
  const [collapsed, setCollapsed] = useState<Set<OrderStatus>>(new Set());

  const orders = useMemo(() => data?.rows ?? [], [data]);

  const groups = useMemo(() => {
    const map = new Map<OrderStatus, Order[]>();
    for (const s of ORDER_STATUSES) map.set(s, []);
    for (const o of orders) map.get(o.status)?.push(o);
    return map;
  }, [orders]);

  const totals = useMemo(() => {
    const map = new Map<OrderStatus, number>();
    for (const s of ORDER_STATUSES) {
      map.set(
        s,
        (groups.get(s) ?? []).reduce((sum, o) => sum + o.total, 0),
      );
    }
    return map;
  }, [groups]);

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

  async function onMove(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    if (!isSupabaseConfigured) {
      toast.error(t("ordStatusChangeError"));
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
      toast.success(t("ordStatusChanged"));
    } catch {
      toast.error(t("ordStatusChangeError"));
    }
  }

  function toggle(status: OrderStatus) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  const visibleStatuses = focus ? [focus] : ORDER_STATUSES;

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
        <>
          {/* ---------- status board / filter rail ---------- */}
          <section className="mb-6">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">{t("ordBoardTitle")}</h2>
              <p className="text-xs text-muted">{t("ordBoardHint")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {ORDER_STATUSES.map((status) => {
                const rows = groups.get(status) ?? [];
                const active = focus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFocus(active ? null : status)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-card border p-3 text-start transition",
                      active
                        ? "border-brand bg-brand-soft/50 shadow-soft"
                        : "border-line bg-panel hover:border-brand/50 hover:bg-panel-2",
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.68rem] font-medium",
                        orderStatusTone(status),
                      )}
                    >
                      {t(orderStatusKey(status))}
                    </span>
                    <span className="num-ltr fx-display text-2xl leading-none text-ink">
                      {rows.length}
                    </span>
                    <Price value={totals.get(status) ?? 0} className="text-[0.7rem] text-muted" />
                  </button>
                );
              })}
            </div>
            {focus && (
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="mt-2 text-xs font-medium text-brand hover:underline"
              >
                {t("ordBoardAll")}
              </button>
            )}
          </section>

          {/* ---------- one section per status ---------- */}
          <div className="flex flex-col gap-6">
            {visibleStatuses.map((status) => {
              const rows = groups.get(status) ?? [];
              // With a filter on, show the (empty) section so the click still
              // gives feedback; without one, hide statuses that have nothing.
              if (rows.length === 0 && !focus) return null;
              const isCollapsed = collapsed.has(status);

              return (
                <section key={status}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggle(status)}
                      aria-expanded={!isCollapsed}
                      className="flex min-w-0 items-center gap-2 text-start"
                    >
                      <ChevronDown
                        size={15}
                        className={cn(
                          "shrink-0 text-muted transition-transform duration-200",
                          isCollapsed && "-rotate-90 rtl:rotate-90",
                        )}
                      />
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          orderStatusTone(status),
                        )}
                      >
                        {t(orderStatusKey(status))}
                      </span>
                      <span className="truncate text-xs text-muted">
                        {t("ordSectionCount", { count: rows.length })}
                      </span>
                      <span className="hidden items-center gap-1 text-xs text-muted sm:inline-flex">
                        · {t("ordSectionValue")}
                        <Price value={totals.get(status) ?? 0} />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onExport(rows)}
                      disabled={rows.length === 0}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-40"
                    >
                      <Download size={13} />
                      {t("ordExportStatus")}
                    </button>
                  </div>

                  {isCollapsed ? null : rows.length === 0 ? (
                    <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
                      {t("ordNoneInStatus")}
                    </p>
                  ) : (
                    <>
                      {/* phone: one card per order — a 7-column table on a
                          360px screen is a horizontal-scroll trap */}
                      <ul className="flex flex-col gap-2 md:hidden">
                        {rows.map((o) => (
                          <li
                            key={o.id}
                            className="rounded-card border border-line bg-panel p-3 text-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/admin/orders/${o.id}`}
                                className="font-mono text-xs text-brand hover:underline"
                              >
                                {o.order_number}
                              </Link>
                              <Price value={o.total} className="font-semibold text-ink" />
                            </div>
                            <p className="mt-1 truncate text-ink">{o.customer_name}</p>
                            <p className="num-ltr truncate text-xs text-muted">
                              {o.customer_phone} · {o.wilaya}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {formatDateTime(o.created_at, lang)}
                            </p>
                            <StatusPicker order={o} onMove={onMove} label={t("ordMoveTo")} />
                          </li>
                        ))}
                      </ul>

                      <div className="hidden overflow-x-auto rounded-card border border-line md:block">
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
                                t("ordMoveTo"),
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
                                <td className="whitespace-nowrap px-4 py-3 text-muted">
                                  {o.wilaya}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  <Price value={o.total} className="text-ink" />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted">
                                  {formatDateTime(o.created_at, lang)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  <StatusPicker order={o} onMove={onMove} compact />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              );
            })}
          </div>
        </>
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

/** Advance an order without leaving the list. */
function StatusPicker({
  order,
  onMove,
  label,
  compact,
}: {
  order: Order;
  onMove: (order: Order, status: OrderStatus) => void;
  label?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  return (
    <label className={cn("flex items-center gap-2", compact ? "" : "mt-2")}>
      {label && <span className="sr-only sm:not-sr-only sm:text-xs sm:text-muted">{label}</span>}
      <select
        value={order.status}
        onChange={(e) => onMove(order, e.target.value as OrderStatus)}
        aria-label={t("ordUpdateStatus")}
        className={cn(
          "min-w-0 flex-1 rounded-full border border-line bg-panel px-3 text-xs text-ink outline-none transition focus:border-brand",
          compact ? "h-8" : "h-9",
        )}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(orderStatusKey(s))}
          </option>
        ))}
      </select>
    </label>
  );
}
