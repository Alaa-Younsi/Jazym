import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, LoadError } from "@/components/admin/AdminUI";
import { BlockEditor } from "@/components/admin/landing/BlockEditor";
import { BLOCK_SPECS } from "@/components/admin/landing/blockSpec";
import { Button } from "@/components/ui/Button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminProducts } from "@/hooks/useAdminData";
import {
  useAdminLandingPage,
  useSaveLandingPage,
  type LandingPageInput,
} from "@/hooks/useLandingPages";
import { useAllPixelsAdmin } from "@/hooks/useTrackingPixels";
import { useI18n } from "@/i18n/LanguageProvider";
import { slugify } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { LandingBlock, LandingBlockType } from "@/types/db";

const EMPTY: LandingPageInput = {
  slug: "",
  title_fr: "",
  title_ar: "",
  status: "draft",
  product_id: null,
  blocks: [],
  theme: "auto",
  seo_title_fr: null,
  seo_title_ar: null,
  seo_description_fr: null,
  seo_description_ar: null,
  og_image_url: null,
  pixel_ids: [],
};

export default function LandingPageForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const navigate = useNavigate();

  const { data: page, isLoading, isError } = useAdminLandingPage(id);
  const { data: products = [] } = useAdminProducts();
  const { data: pixels = [] } = useAllPixelsAdmin();
  const save = useSaveLandingPage();

  const [form, setForm] = useState<LandingPageInput>(EMPTY);
  const [hydrated, setHydrated] = useState(isNew);

  useEffect(() => {
    if (isNew || !page) return;
    setForm({
      id: page.id,
      slug: page.slug,
      title_fr: page.title_fr,
      title_ar: page.title_ar,
      status: page.status,
      product_id: page.product_id,
      blocks: page.blocks,
      theme: page.theme,
      seo_title_fr: page.seo_title_fr,
      seo_title_ar: page.seo_title_ar,
      seo_description_fr: page.seo_description_fr,
      seo_description_ar: page.seo_description_ar,
      og_image_url: page.og_image_url,
      pixel_ids: page.pixel_ids,
    });
    setHydrated(true);
  }, [page, isNew]);

  if (!isSupabaseConfigured) {
    return (
      <div>
        <AdminPageHeader title={t("lpNew")} />
        <LoadError message="Supabase requis." />
      </div>
    );
  }
  if (!isNew && (isLoading || !hydrated)) return <PageLoader />;
  if (!isNew && isError) return <LoadError message={t("adminLoadError")} />;

  const set = <K extends keyof LandingPageInput>(k: K, v: LandingPageInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function addBlock(type: LandingBlockType) {
    const block: LandingBlock = { id: crypto.randomUUID(), type, data: {} };
    set("blocks", [...form.blocks, block]);
  }
  function updateBlock(index: number, data: Record<string, unknown>) {
    set(
      "blocks",
      form.blocks.map((b, i) => (i === index ? { ...b, data } : b)),
    );
  }
  function moveBlock(index: number, delta: number) {
    const next = [...form.blocks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("blocks", next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_fr.trim()) {
      toast.error(t("prodSaveBlockedName"));
      return;
    }
    try {
      await save.mutateAsync({
        ...form,
        id: isNew ? undefined : id,
        slug: form.slug.trim() || slugify(form.title_fr) || `lp-${Date.now()}`,
        title_ar: form.title_ar.trim() || form.title_fr.trim(),
      });
      toast.success(t("adminSaved"));
      navigate("/admin/landing");
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <AdminPageHeader
        title={isNew ? t("lpNew") : t("edit")}
        actions={
          <>
            <Link
              to="/admin/landing"
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

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <AdminCard className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("lpTitle")} required>
                <Input value={form.title_fr} onChange={(e) => set("title_fr", e.target.value)} />
              </Field>
              <Field label={t("lpTitleAr")}>
                <Input
                  dir="rtl"
                  value={form.title_ar}
                  onChange={(e) => set("title_ar", e.target.value)}
                />
              </Field>
            </div>
            <Field label={t("lpSlug")} hint="/lp/…">
              <Input
                dir="ltr"
                value={form.slug}
                placeholder={slugify(form.title_fr)}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field label={t("lpProduct")}>
              <NativeSelect
                value={form.product_id ?? ""}
                onChange={(e) => set("product_id", e.target.value || null)}
              >
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === "ar" ? p.name_ar : p.name_fr}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </AdminCard>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-ink">{t("lpBlocks")}</h3>
            {form.blocks.map((block, i) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={i}
                count={form.blocks.length}
                onChange={(data) => updateBlock(i, data)}
                onMove={(delta) => moveBlock(i, delta)}
                onRemove={() =>
                  set(
                    "blocks",
                    form.blocks.filter((_, idx) => idx !== i),
                  )
                }
              />
            ))}
            <div className="flex flex-wrap gap-2 rounded-card border border-dashed border-line p-3">
              {BLOCK_SPECS.map((spec) => (
                <button
                  key={spec.type}
                  type="button"
                  onClick={() => addBlock(spec.type)}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand hover:text-brand"
                >
                  <Plus size={12} />
                  {t(spec.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard className="flex flex-col gap-4">
            <Field label={t("lpStatus")}>
              <NativeSelect
                value={form.status}
                onChange={(e) => set("status", e.target.value as LandingPageInput["status"])}
              >
                <option value="draft">{t("lpStatusDraft")}</option>
                <option value="published">{t("lpStatusPublished")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("lpTheme")}>
              <NativeSelect
                value={form.theme}
                onChange={(e) => set("theme", e.target.value as LandingPageInput["theme"])}
              >
                <option value="auto">{t("lpThemeAuto")}</option>
                <option value="light">{t("themeLight")}</option>
                <option value="dark">{t("themeDark")}</option>
              </NativeSelect>
            </Field>
          </AdminCard>

          <AdminCard className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-ink">{t("lpSeo")}</h3>
            <Field label={`${t("lpSeoTitle")} FR`}>
              <Input
                value={form.seo_title_fr ?? ""}
                onChange={(e) => set("seo_title_fr", e.target.value || null)}
              />
            </Field>
            <Field label={`${t("lpSeoTitle")} AR`}>
              <Input
                dir="rtl"
                value={form.seo_title_ar ?? ""}
                onChange={(e) => set("seo_title_ar", e.target.value || null)}
              />
            </Field>
            <Field label={`${t("lpSeoDescription")} FR`}>
              <Textarea
                rows={2}
                value={form.seo_description_fr ?? ""}
                onChange={(e) => set("seo_description_fr", e.target.value || null)}
              />
            </Field>
            <Field label={`${t("lpSeoDescription")} AR`}>
              <Textarea
                rows={2}
                dir="rtl"
                value={form.seo_description_ar ?? ""}
                onChange={(e) => set("seo_description_ar", e.target.value || null)}
              />
            </Field>
            <Field label={t("lpOgImage")}>
              <Input
                dir="ltr"
                value={form.og_image_url ?? ""}
                onChange={(e) => set("og_image_url", e.target.value || null)}
              />
            </Field>
          </AdminCard>

          {pixels.length > 0 && (
            <AdminCard>
              <h3 className="mb-2 text-sm font-semibold text-ink">{t("lpPixels")}</h3>
              <div className="flex flex-col gap-2">
                {pixels.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={form.pixel_ids.includes(p.id)}
                      onChange={(e) =>
                        set(
                          "pixel_ids",
                          e.target.checked
                            ? [...form.pixel_ids, p.id]
                            : form.pixel_ids.filter((x) => x !== p.id),
                        )
                      }
                    />
                    {p.label} · {p.provider}
                  </label>
                ))}
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </form>
  );
}
