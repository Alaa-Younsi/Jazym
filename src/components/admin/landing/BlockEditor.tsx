import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { SingleImageUpload } from "@/components/admin/ImageUploader";
import { Input, Textarea } from "@/components/ui/Field";
import { useI18n } from "@/i18n/LanguageProvider";
import type { LandingBlock } from "@/types/db";
import { specFor, type FieldSpec } from "./blockSpec";

interface Props {
  block: LandingBlock;
  index: number;
  count: number;
  onChange: (data: Record<string, unknown>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}

export function BlockEditor({ block, index, count, onChange, onMove, onRemove }: Props) {
  const { t } = useI18n();
  const spec = specFor(block.type);
  const data = block.data;

  function setField(key: string, value: unknown) {
    onChange({ ...data, [key]: value });
  }

  const items = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : [];
  function setItems(next: Record<string, unknown>[]) {
    onChange({ ...data, items: next });
  }

  return (
    <div className="rounded-card border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand">
          {t(spec.labelKey)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"
            aria-label={t("lpMoveUp")}
          >
            <ChevronUp size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"
            aria-label={t("lpMoveDown")}
          >
            <ChevronDown size={15} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-muted hover:text-danger"
            aria-label={t("delete")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {spec.fields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            data={data}
            onChange={(k, v) => setField(k, v)}
          />
        ))}
      </div>

      {spec.item && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">{spec.item.labelFr}</span>
            <button
              type="button"
              onClick={() => setItems([...items, {}])}
              className="inline-flex items-center gap-1 text-xs text-brand"
            >
              <Plus size={12} />
              {t("add")}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-line p-2.5">
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                    className="text-muted hover:text-danger"
                    aria-label={t("delete")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {spec.item?.fields.map((field) => (
                    <FieldInput
                      key={field.key}
                      field={field}
                      data={item}
                      onChange={(k, v) =>
                        setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  data,
  onChange,
}: {
  field: FieldSpec;
  data: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const val = (key: string) => {
    const v = data[key];
    return typeof v === "string" || typeof v === "number" ? String(v) : "";
  };

  if (field.kind === "image") {
    return (
      <div>
        <span className="mb-1 block text-xs text-muted">{field.labelFr}</span>
        <SingleImageUpload
          value={val(field.key) || null}
          onChange={(url) => onChange(field.key, url)}
          prefix="landing/"
        />
      </div>
    );
  }

  if (field.localized) {
    const Comp = field.kind === "textarea" ? Textarea : Input;
    return (
      <div>
        <span className="mb-1 block text-xs text-muted">{field.labelFr}</span>
        <div className="grid gap-2 sm:grid-cols-2">
          <Comp
            placeholder="FR"
            value={val(`${field.key}_fr`)}
            onChange={(e) => onChange(`${field.key}_fr`, e.target.value)}
          />
          <Comp
            dir="rtl"
            placeholder="AR"
            value={val(`${field.key}_ar`)}
            onChange={(e) => onChange(`${field.key}_ar`, e.target.value)}
          />
        </div>
      </div>
    );
  }

  const Comp = field.kind === "textarea" ? Textarea : Input;
  return (
    <div>
      <span className="mb-1 block text-xs text-muted">{field.labelFr}</span>
      <Comp
        type={
          field.kind === "datetime"
            ? "datetime-local"
            : field.kind === "number"
              ? "number"
              : field.kind === "url"
                ? "url"
                : "text"
        }
        dir={field.kind === "url" || field.kind === "datetime" ? "ltr" : undefined}
        value={val(field.key)}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </div>
  );
}
