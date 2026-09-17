import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import { AdminCard, AdminPageHeader, LoadError, Toggle } from "@/components/admin/AdminUI";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Button } from "@/components/ui/Button";
import { Field, Input, NativeSelect } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import {
  useSaveAnnouncement,
  useStoreSettings,
  type AnnouncementFormState,
} from "@/hooks/useStoreSettings";
import { useI18n } from "@/i18n/LanguageProvider";
import {
  announcementItems,
  announcementSpeed,
  announcementStyle,
  ANNOUNCEMENT_STYLES,
  EMOJI_SUGGESTIONS,
  EMPTY_ANNOUNCEMENT_ITEM,
  isAnnouncementEnabled,
  MAX_ANNOUNCEMENT_ITEMS,
} from "@/lib/announcement";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { AnnouncementItem, AnnouncementStyle } from "@/types/db";

const STYLE_LABEL_KEYS = {
  gradient: "annStyleGradient",
  solid: "annStyleSolid",
  soft: "annStyleSoft",
} as const;

export default function Announcement() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const { data: settings, isLoading, isError } = useStoreSettings();
  const save = useSaveAnnouncement();

  const [form, setForm] = useState<AnnouncementFormState | null>(null);

  useEffect(() => {
    if (!settings) return;
    setForm({
      announcement_enabled: isAnnouncementEnabled(settings),
      announcement_items: announcementItems(settings),
      announcement_speed: announcementSpeed(settings),
      announcement_style: announcementStyle(settings),
    });
  }, [settings]);

  if (isError) return <LoadError message={t("adminLoadError")} />;
  if (isLoading || !form) return <PageLoader />;

  const items = form.announcement_items;
  const set = <K extends keyof AnnouncementFormState>(key: K, value: AnnouncementFormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const setItems = (next: AnnouncementItem[]) => set("announcement_items", next);

  const patchItem = (index: number, patch: Partial<AnnouncementItem>) =>
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  async function onSave() {
    if (!form) return;
    const cleaned = form.announcement_items
      .map((item) => ({
        text_fr: item.text_fr.trim(),
        text_ar: item.text_ar.trim() || item.text_fr.trim(),
        emoji_start: item.emoji_start.trim().slice(0, 8),
        emoji_end: item.emoji_end.trim().slice(0, 8),
      }))
      .filter((item) => item.text_fr.length > 0);

    if (form.announcement_enabled && cleaned.length !== form.announcement_items.length) {
      toast.error(t("annNeedsText"));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      await save.mutateAsync({ ...form, announcement_items: cleaned });
      setItems(cleaned);
      toast.success(t("adminSaved"));
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  const previewItems = items.filter((i) => i.text_fr.trim() || i.text_ar.trim());

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        title={t("annTitle")}
        description={t("annIntro")}
        actions={
          <Button onClick={onSave} disabled={save.isPending}>
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {t("save")}
          </Button>
        }
      />

      <div className="flex flex-col gap-5">
        <AdminCard>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">
            {t("annPreview")}
          </span>
          {form.announcement_enabled && previewItems.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-line">
              <AnnouncementBar
                items={previewItems}
                style={form.announcement_style}
                speed={form.announcement_speed}
                preview
              />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
              {t("annEmptyPreview")}
            </p>
          )}
        </AdminCard>

        <AdminCard className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">{t("annEnabled")}</span>
            <Toggle
              checked={form.announcement_enabled}
              onChange={(v) => set("announcement_enabled", v)}
              label={t("annEnabled")}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("annStyle")}>
              <NativeSelect
                value={form.announcement_style}
                onChange={(e) => set("announcement_style", e.target.value as AnnouncementStyle)}
              >
                {ANNOUNCEMENT_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {t(STYLE_LABEL_KEYS[style])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("annSpeed")} hint={t("annSpeedHint")}>
              <Input
                type="number"
                inputMode="numeric"
                min={2}
                max={60}
                value={form.announcement_speed}
                onChange={(e) =>
                  set("announcement_speed", Math.min(60, Math.max(2, Number(e.target.value) || 6)))
                }
              />
            </Field>
          </div>
        </AdminCard>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">{t("annMessages")}</h2>
            <Button
              size="sm"
              variant="secondary"
              disabled={items.length >= MAX_ANNOUNCEMENT_ITEMS}
              onClick={() => setItems([...items, { ...EMPTY_ANNOUNCEMENT_ITEM }])}
            >
              <Plus size={14} />
              {t("annAddMessage")}
            </Button>
          </div>

          {items.length === 0 && (
            <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-xs text-muted">
              {t("annEmptyPreview")}
            </p>
          )}

          {items.map((item, index) => (
            <AdminCard key={index} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="num-ltr grid h-6 w-6 place-items-center rounded-full bg-panel-2 text-xs font-medium text-muted">
                  {index + 1}
                </span>
                <div className="ms-auto flex items-center gap-1">
                  <IconButton
                    label={t("previous")}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    <ChevronUp size={15} />
                  </IconButton>
                  <IconButton
                    label={t("next")}
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                  >
                    <ChevronDown size={15} />
                  </IconButton>
                  <IconButton
                    label={t("delete")}
                    danger
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("annTextFr")}>
                  <Input
                    dir="ltr"
                    value={item.text_fr}
                    maxLength={120}
                    onChange={(e) => patchItem(index, { text_fr: e.target.value })}
                  />
                </Field>
                <Field label={t("annTextAr")}>
                  <Input
                    dir="rtl"
                    value={item.text_ar}
                    maxLength={120}
                    onChange={(e) => patchItem(index, { text_ar: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <EmojiField
                  label={t("annEmojiStart")}
                  value={item.emoji_start}
                  onChange={(v) => patchItem(index, { emoji_start: v })}
                />
                <EmojiField
                  label={t("annEmojiEnd")}
                  value={item.emoji_end}
                  onChange={(v) => patchItem(index, { emoji_end: v })}
                />
              </div>
            </AdminCard>
          ))}

          <p className="text-xs text-muted">{t("annMessageLimit")}</p>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition disabled:opacity-35 ${
        danger ? "hover:border-danger hover:text-danger" : "hover:border-brand hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

/** Free-text emoji input plus a tap-to-insert palette — no picker dependency. */
function EmojiField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <Input
          dir="ltr"
          value={value}
          maxLength={8}
          placeholder={t("annEmojiNone")}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 text-center text-lg"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted underline hover:text-danger"
          >
            {t("annEmojiNone")}
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t("annEmojiPick")}>
        {EMOJI_SUGGESTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            aria-pressed={value === emoji}
            className={`grid h-9 w-9 place-items-center rounded-lg border text-base transition ${
              value === emoji
                ? "border-brand bg-brand-soft"
                : "border-line hover:border-brand hover:bg-panel-2"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </Field>
  );
}
