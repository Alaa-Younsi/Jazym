import {
  ChevronDown,
  ChevronUp,
  FileArchive,
  FileText,
  Film,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import { Field, Input } from "@/components/ui/Field";
import { useI18n } from "@/i18n/LanguageProvider";
import {
  FREEBIE_ACCEPT,
  freebieKind,
  MAX_FREEBIE_BYTES,
  WARN_FREEBIE_BYTES,
  type FreebieKind,
} from "@/lib/freebies";
import { uploadErrorMessage, uploadToBucket } from "@/lib/storage";
import { formatBytes } from "@/lib/video";
import type { PanelFile } from "@/types/db";

const ICONS: Record<FreebieKind, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  video: Film,
  archive: FileArchive,
  doc: FileText,
};

const MAX_FILES = 12; // matches promo_panels_files_check

/**
 * The freebies attached to one promo panel: upload, name in both languages,
 * reorder, remove. Nothing reaches the database until the panel form saves,
 * same convention as the product image editor.
 */
export function PanelFilesEditor({
  value,
  onChange,
}: {
  value: PanelFile[];
  onChange: (files: PanelFile[]) => void;
}) {
  const { t, lang } = useI18n();
  const toast = useAdminToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const room = MAX_FILES - value.length;
    if (room <= 0) {
      toast.error(t("panelFilesTooMany", { max: MAX_FILES }));
      return;
    }

    setBusy(true);
    try {
      const added: PanelFile[] = [];
      for (const file of Array.from(list).slice(0, room)) {
        if (file.size > MAX_FREEBIE_BYTES) {
          toast.error(t("panelFileTooLarge", { max: formatBytes(MAX_FREEBIE_BYTES) }));
          continue;
        }
        // Deliberately NOT run through compressImage: a freebie is the thing
        // being given away, so it goes up exactly as the client made it.
        const url = await uploadToBucket("freebies", file, "panels/");
        const label = file.name.replace(/\.[^.]+$/, "");
        added.push({
          url,
          name_fr: label,
          name_ar: label,
          mime: file.type || null,
          size_bytes: file.size,
        });
        if (file.size > WARN_FREEBIE_BYTES) {
          toast.error(t("panelFileHeavy", { size: formatBytes(file.size) }));
        }
      }
      if (added.length > 0) onChange([...value, ...added]);
    } catch (err) {
      toast.error(uploadErrorMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const update = (i: number, patch: Partial<PanelFile>) =>
    onChange(value.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  function move(i: number, delta: number) {
    const target = i + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  const totalBytes = value.reduce((sum, f) => sum + (f.size_bytes ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-sm font-medium text-ink">{t("panelFilesTitle")}</span>
        <p className="mt-0.5 text-xs text-muted">{t("panelFilesHint")}</p>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((file, i) => {
            const Icon = ICONS[freebieKind(file.mime)];
            return (
              <li
                key={file.url}
                className="flex flex-col gap-3 rounded-lg border border-line p-3 sm:flex-row sm:items-start"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-panel-2 text-brand">
                  <Icon size={18} />
                </span>

                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <Field label={t("panelFileName")}>
                    <Input
                      value={file.name_fr}
                      onChange={(e) => update(i, { name_fr: e.target.value })}
                    />
                  </Field>
                  <Field label={t("panelFileNameAr")}>
                    <Input
                      dir="rtl"
                      value={file.name_ar}
                      onChange={(e) => update(i, { name_ar: e.target.value })}
                    />
                  </Field>
                  <p className="num-ltr text-xs text-muted sm:col-span-2">
                    {file.size_bytes ? formatBytes(file.size_bytes) : "—"}
                    {file.mime ? ` · ${file.mime}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={t("previous")}
                    className="rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label={t("next")}
                    className="rounded-full border border-line p-2 text-muted hover:border-brand hover:text-brand disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                    aria-label={t("delete")}
                    className="rounded-full border border-line p-2 text-muted hover:border-danger hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || value.length >= MAX_FILES}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {t("panelFileAdd")}
        </button>
        <span className="num-ltr text-xs text-muted">
          {value.length}/{MAX_FILES}
          {totalBytes > 0 ? ` · ${formatBytes(totalBytes)}` : ""}
        </span>
      </div>

      {/* The one cost the client cannot see from the dashboard. */}
      <p className="rounded-lg bg-gold/15 px-3 py-2 text-xs text-ink">
        {t("panelFilesEgressWarning")}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={FREEBIE_ACCEPT}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
        aria-label={lang === "ar" ? t("panelFileAdd") : t("panelFileAdd")}
      />
    </div>
  );
}
