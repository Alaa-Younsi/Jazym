import { AlertTriangle, CheckCircle2, Loader2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Price } from "@/components/ui/Price";
import {
  DhdError,
  type DhdCommune,
  type DhdPrepared,
  type DhdPreparedOrder,
  type DhdResult,
  prepareDhd,
  useSendToDhd,
} from "@/hooks/useDhd";
import { useI18n } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/cn";

interface Props {
  /** ids of the selected orders; empty keeps the modal closed */
  orderIds: string[];
  onClose: () => void;
  /** called once a batch went through, so the list can drop its selection */
  onSent: (sentIds: string[]) => void;
}

interface Draft {
  commune: string;
  stop_desk: boolean;
}

const ERROR_KEYS: Record<string, TranslationKey> = {
  not_configured: "dhdErrNotConfigured",
  dhd_unreachable: "dhdErrUnreachable",
  forbidden: "dhdErrForbidden",
  in_progress: "dhdErrInProgress",
  bad_status: "dhdErrBadStatus",
  unknown_wilaya: "dhdUnknownWilaya",
  no_stop_desk: "dhdNoDesk",
};

/**
 * Review-then-send. The edge function proposes DHD's commune for each order
 * (customers type their city freely, often in Arabic, and DHD rejects any
 * spelling not in its list); the admin fixes the ones it couldn't match and
 * confirms. Results are shown per order — a batch can partly fail.
 */
export function SendToDhdModal({ orderIds, onClose, onSent }: Props) {
  const { t } = useI18n();
  const send = useSendToDhd();
  const open = orderIds.length > 0;
  const [prepared, setPrepared] = useState<DhdPrepared | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [results, setResults] = useState<Record<string, DhdResult> | null>(null);

  const idsKey = orderIds.join(",");
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    setPrepared(null);
    setLoadError(null);
    setResults(null);
    (async () => {
      try {
        const data = await prepareDhd(idsKey.split(","));
        if (cancelled) return;
        setPrepared(data);
        setDrafts(
          Object.fromEntries(
            data.orders.map((o) => [o.id, { commune: o.commune ?? "", stop_desk: o.stop_desk }]),
          ),
        );
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof DhdError ? e.code : "generic");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  function errorText(code: string | undefined, message?: string, tracking?: string): string {
    if (code === "already_sent") return t("dhdAlreadySent", { tracking: tracking ?? "" });
    if (code === "rejected") return t("dhdErrRejected", { message: message ?? "" });
    if (code === "uncertain") return t("dhdErrUncertain", { message: message ?? "" });
    const key = code ? ERROR_KEYS[code] : undefined;
    return t(key ?? "dhdErrGeneric");
  }

  const sendable = (prepared?.orders ?? []).filter(
    (o) => !o.tracking && o.dhd_wilaya_id !== null && !results?.[o.id]?.ok,
  );
  const ready = sendable.filter((o) => drafts[o.id]?.commune);

  async function confirm() {
    try {
      const out = await send.mutateAsync(ready.map((o) => ({ id: o.id, ...drafts[o.id] })));
      setResults((prev) => ({ ...prev, ...Object.fromEntries(out.map((r) => [r.id, r])) }));
      const sent = out.filter((r) => r.ok).map((r) => r.id);
      if (sent.length > 0) onSent(sent);
    } catch (e) {
      setLoadError(e instanceof DhdError ? e.code : "generic");
    }
  }

  const busy = send.isPending;

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={t("dhdModalTitle")}
      locked={busy}
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted">{t("dhdModalHint")}</p>

        {loadError && (
          <div className="flex gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{errorText(loadError)}</p>
          </div>
        )}

        {!prepared && !loadError && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={15} className="animate-spin" />
            {t("dhdLoading")}
          </p>
        )}

        {prepared && (
          <ul className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
            {prepared.orders.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                communes={
                  o.dhd_wilaya_id !== null ? (prepared.communes[o.dhd_wilaya_id] ?? []) : []
                }
                draft={drafts[o.id]}
                result={results?.[o.id]}
                disabled={busy}
                errorText={errorText}
                onChange={(d) => setDrafts((prev) => ({ ...prev, [o.id]: d }))}
              />
            ))}
          </ul>
        )}

        {prepared && ready.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
            {t("dhdConfirm", { count: ready.length })}
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="text-center text-xs text-muted hover:text-ink"
        >
          {results ? t("dhdDone") : t("cancel")}
        </button>
      </div>
    </Modal>
  );
}

function OrderRow({
  order: o,
  communes,
  draft,
  result,
  disabled,
  errorText,
  onChange,
}: {
  order: DhdPreparedOrder;
  communes: DhdCommune[];
  draft: Draft | undefined;
  result: DhdResult | undefined;
  disabled: boolean;
  errorText: (code: string | undefined, message?: string, tracking?: string) => string;
  onChange: (d: Draft) => void;
}) {
  const { t } = useI18n();
  const chosen = communes.find((c) => c.name === draft?.commune);
  const locked = disabled || !!o.tracking || !!result?.ok || o.dhd_wilaya_id === null;

  return (
    <li
      className={cn(
        "rounded-card border p-3 text-sm",
        result?.ok ? "border-success/40 bg-success/5" : "border-line bg-panel",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-brand">{o.order_number}</span>
        <Price value={o.total} className="font-semibold text-ink" />
      </div>
      <p className="mt-0.5 text-ink">
        {o.customer_name} · <span className="num-ltr text-muted">{o.customer_phone}</span>
      </p>
      <p className="text-xs text-muted">
        {o.wilaya} · {t("dhdCustomerTyped", { city: o.city })}
      </p>

      {o.tracking ? (
        <p className="mt-2 text-xs font-medium text-muted">
          {t("dhdAlreadySent", { tracking: o.tracking })}
        </p>
      ) : o.dhd_wilaya_id === null ? (
        <p className="mt-2 text-xs font-medium text-danger">{t("dhdUnknownWilaya")}</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={draft?.commune ?? ""}
            disabled={locked}
            aria-label={t("dhdCommune")}
            onChange={(e) => {
              const next = communes.find((c) => c.name === e.target.value);
              onChange({
                commune: e.target.value,
                stop_desk: !!draft?.stop_desk && !!next?.stop_desk,
              });
            }}
            className={cn(
              "h-9 min-w-0 flex-1 rounded-full border bg-panel px-3 text-xs text-ink outline-none transition focus:border-brand disabled:opacity-60",
              draft?.commune ? "border-line" : "border-gold",
            )}
          >
            <option value="">{t("dhdChooseCommune")}</option>
            {communes.map((c) => (
              <option key={c.name} value={c.name}>
                {c.stop_desk ? `${c.name} ★` : c.name}
              </option>
            ))}
          </select>
          <label
            className={cn(
              "flex shrink-0 items-center gap-2 text-xs",
              chosen?.stop_desk ? "text-ink" : "text-muted",
            )}
            title={chosen && !chosen.stop_desk ? t("dhdNoDesk") : undefined}
          >
            <input
              type="checkbox"
              checked={!!draft?.stop_desk}
              disabled={locked || !chosen?.stop_desk}
              onChange={(e) =>
                onChange({ commune: draft?.commune ?? "", stop_desk: e.target.checked })
              }
              className="h-4 w-4 accent-brand"
            />
            {t("dhdStopDesk")}
          </label>
        </div>
      )}

      {result &&
        (result.ok ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
            <CheckCircle2 size={14} />
            {t("dhdResultOk", { tracking: result.tracking ?? "" })}
          </p>
        ) : (
          <p className="mt-2 text-xs font-medium text-danger">
            {errorText(result.code, result.message, result.tracking)}
          </p>
        ))}
    </li>
  );
}
