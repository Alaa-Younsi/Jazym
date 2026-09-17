import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, LoadError, Toggle } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/Button";
import { Field, Input, NativeSelect } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdminCategories, useAdminProducts } from "@/hooks/useAdminData";
import {
  toPromotionFormState,
  useAdminPromotion,
  useSavePromotion,
  type PromotionFormState,
} from "@/hooks/usePromotions";
import { useI18n } from "@/i18n/LanguageProvider";
import { flattenForSelect } from "@/lib/categoryTree";
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/datetime";
import { promotionLabel } from "@/lib/promotions";
import { pick } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PackItem, Promotion, PromotionScope, PromotionType } from "@/types/db";
import { TYPE_LABEL_KEYS } from "./Promotions";

const TYPE_HINT_KEYS = {
  buy_x_get_y: "promoTypeBuyXGetYHint",
  buy_x_percent: "promoTypeBuyXPercentHint",
  category_percent: "promoTypeCategoryPercentHint",
  pack: "promoTypePackHint",
} as const satisfies Record<PromotionType, string>;

const TYPES = Object.keys(TYPE_LABEL_KEYS) as PromotionType[];
const SCOPES: PromotionScope[] = ["all", "categories", "products"];
const SCOPE_LABEL_KEYS = {
  all: "promoScopeAll",
  categories: "promoScopeCategories",
  products: "promoScopeProducts",
} as const satisfies Record<PromotionScope, string>;

const EMPTY: PromotionFormState = {
  name: "",
  type: "category_percent",
  active: false,
  priority: 0,
  starts_at: null,
  ends_at: null,
  scope: "all",
  category_ids: [],
  product_ids: [],
  buy_qty: 0,
  get_qty: 0,
  percent: 0,
  pack_items: [],
  pack_price: null,
  label_fr: null,
  label_ar: null,
};

/** `category_percent` is always category-scoped; the others offer the choice. */
function usesScopePicker(type: PromotionType): boolean {
  return type === "buy_x_get_y" || type === "buy_x_percent";
}

export default function PromotionForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const navigate = useNavigate();

  const { data: promotion, isLoading, isError } = useAdminPromotion(id);
  const { data: categories = [] } = useAdminCategories();
  const { data: products = [] } = useAdminProducts();
  const save = useSavePromotion();

  const [form, setForm] = useState<PromotionFormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (promotion) setForm(toPromotionFormState(promotion));
  }, [promotion]);

  const categoryOptions = useMemo(() => flattenForSelect(categories), [categories]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (!isNew && isError) return <LoadError message={t("adminLoadError")} />;
  if (!isNew && isLoading) return <PageLoader />;

  const set = <K extends keyof PromotionFormState>(key: K, value: PromotionFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function changeType(type: PromotionType) {
    // Clearing the other type's fields keeps a stale percent (or a stale pack)
    // from silently pricing a promotion the admin thinks they replaced.
    setForm((f) => ({
      ...f,
      type,
      scope: usesScopePicker(type) ? f.scope : "all",
      category_ids: type === "category_percent" || usesScopePicker(type) ? f.category_ids : [],
      product_ids: usesScopePicker(type) ? f.product_ids : [],
      buy_qty: type === "buy_x_get_y" || type === "buy_x_percent" ? f.buy_qty : 0,
      get_qty: type === "buy_x_get_y" ? f.get_qty : 0,
      percent: type === "buy_x_percent" || type === "category_percent" ? f.percent : 0,
      pack_items: type === "pack" ? f.pack_items : [],
      pack_price: type === "pack" ? f.pack_price : null,
    }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return t("promoErrName");
    if (form.starts_at && form.ends_at && Date.parse(form.ends_at) <= Date.parse(form.starts_at)) {
      return t("promoErrWindow");
    }
    if (form.type === "buy_x_get_y" && (form.buy_qty < 1 || form.get_qty < 1)) {
      return t("promoErrQty");
    }
    if (form.type === "buy_x_percent") {
      if (form.buy_qty < 1) return t("promoErrQty");
      if (form.percent <= 0 || form.percent > 100) return t("promoErrPercent");
    }
    if (form.type === "category_percent") {
      if (form.percent <= 0 || form.percent > 100) return t("promoErrPercent");
      if (form.category_ids.length === 0) return t("promoErrScope");
    }
    if (form.type === "pack") {
      const items = form.pack_items.filter((i) => i.product_id && i.quantity > 0);
      if (items.length === 0 || !form.pack_price || form.pack_price <= 0) return t("promoErrPack");
    }
    if (usesScopePicker(form.type)) {
      if (form.scope === "categories" && form.category_ids.length === 0) return t("promoErrScope");
      if (form.scope === "products" && form.product_ids.length === 0) return t("promoErrScope");
    }
    return null;
  }

  async function onSave() {
    const problem = validate();
    setError(problem);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    const payload: PromotionFormState = {
      ...form,
      name: form.name.trim(),
      label_fr: form.label_fr?.trim() || null,
      label_ar: form.label_ar?.trim() || null,
      pack_items: form.pack_items.filter((i) => i.product_id && i.quantity > 0),
    };
    try {
      const savedId = await save.mutateAsync({ id: isNew ? undefined : id, form: payload });
      toast.success(t("promoSaved"));
      if (isNew) navigate(`/admin/promotions/${savedId}`, { replace: true });
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  const packValue = form.pack_items.reduce((sum, item) => {
    const product = productById.get(item.product_id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const packSaving = form.pack_price == null ? 0 : Math.max(0, packValue - form.pack_price);

  // The badge the customer will read, rendered from the live form values.
  const previewLabel = promotionLabel(
    { ...form, id: "", created_at: "", updated_at: "" } as Promotion,
    lang,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/promotions"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand"
      >
        <ArrowLeft size={15} className="rtl:rotate-180" />
        {t("promoListTitle")}
      </Link>

      <AdminPageHeader
        title={isNew ? t("promoNew") : form.name || t("promoListTitle")}
        actions={
          <Button onClick={onSave} disabled={save.isPending}>
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {t("save")}
          </Button>
        }
      />

      <div className="flex flex-col gap-5">
        <AdminCard className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">{t("promoActive")}</span>
            <Toggle
              checked={form.active}
              onChange={(v) => set("active", v)}
              label={t("promoActive")}
            />
          </div>

          <Field label={t("promoName")} hint={t("promoNameHint")} required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
          </Field>
        </AdminCard>

        <AdminCard className="flex flex-col gap-4">
          <Field label={t("promoType")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => changeType(type)}
                  aria-pressed={form.type === type}
                  className={cn(
                    "rounded-xl border p-3 text-start transition",
                    form.type === type
                      ? "border-brand bg-brand-soft/60"
                      : "border-line hover:border-brand/60",
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      form.type === type ? "text-brand" : "text-ink",
                    )}
                  >
                    {t(TYPE_LABEL_KEYS[type])}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{t(TYPE_HINT_KEYS[type])}</span>
                </button>
              ))}
            </div>
          </Field>

          {(form.type === "buy_x_get_y" || form.type === "buy_x_percent") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("promoBuyQty")} required>
                <NumberInput
                  value={form.buy_qty}
                  min={1}
                  max={100}
                  onChange={(v) => set("buy_qty", v)}
                />
              </Field>
              {form.type === "buy_x_get_y" ? (
                <Field label={t("promoGetQty")} required>
                  <NumberInput
                    value={form.get_qty}
                    min={1}
                    max={100}
                    onChange={(v) => set("get_qty", v)}
                  />
                </Field>
              ) : (
                <Field label={t("promoPercent")} required>
                  <NumberInput
                    value={form.percent}
                    min={1}
                    max={100}
                    onChange={(v) => set("percent", v)}
                  />
                </Field>
              )}
            </div>
          )}

          {form.type === "category_percent" && (
            <Field label={t("promoPercent")} required>
              <NumberInput
                value={form.percent}
                min={1}
                max={100}
                onChange={(v) => set("percent", v)}
                className="sm:max-w-40"
              />
            </Field>
          )}

          {usesScopePicker(form.type) && (
            <Field label={t("promoScope")}>
              <NativeSelect
                value={form.scope}
                onChange={(e) => set("scope", e.target.value as PromotionScope)}
              >
                {SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {t(SCOPE_LABEL_KEYS[scope])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}

          {(form.type === "category_percent" ||
            (usesScopePicker(form.type) && form.scope === "categories")) && (
            <PickerList
              label={t("promoCategories")}
              selected={form.category_ids}
              onChange={(ids) => set("category_ids", ids)}
              options={categoryOptions.map((o) => ({
                id: o.category.id,
                label: `${"— ".repeat(o.depth)}${pick(lang, o.category, "name")}`,
              }))}
            />
          )}

          {usesScopePicker(form.type) && form.scope === "products" && (
            <PickerList
              label={t("promoProducts")}
              selected={form.product_ids}
              onChange={(ids) => set("product_ids", ids)}
              options={products.map((p) => ({ id: p.id, label: pick(lang, p, "name") }))}
            />
          )}

          {form.type === "pack" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{t("promoPackItems")}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={form.pack_items.length >= 12}
                  onClick={() =>
                    set("pack_items", [...form.pack_items, { product_id: "", quantity: 1 }])
                  }
                >
                  <Plus size={14} />
                  {t("promoPackAddItem")}
                </Button>
              </div>

              {form.pack_items.map((item, index) => (
                <PackRow
                  key={index}
                  item={item}
                  products={products.map((p) => ({ id: p.id, label: pick(lang, p, "name") }))}
                  onChange={(next) =>
                    set(
                      "pack_items",
                      form.pack_items.map((it, i) => (i === index ? next : it)),
                    )
                  }
                  onRemove={() =>
                    set(
                      "pack_items",
                      form.pack_items.filter((_, i) => i !== index),
                    )
                  }
                />
              ))}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("promoPackPrice")} hint={t("promoPackPriceHint")} required>
                  <NumberInput
                    value={form.pack_price ?? 0}
                    min={0}
                    max={10_000_000}
                    onChange={(v) => set("pack_price", v)}
                  />
                </Field>
                <div className="flex flex-col justify-center gap-1 rounded-xl bg-panel-2 px-4 py-3 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>{t("promoPackValue")}</span>
                    <Price value={packValue} />
                  </div>
                  <div className="flex justify-between font-medium text-success">
                    <span>{t("promoPackSaving")}</span>
                    <Price value={packSaving} prefix="-" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </AdminCard>

        <AdminCard className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("promoStartAt")} hint={t("promoScheduleHint")}>
              <Input
                type="datetime-local"
                value={toDatetimeLocal(form.starts_at)}
                onChange={(e) => set("starts_at", fromDatetimeLocal(e.target.value))}
              />
            </Field>
            <Field label={t("promoEndAt")}>
              <Input
                type="datetime-local"
                value={toDatetimeLocal(form.ends_at)}
                onChange={(e) => set("ends_at", fromDatetimeLocal(e.target.value))}
              />
            </Field>
          </div>
          <Field label={t("promoPriority")} hint={t("promoPriorityHint")} className="sm:max-w-40">
            <NumberInput
              value={form.priority}
              min={0}
              max={999}
              onChange={(v) => set("priority", v)}
            />
          </Field>
        </AdminCard>

        <AdminCard className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("promoLabelFr")} hint={t("promoLabelHint")}>
              <Input
                dir="ltr"
                value={form.label_fr ?? ""}
                maxLength={60}
                onChange={(e) => set("label_fr", e.target.value || null)}
              />
            </Field>
            <Field label={t("promoLabelAr")}>
              <Input
                dir="rtl"
                value={form.label_ar ?? ""}
                maxLength={60}
                onChange={(e) => set("label_ar", e.target.value || null)}
              />
            </Field>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-muted">{t("promoRule")}</span>
            <p className="mt-1.5 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              {previewLabel}
            </p>
          </div>
        </AdminCard>

        {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

function NumberInput({
  value,
  min,
  max,
  onChange,
  className,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      dir="ltr"
      min={min}
      max={max}
      value={value}
      className={className}
      onChange={(e) => {
        const next = Number(e.target.value);
        onChange(Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : min);
      }}
    />
  );
}

function PackRow({
  item,
  products,
  onChange,
  onRemove,
}: {
  item: PackItem;
  products: { id: string; label: string }[];
  onChange: (item: PackItem) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-end">
      <Field label={t("promoProducts")} className="min-w-0 flex-1">
        <NativeSelect
          value={item.product_id}
          onChange={(e) => onChange({ ...item, product_id: e.target.value })}
        >
          <option value="">—</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label={t("promoPackQty")} className="sm:w-24">
        <NumberInput
          value={item.quantity}
          min={1}
          max={20}
          onChange={(v) => onChange({ ...item, quantity: v })}
        />
      </Field>
      <button
        type="button"
        aria-label={t("delete")}
        onClick={onRemove}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-muted transition hover:border-danger hover:text-danger"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

/** Searchable multi-select — a plain scroll list, no dependency, RTL-safe. */
function PickerList({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  const [term, setTerm] = useState("");
  const needle = term.trim().toLowerCase();
  const visible = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <Field label={label} hint={t("promoSelected", { count: selected.length })}>
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={t("promoSearch")}
        className="mb-2"
      />
      <div className="fx-scrollbar max-h-64 overflow-y-auto rounded-xl border border-line">
        {visible.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted">{t("promoEmpty")}</p>
        ) : (
          visible.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2.5 border-b border-line px-3 py-2.5 text-sm text-ink last:border-b-0 hover:bg-panel-2"
            >
              <input
                type="checkbox"
                className="accent-brand"
                checked={selected.includes(option.id)}
                onChange={() => toggle(option.id)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))
        )}
      </div>
    </Field>
  );
}
