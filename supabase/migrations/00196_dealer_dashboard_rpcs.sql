-- Migration: dealer dashboard RPCs
-- Used by: app/composables/useDealerDashboard.ts, app/components/DealerPortal.vue

-- RPC: get_dealer_dashboard_stats
-- Returns 8 KPIs for a dealer in one query
CREATE OR REPLACE FUNCTION public.get_dealer_dashboard_stats(
  p_dealer_id uuid,
  p_vertical text DEFAULT 'tracciona',
  p_month_start timestamptz DEFAULT date_trunc('month', now())
)
RETURNS TABLE (
  active_listings bigint,
  total_leads bigint,
  total_views bigint,
  leads_this_month bigint,
  response_rate numeric,
  contacts_this_month bigint,
  ficha_views_this_month bigint,
  conversion_rate numeric
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  WITH dealer_vehicles AS (
    SELECT id FROM public.vehicles
    WHERE dealer_id = p_dealer_id AND vertical = p_vertical
  ),
  active AS (
    SELECT count(*) AS cnt FROM dealer_vehicles dv
    JOIN public.vehicles v ON v.id = dv.id WHERE v.status = 'published'
  ),
  all_leads AS (
    SELECT id, status, created_at FROM public.leads
    WHERE dealer_id = p_dealer_id
  ),
  lead_stats AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE created_at >= p_month_start) AS this_month,
      count(*) FILTER (WHERE status IN ('contacted', 'negotiating', 'won')) AS responded
    FROM all_leads
  ),
  view_stats AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE created_at >= p_month_start) AS this_month
    FROM public.analytics_events
    WHERE event_type = 'vehicle_view'
      AND vertical = p_vertical
      AND jsonb_extract_path_text(metadata, 'dealer_id') = p_dealer_id::text
  ),
  contact_stats AS (
    SELECT count(*) AS cnt FROM public.analytics_events
    WHERE event_type IN ('lead_submit', 'whatsapp_click', 'phone_click')
      AND vertical = p_vertical
      AND jsonb_extract_path_text(metadata, 'dealer_id') = p_dealer_id::text
      AND created_at >= p_month_start
  )
  SELECT
    active.cnt AS active_listings,
    lead_stats.total AS total_leads,
    view_stats.total AS total_views,
    lead_stats.this_month AS leads_this_month,
    CASE WHEN lead_stats.total > 0
      THEN round((lead_stats.responded::numeric / lead_stats.total) * 100, 1)
      ELSE 0
    END AS response_rate,
    contact_stats.cnt AS contacts_this_month,
    view_stats.this_month AS ficha_views_this_month,
    CASE WHEN view_stats.total > 0
      THEN round((lead_stats.total::numeric / view_stats.total) * 100, 1)
      ELSE 0
    END AS conversion_rate
  FROM active, lead_stats, view_stats, contact_stats;
$$;

-- RPC: get_dealer_top_vehicles
-- Returns top vehicles by leads + favorites
CREATE OR REPLACE FUNCTION public.get_dealer_top_vehicles(
  p_dealer_id uuid,
  p_vertical text DEFAULT 'tracciona',
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  brand text,
  model text,
  year integer,
  price numeric,
  views bigint,
  leads bigint,
  favorites bigint,
  status text
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT
    v.id,
    v.brand::text,
    v.model::text,
    v.year::integer,
    v.price,
    coalesce(view_counts.cnt, 0) AS views,
    coalesce(lead_counts.cnt, 0) AS leads,
    coalesce(fav_counts.cnt, 0) AS favorites,
    v.status::text
  FROM public.vehicles v
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt FROM public.analytics_events ae
    WHERE ae.event_type = 'vehicle_view'
      AND ae.vertical = p_vertical
      AND jsonb_extract_path_text(ae.metadata, 'vehicle_id') = v.id::text
  ) view_counts ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt FROM public.leads l
    WHERE l.vehicle_id = v.id
  ) lead_counts ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt FROM public.favorites f
    WHERE f.vehicle_id = v.id
  ) fav_counts ON true
  WHERE v.dealer_id = p_dealer_id
    AND v.vertical = p_vertical
  ORDER BY (coalesce(lead_counts.cnt, 0) + coalesce(fav_counts.cnt, 0)) DESC
  LIMIT p_limit;
$$;

-- RPC: get_dealer_rating_summary
-- Returns average rating and review count for a dealer
CREATE OR REPLACE FUNCTION public.get_dealer_rating_summary(
  p_dealer_id uuid
)
RETURNS TABLE (
  average_rating numeric,
  review_count bigint
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT
    coalesce(round(avg(rating)::numeric, 1), 0) AS average_rating,
    count(*) AS review_count
  FROM public.dealer_reviews
  WHERE dealer_id = p_dealer_id
    AND status = 'approved';
$$;
