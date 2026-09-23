import { Loader2 } from "lucide-react";
import { useState } from "react";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { NotificationPrefsPanel } from "@/components/admin/NotificationPrefsPanel";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/LanguageProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Status = { tone: "success" | "error"; text: string } | null;

export default function Account() {
  const { t } = useI18n();
  const { session } = useAuth();
  const { isOwner } = useAdminProfile();
  const email = session?.user.email ?? "";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (next.length < 8) {
      setStatus({ tone: "error", text: t("accTooShort") });
      return;
    }
    if (next !== confirm) {
      setStatus({ tone: "error", text: t("accMismatch") });
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus({ tone: "error", text: t("adminSaveError") });
      return;
    }
    setBusy(true);
    // Re-authenticate before updating — updateUser alone requires no proof of
    // the old password. A failed sign-in returns an error without disturbing
    // the live session. See skill Phase 8.5.
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (authError) {
      setBusy(false);
      setStatus({ tone: "error", text: t("accWrongPassword") });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("should be different")) {
        setStatus({ tone: "error", text: t("accWrongPassword") });
      } else if (msg.includes("at least") || msg.includes("too short")) {
        setStatus({ tone: "error", text: t("accTooShort") });
      } else {
        setStatus({ tone: "error", text: t("adminSaveError") });
      }
      return;
    }
    setStatus({ tone: "success", text: t("accUpdated") });
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div>
      <AdminPageHeader title={t("accTitle")} />

      <div className="grid max-w-lg gap-6">
        <AdminCard className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">{t("accEmail")}</p>
            <p className="num-ltr text-sm font-medium text-ink">{email}</p>
          </div>
          <span className="rounded-full bg-brand-soft/70 px-3 py-1 text-xs font-medium text-brand">
            {isOwner ? t("accRoleOwner") : t("accRoleStaff")}
          </span>
        </AdminCard>

        <NotificationPrefsPanel />

        <AdminCard>
          <h2 className="mb-4 text-sm font-semibold text-ink">{t("accChangePassword")}</h2>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label={t("accCurrentPassword")}>
              <Input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </Field>
            <Field label={t("accNewPassword")}>
              <Input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
            </Field>
            <Field label={t("accConfirmPassword")}>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </Field>
            {status && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  status.tone === "success"
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {status.text}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : t("accChangePassword")}
            </Button>
          </form>
        </AdminCard>
      </div>
    </div>
  );
}
