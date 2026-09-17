import { ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, EmptyState, LoadError } from "@/components/admin/AdminUI";
import { SingleImageUpload } from "@/components/admin/ImageUploader";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import {
  useAdminCategories,
  useAdminProducts,
  useDeleteCategory,
  useSaveCategory,
  type CategoryFormState,
} from "@/hooks/useAdminData";
import { useI18n } from "@/i18n/LanguageProvider";
import { childrenOf, pathTo } from "@/lib/categoryTree";
import { responsiveSrcSet } from "@/lib/image";
import { slugify } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Category } from "@/types/db";

function emptyForm(parentId: string | null, sortOrder: number): CategoryFormState {
  return {
    slug: "",
    name_fr: "",
    name_ar: "",
    description_fr: "",
    description_ar: "",
    image_url: null,
    sort_order: sortOrder,
    parent_id: parentId,
  };
}

export default function Categories() {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const { data: categories, isLoading, isError } = useAdminCategories();
  const { data: products = [] } = useAdminProducts();
  const save = useSaveCategory();
  const del = useDeleteCategory();

  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(emptyForm(null, 1));

  const productCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (!p.category_id) continue;
      map.set(p.category_id, (map.get(p.category_id) ?? 0) + 1);
    }
    return map;
  }, [products]);

  if (isLoading) return <PageLoader />;
  if (isError || !categories) return <LoadError message={t("adminLoadError")} />;

  const categoryList = categories;
  const ancestors = pathTo(categoryList, currentParentId);
  const currentNode = ancestors[ancestors.length - 1] ?? null;
  const levelCategories = childrenOf(categoryList, currentParentId);
  const currentHasProducts = currentParentId
    ? (productCountByCategory.get(currentParentId) ?? 0) > 0
    : false;

  function openNew(parentId: string | null, siblingCount: number) {
    setForm(emptyForm(parentId, siblingCount + 1));
    setCurrentParentId(parentId);
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
      parent_id: c.parent_id,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ERR_CATEGORY_NOT_LEAF")) {
        toast.error(t("catSaveBlockedNotLeaf"));
      } else {
        toast.error(message || t("adminSaveError"));
      }
    }
  }

  async function onDelete(c: Category) {
    const hasChildren = categoryList.some((child) => child.parent_id === c.id);
    const hasProducts = (productCountByCategory.get(c.id) ?? 0) > 0;
    if (hasChildren) {
      toast.error(t("catDeleteBlockedChildren"));
      return;
    }
    if (hasProducts) {
      toast.error(t("catDeleteBlockedProducts"));
      return;
    }
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
          <>
            {currentHasProducts && (
              <ButtonLink size="sm" variant="secondary" to="/admin/products">
                {t("catManageProducts")}
              </ButtonLink>
            )}
            <Button size="sm" onClick={() => openNew(currentParentId, levelCategories.length)}>
              <Plus size={15} />
              {currentNode ? t("catNewSubcategoryHere") : t("catNew")}
            </Button>
          </>
        }
      />

      {/* breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <button
          type="button"
          onClick={() => setCurrentParentId(null)}
          className={currentParentId === null ? "font-medium text-ink" : "hover:text-brand"}
        >
          {t("catBreadcrumbRoot")}
        </button>
        {ancestors.map((a) => (
          <span key={a.id} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="rtl:rotate-180" />
            <button
              type="button"
              onClick={() => setCurrentParentId(a.id)}
              className={a.id === currentParentId ? "font-medium text-ink" : "hover:text-brand"}
            >
              {lang === "ar" ? a.name_ar : a.name_fr}
            </button>
          </span>
        ))}
      </nav>

      {currentHasProducts && (
        <p className="mb-4 rounded-lg bg-brand-soft/50 px-3 py-2 text-sm text-brand">
          {t("catHoldsProductsHint")}
        </p>
      )}

      {levelCategories.length === 0 ? (
        <EmptyState title={t("catEmptyLevel")} hint={t("catEmptyLevelHint")} />
      ) : (
        <div className="grid gap-3">
          {levelCategories.map((c) => {
            const childCount = categoryList.filter((child) => child.parent_id === c.id).length;
            const productCount = productCountByCategory.get(c.id) ?? 0;
            const isLeaf = childCount === 0;
            return (
              /* Phone: identity row on top, actions on their own row beneath.
                 Laying all six controls out in one line on a 360px screen was
                 forcing the whole admin page into horizontal overflow. */
              <AdminCard
                key={c.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-panel-2 sm:h-12 sm:w-12">
                    {c.image_url && (
                      <img
                        src={c.image_url}
                        srcSet={responsiveSrcSet(c.image_url)}
                        sizes="48px"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentParentId(c.id)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <p className="truncate font-medium text-ink">
                      {lang === "ar" ? c.name_ar : c.name_fr}
                    </p>
                    <p className="truncate text-xs text-muted">
                      /{c.slug}
                      {productCount > 0 && ` · ${t("catProductCount", { count: productCount })}`}
                      {childCount > 0 && ` · ${t("catSubcategoryCount", { count: childCount })}`}
                      {isLeaf && productCount === 0 && ` · ${t("catEmptyLevel")}`}
                    </p>
                  </button>
                </div>

                <div className="flex shrink-0 items-center gap-2 border-t border-line pt-3 sm:border-0 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setCurrentParentId(c.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-line px-3 py-2 text-xs font-medium text-ink hover:border-brand hover:text-brand sm:flex-none sm:py-1.5"
                    aria-label={t("catBrowse")}
                  >
                    {t("catBrowse")}
                    <ChevronRight size={13} className="rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openNew(c.id, childCount)}
                    className="shrink-0 rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand"
                    aria-label={t("catAddSubcategory")}
                    title={t("catAddSubcategory")}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="shrink-0 rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand"
                    aria-label={t("edit")}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    className="shrink-0 rounded-full border border-line p-2 text-muted hover:border-danger hover:text-danger"
                    aria-label={t("delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={
          editing
            ? t("edit")
            : currentNode
              ? t("catNewSubcategoryOf", {
                  name: lang === "ar" ? currentNode.name_ar : currentNode.name_fr,
                })
              : t("catNew")
        }
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
