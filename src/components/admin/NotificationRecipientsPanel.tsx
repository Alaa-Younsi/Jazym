import { Loader2 } from "lucide-react";
import { AdminCard, Toggle } from "@/components/admin/AdminUI";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useNotificationRecipients, useSetRecipientEnabled } from "@/hooks/useNotificationPrefs";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

/**
 * Owner-only: every address the order alerts go to, across ALL admin
 * accounts. Each account still edits its own address in its own "Mon compte";
 * this panel is how the owner sees an address saved on someone else's account
 * and switches it off. Needs migration 0034.
 */
export function NotificationRecipientsPanel() {
  const { t } = useI18n();
  const toast = useAdminToast();
  const { data: rows = [], isLoading, isError } = useNotificationRecipients(true);
  const setEnabled = useSetRecipientEnabled();

  return (
    <AdminCard>
      <h2 className="text-sm font-semibold text-ink">{t("notifAllTitle")}</h2>
      <p className="mt-1 text-xs text-muted">{t("notifAllIntro")}</p>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-brand" />
        </div>
      ) : isError ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {t("notifAllLoadError")}
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("notifAllEmpty")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((r) => {
            const live = r.email_enabled && r.account_active && !!r.notify_email;
            return (
              <li
                key={r.user_id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3",
                  live ? "border-brand/40" : "border-line opacity-70",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink" dir="ltr">
                    {r.notify_email || "—"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {t("notifAllAccount")} <span dir="ltr">{r.account_email ?? r.user_id}</span>
                    {r.is_owner && ` · ${t("notifAllOwner")}`}
                    {!r.account_active && ` · ${t("notifAllInactive")}`}
                  </p>
                </div>
                <Toggle
                  checked={r.email_enabled}
                  label={t("notifEmailChannel")}
                  onChange={(enabled) =>
                    setEnabled.mutate(
                      { userId: r.user_id, enabled },
                      { onError: () => toast.error(t("adminSaveError")) },
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}
