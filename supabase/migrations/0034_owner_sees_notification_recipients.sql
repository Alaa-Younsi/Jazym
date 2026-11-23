-- Let the OWNER see and switch off every account's order-alert address.
--
-- Why: 0025 deliberately scoped admin_notification_prefs to "each account sees
-- only its own row" (the row then also held a WhatsApp number and a CallMeBot
-- key). Side effect found on 2026-11-23: the owner set an address on their own
-- account, yet alerts kept arriving at another inbox. The `notify` function
-- emails EVERY active admin whose row has email_enabled = true, and the other
-- inbox was saved on a different admin account, which the owner had no way to
-- see from the dashboard.
--
-- Since 0026 the row only holds an on/off flag and an e-mail address, so the
-- privacy reason is gone. The owner gets read + update + delete on all rows
-- (not insert: an account still creates its own row from "Mon compte").
-- Idempotent: safe to re-run.

drop policy if exists "owner reads all notification prefs" on public.admin_notification_prefs;
create policy "owner reads all notification prefs" on public.admin_notification_prefs
  for select to authenticated
  using (public.is_owner());

drop policy if exists "owner updates all notification prefs" on public.admin_notification_prefs;
create policy "owner updates all notification prefs" on public.admin_notification_prefs
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "owner deletes notification prefs" on public.admin_notification_prefs;
create policy "owner deletes notification prefs" on public.admin_notification_prefs
  for delete to authenticated
  using (public.is_owner());

grant select, update, delete on public.admin_notification_prefs to authenticated;
grant execute on function public.is_owner() to authenticated;

notify pgrst, 'reload schema';
