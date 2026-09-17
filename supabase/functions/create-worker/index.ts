// Creates a staff auth user + admin_profiles row. Needs the service-role key,
// so it runs here (never in the browser). Deploy: supabase functions deploy
// create-worker. Self-contained on purpose (no ../_shared import). Skill 8.5.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Keep in sync with GRANTABLE_SECTIONS in src/lib/adminSections.ts and the
// has_section('…') strings in the migration.
const ALLOWED_SECTIONS = [
  "products",
  "categories",
  "orders",
  "delivery",
  "reviews",
  "landing",
  "pixels",
  "policy",
  "panels",
  "promotions",
  "announcement",
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Verify the CALLER is an active owner.
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !caller.user) return json({ code: "forbidden" }, 401);

  const { data: callerProfile } = await admin
    .from("admin_profiles")
    .select("is_owner, active")
    .eq("user_id", caller.user.id)
    .maybeSingle();
  if (!callerProfile?.is_owner || !callerProfile.active) {
    return json({ code: "forbidden" }, 403);
  }

  let payload: { email?: string; password?: string; sections?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const sections = Array.isArray(payload.sections)
    ? payload.sections.filter((s): s is string => typeof s === "string" && ALLOWED_SECTIONS.includes(s))
    : [];

  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ code: "bad_request" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    const msg = (createErr?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return json({ code: "email_exists" }, 409);
    }
    return json({ code: "create_failed" }, 500);
  }

  const { error: profileErr } = await admin.from("admin_profiles").insert({
    user_id: created.user.id,
    email,
    is_owner: false,
    sections,
    active: true,
  });
  if (profileErr) {
    // Roll back the dangling auth user.
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ code: "profile_failed" }, 500);
  }

  return json({ ok: true, user_id: created.user.id }, 201);
});
