import { Pencil, Percent, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  LoadError,
  Toggle,
} from "@/components/admin/AdminUI";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import {
  useAdminPromotions,
  useDeletePromotion,
  useSavePromotion,
  toPromotionFormState,
} from "@/hooks/usePromotions";
import { useI18n } from "@/i18n/LanguageProvider";
import { scheduleState, type ScheduleState } from "@/lib/datetime";
import { formatDate } from "@/lib/format";
import { promotionLabel } from "@/lib/promotions";
import { cn } from "@/lib/cn";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Promotion, PromotionType } from "@/types/db";

export const TYPE_LABEL_KEYS = {
  buy_x_get_y: "promoTypeBuyXGetY",
  buy_x_percent: "promoTypeBuyXPercent",
  category_percent: "promoTypeCategoryPercent",
  pack: "promoTypePack",
} as const satisfies Record<PromotionType, string>;

const STATE_STYLES: Record<ScheduleState, string> = {
  live: "bg-success/12 text-success",
  scheduled: "bg-brand-soft text-brand",
  expired: "bg-danger/10 text-danger",
  off: "bg-panel-2 text-muted",
};

const STATE_LABEL_KEYS = {
  live: "promoActive",
  scheduled: "promoScheduled",
  expired: "promoExpired",
  off: "promoInactive",
} as const;

export default function Promotions() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const { data: promotions, isLoading, isError } = useAdminPromotions();
  const save = useSavePromotion();
  const remove = useDeletePromotion();
  const [pendingDelete, setPendingDelete] = useState<Promotion | null>(null);

  if (isLoading) return <PageLoader />;
  if (isError || !promotions) return <LoadError message={t("adminLoadError")} />;

  async function toggleActive(promo: Promotion, active: boolean) {
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      await save.mutateAsync({ id: promo.id, form: { ...toPromotionFormState(promo), active } });
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success(t("adminDeleted"));
    } catch {
      toast.error(t("adminDeleteError"));
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t("promoListTitle")}
        description={t("promoListHint")}
        actions={
          <ButtonLink to="/admin/promotions/new" size="sm">
            <Plus size={15} />
            {t("promoNew")}
          </ButtonLink>
        }
      />

      {promotions.length === 0 ? (
        <EmptyState
          title={t("promoEmpty")}
          hint={t("promoListHint")}
          action={
            <ButtonLink to="/admin/promotions/new" size="sm">
              <Plus size={15} />
              {t("promoNew")}
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-3">
          {promotions.map((promo) => (
            <PromotionRow
              key={promo.id}
              promo={promo}
              onToggle={(v) => toggleActive(promo, v)}
              onDelete={() => setPendingDelete(promo)}
            />
          ))}
        </div>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t("promoDeleteConfirm")}
      >
        <p className="text-sm text-muted">{pendingDelete?.name}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={remove.isPending}>
            {t("delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function PromotionRow({
  promo,
  onToggle,
  onDelete,
}: {
  promo: Promotion;
  onToggle: (value: boolean) => void;
  onDelete: () => void;
}) {
  const { t, lang } = useI18n();
  const state = scheduleState(promo.active, promo.starts_at, promo.ends_at);

  return (
    <AdminCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Percent size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-ink">{promo.name}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
              STATE_STYLES[state],
            )}
          >
            {t(STATE_LABEL_KEYS[state])}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">{t(TYPE_LABEL_KEYS[promo.type])}</p>
        <p className="mt-1 text-xs text-brand">{promotionLabel(promo, lang)}</p>
        {(promo.starts_at || promo.ends_at) && (
          <p className="num-ltr mt-1 text-[0.7rem] text-muted">
            {promo.starts_at ? formatDate(promo.starts_at, lang) : "—"}
            {" → "}
            {promo.ends_at ? formatDate(promo.ends_at, lang) : "∞"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        <Toggle checked={promo.active} onChange={onToggle} label={t("promoActive")} />
        <Link
          to={`/admin/promotions/${promo.id}`}
          aria-label={t("edit")}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-brand hover:text-brand"
        >
          <Pencil size={15} />
        </Link>
        <button
          type="button"
          aria-label={t("delete")}
          onClick={onDelete}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-danger hover:text-danger"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </AdminCard>
  );
}
