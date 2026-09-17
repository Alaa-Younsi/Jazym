import type { TranslationKey } from "@/i18n/translations";

/**
 * Map a `place_order` RPC error message (always prefixed with a stable ERR_*
 * code) to a translation key. One shared helper — used by both Checkout and
 * InlineCheckout. See skill Phase 5.
 */
export function orderErrorKey(message: string | undefined | null): TranslationKey {
  const m = (message ?? "").toUpperCase();
  if (m.includes("ERR_FORBIDDEN")) return "teamErrForbidden";
  if (m.includes("ERR_CART_EMPTY")) return "orderErrCartEmpty";
  if (m.includes("ERR_MISSING_SELECTION")) return "orderErrMissingSelection";
  if (m.includes("ERR_PRODUCT_UNAVAILABLE")) return "orderErrProductUnavailable";
  if (m.includes("ERR_STOCK")) return "orderErrStock";
  if (m.includes("ERR_WILAYA_DISABLED")) return "orderErrWilayaDisabled";
  if (m.includes("ERR_RATE_LIMIT")) return "orderErrRateLimit";
  if (m.includes("ERR_INVALID_INPUT")) return "orderErrInvalidInput";
  return "orderErrGeneric";
}
