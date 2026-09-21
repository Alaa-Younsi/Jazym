import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartVariantPick, Order, OrderStatus } from "@/types/db";
import type { Lang } from "@/i18n/translations";
import { normalizeOrder } from "@/lib/normalize";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { invalidateOrderCaches } from "@/lib/queryCache";

const ORDERS_LIMIT = 300;

export interface PlaceOrderItem {
  product_id: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  variants?: CartVariantPick[];
  variant_id?: string | null;
  /** optional per-line note the shopper attached to this product */
  note?: string | null;
}

export interface PlaceOrderCustomer {
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  address?: string | null;
  notes?: string | null;
  delivery_type: "home" | "office";
  language: Lang;
}

/**
 * Calls the `place_order` SECURITY DEFINER RPC. The client NEVER sends prices,
 * shipping or discount — the server re-derives all of it. Returns the generated
 * order_number. See skill Phase 5.
 */
export async function placeOrder(
  items: PlaceOrderItem[],
  customer: PlaceOrderCustomer,
): Promise<string> {
  if (!isSupabaseConfigured) {
    // Demo mode: fabricate a plausible order number so the flow is walkable.
    await new Promise((r) => setTimeout(r, 600));
    const suffix = Math.random().toString(16).slice(2, 12).toUpperCase();
    return `JZ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${suffix}`;
  }
  const { data, error } = await supabase.rpc("place_order", {
    items,
    customer,
  });
  if (error) throw error;
  return String(data);
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      items,
      customer,
    }: {
      items: PlaceOrderItem[];
      customer: PlaceOrderCustomer;
    }) => placeOrder(items, customer),
    onSuccess: () => invalidateOrderCaches(qc),
  });
}

export interface GuestOrder {
  order_number: string;
  customer_name: string;
  wilaya: string;
  city: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  delivery_type: "home" | "office";
  items: {
    name_fr: string;
    name_ar: string;
    price: number;
    quantity: number;
    color: string | null;
    size: string | null;
    variants: CartVariantPick[];
    image_url: string | null;
    note: string | null;
  }[];
}

/** Guest lookup via the `get_order_by_number` RPC — never a direct .from(). */
export function useOrderByNumber(orderNumber: string | undefined) {
  return useQuery({
    queryKey: ["order", orderNumber],
    enabled: !!orderNumber,
    retry: 0,
    queryFn: async (): Promise<GuestOrder | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.rpc("get_order_by_number", {
        p_order_number: orderNumber,
      });
      if (error) throw error;
      return (data as GuestOrder | null) ?? null;
    },
  });
}

/* ---------------- admin ---------------- */

/** @param enabled false for a staff member without the `orders` section — RLS
    would hand back an empty set, which reads as "0 orders" rather than
    "not yours to see". */
export function useAdminOrders(status: OrderStatus | "all" = "all", enabled = true) {
  return useQuery({
    queryKey: ["orders", status],
    enabled,
    queryFn: async (): Promise<{ rows: Order[]; capped: boolean }> => {
      if (!isSupabaseConfigured) return { rows: [], capped: false };
      let query = supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(ORDERS_LIMIT);
      if (status !== "all") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data as Record<string, unknown>[]).map(normalizeOrder);
      return { rows, capped: rows.length >= ORDERS_LIMIT };
    },
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["order", "admin", id],
    enabled: !!id,
    queryFn: async (): Promise<Order | null> => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeOrder(data as Record<string, unknown>) : null;
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateOrderCaches(qc),
  });
}

export function useUpdateOrderNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string | null }) => {
      const { error } = await supabase.from("orders").update({ notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateOrderCaches(qc),
  });
}

/** A line the admin enters by hand for a manually-logged order — a real
    catalog product (with its own snapshot fields) or a free-text line. */
export interface AdminOrderLine {
  product_id?: string | null;
  variant_id?: string | null;
  name_fr: string;
  name_ar?: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

export interface AdminCreateOrderInput {
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  address?: string | null;
  notes?: string | null;
  delivery_type: "home" | "office";
  shipping: number;
  status: OrderStatus;
  items: AdminOrderLine[];
}

/** Logs an order that happened outside the site (phone/in-person sale) via
    the admin_create_order RPC — distinct from place_order(), no customer
    rate-limiting, admin-entered price/shipping trusted as-is. */
export function useAdminCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminCreateOrderInput): Promise<string> => {
      const { data, error } = await supabase.rpc("admin_create_order", {
        customer: {
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          wilaya: input.wilaya,
          city: input.city,
          address: input.address ?? null,
          notes: input.notes ?? null,
          delivery_type: input.delivery_type,
          shipping: input.shipping,
        },
        items: input.items,
        order_status: input.status,
      });
      if (error) throw error;
      return String(data);
    },
    onSuccess: () => invalidateOrderCaches(qc),
  });
}

export function useDeleteAllOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Supabase refuses an unfiltered delete.
      const { error } = await supabase.from("orders").delete().not("id", "is", null);
      if (error) throw error;
    },
    onSuccess: () => invalidateOrderCaches(qc),
  });
}

export const ORDERS_PAGE_LIMIT = ORDERS_LIMIT;
