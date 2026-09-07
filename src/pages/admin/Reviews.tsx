import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  LoadError,
  Toggle,
} from "@/components/admin/AdminUI";
import { SingleImageUpload } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { Stars } from "@/components/ui/Stars";
import {
  useAdminReviews,
  useDeleteReview,
  useSaveReview,
  type ReviewFormState,
} from "@/hooks/useAdminData";
import { useI18n } from "@/i18n/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ClientReview } from "@/types/db";

const EMPTY: ReviewFormState = {
  client_name: "",
  stars: 5,
  review_text: "",
  image_url: null,
  active: true,
};

export default function Reviews() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const { data: reviews, isLoading, isError } = useAdminReviews();
  const save = useSaveReview();
  const del = useDeleteReview();

  const [editing, setEditing] = useState<ClientReview | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ReviewFormState>(EMPTY);

  if (isLoading) return <PageLoader />;
  if (isError || !reviews) return <LoadError message={t("adminLoadError")} />;

  const open = creating || !!editing;
  const set = <K extends keyof ReviewFormState>(k: K, v: ReviewFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function openNew() {
    setForm(EMPTY);
    setCreating(true);
    setEditing(null);
  }
  function openEdit(r: ClientReview) {
    setForm({
      client_name: r.client_name,
      stars: r.stars,
      review_text: r.review_text,
      image_url: r.image_url,
      active: r.active,
    });
    setEditing(r);
    setCreating(false);
  }

  async function onSave() {
    if (!form.client_name.trim() || !form.review_text.trim()) {
      toast.error(t("adminSaveError"));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      await save.mutateAsync({ id: editing?.id, form });
      toast.success(t("adminSaved"));
      setCreating(false);
      setEditing(null);
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function onToggle(r: ClientReview) {
    if (!isSupabaseConfigured) return;
    try {
      await save.mutateAsync({
        id: r.id,
        form: {
          client_name: r.client_name,
          stars: r.stars,
          review_text: r.review_text,
          image_url: r.image_url,
          active: !r.active,
        },
      });
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

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
        title={t("revListTitle")}
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus size={15} />
            {t("revNew")}
          </Button>
        }
      />

      {reviews.length === 0 ? (
        <EmptyState title={t("revListTitle")} />
      ) : (
        <div className="grid gap-3">
          {reviews.map((r) => (
            <AdminCard key={r.id} className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Stars value={r.stars} size={13} />
                  <span className="text-sm font-medium text-ink">{r.client_name}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{r.review_text}</p>
              </div>
              <Toggle checked={r.active} onChange={() => onToggle(r)} label={t("revActive")} />
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand"
                aria-label={t("edit")}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(r.id)}
                className="rounded-full border border-line p-2 text-muted hover:border-danger hover:text-danger"
                aria-label={t("delete")}
              >
                <Trash2 size={14} />
              </button>
            </AdminCard>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? t("edit") : t("revNew")}
      >
        <div className="flex flex-col gap-4">
          <Field label={t("revClientName")} required>
            <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
          </Field>
          <Field label={t("revStars")}>
            <NativeSelect value={form.stars} onChange={(e) => set("stars", Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("revText")} required>
            <Textarea
              rows={4}
              value={form.review_text}
              onChange={(e) => set("review_text", e.target.value)}
            />
          </Field>
          <div>
            <span className="mb-1 block text-sm font-medium text-ink">{t("revImage")}</span>
            <SingleImageUpload
              value={form.image_url}
              onChange={(url) => set("image_url", url)}
              prefix="reviews/"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            {t("revActive")}
          </label>
          <Button onClick={onSave} disabled={save.isPending} fullWidth>
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : t("save")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
