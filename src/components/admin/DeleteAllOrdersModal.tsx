import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/i18n/LanguageProvider";
import type { Order } from "@/types/db";
import { exportOrdersToXlsx } from "@/lib/exportOrders";

interface Props {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onConfirm: () => Promise<void>;
}

export function DeleteAllOrdersModal({ open, onClose, orders, onConfirm }: Props) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={deleting ? () => undefined : onClose}
      title={t("ordDeleteAllTitle")}
      locked={deleting}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{t("ordDeleteAllWarn", { count: orders.length })}</p>
        </div>

        <button
          type="button"
          disabled={deleting || orders.length === 0}
          onClick={() => exportOrdersToXlsx(orders)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          <Download size={15} />
          {t("ordDeleteAllExportFirst")}
        </button>

        <button
          type="button"
          disabled={deleting}
          onClick={confirm}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-4 py-2.5 text-sm font-medium text-white transition hover:bg-danger/90 disabled:opacity-60"
        >
          {deleting && <Loader2 size={15} className="animate-spin" />}
          {t("ordDeleteAllConfirm")}
        </button>

        <button
          type="button"
          disabled={deleting}
          onClick={onClose}
          className="text-center text-xs text-muted hover:text-ink"
        >
          {t("cancel")}
        </button>
      </div>
    </Modal>
  );
}
