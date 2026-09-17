import { Loader2, Plus, Radio, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  LoadError,
  Toggle,
} from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/Button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import {
  useAllPixelsAdmin,
  useDeletePixel,
  useSavePixel,
  type PixelInput,
} from "@/hooks/useTrackingPixels";
import { useI18n } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PixelProvider, PixelScope, TrackingPixel } from "@/types/db";

const EVENT_KEYS: (keyof TrackingPixel["events"])[] = [
  "page_view",
  "view_content",
  "add_to_cart",
  "initiate_checkout",
  "purchase",
];

const EVENT_LABEL: Record<keyof TrackingPixel["events"], TranslationKey> = {
  page_view: "pxEventPageView",
  view_content: "pxEventViewContent",
  add_to_cart: "pxEventAddToCart",
  initiate_checkout: "pxEventInitiateCheckout",
  purchase: "pxEventPurchase",
};

function emptyPixel(): PixelInput {
  return {
    provider: "meta",
    label: "",
    pixel_id: "",
    active: true,
    scope: "all",
    match_values: [],
    events: {
      page_view: true,
      view_content: true,
      add_to_cart: true,
      initiate_checkout: true,
      purchase: true,
    },
    currency: "DZD",
    sort_order: 0,
    notes: null,
  };
}

export default function Pixels() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const { data: pixels, isLoading, isError } = useAllPixelsAdmin();
  const save = useSavePixel();
  const del = useDeletePixel();
  const [draft, setDraft] = useState<PixelInput | null>(null);

  if (isLoading) return <PageLoader />;
  if (isError || !pixels) return <LoadError message={t("adminLoadError")} />;

  function startNew() {
    setDraft(emptyPixel());
  }
  function startEdit(p: TrackingPixel) {
    setDraft({ ...p });
  }

  async function onSave() {
    if (!draft) return;
    if (!/^\d{10,20}$/.test(draft.pixel_id.trim())) {
      toast.error(t("pxIdInvalid"));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(t("adminSaveError"));
      return;
    }
    try {
      await save.mutateAsync({ ...draft, label: draft.label.trim() || draft.pixel_id });
      toast.success(t("adminSaved"));
      setDraft(null);
    } catch {
      toast.error(t("adminSaveError"));
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t("pixDeleteConfirm"))) return;
    try {
      await del.mutateAsync(id);
      toast.success(t("adminDeleted"));
    } catch {
      toast.error(t("adminDeleteError"));
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t("pxListTitle")}
        actions={
          <Button size="sm" onClick={startNew}>
            <Plus size={15} />
            {t("pxNew")}
          </Button>
        }
      />

      {pixels.length === 0 && !draft ? (
        <EmptyState title={t("pxListTitle")} hint={t("pxIdHint")} />
      ) : (
        <div className="grid gap-3">
          {pixels.map((p) => (
            <AdminCard key={p.id} className="flex flex-wrap items-center gap-3">
              <Radio size={16} className={p.provider === "tiktok" ? "text-ink" : "text-brand"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {p.label}{" "}
                  <span className="text-xs font-normal text-muted">
                    · {p.provider} · {t(`pxScope${cap(p.scope)}` as TranslationKey)}
                  </span>
                </p>
                <p className="num-ltr text-xs text-muted">{p.pixel_id}</p>
              </div>
              <Toggle
                checked={p.active}
                onChange={(v) => save.mutate({ ...p, active: v })}
                label={t("pxActive")}
              />
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-brand hover:text-brand"
              >
                {t("edit")}
              </button>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                className="rounded-full border border-line p-1.5 text-muted hover:border-danger hover:text-danger"
                aria-label={t("delete")}
              >
                <Trash2 size={14} />
              </button>
            </AdminCard>
          ))}
        </div>
      )}

      {draft && (
        <AdminCard className="mt-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("pxProvider")}>
              <NativeSelect
                value={draft.provider}
                onChange={(e) => setDraft({ ...draft, provider: e.target.value as PixelProvider })}
              >
                <option value="meta">{t("pxProviderMeta")}</option>
                <option value="tiktok">{t("pxProviderTiktok")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("pxLabel")}>
              <Input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t("pxId")} hint={t("pxIdHint")}>
            <Input
              dir="ltr"
              value={draft.pixel_id}
              onChange={(e) => setDraft({ ...draft, pixel_id: e.target.value })}
            />
          </Field>
          <Field label={t("pxScope")}>
            <NativeSelect
              value={draft.scope}
              onChange={(e) => setDraft({ ...draft, scope: e.target.value as PixelScope })}
            >
              <option value="all">{t("pxScopeAll")}</option>
              <option value="paths">{t("pxScopePaths")}</option>
              <option value="products">{t("pxScopeProducts")}</option>
              <option value="landing">{t("pxScopeLanding")}</option>
            </NativeSelect>
          </Field>
          {draft.scope !== "all" && (
            <Field
              label={t("pxMatchValues")}
              hint={
                draft.scope === "paths"
                  ? t("pxMatchHintPaths")
                  : draft.scope === "products"
                    ? t("pxMatchHintProducts")
                    : t("pxMatchHintLanding")
              }
            >
              <Textarea
                rows={3}
                dir="ltr"
                value={draft.match_values.join("\n")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    match_values: e.target.value
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          )}
          <div>
            <span className="mb-2 block text-sm font-medium text-ink">{t("pxEvents")}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EVENT_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-ink"
                >
                  <input
                    type="checkbox"
                    checked={draft.events[key]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        events: { ...draft.events, [key]: e.target.checked },
                      })
                    }
                  />
                  {t(EVENT_LABEL[key])}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("pxSortOrder")}>
              <Input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </Field>
            <label className="mt-6 flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              {t("pxActive")}
            </label>
          </div>
          <Field label={t("pxNotes")}>
            <Textarea
              rows={2}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={save.isPending}>
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : t("save")}
            </Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t("cancel")}
            </Button>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
