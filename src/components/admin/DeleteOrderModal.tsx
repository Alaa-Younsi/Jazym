import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteRestocks } from "@/hooks/useOrders";
import { useI18n } from "@/i18n/LanguageProvider";
import type { Order } from "@/types/db";

interface Props {
  /** The order to delete; `null` keeps the modal closed. */
  order: Order | null;
  onClose: () => void;
  onConfirm: (order: Order) => Promise<void>;
}

export function DeleteOrderModal({ order, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    if (!order) return;
    setDeleting(true);
    try {
      await onConfirm(order);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={order !== null}
      onClose={deleting ? () => undefined : onClose}
      title={t("ordDeleteOneTitle", { number: order?.order_number ?? "" })}
      locked={deleting}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            {t("ordDeleteOneWarn")}{" "}
            {order && deleteRestocks(order.status)
              ? t("ordDeleteOneRestock")
              : t("ordDeleteOneNoRestock")}
          </p>
        </div>

        {order && (
          <p className="text-sm text-muted">
            {order.customer_name} · <span className="num-ltr">{order.customer_phone}</span>
          </p>
        )}

        <button
          type="button"
          disabled={deleting}
          onClick={confirm}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-4 py-2.5 text-sm font-medium text-white transition hover:bg-danger/90 disabled:opacity-60"
        >
          {deleting && <Loader2 size={15} className="animate-spin" />}
          {t("ordDeleteOneConfirm")}
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
