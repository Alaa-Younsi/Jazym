import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { ButtonLink } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminLandingPages, useDeleteLandingPage } from "@/hooks/useLandingPages";
import { useI18n } from "@/i18n/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function LandingPages() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const { data: pages, isLoading, isError } = useAdminLandingPages();
  const del = useDeleteLandingPage();

  if (!isSupabaseConfigured) {
    return (
      <div>
        <AdminPageHeader title={t("lpListTitle")} />
        <LoadError message={t("adminNeedsSupabase")} />
      </div>
    );
  }
  if (isLoading) return <PageLoader />;
  if (isError || !pages) return <LoadError message={t("adminLoadError")} />;

  async function onDelete(id: string) {
    if (!window.confirm(t("lpDeleteConfirm"))) return;
    try {
      await del.mutateAsync(id);
      toast.success(t("adminDeleted"));
    } catch {
      toast.error(t("adminDeleteError"));
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t("lpListTitle")}
        actions={
          <ButtonLink to="/admin/landing/new" size="sm">
            <Plus size={15} />
            {t("lpNew")}
          </ButtonLink>
        }
      />

      {pages.length === 0 ? (
        <EmptyState title={t("lpListTitle")} />
      ) : (
        <div className="grid gap-3">
          {pages.map((p) => (
            <AdminCard key={p.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {lang === "ar" ? p.title_ar : p.title_fr}
                </p>
                <p className="num-ltr text-xs text-muted">/lp/{p.slug}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  p.status === "published" ? "bg-success/10 text-success" : "bg-panel-2 text-muted"
                }`}
              >
                {p.status === "published" ? t("lpStatusPublished") : t("lpStatusDraft")}
              </span>
              {p.status === "published" && (
                <a
                  href={`/lp/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand"
                  aria-label={t("lpOpen")}
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <Link
                to={`/admin/landing/${p.id}`}
                className="rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand"
                aria-label={t("edit")}
              >
                <Pencil size={14} />
              </Link>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                className="rounded-full border border-line p-2 text-muted hover:border-danger hover:text-danger"
                aria-label={t("delete")}
              >
                <Trash2 size={14} />
              </button>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
