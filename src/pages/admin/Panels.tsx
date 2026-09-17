import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminCard, AdminPageHeader, LoadError } from "@/components/admin/AdminUI";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminPanels } from "@/hooks/usePromoPanels";
import { useI18n } from "@/i18n/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PanelSlot } from "@/types/db";

export const SLOT_LABEL_KEYS: Record<
  PanelSlot,
  "panelSlotHomeHero" | "panelSlotHomeMid" | "panelSlotCategoryTop" | "panelSlotCartDrawer"
> = {
  home_hero: "panelSlotHomeHero",
  home_mid: "panelSlotHomeMid",
  category_top: "panelSlotCategoryTop",
  cart_drawer: "panelSlotCartDrawer",
};

export default function Panels() {
  const { t, lang } = useI18n();
  const { data: panels, isLoading, isError } = useAdminPanels();

  if (!isSupabaseConfigured) {
    return (
      <div>
        <AdminPageHeader title={t("panelListTitle")} />
        <LoadError message={t("adminNeedsSupabase")} />
      </div>
    );
  }
  if (isLoading) return <PageLoader />;
  if (isError || !panels) return <LoadError message={t("adminLoadError")} />;

  return (
    <div>
      <AdminPageHeader title={t("panelListTitle")} description={t("panelListHint")} />

      <div className="grid gap-3">
        {panels.map((p) => {
          const scheduled = p.start_at || p.end_at;
          return (
            <AdminCard key={p.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t(SLOT_LABEL_KEYS[p.slot])}</p>
                {p.title_fr || p.title_ar ? (
                  <p className="truncate text-xs text-muted">
                    {lang === "ar" ? p.title_ar : p.title_fr}
                  </p>
                ) : (
                  <p className="text-xs text-muted">{t("panelEmpty")}</p>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  p.active ? "bg-success/10 text-success" : "bg-panel-2 text-muted"
                }`}
              >
                {p.active ? t("panelActive") : t("panelInactive")}
              </span>
              {scheduled && (
                <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-muted">
                  {t("panelScheduled")}
                </span>
              )}
              <Link
                to={`/admin/panels/${p.id}`}
                className="rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand"
                aria-label={t("edit")}
              >
                <Pencil size={14} />
              </Link>
            </AdminCard>
          );
        })}
      </div>
    </div>
  );
}
