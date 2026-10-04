// Send orders to DHD (delivery company, Ecotrack platform).
// Self-contained on purpose (no ../_shared import — the CLI bundler does not
// reliably pull sibling files in).
//
// Deploy:  supabase functions deploy dhd
// Secrets: supabase secrets set DHD_API_TOKEN=<token from the DHD account>
//          supabase secrets set DHD_API_URL=https://platform.dhd-dz.com/api/v1   (optional)
//
// The token never reaches the browser. Two actions, both for an active admin
// with the `orders` section (or the owner):
//
//  * prepare { order_ids }        — reads the orders and proposes DHD's wilaya
//                                   code + commune for each, with the commune
//                                   list so the admin can fix a bad match.
//  * send    { orders: [{ id, commune, stop_desk }] }
//                                 — creates the parcels. Everything except the
//                                   commune / stop-desk choice is re-read from
//                                   the database: the amount DHD collects is
//                                   the stored order total, never a client
//                                   value.
//
// DHD only knows the 58 historical wilayas. Orders from the 2019 and 2026
// wilayas go under their parent wilaya, whose commune list still holds them.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const DEFAULT_API = "https://platform.dhd-dz.com/api/v1";
const MAX_ORDERS = 50;
/** A claim this old with no tracking number is a crashed call — retryable. */
const STALE_CLAIM_MS = 5 * 60 * 1000;
const SENDABLE = ["pending", "confirmed", "shipped"];

/** Index = the store's wilaya code (src/lib/wilayas.ts), 1..69. */
const WILAYA_NAMES = [
  "",
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
  "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
  "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
  "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa", "Aflou",
  "Barika", "El Kantara", "Bir El Ater", "El Aricha", "Ksar Chellala", "Aïn Oussera",
  "Messaad", "Ksar El Boukhari", "Bou Saâda", "El Abiodh Sidi Cheikh",
];

/** Wilayas DHD does not list, mapped to the wilaya they were carved out of. */
const PARENT_WILAYA: Record<number, number> = {
  50: 1, 54: 11, 56: 33,
  59: 3, 60: 5, 61: 7, 62: 12, 63: 13, 64: 14, 65: 17, 66: 17, 67: 26, 68: 28, 69: 32,
};

/** Lowercase, accents and punctuation stripped: "Aïn Témouchent" → "aintemouchent". */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]/g, "");
}

function dhdWilayaId(storeWilaya: string): number | null {
  const n = norm(storeWilaya);
  const code = WILAYA_NAMES.findIndex((w, i) => i > 0 && norm(w) === n);
  if (code < 1) return null;
  return PARENT_WILAYA[code] ?? code;
}

interface Commune {
  name: string;
  stop_desk: boolean;
}

function matchCommune(city: string, communes: Commune[]): Commune | null {
  const n = norm(city);
  if (!n) return null;
  const exact = communes.find((c) => norm(c.name) === n);
  if (exact) return exact;
  // "El Eulma centre" / "Eulma" — accept a containment match only when it is
  // unambiguous and long enough not to be noise.
  const loose = communes.filter((c) => {
    const cn = norm(c.name);
    return cn.length >= 4 && n.length >= 4 && (n.includes(cn) || cn.includes(n));
  });
  if (loose.length === 1) return loose[0];
  // Spelling variants ("Oulmène" / "Oulmane"): a unique closest name within
  // 2 edits.
  if (n.length < 5) return null;
  let best: Commune | null = null;
  let bestDist = 3;
  let tie = false;
  for (const c of communes) {
    const d = editDistance(n, norm(c.name));
    if (d < bestDist) {
      best = c;
      bestDist = d;
      tie = false;
    } else if (d === bestDist) {
      tie = true;
    }
  }
  return tie ? null : best;
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** "+213 559 81 56 46" → "0559815646" — DHD wants 9-10 local digits. */
function localPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00213")) d = d.slice(5);
  else if (d.startsWith("213")) d = d.slice(3);
  if (d.length === 9 && !d.startsWith("0")) d = `0${d}`;
  return d;
}

function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  address: string | null;
  notes: string | null;
  total: number;
  status: string;
  delivery_type: string;
  delivery_tracking: string | null;
  order_items: { name_fr: string; quantity: number }[];
}

class Dhd {
  private communeCache = new Map<number, Promise<Commune[]>>();

  constructor(
    private base: string,
    private token: string,
  ) {}

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  communes(wilayaId: number): Promise<Commune[]> {
    let p = this.communeCache.get(wilayaId);
    if (!p) {
      p = (async () => {
        const res = await fetch(`${this.base}/get/communes?wilaya_id=${wilayaId}`, {
          headers: this.headers(),
        });
        if (!res.ok) throw new Error(`communes_${res.status}`);
        const rows = (await res.json()) as { nom: string; has_stop_desk: number }[];
        return rows.map((r) => ({ name: r.nom, stop_desk: r.has_stop_desk === 1 }));
      })();
      this.communeCache.set(wilayaId, p);
    }
    return p;
  }

  /** Ok → tracking. `rejected` = DHD validated and refused, nothing created.
      `uncertain` = network/5xx: the parcel MAY exist on DHD's side. */
  async create(
    body: Record<string, unknown>,
  ): Promise<
    | { ok: true; tracking: string }
    | { ok: false; kind: "rejected" | "uncertain"; message: string }
  > {
    let res: Response;
    try {
      res = await fetch(`${this.base}/create/order`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, kind: "uncertain", message: "network" };
    }
    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      tracking?: string;
      message?: string;
      errors?: Record<string, string[]>;
    } | null;
    if (res.ok && data?.tracking) return { ok: true, tracking: data.tracking };
    if (res.status >= 400 && res.status < 500) {
      const details = data?.errors ? Object.values(data.errors).flat().join(" · ") : "";
      return {
        ok: false,
        kind: "rejected",
        message: details || data?.message || `HTTP ${res.status}`,
      };
    }
    return { ok: false, kind: "uncertain", message: data?.message || `HTTP ${res.status}` };
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !caller.user) return json({ code: "forbidden" }, 401);

  const { data: profile } = await admin
    .from("admin_profiles")
    .select("is_owner, active, sections")
    .eq("user_id", caller.user.id)
    .maybeSingle();
  const sections = (profile?.sections as string[] | null) ?? [];
  if (!profile?.active || !(profile.is_owner || sections.includes("orders"))) {
    return json({ code: "forbidden" }, 403);
  }

  const token = Deno.env.get("DHD_API_TOKEN");
  if (!token) return json({ code: "not_configured" }, 503);
  const dhd = new Dhd((Deno.env.get("DHD_API_URL") ?? DEFAULT_API).replace(/\/+$/, ""), token);

  let payload: {
    action?: string;
    order_ids?: unknown;
    orders?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  async function loadOrders(ids: string[]): Promise<OrderRow[] | null> {
    const { data, error } = await admin
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, wilaya, city, address, notes, total, status, delivery_type, delivery_tracking, order_items(name_fr, quantity)",
      )
      .in("id", ids);
    if (error) return null;
    return (data as OrderRow[]).map((o) => ({ ...o, total: Number(o.total) }));
  }

  /* ---------------- prepare ---------------- */
  if (payload.action === "prepare") {
    const ids = Array.isArray(payload.order_ids) ? payload.order_ids.map(String) : [];
    if (ids.length === 0 || ids.length > MAX_ORDERS) return json({ code: "bad_request" }, 400);
    const rows = await loadOrders(ids);
    if (!rows) return json({ code: "load_failed" }, 500);

    const communes: Record<number, Commune[]> = {};
    try {
      const wilayaIds = [
        ...new Set(rows.map((o) => dhdWilayaId(o.wilaya)).filter((w): w is number => w !== null)),
      ];
      await Promise.all(
        wilayaIds.map(async (w) => {
          communes[w] = await dhd.communes(w);
        }),
      );
    } catch {
      return json({ code: "dhd_unreachable" }, 502);
    }

    const orders = rows.map((o) => {
      const wilayaId = dhdWilayaId(o.wilaya);
      const list = wilayaId ? (communes[wilayaId] ?? []) : [];
      let commune = matchCommune(o.city, list);
      let stopDesk = o.delivery_type === "office";
      // Stop-desk orders need a commune with a DHD desk. When the customer's
      // own commune has none, propose the wilaya's desk instead.
      if (stopDesk && !commune?.stop_desk) {
        const desks = list.filter((c) => c.stop_desk);
        const wilayaName = wilayaId ? norm(WILAYA_NAMES[wilayaId]) : "";
        commune = desks.find((c) => norm(c.name) === wilayaName) ?? desks[0] ?? commune;
        if (!commune?.stop_desk) stopDesk = false;
      }
      return {
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        wilaya: o.wilaya,
        city: o.city,
        address: o.address,
        total: o.total,
        status: o.status,
        delivery_type: o.delivery_type,
        tracking: o.delivery_tracking,
        dhd_wilaya_id: wilayaId,
        commune: commune?.name ?? null,
        stop_desk: stopDesk,
      };
    });
    return json({ orders, communes });
  }

  /* ---------------- send ---------------- */
  if (payload.action === "send") {
    const picks = (Array.isArray(payload.orders) ? payload.orders : [])
      .map((p) => p as { id?: unknown; commune?: unknown; stop_desk?: unknown })
      .map((p) => ({
        id: String(p.id ?? ""),
        commune: String(p.commune ?? ""),
        stop_desk: p.stop_desk === true,
      }))
      .filter((p) => p.id);
    if (picks.length === 0 || picks.length > MAX_ORDERS) return json({ code: "bad_request" }, 400);

    const rows = await loadOrders(picks.map((p) => p.id));
    if (!rows) return json({ code: "load_failed" }, 500);
    const byId = new Map(rows.map((o) => [o.id, o]));

    const results: {
      id: string;
      ok: boolean;
      tracking?: string;
      code?: string;
      message?: string;
    }[] = [];

    // Sequential on purpose: Ecotrack rate-limits, and a handful of parcels at
    // a time is the normal batch.
    for (const pick of picks) {
      const o = byId.get(pick.id);
      if (!o) {
        results.push({ id: pick.id, ok: false, code: "not_found" });
        continue;
      }
      if (o.delivery_tracking) {
        results.push({ id: o.id, ok: false, code: "already_sent", tracking: o.delivery_tracking });
        continue;
      }
      if (!SENDABLE.includes(o.status)) {
        results.push({ id: o.id, ok: false, code: "bad_status" });
        continue;
      }
      const wilayaId = dhdWilayaId(o.wilaya);
      if (!wilayaId) {
        results.push({ id: o.id, ok: false, code: "unknown_wilaya" });
        continue;
      }
      let commune: Commune | undefined;
      try {
        commune = (await dhd.communes(wilayaId)).find((c) => c.name === pick.commune);
      } catch {
        results.push({ id: o.id, ok: false, code: "dhd_unreachable" });
        continue;
      }
      if (!commune) {
        results.push({ id: o.id, ok: false, code: "bad_commune" });
        continue;
      }
      if (pick.stop_desk && !commune.stop_desk) {
        results.push({ id: o.id, ok: false, code: "no_stop_desk" });
        continue;
      }

      // Claim before calling DHD, so a concurrent send can't double-ship.
      const staleBefore = new Date(Date.now() - STALE_CLAIM_MS).toISOString();
      const { data: claimed } = await admin
        .from("orders")
        .update({ delivery_sent_at: new Date().toISOString() })
        .eq("id", o.id)
        .is("delivery_tracking", null)
        .or(`delivery_sent_at.is.null,delivery_sent_at.lt.${staleBefore}`)
        .select("id")
        .maybeSingle();
      if (!claimed) {
        results.push({ id: o.id, ok: false, code: "in_progress" });
        continue;
      }

      const produit = o.order_items
        .map((i) => (i.quantity > 1 ? `${i.name_fr} x${i.quantity}` : i.name_fr))
        .join(", ");
      const remarque = [`Jazym ${o.order_number}`, o.notes?.trim()].filter(Boolean).join(" — ");

      const created = await dhd.create({
        reference: o.order_number,
        nom_client: clip(o.customer_name.trim(), 250),
        telephone: localPhone(o.customer_phone),
        adresse: clip((o.address?.trim() || o.city.trim() || commune.name), 250),
        commune: commune.name,
        code_wilaya: wilayaId,
        montant: Math.round(o.total),
        remarque: clip(remarque, 250),
        produit: clip(produit || "Commande Jazym", 250),
        type: 1,
        stop_desk: pick.stop_desk ? 1 : 0,
      });

      if (created.ok) {
        const update: Record<string, unknown> = { delivery_tracking: created.tracking };
        if (o.status === "pending" || o.status === "confirmed") update.status = "shipped";
        await admin.from("orders").update(update).eq("id", o.id);
        results.push({ id: o.id, ok: true, tracking: created.tracking });
      } else if (created.kind === "rejected") {
        // Nothing was created — release the claim so it can be fixed and resent.
        await admin.from("orders").update({ delivery_sent_at: null }).eq("id", o.id);
        results.push({ id: o.id, ok: false, code: "rejected", message: created.message });
      } else {
        // Keep the claim: the parcel may exist. It becomes retryable once stale.
        results.push({ id: o.id, ok: false, code: "uncertain", message: created.message });
      }
    }

    return json({ results });
  }

  return json({ code: "bad_request" }, 400);
});
