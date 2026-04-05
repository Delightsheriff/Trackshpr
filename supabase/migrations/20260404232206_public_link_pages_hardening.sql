ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY "profiles_select_own"
      ON public.profiles
      FOR SELECT
      USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY "profiles_insert_own"
      ON public.profiles
      FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY "profiles_update_own"
      ON public.profiles
      FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_select_own'
  ) THEN
    CREATE POLICY "orders_select_own"
      ON public.orders
      FOR SELECT
      USING (seller_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_insert_own'
  ) THEN
    CREATE POLICY "orders_insert_own"
      ON public.orders
      FOR INSERT
      WITH CHECK (seller_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_update_own'
  ) THEN
    CREATE POLICY "orders_update_own"
      ON public.orders
      FOR UPDATE
      USING (seller_id = auth.uid())
      WITH CHECK (seller_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_delete_own'
  ) THEN
    CREATE POLICY "orders_delete_own"
      ON public.orders
      FOR DELETE
      USING (seller_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_status_events'
      AND policyname = 'order_status_events_select_own'
  ) THEN
    CREATE POLICY "order_status_events_select_own"
      ON public.order_status_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.orders o
          WHERE o.id = order_id
            AND o.seller_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_status_events'
      AND policyname = 'order_status_events_insert_own'
  ) THEN
    CREATE POLICY "order_status_events_insert_own"
      ON public.order_status_events
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.orders o
          WHERE o.id = order_id
            AND o.seller_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'location_pings'
      AND policyname = 'location_pings_select_own'
  ) THEN
    CREATE POLICY "location_pings_select_own"
      ON public.location_pings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.orders o
          WHERE o.id = order_id
            AND o.seller_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'location_pings'
      AND policyname = 'location_pings_insert_own'
  ) THEN
    CREATE POLICY "location_pings_insert_own"
      ON public.location_pings
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.orders o
          WHERE o.id = order_id
            AND o.seller_id = auth.uid()
        )
      );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.get_public_order_snapshot(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'seller_id', o.seller_id,
    'order_number', o.order_number,
    'item', o.item,
    'status', COALESCE(o.status, 'pending'),
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'delivery_address', o.delivery_address,
    'city', o.city,
    'delivery_fee', o.delivery_fee,
    'rider_name', o.rider_name,
    'rider_phone', o.rider_phone,
    'photo_url', o.photo_url,
    'created_at', o.created_at,
    'delivered_at', o.delivered_at,
    'profile', jsonb_build_object(
      'id', p.id,
      'business_name', p.business_name,
      'brand_name', p.brand_name,
      'brand_color', p.brand_color,
      'logo_url', p.logo_url,
      'phone', p.phone,
      'contact_numbers', p.contact_numbers
    ),
    'events', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'status', e.status,
            'note', e.note,
            'created_at', e.created_at
          )
          ORDER BY e.created_at ASC
        )
        FROM public.order_status_events e
        WHERE e.order_id = o.id
      ),
      '[]'::jsonb
    ),
    'latest_ping', (
      SELECT jsonb_build_object(
        'id', lp.id,
        'latitude', lp.latitude,
        'longitude', lp.longitude,
        'created_at', lp.created_at
      )
      FROM public.location_pings lp
      WHERE lp.order_id = o.id
      ORDER BY lp.created_at DESC
      LIMIT 1
    )
  )
  FROM public.orders o
  JOIN public.profiles p
    ON p.id = o.seller_id
  WHERE o.id = p_order_id;
$$;

CREATE OR REPLACE FUNCTION public.get_rider_link_order(
  p_rider_token uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_public_order_snapshot(o.id)
  FROM public.orders o
  WHERE o.rider_token = p_rider_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_tracking_order(
  p_customer_token uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_public_order_snapshot(o.id)
  FROM public.orders o
  WHERE o.customer_token = p_customer_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.public_insert_location_ping(
  p_order_id uuid,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.location_pings (order_id, latitude, longitude)
  VALUES (p_order_id, p_latitude, p_longitude);
END;
$$;

CREATE OR REPLACE FUNCTION public.rider_pickup_order(
  p_rider_token uuid,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order public.orders;
BEGIN
  SELECT *
  INTO current_order
  FROM public.orders
  WHERE rider_token = p_rider_token
  FOR UPDATE;

  IF current_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF current_order.status = 'pending' OR current_order.status IS NULL THEN
    PERFORM public.public_insert_location_ping(
      current_order.id,
      p_latitude,
      p_longitude
    );

    INSERT INTO public.order_status_events (order_id, status, note)
    VALUES (current_order.id, 'picked_up', 'Rider confirmed pickup');

    UPDATE public.orders
    SET status = 'picked_up'
    WHERE id = current_order.id
    RETURNING * INTO current_order;
  END IF;

  RETURN public.get_public_order_snapshot(current_order.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.rider_complete_order(
  p_rider_token uuid,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order public.orders;
BEGIN
  SELECT *
  INTO current_order
  FROM public.orders
  WHERE rider_token = p_rider_token
  FOR UPDATE;

  IF current_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF current_order.status = 'delivered' THEN
    RETURN public.get_public_order_snapshot(current_order.id);
  END IF;

  IF current_order.status NOT IN ('picked_up', 'in_transit') THEN
    RAISE EXCEPTION 'Order cannot be completed from its current status';
  END IF;

  PERFORM public.public_insert_location_ping(
    current_order.id,
    p_latitude,
    p_longitude
  );

  PERFORM public.apply_delivered_order_stock(current_order.id);

  INSERT INTO public.order_status_events (order_id, status, note)
  VALUES (current_order.id, 'delivered', 'Rider confirmed delivery');

  UPDATE public.orders
  SET status = 'delivered',
      delivered_at = COALESCE(delivered_at, now())
  WHERE id = current_order.id
  RETURNING * INTO current_order;

  RETURN public.get_public_order_snapshot(current_order.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.rider_fail_order(
  p_rider_token uuid,
  p_note text,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order public.orders;
  normalized_note text;
BEGIN
  normalized_note := NULLIF(trim(COALESCE(p_note, '')), '');

  IF normalized_note IS NULL THEN
    RAISE EXCEPTION 'Problem note is required';
  END IF;

  SELECT *
  INTO current_order
  FROM public.orders
  WHERE rider_token = p_rider_token
  FOR UPDATE;

  IF current_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF current_order.status <> 'failed' THEN
    PERFORM public.public_insert_location_ping(
      current_order.id,
      p_latitude,
      p_longitude
    );

    INSERT INTO public.order_status_events (order_id, status, note)
    VALUES (current_order.id, 'failed', normalized_note);

    UPDATE public.orders
    SET status = 'failed'
    WHERE id = current_order.id
    RETURNING * INTO current_order;
  END IF;

  RETURN public.get_public_order_snapshot(current_order.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_public_order_link_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order public.orders;
  payload jsonb;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    current_order := COALESCE(NEW, OLD);
  ELSE
    SELECT *
    INTO current_order
    FROM public.orders
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  END IF;

  IF current_order.id IS NULL THEN
    RETURN NULL;
  END IF;

  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'order_id', current_order.id,
    'status', current_order.status
  );

  PERFORM realtime.send(
    payload,
    'order_update',
    'public:rider:' || current_order.rider_token::text,
    FALSE
  );

  PERFORM realtime.send(
    payload,
    'order_update',
    'public:customer:' || current_order.customer_token::text,
    FALSE
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS orders_public_link_broadcast_trigger ON public.orders;
CREATE TRIGGER orders_public_link_broadcast_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_public_order_link_event();

DROP TRIGGER IF EXISTS order_status_events_public_link_broadcast_trigger ON public.order_status_events;
CREATE TRIGGER order_status_events_public_link_broadcast_trigger
AFTER INSERT ON public.order_status_events
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_public_order_link_event();

DROP TRIGGER IF EXISTS location_pings_public_link_broadcast_trigger ON public.location_pings;
CREATE TRIGGER location_pings_public_link_broadcast_trigger
AFTER INSERT ON public.location_pings
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_public_order_link_event();

GRANT EXECUTE ON FUNCTION public.get_public_order_snapshot(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rider_link_order(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_customer_tracking_order(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_insert_location_ping(uuid, double precision, double precision) TO anon;
GRANT EXECUTE ON FUNCTION public.rider_pickup_order(uuid, double precision, double precision) TO anon;
GRANT EXECUTE ON FUNCTION public.rider_complete_order(uuid, double precision, double precision) TO anon;
GRANT EXECUTE ON FUNCTION public.rider_fail_order(uuid, text, double precision, double precision) TO anon;
