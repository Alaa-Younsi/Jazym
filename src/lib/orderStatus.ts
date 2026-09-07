import type { OrderStatus } from "@/types/db";
import type { TranslationKey } from "@/i18n/translations";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export function orderStatusKey(status: OrderStatus): TranslationKey {
  const map: Record<OrderStatus, TranslationKey> = {
    pending: "ordStatusPending",
    confirmed: "ordStatusConfirmed",
    shipped: "ordStatusShipped",
    delivered: "ordStatusDelivered",
    cancelled: "ordStatusCancelled",
  };
  return map[status];
}

export function orderStatusTone(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "text-success bg-success/10";
    case "cancelled":
      return "text-danger bg-danger/10";
    case "shipped":
      return "text-brand bg-brand-soft/60";
    case "confirmed":
      return "text-ink bg-panel-2";
    default:
      return "text-muted bg-panel-2";
  }
}
