CREATE OR REPLACE FUNCTION public.get_analytics_overview(
  p_seller_id uuid
)
RETURNS TABLE (
  last_30_total bigint,
  last_30_delivered bigint,
  last_30_failed bigint,
  success_rate numeric,
  avg_delivery_minutes numeric,
  month_total bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_seller_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH last_30_orders AS (
    SELECT
      o.status,
      o.created_at,
      o.delivered_at
    FROM public.orders o
    WHERE o.seller_id = p_seller_id
      AND o.created_at >= now() - interval '30 days'
  ),
  this_month_orders AS (
    SELECT COUNT(*)::bigint AS month_total
    FROM public.orders o
    WHERE o.seller_id = p_seller_id
      AND (o.created_at AT TIME ZONE 'Africa/Lagos') >= date_trunc(
        'month',
        timezone('Africa/Lagos', now())
      )
  )
  SELECT
    COUNT(*)::bigint AS last_30_total,
    COUNT(*) FILTER (WHERE status = 'delivered')::bigint AS last_30_delivered,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint AS last_30_failed,
    COALESCE(
      ROUND(
        (
          COUNT(*) FILTER (WHERE status = 'delivered')
        )::numeric * 100 / NULLIF(COUNT(*), 0),
        0
      ),
      0
    ) AS success_rate,
    COALESCE(
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (delivered_at - created_at)) / 60
        ) FILTER (
          WHERE status = 'delivered'
            AND delivered_at IS NOT NULL
            AND created_at IS NOT NULL
        ),
        0
      ),
      0
    ) AS avg_delivery_minutes,
    (SELECT this_month_orders.month_total FROM this_month_orders) AS month_total
  FROM last_30_orders;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_daily_chart(
  p_seller_id uuid
)
RETURNS TABLE (
  day date,
  total bigint,
  delivered bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_seller_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH chart_days AS (
    SELECT generate_series(
      (timezone('Africa/Lagos', now())::date - 13),
      timezone('Africa/Lagos', now())::date,
      interval '1 day'
    )::date AS day
  )
  SELECT
    d.day,
    COUNT(o.id)::bigint AS total,
    COUNT(o.id) FILTER (WHERE o.status = 'delivered')::bigint AS delivered
  FROM chart_days d
  LEFT JOIN public.orders o
    ON o.seller_id = p_seller_id
   AND (o.created_at AT TIME ZONE 'Africa/Lagos')::date = d.day
  GROUP BY d.day
  ORDER BY d.day ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_top_riders(
  p_seller_id uuid
)
RETURNS TABLE (
  rider_id uuid,
  rider_name text,
  delivered_count bigint,
  success_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_seller_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH rider_stats AS (
    SELECT
      r.id AS rider_id,
      r.name AS rider_name,
      COUNT(o.id) FILTER (WHERE o.status = 'delivered')::bigint AS delivered_count,
      COUNT(o.id)::bigint AS total_count
    FROM public.riders r
    LEFT JOIN public.orders o
      ON o.rider_id = r.id
     AND o.seller_id = p_seller_id
     AND o.created_at >= now() - interval '30 days'
    WHERE r.seller_id = p_seller_id
    GROUP BY r.id, r.name
  )
  SELECT
    rider_stats.rider_id,
    rider_stats.rider_name,
    rider_stats.delivered_count,
    COALESCE(
      ROUND(
        rider_stats.delivered_count::numeric * 100 / NULLIF(rider_stats.total_count, 0),
        0
      ),
      0
    ) AS success_rate
  FROM rider_stats
  WHERE rider_stats.delivered_count > 0
  ORDER BY rider_stats.delivered_count DESC, rider_stats.rider_name ASC
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_overview(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_overview(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_daily_chart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_daily_chart(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_top_riders(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_top_riders(uuid) TO anon;
