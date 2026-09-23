import { Loader2 } from "lucide-react";
import { useState } from "react";
import { AdminCard, Toggle } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import {
  EMPTY_PREFS,
  useNotificationPrefs,
  useSaveNotificationPrefs,
  type NotificationPrefsInput,
} from "@/hooks/useNotificationPrefs";
import { useI18n } from "@/i18n/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase";

type Status = { tone: "success" | "error"; text: string } | null;

/**
 * Per-admin order notifications, by email. Each account sets its OWN address —
 * the owner never configures a worker's (RLS wouldn't let them; migration
 * 0025). The send itself is the `notify` edge function via Resend.
 *
 * Split in two on purpose: this outer half waits for the query, the inner form
 * takes the loaded row as `initial` and is remounted by `key`. That is how the
 * fields get seeded without `setState` inside an effect — the same pattern
 * ProductForm uses. See skill Phase 8.9.
 */
export function NotificationPrefsPanel() {
  const { t } = useI18n();
  const { data: prefs, isLoading } = useNotificationPrefs();

  if (!isSupabaseConfigured) {
    return (
      <AdminCard>
        <h2 className="mb-2 text-sm font-semibold text-ink">{t("notifTitle")}</h2>
        <p className="text-sm text-muted">{t("notifNotConfigured")}</p>
      </AdminCard>
    );
  }

  if (isLoading) {
    return (
      <AdminCard className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-brand" />
      </AdminCard>
    );
  }

  const initial: NotificationPrefsInput = prefs
    ? { email_enabled: prefs.email_enabled, notify_email: prefs.notify_email }
    : EMPTY_PREFS;

  return <PrefsForm key={prefs?.updated_at ?? "new"} initial={initial} />;
}

function PrefsForm({ initial }: { initial: NotificationPrefsInput }) {
  const { t } = useI18n();
  const save = useSaveNotificationPrefs();

  const [enabled, setEnabled] = useState(initial.email_enabled);
  const [email, setEmail] = useState(initial.notify_email ?? "");
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    // Enabled with a blank address would be skipped in silence by the edge
    // function, which reads as "notifications don't work". Require it here.
    if (enabled && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setStatus({ tone: "error", text: t("notifErrEmail") });
      return;
    }

    try {
      await save.mutateAsync({ email_enabled: enabled, notify_email: email });
      setStatus({ tone: "success", text: t("notifSaved") });
    } catch {
      setStatus({ tone: "error", text: t("adminSaveError") });
    }
  }

  return (
    <AdminCard>
      <h2 className="text-sm font-semibold text-ink">{t("notifTitle")}</h2>
      <p className="mt-1 text-xs text-muted">{t("notifIntro")}</p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-4">
          <div>
            <p className="text-sm font-medium text-ink">{t("notifEmailChannel")}</p>
            <p className="text-xs text-muted">{t("notifEmailHint")}</p>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} label={t("notifEmailChannel")} />
        </div>

        {enabled && (
          <Field label={t("notifEmailAddress")}>
            <Input
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        )}

        {status && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              status.tone === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {status.text}
          </p>
        )}

        <Button type="submit" disabled={save.isPending} className="w-fit">
          {save.isPending ? <Loader2 size={15} className="animate-spin" /> : t("save")}
        </Button>
      </form>
    </AdminCard>
  );
}
