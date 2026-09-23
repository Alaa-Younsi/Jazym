-- Order notifications — per-admin email (Resend) and WhatsApp (CallMeBot).
-- See skill Phase 8.9.
--
-- Shape of the thing: the shopper is ANONYMOUS when the order lands, so the
-- browser that triggers the notification has no admin session. The send
-- therefore happens in an edge function running with the service-role key,
-- and the only thing the anonymous browser does is say "order JZ-… exists,
-- go look". That makes the claim RPC below a public attack surface in
-- everything but name, which is what shapes its design:
--
--   * it is an atomic `update … where notified_at is null … returning`, so a
--     replay, a double-invoke or a stranger guessing order numbers all get
--     the same empty result — the row can be claimed AT MOST ONCE, ever;
--   * it is NOT granted to anon or authenticated. The skill's own bug ledger
--     records shipping this granted-to-anon by copying place_order's grant
--     line: it leaks the customer's PHONE NUMBER (which get_order_by_number
--     deliberately omits) and lets anyone permanently suppress a real
--     notification just by probing the order number.

-- 1. The claim flag -------------------------------------------------------
alter table public.orders
  add column if not exists notified_at timestamptz;

-- Partial index: the only query against this column asks for the unclaimed
-- ones, and that set is tiny compared to the table.
create index if not exists orders_unnotified_idx
  on public.orders (created_at desc) where notified_at is null;

-- 2. Per-admin channel preferences ---------------------------------------
-- Keyed to admin_profiles, not auth.users: the FK is what lets the edge
-- function embed `admin_profiles!inner(active)` and skip deactivated staff
-- in one PostgREST round trip.
create table if not exists public.admin_notification_prefs (
  user_id          uuid primary key references public.admin_profiles(user_id) on delete cascade,
  email_enabled    boolean not null default false,
  notify_email     text,
  whatsapp_enabled boolean not null default false,
  whatsapp_number  text,
  callmebot_apikey text,
  updated_at       timestamptz not null default now()
);

alter table public.admin_notification_prefs enable row level security;

-- This is personal contact information, not a section grant — there is
-- deliberately NO owner-manages-everyone policy. Each account manages only
-- its own row, and the owner cannot read a worker's phone number or API key.
drop policy if exists "admin manages own notification prefs" on public.admin_notification_prefs;
create policy "admin manages own notification prefs" on public.admin_notification_prefs
  for all to authenticated
  using (user_id = auth.uid() and public.is_admin())
  with check (user_id = auth.uid() and public.is_admin());

drop trigger if exists admin_notification_prefs_updated_at on public.admin_notification_prefs;
create trigger admin_notification_prefs_updated_at
  before update on public.admin_notification_prefs
  for each row execute function public.update_updated_at();

-- 3. The atomic claim -----------------------------------------------------
create or replace function public.claim_order_notification(p_order_number text)
returns table (
  order_number   text,
  customer_name  text,
  customer_phone text,
  wilaya         text,
  city           text,
  total          numeric,
  item_count     integer,
  created_at     timestamptz
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  return query
    update public.orders o
       set notified_at = now()
     where o.order_number = p_order_number
       and o.notified_at is null
    returning
      o.order_number,
      o.customer_name,
      o.customer_phone,
      o.wilaya,
      o.city,
      o.total,
      (select count(*)::int from public.order_items oi where oi.order_id = o.id),
      o.created_at;
end;
$fn$;

-- Lock it to the service role. The skill says to leave it entirely ungranted
-- on the grounds that service-role "bypasses" grants — it does not: BYPASSRLS
-- covers row security, while EXECUTE is an ordinary grant, and revoking from
-- PUBLIC removes it from service_role too. Granting it explicitly is what
-- actually makes the edge function work while keeping anon out.
revoke all on function public.claim_order_notification(text) from public;
revoke all on function public.claim_order_notification(text) from anon;
revoke all on function public.claim_order_notification(text) from authenticated;
grant execute on function public.claim_order_notification(text) to service_role;

-- 4. Backfill -------------------------------------------------------------
-- Every order that already exists predates notifications; mark them claimed
-- so switching the feature on cannot fire a burst of alerts for old orders.
update public.orders
   set notified_at = created_at
 where notified_at is null;
