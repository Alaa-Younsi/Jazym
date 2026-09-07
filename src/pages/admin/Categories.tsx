import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { SingleImageUpload } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import {
  useAdminCategories,
  useDeleteCategory,
  useSaveCategory,
  type CategoryFormState,
} from "@/hooks/useAdminData";
import { useI18n } from "@/i18n/LanguageProvider";
import { slugify } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Category } from "@/types/db";

const EMPTY: CategoryFormState = {
  slug: "",
  name_fr: "",
  name_ar: "",
  description_fr: "",
  description_ar: "",
  image_url: null,
  sort_order: 0,
};

export default function Categories() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const { data: categories, isLoading, isError } = useAdminCategories();
  const save = useSaveCategory();
  const del = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(EMPTY);

  if (isLoading) return <PageLoader />;
  if (isError || !categories) return <LoadError message={t("adminLoadError")} />;

  function openNew() {
    setForm({ ...EMPTY, sort_order: (categories?.length ?? 0) + 1 });
    setCreating(true);
    setEditing(null);
  }

  function openEdit(c: Category) {
    setForm({
      slug: c.slug,
      name_fr: c.name_fr,
      name_ar: c.name_ar,
      description_fr: c.description_fr,
      description_ar: c.description_ar,
      image_url: c.image_url,
      sort_order: c.sort_order,
    });
    setEditing(c);
    setCreating(false);
  }

  const open = creating || !!editing;
  const set = <K extends keyof CategoryFormState>(k: K, v: CategoryFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSave() {
    if (!form.name_fr.trim()) {
      toast.error(t("prodSaveBlockedName"));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      await save.mutateAsync({
        id: editing?.id,
        form: {
          ...form,
          slug: form.slug.trim() || slugify(form.name_fr) || `cat-${Date.now()}`,
          name_ar: form.name_ar.trim() || form.name_fr.trim(),
        },
      });
      toast.success(t("adminSaved"));
      setCreating(false);
      setEditing(null);
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function onDelete(c: Category) {
    if (!window.confirm(t("lpDeleteConfirm"))) return;
    try {
      await del.mutateAsync(c.id);
      toast.success(t("adminDeleted"));
    } catch {
      toast.error(t("adminDeleteError"));
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t("catListTitle")}
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus size={15} />
            {t("catNew")}
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState title={t("catListTitle")} />
      ) : (
        <div className="grid gap-3">
          {categories.map((c) => (
            <AdminCard key={c.id} className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-panel-2">
                {c.image_url && (
                  <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{lang === "ar" ? c.name_ar : c.name_fr}</p>
                <p className="text-xs text-muted">/{c.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand"
                aria-label={t("edit")}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(c)}
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
        title={editing ? t("edit") : t("catNew")}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("catName")} required>
              <Input value={form.name_fr} onChange={(e) => set("name_fr", e.target.value)} />
            </Field>
            <Field label={t("catNameAr")}>
              <Input
                dir="rtl"
                value={form.name_ar}
                onChange={(e) => set("name_ar", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("prodDescription")}`}>
              <Textarea
                rows={3}
                value={form.description_fr ?? ""}
                onChange={(e) => set("description_fr", e.target.value)}
              />
            </Field>
            <Field label={`${t("prodDescriptionAr")}`}>
              <Textarea
                rows={3}
                dir="rtl"
                value={form.description_ar ?? ""}
                onChange={(e) => set("description_ar", e.target.value)}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Field label={t("catSortOrder")} className="w-28">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </Field>
            <div className="flex-1">
              <span className="mb-1 block text-sm font-medium text-ink">{t("catImage")}</span>
              <SingleImageUpload
                value={form.image_url}
                onChange={(url) => set("image_url", url)}
                bucket="product-images"
                prefix="categories/"
              />
            </div>
          </div>
          <Button onClick={onSave} disabled={save.isPending} fullWidth>
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : t("save")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
