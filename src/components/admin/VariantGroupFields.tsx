import { Plus, Trash2 } from "lucide-react";
import { SingleImageUpload } from "@/components/admin/ImageUploader";
import { Input } from "@/components/ui/Field";
import { useI18n } from "@/i18n/LanguageProvider";
import type { VariantGroup } from "@/types/db";

/** Editor for ONE custom option group — shared by the product form and the
 *  bulk "shared options" page. */
export function VariantGroupFields({
  group,
  onChange,
  onDelete,
  uploadPrefix,
}: {
  group: VariantGroup;
  onChange: (g: VariantGroup) => void;
  /** Omit to hide the delete-group button. */
  onDelete?: () => void;
  uploadPrefix: string;
}) {
  const { t } = useI18n();

  const updateGroup = (patch: Partial<VariantGroup>) => onChange({ ...group, ...patch });
  const updateValue = (vi: number, patch: Partial<VariantGroup["values"][number]>) =>
    updateGroup({ values: group.values.map((v, idx) => (idx === vi ? { ...v, ...patch } : v)) });

  return (
    <div className="rounded-lg border border-line p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Input
          className="w-40"
          placeholder={t("prodVariantGroupName")}
          value={group.name_fr}
          onChange={(e) => updateGroup({ name_fr: e.target.value })}
        />
        <Input
          className="w-40"
          dir="rtl"
          placeholder={t("prodVariantGroupNameAr")}
          value={group.name_ar}
          onChange={(e) => updateGroup({ name_ar: e.target.value })}
        />
        <label className="inline-flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={!!group.before_price_variant}
            onChange={(e) => updateGroup({ before_price_variant: e.target.checked })}
          />
          {t("prodVariantBeforePrice")}
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={!!group.optional}
            onChange={(e) => updateGroup({ optional: e.target.checked })}
          />
          {t("prodVariantOptional")}
        </label>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ms-auto text-muted hover:text-danger"
            aria-label={t("delete")}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 ps-2">
        {group.values.map((opt, vi) => (
          <div
            key={vi}
            className="flex flex-wrap items-center gap-2 rounded-md border border-line/60 p-2"
          >
            <Input
              className="w-32"
              placeholder={t("prodVariantValue")}
              value={opt.value_fr}
              onChange={(e) => updateValue(vi, { value_fr: e.target.value })}
            />
            <Input
              className="w-32"
              dir="rtl"
              placeholder={t("prodVariantValueAr")}
              value={opt.value_ar}
              onChange={(e) => updateValue(vi, { value_ar: e.target.value })}
            />
            <input
              type="color"
              value={opt.swatch_hex || "#ffffff"}
              onChange={(e) => updateValue(vi, { swatch_hex: e.target.value })}
              className="h-9 w-9 rounded"
              aria-label={t("prodVariantSwatch")}
              title={t("prodVariantSwatch")}
            />
            {opt.swatch_hex && (
              <button
                type="button"
                onClick={() => updateValue(vi, { swatch_hex: null })}
                className="text-xs text-muted hover:text-danger"
              >
                {t("prodVariantSwatchClear")}
              </button>
            )}
            <SingleImageUpload
              value={opt.image_url ?? null}
              onChange={(url) => updateValue(vi, { image_url: url })}
              prefix={uploadPrefix}
            />
            <label className="inline-flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={!!opt.requires_text}
                onChange={(e) =>
                  updateValue(vi, {
                    requires_text: e.target.checked,
                    requires_upload: e.target.checked ? false : opt.requires_upload,
                  })
                }
              />
              {t("prodVariantRequiresText")}
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={!!opt.requires_upload}
                onChange={(e) =>
                  updateValue(vi, {
                    requires_upload: e.target.checked,
                    requires_text: e.target.checked ? false : opt.requires_text,
                  })
                }
              />
              {t("prodVariantRequiresUpload")}
            </label>
            <button
              type="button"
              onClick={() => updateGroup({ values: group.values.filter((_, idx) => idx !== vi) })}
              className="ms-auto text-muted hover:text-danger"
              aria-label={t("delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            updateGroup({
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
  );
}
