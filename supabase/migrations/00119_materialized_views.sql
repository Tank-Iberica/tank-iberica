-- Migration 00119: Materialized views for dashboard KPIs and search facets
-- Refreshed via cron/refresh-matviews endpoint (every 15min in prod).
-- Dashboard and search composables query these views instead of live tables.

-- ── Dashboard KPIs ────────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_dashboard_kpis AS
SELECT
  NOW()                                                          AS refreshed_at,
  -- Vehicle counts
  COUNT(*) FILTER (WHERE status = 'published')                  AS published_vehicles,
  COUNT(*) FILTER (WHERE status = 'draft')                      AS draft_vehicles,
  COUNT(*) FILTER (WHERE status = 'sold')                       AS sold_vehicles,
  COUNT(*) FILTER (WHERE status = 'reserved')                   AS reserved_vehicles,
  COUNT(*) FILTER (
    WHERE status = 'published'
      AND created_at >= NOW() - INTERVAL '24 hours'
  )                                                              AS published_today,
  COUNT(*) FILTER (
    WHERE status = 'published'
      AND created_at >= NOW() - INTERVAL '7 days'
  )                                                              AS published_this_week,
  -- Pricing
  ROUND(AVG(price) FILTER (WHERE status = 'published' AND price > 0))  AS avg_price,
  MIN(price) FILTER (WHERE status = 'published' AND price > 0)         AS min_price,
  MAX(price) FILTER (WHERE status = 'published' AND price > 0)         AS max_price,
  -- Featured / highlighted
  COUNT(*) FILTER (WHERE featured = TRUE AND status = 'published')     AS featured_count,
  COUNT(*) FILTER (WHERE highlight_style IS NOT NULL AND status = 'published') AS highlighted_count
FROM public.vehicles
WITH NO DATA;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_dashboard_kpis_singleton
  ON public.mv_dashboard_kpis ((1));

-- Perform initial populate
REFRESH MATERIALIZED VIEW public.mv_dashboard_kpis;

-- ── Search Facets ─────────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_search_facets AS
SELECT
  NOW()                          AS refreshed_at,
  v.type_id,
  t.name                         AS type_name,
  v.category_id,
  c.name                         AS category_name,
  v.subcategory_id,
  sc.name                        AS subcategory_name,
  v.brand,
  v.location,
  COUNT(*)                       AS vehicle_count,
  ROUND(AVG(v.price) FILTER (WHERE v.price > 0)) AS avg_price
FROM public.vehicles v
LEFT JOIN public.vehicle_types t   ON t.id = v.type_id
LEFT JOIN public.categories c      ON c.id = v.category_id
LEFT JOIN public.subcategories sc  ON sc.id = v.subcategory_id
WHERE v.status = 'published'
GROUP BY
  v.type_id, t.name,
  v.category_id, c.name,
  v.subcategory_id, sc.name,
  v.brand,
  v.location
WITH NO DATA;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_search_facets_group
  ON public.mv_search_facets (
    type_id, category_id, subcategory_id, brand, location
  ) NULLS NOT DISTINCT;

-- Indexes for common filter queries
CREATE INDEX IF NOT EXISTS idx_mv_search_facets_type
  ON public.mv_search_facets (type_id);

CREATE INDEX IF NOT EXISTS idx_mv_search_facets_category
  ON public.mv_search_facets (category_id);

CREATE INDEX IF NOT EXISTS idx_mv_search_facets_brand
  ON public.mv_search_facets (brand);

-- Initial populate
REFRESH MATERIALIZED VIEW public.mv_search_facets;

-- ── Permissions ───────────────────────────────────────────────────────────────

GRANT SELECT ON public.mv_dashboard_kpis TO anon, authenticated, service_role;
GRANT SELECT ON public.mv_search_facets  TO anon, authenticated, service_role;

-- ── Refresh helper (called by cron) ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_matview(view_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Whitelist to prevent injection via view_name
  IF view_name NOT IN ('mv_dashboard_kpis', 'mv_search_facets') THEN
    RAISE EXCEPTION 'Unknown materialized view: %', view_name;
  END IF;
  EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.' || quote_ident(view_name);
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_matview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_matview(TEXT) TO service_role;
