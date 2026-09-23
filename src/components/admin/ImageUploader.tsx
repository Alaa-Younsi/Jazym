import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import { SmartImage } from "@/components/ui/SmartImage";
import { useI18n } from "@/i18n/LanguageProvider";
import { compressImage } from "@/lib/image";
import { uploadErrorMessage, uploadToBucket } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/cn";

interface SingleProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  prefix?: string;
  label?: string;
  className?: string;
}

export function SingleImageUpload({
  value,
  onChange,
  bucket = "product-images",
  prefix = "",
  label,
  className,
}: SingleProps) {
  const { t } = useI18n();
  const toast = useAdminToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!isSupabaseConfigured) {
      toast.error(t("adminUploadError"));
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToBucket(bucket, compressed, prefix);
      onChange(url);
    } catch (err) {
      toast.error(uploadErrorMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-panel-2">
        {value ? (
          <SmartImage src={value} alt="" sizes="64px" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted">
            <ImagePlus size={18} />
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-panel/70">
            <Loader2 size={16} className="animate-spin text-brand" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {label && <span className="text-xs text-muted">{label}</span>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand hover:text-brand"
          >
            {value ? t("edit") : t("add")}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-danger hover:text-danger"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

interface MultiProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  prefix?: string;
}

/** Ordered gallery uploader. Index 0 is the main image / order-line thumbnail —
    real ◀ ▶ reorder controls, no dead drag-handle glyph. See skill Phase 8. */
export function MultiImageUpload({
  value,
  onChange,
  bucket = "product-images",
  prefix = "",
}: MultiProps) {
  const { t } = useI18n();
  const toast = useAdminToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!isSupabaseConfigured) {
      toast.error(t("adminUploadError"));
      return;
    }
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        uploaded.push(await uploadToBucket(bucket, compressed, prefix));
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      toast.error(uploadErrorMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-panel-2"
          >
            <SmartImage src={url} alt="" sizes="120px" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute start-1 top-1 rounded bg-brand px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
                {t("prodImageMain")}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/60 p-1">
              <button
                type="button"
                aria-label={t("previous")}
                onClick={() => move(i, -1)}
                className="text-white disabled:opacity-30"
                disabled={i === 0}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                aria-label={t("cartRemove")}
                onClick={() => onChange(value.filter((u) => u !== url))}
                className="text-white hover:text-danger"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                aria-label={t("next")}
                onClick={() => move(i, 1)}
                className="text-white disabled:opacity-30"
                disabled={i === value.length - 1}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted transition hover:border-brand hover:text-brand"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          <span className="text-[0.65rem]">{t("prodAddImage")}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
