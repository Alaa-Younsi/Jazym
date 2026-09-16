import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, LoadError, Toggle } from "@/components/admin/AdminUI";
import { SingleImageUpload } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import {
  toPanelFormState,
  useAdminPanel,
  useSavePanel,
  type PanelFormState,
} from "@/hooks/usePromoPanels";
import { useI18n } from "@/i18n/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PanelSlot } from "@/types/db";

const SLOT_LABEL_KEYS: Record<
  PanelSlot,
  "panelSlotHomeHero" | "panelSlotHomeMid" | "panelSlotCategoryTop" | "panelSlotCartDrawer"
> = {
  home_hero: "panelSlotHomeHero",
  home_mid: "panelSlotHomeMid",
  category_top: "panelSlotCategoryTop",
  cart_drawer: "panelSlotCartDrawer",
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function PanelForm() {
  const { id } = useParams();
  const { t } = useI18n();
  const toast = useAdminToast();
  const navigate = useNavigate();

  const { data: panel, isLoading, isError } = useAdminPanel(id);
  const save = useSavePanel();

  const [form, setForm] = useState<PanelFormState | null>(null);

  useEffect(() => {
    if (panel) setForm(toPanelFormState(panel));
  }, [panel]);

  if (!isSupabaseConfigured || isError) return <LoadError message={t("adminLoadError")} />;
  if (isLoading || !panel || !form) return <PageLoader />;

  const set = <K extends keyof PanelFormState>(key: K, value: PanelFormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !id) return;
    try {
      await save.mutateAsync({ id, form });
      toast.success(t("adminSaved"));
      navigate("/admin/panels");
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <AdminPageHeader
        title={t(SLOT_LABEL_KEYS[panel.slot])}
        actions={
          <>
            <Link
              to="/admin/panels"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink"
            >
              <ArrowLeft size={14} className="rtl:rotate-180" />
              {t("back")}
            </Link>
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : t("save")}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <AdminCard className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">{t("panelActive")}</span>
          <Toggle
            checked={form.active}
            onChange={(v) => set("active", v)}
            label={t("panelActive")}
          />
        </AdminCard>

        <AdminCard className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("panelTitle")}>
              <Input
                value={form.title_fr ?? ""}
                onChange={(e) => set("title_fr", e.target.value || null)}
              />
            </Field>
            <Field label={t("panelTitleAr")}>
              <Input
                dir="rtl"
                value={form.title_ar ?? ""}
                onChange={(e) => set("title_ar", e.target.value || null)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("panelSubtitle")}>
              <Input
                value={form.subtitle_fr ?? ""}
                onChange={(e) => set("subtitle_fr", e.target.value || null)}
              />
            </Field>
            <Field label={t("panelSubtitleAr")}>
              <Input
                dir="rtl"
                value={form.subtitle_ar ?? ""}
                onChange={(e) => set("subtitle_ar", e.target.value || null)}
              />
            </Field>
          </div>
          <Field label={t("panelLink")} hint="/boutique/… ou https://…">
            <Input
              dir="ltr"
              value={form.link_url ?? ""}
              onChange={(e) => set("link_url", e.target.value || null)}
            />
          </Field>
          <div>
            <span className="mb-1 block text-sm font-medium text-ink">{t("panelImage")}</span>
            <SingleImageUpload
              value={form.image_url}
              onChange={(url) => set("image_url", url)}
              bucket="product-images"
              prefix="panels/"
            />
          </div>
        </AdminCard>

        <AdminCard className="flex flex-col gap-4">
          <p className="text-xs text-muted">{t("panelScheduleHint")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("panelStartAt")}>
              <Input
                type="datetime-local"
                value={toDatetimeLocal(form.start_at)}
                onChange={(e) => set("start_at", fromDatetimeLocal(e.target.value))}
              />
            </Field>
            <Field label={t("panelEndAt")}>
              <Input
                type="datetime-local"
                value={toDatetimeLocal(form.end_at)}
                onChange={(e) => set("end_at", fromDatetimeLocal(e.target.value))}
              />
            </Field>
          </div>
        </AdminCard>
      </div>
    </form>
  );
}
