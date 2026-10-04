-- Dispatch to the delivery company (DHD, an Ecotrack platform).
--
-- The `dhd` edge function creates the parcel on DHD's side and writes the
-- tracking number back here. Nothing in the browser talks to DHD: the API
-- token is a Supabase secret (DHD_API_TOKEN) and only the function holds it.
--
--  * delivery_tracking — DHD's tracking number; non-null = already sent, the
--    function refuses to send the order twice.
--  * delivery_sent_at  — set when the function CLAIMS the order, before it
--    calls DHD, so two admins clicking "send" at once can't create two
--    parcels. Cleared again if DHD rejects the order. A claim with no
--    tracking older than a few minutes is a crashed call and may be retried.

alter table public.orders
  add column if not exists delivery_tracking text,
  add column if not exists delivery_sent_at  timestamptz;

create unique index if not exists orders_delivery_tracking_key
  on public.orders (delivery_tracking)
  where delivery_tracking is not null;
