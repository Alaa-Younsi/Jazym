-- Drop the WhatsApp/CallMeBot notification channel — email (Resend) only.
--
-- 0025 shipped both channels. The client asked for WhatsApp to be removed
-- entirely rather than left switched off, so the columns go with it: a dormant
-- `callmebot_apikey` column is a credential store nobody is maintaining, and a
-- disabled channel that still has its fields in the schema is the kind of thing
-- that quietly comes back in a later copy-paste.
--
-- This is a separate migration rather than an edit to 0025 because 0025 has
-- already been applied to the live project.
--
-- Irreversible: any keys staff had already pasted in are dropped with the
-- columns. That is intended — they are CallMeBot keys, useless without the
-- channel, and re-activation issues a fresh one anyway.

alter table public.admin_notification_prefs
  drop column if exists whatsapp_enabled,
  drop column if exists whatsapp_number,
  drop column if exists callmebot_apikey;

-- The table now has exactly one channel, so a row whose email is off carries
-- no information. Harmless to keep, but the edge function skips them either
-- way — the RLS policy and the claim RPC from 0025 are unchanged.
