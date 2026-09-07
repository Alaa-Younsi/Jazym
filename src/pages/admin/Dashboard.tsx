import { Link } from "react-router-dom";
import { AdminPageHeader, EmptyState, StatCard } from "@/components/admin/AdminUI";
import { Price } from "@/components/ui/Price";
import { useAdminProducts } from "@/hooks/useAdminData";
import { useAdminOrders } from "@/hooks/useOrders";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { orderStatusKey } from "@/lib/orderStatus";

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { data: ordersRes } = useAdminOrders("all");
  const { data: products = [] } = useAdminProducts();
  const orders = ordersRes?.rows ?? [];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("dashOrdersTotal")} value={orders.length} />
        <StatCard label={t("dashOrdersPending")} value={pending} />
        <StatCard
          label={t("dashRevenue")}
          value={`${new Intl.NumberFormat("fr-FR").format(Math.round(deliveredRevenue))} DA`}
          hint={`${t("dashRevenueBooked")}: ${new Intl.NumberFormat("fr-FR").format(
            Math.round(bookedRevenue),
          )} DA`}
        />
        <StatCard label={t("dashProductsActive")} value={activeProducts} />
        <StatCard
          label={t("dashLowStock")}
          value={lowStock}
          tone={lowStock > 0 ? "danger" : undefined}
        />
      </div>

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
                  <th className="whitespace-nowrap px-4 py-3 text-start">{t("ordFilterStatus")}</th>
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
    </div>
  );
}
