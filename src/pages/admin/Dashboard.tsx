import { Link } from "react-router-dom";
import { AdminPageHeader, EmptyState, StatCard } from "@/components/admin/AdminUI";
import { Price } from "@/components/ui/Price";
import { useAdminProducts } from "@/hooks/useAdminData";
import { useAdminOrders } from "@/hooks/useOrders";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { orderStatusKey } from "@/lib/orderStatus";

export default function Dashboard() {
  const { t, lang } = useI18n();
  // The overview is visible to every active staff member, but its tiles are
  // not. RLS returns an empty set to a worker without the section, which would
  // render as a confident "0 orders / 0 DA revenue" — worse than not showing
  // the tile at all. Ask first, then don't even make the request.
  const { hasSection } = useAdminProfile();
  const canSeeOrders = hasSection("orders");
  const canSeeProducts = hasSection("products");

  const { data: ordersRes } = useAdminOrders("all", canSeeOrders);
  const { data: products = [] } = useAdminProducts(canSeeProducts);
  const orders = ordersRes?.rows ?? [];
  const capped = ordersRes?.capped ?? false;

  const pending = orders.filter((o) => o.status === "pending").length;
  const deliveredRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total, 0);
  const bookedRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const activeProducts = products.filter((p) => p.status === "active").length;
  const lowStock = products.filter((p) => p.stock <= 3 && p.status === "active").length;

  return (
    <div>
      <AdminPageHeader title={t("adminSecDashboard")} />

      {capped && (
        <p className="mb-4 rounded-lg bg-gold/15 px-3 py-2 text-xs text-ink">
          {t("ordShowingRecent", { count: orders.length })}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canSeeOrders && (
          <>
            <StatCard label={t("dashOrdersTotal")} value={orders.length} />
            <StatCard label={t("dashOrdersPending")} value={pending} />
            <StatCard
              label={t("dashRevenue")}
              value={<Price value={deliveredRevenue} />}
              hint={
                <>
                  {t("dashRevenueBooked")}: <Price value={bookedRevenue} />
                </>
              }
            />
          </>
        )}
        {canSeeProducts && (
          <>
            <StatCard label={t("dashProductsActive")} value={activeProducts} />
            <StatCard
              label={t("dashLowStock")}
              value={lowStock}
              tone={lowStock > 0 ? "danger" : undefined}
            />
          </>
        )}
      </div>

      {canSeeOrders && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">{t("dashRecentOrders")}</h2>
          {orders.length === 0 ? (
            <EmptyState title={t("dashNoOrders")} />
          ) : (
            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full text-sm">
                <thead className="bg-panel-2 text-start text-xs uppercase text-muted">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-start">{t("ordNumber")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-start">{t("ordCustomer")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-start">{t("ordWilaya")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-start">{t("ordTotal")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-start">
                      {t("ordFilterStatus")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-start">{t("ordDate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="hover:bg-panel-2/50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link to={`/admin/orders/${o.id}`} className="font-mono text-xs text-brand">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{o.customer_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{o.wilaya}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Price value={o.total} className="text-ink" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {t(orderStatusKey(o.status))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {formatDate(o.created_at, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
