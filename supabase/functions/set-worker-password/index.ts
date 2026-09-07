// Owner sets a worker's password (auth.admin.updateUserById needs the
// service-role key). Deploy: supabase functions deploy set-worker-password.
// Self-contained on purpose. Skill 8.5.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  let payload: { userId?: string; password?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const userId = String(payload.userId ?? "");
  const password = String(payload.password ?? "");
  if (!userId) return json({ code: "bad_request" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  // The target must be a non-owner staff member.
  const { data: target } = await admin
    .from("admin_profiles")
    .select("user_id, is_owner")
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return json({ code: "not_found" }, 404);
  if (target.is_owner) return json({ code: "forbidden_target" }, 403);

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return json({ code: "update_failed" }, 500);

  return json({ ok: true });
});
