import { AlertTriangle, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import { Input } from "@/components/ui/Field";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatBytes, MAX_VIDEO_BYTES, resolveVideo, WARN_VIDEO_BYTES } from "@/lib/video";
import { isSupabaseConfigured } from "@/lib/supabase";
import { uploadErrorMessage, uploadToBucket } from "@/lib/storage";
import { cn } from "@/lib/cn";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  prefix?: string;
}

type Mode = "upload" | "url";

/**
 * One field, two ways in: upload a file to Supabase Storage, or paste a link
 * from YouTube / Vimeo / a social post / any direct .mp4. Both end up as a URL
 * in `products.video_url`; VideoPlayer decides how to render it.
 */
export function VideoField({ value, onChange, bucket = "product-videos", prefix = "" }: Props) {
  const { t } = useI18n();
  const toast = useAdminToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(
    value && !value.includes("/storage/v1/") ? "url" : "upload",
  );
  const [busy, setBusy] = useState(false);
  const [progressNote, setProgressNote] = useState<string | null>(null);

  const resolved = resolveVideo(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error(t("vidErrType"));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(t("vidErrTooLarge", { max: formatBytes(MAX_VIDEO_BYTES) }));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("adminUploadError"));
      return;
    }
    setBusy(true);
    setProgressNote(formatBytes(file.size));
    try {
      const url = await uploadToBucket(bucket, file, prefix);
      onChange(url);
      if (file.size > WARN_VIDEO_BYTES) toast.error(t("vidWarnHeavy"));
    } catch (err) {
      toast.error(uploadErrorMessage(err));
    } finally {
      setBusy(false);
      setProgressNote(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink">{t("vidLabel")}</span>
        <div className="ms-auto inline-flex rounded-full border border-line p-0.5">
          <ModeTab active={mode === "upload"} onClick={() => setMode("upload")}>
            <Upload size={13} />
            {t("vidModeUpload")}
          </ModeTab>
          <ModeTab active={mode === "url"} onClick={() => setMode("url")}>
            <Link2 size={13} />
            {t("vidModeUrl")}
          </ModeTab>
        </div>
      </div>

      {mode === "upload" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {value ? t("edit") : t("add")}
          </button>
          <span className="text-xs text-muted">
            {progressNote ?? t("vidUploadHint", { max: formatBytes(MAX_VIDEO_BYTES) })}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <Input
          dir="ltr"
          inputMode="url"
          placeholder="https://…"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim() || null)}
        />
      )}

      <p className="text-xs text-muted">{t("vidHint")}</p>
      {mode === "upload" && <p className="text-xs text-muted">{t("vidPreferLink")}</p>}

      {value && resolved && !resolved.silentLoopGuaranteed && (
        <p className="flex items-start gap-2 rounded-xl bg-gold/12 px-3 py-2 text-xs text-ink">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold" />
          {t("vidEmbedWarning")}
        </p>
      )}

      {value && !resolved && (
        <p className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t("vidErrUrl")}
        </p>
      )}

      {value && resolved && (
        <div className="flex flex-col gap-2">
          <VideoPlayer url={value} className="max-w-sm" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition hover:text-danger"
          >
            <Trash2 size={13} />
            {t("vidRemove")}
          </button>
        </div>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
        active ? "bg-brand text-white" : "text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
