-- Production hardening
-- 1. public.delete_user() — RPC the client calls to permanently remove the user
--    and cascade-clean their data. Must exist or the delete-account UI fails
--    (Apple tests this during review).
-- 2. public.notification_log — outbound Termii attempts so we can surface
--    failures instead of swallowing them.
-- 3. public.tracking_link_events — per-token throttle counter for public
--    tracking links. Backs abuse-protection in the public Edge Function.
-- 4. public.cancel_pro_subscription — flips is_pro back off and records the
--    date. The Paystack disable call is made by the Edge Function.

-- ── 1. Account deletion RPC ──────────────────────────────────────────────────
-- SECURITY DEFINER so it can reach into auth.users. We gate on auth.uid()
-- so a caller can only ever delete themselves. ON DELETE CASCADE on every
-- profiles(id) FK means this single call sweeps orders, riders, customers,
-- products, stock_movements, order_items, location_pings, etc.
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove auth user; this cascades to profiles via the FK on profiles.id,
  -- which in turn cascades to every ON DELETE CASCADE table (orders, riders,
  -- customers, customer_addresses, products, stock_movements, order_items,
  -- order_status_events, location_pings, notification_log, pro_waitlist).
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- ── 2. Notification log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  recipient_kind text NOT NULL CHECK (recipient_kind IN ('customer', 'rider')),
  event text NOT NULL CHECK (event IN (
    'order_created', 'order_picked_up', 'order_delivered', 'order_failed'
  )),
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_seller_created
  ON public.notification_log (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_order
  ON public.notification_log (order_id, created_at DESC)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_log_select_own" ON public.notification_log;
CREATE POLICY "notification_log_select_own"
  ON public.notification_log
  FOR SELECT
  USING (seller_id = auth.uid());

-- Only Edge Functions (via service role) insert into this table; the anon /
-- authenticated role never writes. RLS policy intentionally missing for
-- INSERT so authenticated-role writes are blocked by default.

-- ── 3. Public tracking-link throttle ─────────────────────────────────────────
-- One row per (token, 10-minute bucket). The Edge Function upserts and
-- rejects when the count crosses the threshold. Scheduled cleanup trims
-- rows older than a day so the table stays small.
CREATE TABLE IF NOT EXISTS public.tracking_link_events (
  id bigserial PRIMARY KEY,
  token text NOT NULL,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_link_events_token_time
  ON public.tracking_link_events (token, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracking_link_events_iphash_time
  ON public.tracking_link_events (ip_hash, created_at DESC);

ALTER TABLE public.tracking_link_events ENABLE ROW LEVEL SECURITY;
-- No policies; service role only.

CREATE OR REPLACE FUNCTION public.record_tracking_link_hit(
  p_token text,
  p_ip_hash text,
  p_window_seconds int DEFAULT 60,
  p_max_hits int DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
BEGIN
  -- Purge ancient rows opportunistically (keep 24h of data).
  DELETE FROM public.tracking_link_events
  WHERE created_at < now() - interval '1 day';

  SELECT COUNT(*) INTO recent_count
  FROM public.tracking_link_events
  WHERE token = p_token
    AND created_at > now() - make_interval(secs => p_window_seconds);

  IF recent_count >= p_max_hits THEN
    RETURN false;
  END IF;

  INSERT INTO public.tracking_link_events (token, ip_hash)
  VALUES (p_token, p_ip_hash);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_tracking_link_hit(text, text, int, int) FROM PUBLIC, anon, authenticated;
-- Callable only by service-role (Edge Functions).

-- ── 4. Pro subscription fields + cancellation RPC ────────────────────────────
-- Add pro_since and pro_cancelled_at if not already present. These are used
-- by the Paystack verify + cancel Edge Functions.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_since timestamptz,
  ADD COLUMN IF NOT EXISTS pro_cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS paystack_customer_code text,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code text;

CREATE OR REPLACE FUNCTION public.cancel_pro_subscription()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- We flip is_pro=false immediately. The Edge Function is responsible for
  -- calling Paystack's disable-subscription endpoint; if that step fails the
  -- function retries or logs, but the user's entitlement ends on our side now.
  UPDATE public.profiles
  SET is_pro = false,
      pro_cancelled_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_pro_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_pro_subscription() TO authenticated;
