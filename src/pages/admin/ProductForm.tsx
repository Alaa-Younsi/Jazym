import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, LoadError } from "@/components/admin/AdminUI";
import { SingleImageUpload, MultiImageUpload } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import {
  toProductFormState,
  toProductVariantFormState,
  useAdminCategories,
  useAdminProduct,
  useSaveProduct,
  type ProductFormState,
  type ProductVariantFormState,
} from "@/hooks/useAdminData";
import { useI18n } from "@/i18n/LanguageProvider";
import { flattenForSelect } from "@/lib/categoryTree";
import {
  linesToArray,
  sanitizeColors,
  sanitizeOffers,
  sanitizeSizes,
  sanitizeVariantGroups,
  uniqueSlug,
} from "@/lib/productForm";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ProductColor, ProductSize, QuantityOffer, VariantGroup } from "@/types/db";

const MAX_VARIANT_ROWS = 60;

interface AxisValue {
  fr: string;
  ar: string;
}

function parseAxisValues(text: string): AxisValue[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [fr, ar] = line.split("|").map((s) => s.trim());
      return { fr, ar: ar || fr };
    })
    .filter((v) => v.fr.length > 0);
}

function axisValuesToText(values: AxisValue[]): string {
  return values.map((v) => (v.ar && v.ar !== v.fr ? `${v.fr} | ${v.ar}` : v.fr)).join("\n");
}

const EMPTY: ProductFormState = {
  slug: "",
  name_fr: "",
  name_ar: "",
  description_fr: "",
  description_ar: "",
  details_fr: [],
  details_ar: [],
  price: 0,
  compare_at_price: null,
  category_id: null,
  stock: 0,
  style_code: null,
  colors: [],
  sizes: [],
  variants: [],
  quantity_offers: [],
  video_url: null,
  featured: false,
  status: "active",
};

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useAdminProduct(id);
  const { data: categories = [] } = useAdminCategories();
  const categoryOptions = useMemo(() => flattenForSelect(categories), [categories]);
  const save = useSaveProduct();

  const [form, setForm] = useState<ProductFormState>(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [detailsFrText, setDetailsFrText] = useState("");
  const [detailsArText, setDetailsArText] = useState("");
  const [variantRows, setVariantRows] = useState<ProductVariantFormState[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [hydrated, setHydrated] = useState(isNew);

  useEffect(() => {
    if (isNew) return;
    if (isError) {
      setLoadFailed(true);
      return;
    }
    if (product) {
      setForm(toProductFormState(product));
      setImages((product.product_images ?? []).map((i) => i.url));
      setDetailsFrText(product.details_fr.join("\n"));
      setDetailsArText(product.details_ar.join("\n"));
      setVariantRows((product.product_variants ?? []).map(toProductVariantFormState));
      setHydrated(true);
    }
  }, [product, isError, isNew]);

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const priceValid = Number.isFinite(form.price) && form.price > 0;
  const nameValid = form.name_fr.trim().length > 0;
  const canSave = priceValid && nameValid && !save.isPending;

  const blockReason = useMemo(() => {
    if (!nameValid) return t("prodSaveBlockedName");
    if (!priceValid) return t("prodSaveBlockedPrice");
    return null;
  }, [nameValid, priceValid, t]);

  if (loadFailed) return <LoadError message={t("prodLoadFailed")} />;
  if (!isNew && (isLoading || !hydrated)) return <PageLoader />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      const slug =
        form.slug.trim() || (await uniqueSlug(form.name_fr, id === "new" ? undefined : id));
      const payload: ProductFormState = {
        ...form,
        slug,
        name_ar: form.name_ar.trim() || form.name_fr.trim(),
        details_fr: linesToArray(detailsFrText),
        details_ar: linesToArray(detailsArText),
        colors: sanitizeColors(form.colors),
        sizes: sanitizeSizes(form.sizes),
        variants: sanitizeVariantGroups(form.variants),
        quantity_offers: sanitizeOffers(form.quantity_offers),
        compare_at_price:
          form.compare_at_price && form.compare_at_price > form.price
            ? form.compare_at_price
            : null,
      };
      await save.mutateAsync({
        id: isNew ? undefined : id,
        form: payload,
        imageUrls: images,
        variantRows,
      });
      toast.success(t("adminSaved"));
      navigate("/admin/products");
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <AdminPageHeader
        title={isNew ? t("prodNew") : t("edit")}
        actions={
          <>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink"
            >
              <ArrowLeft size={14} className="rtl:rotate-180" />
              {t("back")}
            </Link>
            <Button type="submit" size="sm" disabled={!canSave}>
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : t("save")}
            </Button>
          </>
        }
      />

      {blockReason && (
        <p className="mb-4 rounded-lg bg-gold/15 px-3 py-2 text-sm text-ink">{blockReason}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <AdminCard className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("prodName")} required>
                <Input value={form.name_fr} onChange={(e) => set("name_fr", e.target.value)} />
              </Field>
              <Field label={t("prodNameAr")}>
                <Input
                  dir="rtl"
                  value={form.name_ar}
                  onChange={(e) => set("name_ar", e.target.value)}
                />
              </Field>
            </div>
            <Field label={t("prodSlug")} hint="auto">
              <Input
                value={form.slug}
                placeholder={form.name_fr}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("prodDescription")}>
                <Textarea
                  rows={4}
                  value={form.description_fr ?? ""}
                  onChange={(e) => set("description_fr", e.target.value)}
                />
              </Field>
              <Field label={t("prodDescriptionAr")}>
                <Textarea
                  rows={4}
                  dir="rtl"
                  value={form.description_ar ?? ""}
                  onChange={(e) => set("description_ar", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("prodDetails")}>
                <Textarea
                  rows={4}
                  value={detailsFrText}
                  onChange={(e) => setDetailsFrText(e.target.value)}
                />
              </Field>
              <Field label={t("prodDetailsAr")}>
                <Textarea
                  rows={4}
                  dir="rtl"
                  value={detailsArText}
                  onChange={(e) => setDetailsArText(e.target.value)}
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("prodImages")}</h3>
            <MultiImageUpload value={images} onChange={setImages} />
            <div className="mt-4">
              <Field label={t("prodVideo")}>
                <Input
                  dir="ltr"
                  placeholder="https://…"
                  value={form.video_url ?? ""}
                  onChange={(e) => set("video_url", e.target.value || null)}
                />
              </Field>
            </div>
          </AdminCard>

          <ColorsEditor
            value={form.colors}
            onChange={(v) => set("colors", v)}
            productId={isNew ? null : (id ?? null)}
          />
          <SizesEditor value={form.sizes} onChange={(v) => set("sizes", v)} />
          <ProductVariantsEditor
            value={variantRows}
            onChange={setVariantRows}
            basePrice={form.price}
            productId={isNew ? null : (id ?? null)}
          />
          {variantRows.length === 0 && (
            <VariantsEditor
              value={form.variants}
              onChange={(v) => set("variants", v)}
              productId={isNew ? null : (id ?? null)}
            />
          )}
          <OffersEditor value={form.quantity_offers} onChange={(v) => set("quantity_offers", v)} />
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard className="flex flex-col gap-4">
            <Field label={t("prodPrice")} required>
              <Input
                type="number"
                min={0}
                step={50}
                value={form.price || ""}
                onChange={(e) => set("price", Number(e.target.value))}
              />
            </Field>
            <Field label={t("prodCompareAt")}>
              <Input
                type="number"
                min={0}
                step={50}
                value={form.compare_at_price ?? ""}
                onChange={(e) =>
                  set("compare_at_price", e.target.value ? Number(e.target.value) : null)
                }
              />
            </Field>
            <Field label={t("prodStock")}>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", Math.max(0, Number(e.target.value)))}
              />
            </Field>
            <Field label={t("prodCategory")}>
              <NativeSelect
                value={form.category_id ?? ""}
                onChange={(e) => set("category_id", e.target.value || null)}
              >
                <option value="">—</option>
                {categoryOptions.map(({ category: c, depth, isLeaf: leaf }) => (
                  <option key={c.id} value={c.id} disabled={!leaf}>
                    {"　".repeat(depth)}
                    {lang === "ar" ? c.name_ar : c.name_fr}
                    {!leaf ? ` (${t("catHasSubcategories")})` : ""}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Réf. / style">
              <Input
                value={form.style_code ?? ""}
                onChange={(e) => set("style_code", e.target.value || null)}
              />
            </Field>
          </AdminCard>

          <AdminCard className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              {t("prodFeatured")}
            </label>
            <Field label={t("prodStatus")}>
              <NativeSelect
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProductFormState["status"])}
              >
                <option value="active">{t("prodStatusActive")}</option>
                <option value="draft">{t("prodStatusDraft")}</option>
              </NativeSelect>
            </Field>
          </AdminCard>
        </div>
      </div>
    </form>
  );
}

/* ---------------- sub-editors ---------------- */

function ColorsEditor({
  value,
  onChange,
  productId,
}: {
  value: ProductColor[];
  onChange: (v: ProductColor[]) => void;
  productId: string | null;
}) {
  const { t } = useI18n();
  const update = (i: number, patch: Partial<ProductColor>) =>
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <AdminCard>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{t("prodColors")}</h3>
        <button
          type="button"
          onClick={() =>
            onChange([...value, { label_fr: "", label_ar: "", hex: "#5b6fc7", image_url: null }])
          }
          className="inline-flex items-center gap-1 text-xs text-brand"
        >
          <Plus size={13} />
          {t("add")}
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {value.map((c, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2"
          >
            <input
              type="color"
              value={c.hex}
              onChange={(e) => update(i, { hex: e.target.value })}
              className="h-9 w-9 rounded"
              aria-label="hex"
            />
            <Input
              className="w-32"
              placeholder="FR"
              value={c.label_fr}
              onChange={(e) => update(i, { label_fr: e.target.value })}
            />
            <Input
              className="w-32"
              dir="rtl"
              placeholder="AR"
              value={c.label_ar}
              onChange={(e) => update(i, { label_ar: e.target.value })}
            />
            <SingleImageUpload
              value={c.image_url ?? null}
              onChange={(url) => update(i, { image_url: url })}
              prefix="colors/"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="ms-auto text-muted hover:text-danger"
              aria-label={t("delete")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-muted">{t("optional")}</p>}
        {!productId && value.length > 0 && (
          <p className="text-xs text-muted">
            {t("save")} — {t("prodImages").toLowerCase()}
          </p>
        )}
      </div>
    </AdminCard>
  );
}

function SizesEditor({
  value,
  onChange,
}: {
  value: ProductSize[];
  onChange: (v: ProductSize[]) => void;
}) {
  const { t } = useI18n();
  const update = (i: number, patch: Partial<ProductSize>) =>
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  return (
    <AdminCard>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{t("prodSizes")}</h3>
        <button
          type="button"
          onClick={() => onChange([...value, { label_fr: "", label_ar: "" }])}
          className="inline-flex items-center gap-1 text-xs text-brand"
        >
          <Plus size={13} />
          {t("add")}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {value.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              className="w-40"
              placeholder="FR"
              value={s.label_fr}
              onChange={(e) => update(i, { label_fr: e.target.value })}
            />
            <Input
              className="w-40"
              dir="rtl"
              placeholder="AR"
              value={s.label_ar}
              onChange={(e) => update(i, { label_ar: e.target.value })}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-danger"
              aria-label={t("delete")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-muted">{t("optional")}</p>}
      </div>
    </AdminCard>
  );
}

interface AxisState {
  name_fr: string;
  name_ar: string;
  valuesText: string;
}

function deriveAxis(
  rows: ProductVariantFormState[],
  nameKey: "option1_name_fr" | "option2_name_fr",
  nameArKey: "option1_name_ar" | "option2_name_ar",
  valueKey: "option1_value_fr" | "option2_value_fr",
  valueArKey: "option1_value_ar" | "option2_value_ar",
): AxisState | null {
  const first = rows.find((r) => r[valueKey]);
  if (!first) return null;
  const seen = new Set<string>();
  const values: AxisValue[] = [];
  for (const r of rows) {
    const fr = r[valueKey];
    if (!fr || seen.has(fr)) continue;
    seen.add(fr);
    values.push({ fr, ar: r[valueArKey] || fr });
  }
  return {
    name_fr: first[nameKey] || "",
    name_ar: first[nameArKey] || first[nameKey] || "",
    valuesText: axisValuesToText(values),
  };
}

function ProductVariantsEditor({
  value,
  onChange,
  basePrice,
  productId,
}: {
  value: ProductVariantFormState[];
  onChange: (v: ProductVariantFormState[]) => void;
  basePrice: number;
  productId: string | null;
}) {
  const { t } = useI18n();
  const toast = useAdminToast();
  const [axis1, setAxis1] = useState<AxisState>(
    () =>
      deriveAxis(
        value,
        "option1_name_fr",
        "option1_name_ar",
        "option1_value_fr",
        "option1_value_ar",
      ) ?? { name_fr: "", name_ar: "", valuesText: "" },
  );
  const [axis2, setAxis2] = useState<AxisState | null>(() =>
    deriveAxis(value, "option2_name_fr", "option2_name_ar", "option2_value_fr", "option2_value_ar"),
  );

  function generate() {
    const values1 = parseAxisValues(axis1.valuesText);
    if (values1.length === 0 || !axis1.name_fr.trim()) {
      toast.error(t("prodVariantMatrixEmpty"));
      return;
    }
    const values2 = axis2 ? parseAxisValues(axis2.valuesText) : [];
    const combos: [AxisValue, AxisValue | null][] =
      axis2 && values2.length > 0
        ? values1.flatMap((v1) => values2.map((v2): [AxisValue, AxisValue | null] => [v1, v2]))
        : values1.map((v1): [AxisValue, AxisValue | null] => [v1, null]);

    if (combos.length > MAX_VARIANT_ROWS) {
      toast.error(t("prodVariantMatrixTooMany", { max: MAX_VARIANT_ROWS }));
      return;
    }

    const existingByKey = new Map(
      value.map((r) => [`${r.option1_value_fr ?? ""}::${r.option2_value_fr ?? ""}`, r]),
    );

    const rows: ProductVariantFormState[] = combos.map(([v1, v2], i) => {
      const key = `${v1.fr}::${v2?.fr ?? ""}`;
      const existing = existingByKey.get(key);
      return {
        option1_name_fr: axis1.name_fr.trim(),
        option1_name_ar: axis1.name_ar.trim() || axis1.name_fr.trim(),
        option1_value_fr: v1.fr,
        option1_value_ar: v1.ar,
        option2_name_fr: axis2 ? axis2.name_fr.trim() || null : null,
        option2_name_ar: axis2 ? axis2.name_ar.trim() || axis2.name_fr.trim() || null : null,
        option2_value_fr: v2?.fr ?? null,
        option2_value_ar: v2?.ar ?? null,
        price: existing?.price ?? basePrice,
        compare_at_price: existing?.compare_at_price ?? null,
        stock: existing?.stock ?? 0,
        sku: existing?.sku ?? null,
        image_url: existing?.image_url ?? null,
        sort_order: i,
      };
    });
    onChange(rows);
  }

  const update = (i: number, patch: Partial<ProductVariantFormState>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <AdminCard>
      <h3 className="mb-1 text-sm font-semibold text-ink">{t("prodVariantMatrixTitle")}</h3>
      <p className="mb-3 text-xs text-muted">{t("prodVariantMatrixHint")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 flex gap-2">
            <Input
              className="flex-1"
              placeholder={t("prodVariantAxisName")}
              value={axis1.name_fr}
              onChange={(e) => setAxis1((a) => ({ ...a, name_fr: e.target.value }))}
            />
            <Input
              className="flex-1"
              dir="rtl"
              placeholder={t("prodVariantAxisNameAr")}
              value={axis1.name_ar}
              onChange={(e) => setAxis1((a) => ({ ...a, name_ar: e.target.value }))}
            />
          </div>
          <Textarea
            rows={4}
            placeholder={t("prodVariantAxisValuesPlaceholder")}
            value={axis1.valuesText}
            onChange={(e) => setAxis1((a) => ({ ...a, valuesText: e.target.value }))}
          />
        </div>

        {axis2 ? (
          <div className="rounded-lg border border-line p-3">
            <div className="mb-2 flex items-center gap-2">
              <Input
                className="flex-1"
                placeholder={t("prodVariantAxisName")}
                value={axis2.name_fr}
                onChange={(e) => setAxis2((a) => (a ? { ...a, name_fr: e.target.value } : a))}
              />
              <Input
                className="flex-1"
                dir="rtl"
                placeholder={t("prodVariantAxisNameAr")}
                value={axis2.name_ar}
                onChange={(e) => setAxis2((a) => (a ? { ...a, name_ar: e.target.value } : a))}
              />
              <button
                type="button"
                onClick={() => setAxis2(null)}
                className="text-muted hover:text-danger"
                aria-label={t("delete")}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <Textarea
              rows={4}
              placeholder={t("prodVariantAxisValuesPlaceholder")}
              value={axis2.valuesText}
              onChange={(e) => setAxis2((a) => (a ? { ...a, valuesText: e.target.value } : a))}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAxis2({ name_fr: "", name_ar: "", valuesText: "" })}
            className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-line p-3 text-xs text-brand hover:border-brand"
          >
            <Plus size={13} />
            {t("prodVariantAddAxis2")}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={generate}
        className="mt-3 inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
      >
        {t("prodGenerateMatrix")}
      </button>

      {value.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {value.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2 text-sm"
            >
              <span className="w-40 shrink-0 truncate text-ink">
                {row.option1_value_fr}
                {row.option2_value_fr ? ` / ${row.option2_value_fr}` : ""}
              </span>
              <Input
                type="number"
                className="w-24"
                min={0}
                step={50}
                placeholder={t("prodVariantPrice")}
                value={row.price || ""}
                onChange={(e) => update(i, { price: Number(e.target.value) })}
              />
              <Input
                type="number"
                className="w-24"
                min={0}
                step={50}
                placeholder={t("prodVariantCompareAt")}
                value={row.compare_at_price ?? ""}
                onChange={(e) =>
                  update(i, { compare_at_price: e.target.value ? Number(e.target.value) : null })
                }
              />
              <Input
                type="number"
                className="w-20"
                min={0}
                placeholder={t("prodVariantStock")}
                value={row.stock}
                onChange={(e) => update(i, { stock: Math.max(0, Number(e.target.value)) })}
              />
              <Input
                className="w-28"
                placeholder={t("prodVariantSku")}
                value={row.sku ?? ""}
                onChange={(e) => update(i, { sku: e.target.value || null })}
              />
              <SingleImageUpload
                value={row.image_url ?? null}
                onChange={(url) => update(i, { image_url: url })}
                prefix={productId ? `variants/${productId}/` : "variants/"}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="ms-auto text-muted hover:text-danger"
                aria-label={t("delete")}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length === 0 && <p className="mt-3 text-xs text-muted">{t("optional")}</p>}
    </AdminCard>
  );
}

function VariantsEditor({
  value,
  onChange,
  productId,
}: {
  value: VariantGroup[];
  onChange: (v: VariantGroup[]) => void;
  productId: string | null;
}) {
  const { t } = useI18n();

  const updateGroup = (gi: number, patch: Partial<VariantGroup>) =>
    onChange(value.map((g, idx) => (idx === gi ? { ...g, ...patch } : g)));
  const updateValue = (gi: number, vi: number, patch: Partial<VariantGroup["values"][number]>) =>
    updateGroup(gi, {
      values: value[gi].values.map((v, idx) => (idx === vi ? { ...v, ...patch } : v)),
    });

  return (
    <AdminCard>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{t("prodVariants")}</h3>
        <button
          type="button"
          onClick={() => onChange([...value, { name_fr: "", name_ar: "", values: [] }])}
          className="inline-flex items-center gap-1 text-xs text-brand"
        >
          <Plus size={13} />
          {t("prodAddVariantGroup")}
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {value.map((group, gi) => (
          <div key={gi} className="rounded-lg border border-line p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Input
                className="w-40"
                placeholder={t("prodVariantGroupName")}
                value={group.name_fr}
                onChange={(e) => updateGroup(gi, { name_fr: e.target.value })}
              />
              <Input
                className="w-40"
                dir="rtl"
                placeholder={t("prodVariantGroupNameAr")}
                value={group.name_ar}
                onChange={(e) => updateGroup(gi, { name_ar: e.target.value })}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== gi))}
                className="ms-auto text-muted hover:text-danger"
                aria-label={t("delete")}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="flex flex-col gap-2 ps-2">
              {group.values.map((opt, vi) => (
                <div key={vi} className="flex flex-wrap items-center gap-2">
                  <Input
                    className="w-32"
                    placeholder={t("prodVariantValue")}
                    value={opt.value_fr}
                    onChange={(e) => updateValue(gi, vi, { value_fr: e.target.value })}
                  />
                  <Input
                    className="w-32"
                    dir="rtl"
                    placeholder={t("prodVariantValueAr")}
                    value={opt.value_ar}
                    onChange={(e) => updateValue(gi, vi, { value_ar: e.target.value })}
                  />
                  <SingleImageUpload
                    value={opt.image_url ?? null}
                    onChange={(url) => updateValue(gi, vi, { image_url: url })}
                    prefix={productId ? `variants/${productId}/` : "variants/"}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateGroup(gi, {
                        values: group.values.filter((_, idx) => idx !== vi),
                      })
                    }
                    className="text-muted hover:text-danger"
                    aria-label={t("delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateGroup(gi, {
                    values: [...group.values, { value_fr: "", value_ar: "", image_url: null }],
                  })
                }
                className="inline-flex w-fit items-center gap-1 text-xs text-brand"
              >
                <Plus size={12} />
                {t("prodAddVariantValue")}
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-muted">{t("optional")}</p>}
      </div>
    </AdminCard>
  );
}

function OffersEditor({
  value,
  onChange,
}: {
  value: QuantityOffer[];
  onChange: (v: QuantityOffer[]) => void;
}) {
  const { t } = useI18n();
  return (
    <AdminCard>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{t("prodOffers")}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange([...value, { type: "free", buy: 2, get: 1 }])}
            className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand"
          >
            {t("prodOfferFree")}
          </button>
          <button
            type="button"
            onClick={() => onChange([...value, { type: "price", qty: 3, price: 0 }])}
            className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand"
          >
            {t("prodOfferPrice")}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {value.map((offer, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2 text-sm"
          >
            {offer.type === "free" ? (
              <>
                <label className="text-xs text-muted">{t("prodOfferBuy")}</label>
                <Input
                  type="number"
                  className="w-20"
                  min={1}
                  value={offer.buy}
                  onChange={(e) =>
                    onChange(
                      value.map((o, idx) =>
                        idx === i && o.type === "free" ? { ...o, buy: Number(e.target.value) } : o,
                      ),
                    )
                  }
                />
                <label className="text-xs text-muted">{t("prodOfferGet")}</label>
                <Input
                  type="number"
                  className="w-20"
                  min={1}
                  value={offer.get}
                  onChange={(e) =>
                    onChange(
                      value.map((o, idx) =>
                        idx === i && o.type === "free" ? { ...o, get: Number(e.target.value) } : o,
                      ),
                    )
                  }
                />
              </>
            ) : (
              <>
                <label className="text-xs text-muted">{t("prodOfferQty")}</label>
                <Input
                  type="number"
                  className="w-20"
                  min={2}
                  value={offer.qty}
                  onChange={(e) =>
                    onChange(
                      value.map((o, idx) =>
                        idx === i && o.type === "price" ? { ...o, qty: Number(e.target.value) } : o,
                      ),
                    )
                  }
                />
                <label className="text-xs text-muted">{t("prodOfferBundlePrice")}</label>
                <Input
                  type="number"
                  className="w-28"
                  min={0}
                  step={50}
                  value={offer.price}
                  onChange={(e) =>
                    onChange(
                      value.map((o, idx) =>
                        idx === i && o.type === "price"
                          ? { ...o, price: Number(e.target.value) }
                          : o,
                      ),
                    )
                  }
                />
              </>
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="ms-auto text-muted hover:text-danger"
              aria-label={t("delete")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-muted">{t("optional")}</p>}
      </div>
    </AdminCard>
  );
}
