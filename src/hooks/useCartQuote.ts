import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCategories } from "@/hooks/useCategories";
import { usePromotions } from "@/hooks/usePromotions";
import { quoteCart, type CartQuote, type QuoteLineInput } from "@/lib/promotions";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useCart, type CartLine } from "@/store/cart";

export interface VerifiedQuote extends CartQuote {
  /** true once the server RPC has confirmed these numbers. */
  verified: boolean;
}

/** What `price_cart` / `place_order` accept — ids and quantities, never prices. */
interface QuoteItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
}

/**
 * The ONE cart pricing path for every screen that shows a goods total.
 *
 * The local mirror answers instantly so quantity steppers never lag; the
 * `price_cart` RPC then confirms with the numbers `place_order` will actually
 * charge, and its totals win the moment they land. Per-line detail always
 * comes from the mirror — the RPC drops lines it cannot resolve, so its array
 * cannot be indexed back onto cart keys.
 */
function useQuote(lines: QuoteLineInput[], items: QuoteItem[]): VerifiedQuote {
  const { data: promotions = [] } = usePromotions();
  const { data: categories = [] } = useCategories();

  const local = useMemo(
    () => quoteCart(lines, promotions, categories),
    [lines, promotions, categories],
  );

  const server = useQuery({
    queryKey: ["cart-quote", items],
    enabled: isSupabaseConfigured && items.length > 0,
    staleTime: 1000 * 30,
    retry: 0,
    queryFn: async (): Promise<{ subtotal: number; discount: number }> => {
      const { data, error } = await supabase.rpc("price_cart", { items });
      if (error) throw error;
      const row = (data ?? {}) as { subtotal?: number; discount?: number };
      return { subtotal: Number(row.subtotal ?? 0), discount: Number(row.discount ?? 0) };
    },
  });

  if (!server.data) return { ...local, verified: false };

  const { subtotal, discount } = server.data;
  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    lines: local.lines,
    verified: true,
  };
}

function toQuoteLine(line: CartLine): QuoteLineInput {
  return {
    key: line.key,
    productId: line.productId,
    categoryId: line.categoryId,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    quantityOffers: line.quantity_offers,
  };
}

/** Priced quote for the whole cart (drawer + /commander). */
export function useCartQuote(): VerifiedQuote {
  const lines = useCart((s) => s.lines);
  const quoteLines = useMemo(() => lines.map(toQuoteLine), [lines]);
  const items = useMemo(
    () =>
      lines.map((l) => ({
        product_id: l.productId,
        variant_id: l.variantId,
        quantity: l.quantity,
      })),
    [lines],
  );
  return useQuote(quoteLines, items);
}

/** Priced quote for a single product line — the buy-now form on a product page. */
export function useLineQuote(line: QuoteLineInput & { variantId: string | null }): VerifiedQuote {
  const quoteLines = useMemo(
    () => [
      {
        key: line.key,
        productId: line.productId,
        categoryId: line.categoryId,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        quantityOffers: line.quantityOffers,
      },
    ],
    [line.key, line.productId, line.categoryId, line.unitPrice, line.quantity, line.quantityOffers],
  );
  const items = useMemo(
    () => [{ product_id: line.productId, variant_id: line.variantId, quantity: line.quantity }],
    [line.productId, line.variantId, line.quantity],
  );
  return useQuote(quoteLines, items);
}
