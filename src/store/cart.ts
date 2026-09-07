import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartVariantPick, Product, QuantityOffer } from "@/types/db";
import { variantPickKey } from "@/lib/utils";

export interface CartLine {
  /** stable identity: productId + color + size + sorted variant-pick key */
  key: string;
  productId: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  unitPrice: number;
  image_url: string | null;
  quantity: number;
  color: string | null;
  size: string | null;
  variants: CartVariantPick[];
  quantity_offers: QuantityOffer[];
  /** max quantity that can be ordered (product stock at add time) */
  maxQuantity: number;
}

export interface AddLineInput {
  product: Product;
  unitPrice: number;
  quantity: number;
  color: string | null;
  size: string | null;
  variants: CartVariantPick[];
  image_url: string | null;
}

function lineKey(
  productId: string,
  color: string | null,
  size: string | null,
  variants: CartVariantPick[],
): string {
  return [productId, color ?? "", size ?? "", variantPickKey(variants)].join("::");
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  addLine: (input: AddLineInput) => void;
  removeLine: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      addLine: (input) => {
        const key = lineKey(input.product.id, input.color, input.size, input.variants);
        set((state) => {
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              isOpen: true,
              lines: state.lines.map((l) =>
                l.key === key
                  ? {
                      ...l,
                      quantity: Math.min(l.quantity + input.quantity, l.maxQuantity),
                    }
                  : l,
              ),
            };
          }
          const line: CartLine = {
            key,
            productId: input.product.id,
            slug: input.product.slug,
            name_fr: input.product.name_fr,
            name_ar: input.product.name_ar,
            unitPrice: input.unitPrice,
            image_url: input.image_url,
            quantity: Math.min(input.quantity, Math.max(1, input.product.stock || 20)),
            color: input.color,
            size: input.size,
            variants: input.variants,
            quantity_offers: input.product.quantity_offers,
            maxQuantity: Math.max(1, Math.min(input.product.stock || 20, 20)),
          };
          return { isOpen: true, lines: [...state.lines, line] };
        });
      },
      removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxQuantity)) } : l,
          ),
        })),
      clear: () => set({ lines: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      totalItems: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: "jazym-cart",
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
