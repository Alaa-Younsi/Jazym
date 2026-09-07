import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { ProductThumb } from "@/components/product/ProductThumb";
import { ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminProducts, useDeleteProduct } from "@/hooks/useAdminData";
import { useI18n } from "@/i18n/LanguageProvider";

export default function AdminProducts() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const { data: products, isLoading, isError } = useAdminProducts();
  const del = useDeleteProduct();
  const [q, setQ] = useState("");

  if (isLoading) return <PageLoader />;
  if (isError || !products) return <LoadError message={t("adminLoadError")} />;

  const filtered = products.filter((p) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      p.name_fr.toLowerCase().includes(term) ||
      p.name_ar.includes(term) ||
      (p.style_code ?? "").toLowerCase().includes(term)
    );
  });

  async function onDelete(id: string) {
    if (!window.confirm(t("prodDeleteConfirm"))) return;
    try {
      await del.mutateAsync(id);
      toast.success(t("adminDeleted"));
    } catch {
      toast.error(t("adminDeleteError"));
    }
  }

  const lowCount = products.filter((p) => p.stock <= 3 && p.status === "active").length;

  return (
    <div>
      <AdminPageHeader
        title={t("prodListTitle")}
        description={lowCount > 0 ? `${lowCount} ${t("dashLowStock").toLowerCase()}` : undefined}
        actions={
          <ButtonLink to="/admin/products/new" size="sm">
            <Plus size={15} />
            {t("prodNew")}
          </ButtonLink>
        }
      />

      <div className="mb-4 max-w-xs">
        <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("shopEmpty")} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel-2 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 text-start">{t("prodName")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start">{t("prodPrice")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start">{t("prodStock")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start">{t("prodStatus")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-panel-2/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductThumb
                        src={p.product_images?.[0]?.url ?? null}
                        name={p.name_fr}
                        sizes="36px"
                        className="h-11 w-9 shrink-0 rounded"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {lang === "ar" ? p.name_ar : p.name_fr}
                        </p>
                        {p.style_code && <p className="text-xs text-muted">{p.style_code}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Price value={p.price} className="text-ink" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={
                        p.stock <= 0 ? "text-danger" : p.stock <= 3 ? "text-gold" : "text-muted"
                      }
                    >
                      {p.stock <= 0 ? t("outOfStock") : p.stock}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-panel-2 text-muted"
                      }`}
                    >
                      {p.status === "active" ? t("prodStatusActive") : t("prodStatusDraft")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-end">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="rounded-full border border-line p-1.5 text-muted hover:border-brand hover:text-brand"
                        aria-label={t("edit")}
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="rounded-full border border-line px-2 py-1 text-xs text-muted hover:border-danger hover:text-danger"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
