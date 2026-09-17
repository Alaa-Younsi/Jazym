import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminPageHeader, LoadError, Toggle } from "@/components/admin/AdminUI";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminDeliveryPrices, useUpdateDeliveryPrice } from "@/hooks/useAdminData";
import { useI18n } from "@/i18n/LanguageProvider";
import { WILAYA_COUNT } from "@/lib/wilayas";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/cn";

export default function DeliveryPrices() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const { data: rows, isLoading, isError } = useAdminDeliveryPrices();
  const update = useUpdateDeliveryPrice();

  if (isLoading) return <PageLoader />;
  if (isError || !rows) return <LoadError message={t("adminLoadError")} />;

  async function commit(
    id: string,
    field: "home_price" | "office_price",
    input: HTMLInputElement,
    previous: number,
  ) {
    const value = Math.max(0, Number(input.value));
    if (value === previous) return;
    if (!isSupabaseConfigured) {
      input.value = String(previous); // revert — no backend
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      await update.mutateAsync({ id, patch: { [field]: value } });
    } catch {
      input.value = String(previous); // revert on refused write
      toast.error(t("adminSaveError"));
    }
  }

  async function toggleActive(id: string, next: boolean) {
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      await update.mutateAsync({ id, patch: { active: next } });
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t("delListTitle")}
        description={t("delWilayaCount", { count: rows.length })}
      />

      {rows.length < WILAYA_COUNT && (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {rows.length}/{WILAYA_COUNT} — {t("adminLoadError")}
        </p>
      )}

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-panel-2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t("delWilaya")}</th>
              <th className="w-32 px-4 py-3 text-start">{t("delHome")}</th>
              <th className="w-32 px-4 py-3 text-start">{t("delOffice")}</th>
              <th className="w-20 px-4 py-3 text-start">{t("delActive")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className={cn("hover:bg-panel-2/40", !row.active && "opacity-50")}>
                <td className="px-4 py-2.5 text-ink">{row.wilaya}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    defaultValue={row.home_price}
                    onBlur={(e) => commit(row.id, "home_price", e.currentTarget, row.home_price)}
                    className="w-24 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    defaultValue={row.office_price}
                    onBlur={(e) =>
                      commit(row.id, "office_price", e.currentTarget, row.office_price)
                    }
                    className="w-24 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <Toggle
                    checked={row.active}
                    onChange={(v) => toggleActive(row.id, v)}
                    label={t("delActive")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
