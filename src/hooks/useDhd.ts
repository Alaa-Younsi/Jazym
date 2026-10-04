import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateOrderCaches } from "@/lib/queryCache";
import { supabase } from "@/lib/supabase";

/**
 * Dispatch to DHD goes through the `dhd` edge function — the API token is a
 * server secret and never reaches the browser. The function re-reads every
 * order itself; the only thing the admin chooses is the commune / stop desk.
 */

export interface DhdCommune {
  name: string;
  stop_desk: boolean;
}

export interface DhdPreparedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  address: string | null;
  total: number;
  status: string;
  delivery_type: "home" | "office";
  tracking: string | null;
  /** DHD's (58-wilaya) code, null when DHD does not serve the wilaya */
  dhd_wilaya_id: number | null;
  /** best match for the customer's city, null when the admin must pick */
  commune: string | null;
  stop_desk: boolean;
}

export interface DhdPrepared {
  orders: DhdPreparedOrder[];
  communes: Record<string, DhdCommune[]>;
}

export interface DhdPick {
  id: string;
  commune: string;
  stop_desk: boolean;
}

export interface DhdResult {
  id: string;
  ok: boolean;
  tracking?: string;
  code?: string;
  message?: string;
}

/** Error carrying the function's `code` so the UI can translate it. */
export class DhdError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

async function invokeDhd<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("dhd", { body });
  if (error) {
    // FunctionsHttpError keeps the Response on `context`.
    const ctx = (error as { context?: unknown }).context;
    let code = "generic";
    if (ctx instanceof Response) {
      const payload = (await ctx.json().catch(() => null)) as { code?: string } | null;
      if (payload?.code) code = payload.code;
    }
    throw new DhdError(code);
  }
  return data as T;
}

export function prepareDhd(orderIds: string[]): Promise<DhdPrepared> {
  return invokeDhd<DhdPrepared>({ action: "prepare", order_ids: orderIds });
}

export function useSendToDhd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orders: DhdPick[]): Promise<DhdResult[]> => {
      const data = await invokeDhd<{ results: DhdResult[] }>({ action: "send", orders });
      return data.results;
    },
    // Even a partly failed batch changed some orders.
    onSettled: () => invalidateOrderCaches(qc),
  });
}
