// Order/message notifications — email via Resend.
// Self-contained on purpose (no ../_shared import — the CLI bundler does not
// reliably pull sibling files in). Skill Phase 8.9.
//
// Deploy:  supabase functions deploy notify
// Secrets: supabase secrets set RESEND_API_KEY=re_...
//          supabase secrets set RESEND_FROM="Jazym <commandes@jazym.shop>"
//          supabase secrets set SITE_ADMIN_URL="https://jazym.shop/admin"      (optional)
//
// Until the client's domain is verified in Resend, RESEND_FROM defaults to
// Resend's sandbox sender, which ONLY delivers to the email address the Resend
// account itself was registered with. That is enough to prove the pipeline end
// to end; switch the secret once the domain verifies. No code change.
//
// The caller is the ANONYMOUS shopper's browser, which void-invokes this right
// after its order lands. Nothing here may throw back at them: a bad API key, a
// rate-limited provider must never surface in checkout.

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

/** Resend's sandbox sender. Delivers only to the Resend account's own address. */
const DEFAULT_FROM = "Jazym <onboarding@resend.dev>";

interface Recipient {
  email_enabled: boolean;
  notify_email: string | null;
}

interface Payload {
  subject: string;
  /** The email's plain-text part, for clients that don't render HTML. */
  text: string;
  html: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} DA`;
}

/** RESEND_FROM as Resend expects it. Secrets pasted with their shell quotes
 *  (`"Jazym <x@y>"`) arrive with the quotes and Resend rejects them with a 422,
 *  so strip wrapping quotes/whitespace first. */
function senderAddress(): string {
  let raw = (Deno.env.get("RESEND_FROM") ?? "").trim();
  const q = raw[0];
  if (raw.length > 1 && (q === '"' || q === "'") && raw.endsWith(q)) raw = raw.slice(1, -1).trim();
  return raw || DEFAULT_FROM;
}

async function sendEmail(to: string, payload: Payload): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY");
  // Not configured yet is a normal state, not an error — the client wires
  // Resend up after launch. Skip quietly rather than failing the whole fan-out.
  if (!key) throw new Error("resend_not_configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: senderAddress(),
      to: [to],
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });
  if (!res.ok) {
    // Resend fails LOUD (an HTTP error) rather than vanishing into a spam
    // folder — keep the body, it is the only diagnostic there is.
    throw new Error(`resend_${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let body: { kind?: string; order_number?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  let payload: Payload;

  if (body.kind === "order") {
    const orderNumber = String(body.order_number ?? "").trim();
    if (!orderNumber) return json({ code: "bad_request" }, 400);

    // Atomic claim. An already-notified order (or a guessed number) returns
    // no rows, and the response is identical either way — a prober learns
    // nothing and cannot tell a real order number from a fake one.
    const { data, error } = await admin.rpc("claim_order_notification", {
      p_order_number: orderNumber,
    });
    if (error) {
      console.error("[notify] claim failed:", error.message);
      return json({ code: "claim_failed" }, 500);
    }
    const order = Array.isArray(data) ? data[0] : null;
    if (!order) {
      console.log("[notify] nothing to claim (already notified or unknown order)");
      return json({ ok: true, claimed: false });
    }

    const adminUrl = Deno.env.get("SITE_ADMIN_URL") || "https://jazym.shop/admin";
    const lines = [
      `Nouvelle commande ${order.order_number}`,
      `Client : ${order.customer_name}`,
      `Tel : ${order.customer_phone}`,
      `Wilaya : ${order.wilaya} — ${order.city}`,
      `Articles : ${order.item_count}`,
      `Total : ${money(Number(order.total))}`,
    ];
    if (adminUrl) lines.push(`${adminUrl}/orders`);

    payload = {
      subject: `Nouvelle commande ${order.order_number} — ${money(Number(order.total))}`,
      text: lines.join("\n"),
      html:
        `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#18181b">` +
        `<h2 style="margin:0 0 12px">Nouvelle commande ${esc(order.order_number)}</h2>` +
        `<table cellpadding="6" style="border-collapse:collapse">` +
        `<tr><td style="color:#6b6b70">Client</td><td><b>${esc(order.customer_name)}</b></td></tr>` +
        `<tr><td style="color:#6b6b70">Téléphone</td><td>${esc(order.customer_phone)}</td></tr>` +
        `<tr><td style="color:#6b6b70">Wilaya</td><td>${esc(order.wilaya)} — ${esc(order.city)}</td></tr>` +
        `<tr><td style="color:#6b6b70">Articles</td><td>${order.item_count}</td></tr>` +
        `<tr><td style="color:#6b6b70">Total</td><td><b>${esc(money(Number(order.total)))}</b></td></tr>` +
        `</table>` +
        (adminUrl
          ? `<p style="margin-top:16px"><a href="${esc(adminUrl)}/orders">Ouvrir le tableau de bord</a></p>`
          : "") +
        `</div>`,
    };
  } else {
    // The dispatcher is deliberately kind-routed so a second event type is a
    // small addition here rather than a second function. Jazym's contact page
    // is static (no contact_messages table), so "message" is not wired yet.
    return json({ code: "bad_request" }, 400);
  }

  const { data: recipients, error: recipientsError } = await admin
    .from("admin_notification_prefs")
    .select("email_enabled, notify_email, admin_profiles!inner(active)")
    .eq("admin_profiles.active", true);

  if (recipientsError) {
    console.error("[notify] recipients query failed:", recipientsError.message);
    return json({ code: "recipients_failed" }, 500);
  }

  const jobs: Promise<void>[] = [];
  for (const r of (recipients ?? []) as unknown as Recipient[]) {
    if (r.email_enabled && r.notify_email) {
      jobs.push(sendEmail(r.notify_email, payload));
    }
  }

  // allSettled, never all: one recipient's bounced address must not stop the
  // other four from being told an order came in.
  if (jobs.length === 0) {
    console.log("[notify] no recipient has email notifications enabled");
  }

  const results = await Promise.allSettled(jobs);
  const failed = results.filter((r) => r.status === "rejected");
  for (const f of failed) {
    console.error("[notify] send failed:", (f as PromiseRejectedResult).reason);
  }

  console.log(`[notify] ${body.order_number}: sent ${jobs.length - failed.length}/${jobs.length}`);
  return json({
    ok: true,
    claimed: true,
    attempted: jobs.length,
    sent: jobs.length - failed.length,
  });
});
