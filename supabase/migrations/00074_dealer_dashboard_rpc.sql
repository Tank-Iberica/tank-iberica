-- ── Migration 00074: Dealer Dashboard RPC Functions ────────────────────────────
-- Reduces useDealerDashboard.ts from 10 round-trips to 3 (one parallel batch).
--
-- Functions:
--   get_dealer_dashboard_stats  → all 8 KPIs in one CTE query
--   get_dealer_top_vehicles     → top N vehicles with lead + favorite counts
-- ────────────────────────────────────────────────────────────────────────────

-- 1. KPI aggregation ──────────────────────────────────────────────────────────
--
-- Replaces seven individual Supabase queries:
--   active_listings  → vehicles COUNT (published, vertical)
--   total_leads      → leads COUNT (dealer)
--   leads_this_month → leads COUNT (dealer, month)
--   response_rate    → (responded / total) × 100
--   total_views      → dealer_stats.total_views
--   contacts_this_month    → analytics_events COUNT (contact_click, month)
--   ficha_views_this_month → analytics_events COUNT (ficha_view, month)
--   conversion_rate  → (contacts / ficha_views) × 100
--
-- Returns exactly one row.

CREATE OR REPLACE FUNCTION get_dealer_dashboard_stats(
  p_dealer_id   UUID,
  p_vertical    TEXT,
  p_month_start TIMESTAMPTZ
)
RETURNS TABLE (
  active_listings        BIGINT,
  total_leads            BIGINT,
  total_views            BIGINT,
  leads_this_month       BIGINT,
  response_rate          NUMERIC,
  contacts_this_month    BIGINT,
  ficha_views_this_month BIGINT,
  conversion_rate        NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    listing_stats AS (
      SELECT COUNT(*)::BIGINT AS cnt
      FROM vehicles
      WHERE dealer_id = p_dealer_id
        AND status    = 'published'::vehicle_status
        AND vertical  = p_vertical
    ),
    lead_stats AS (
      SELECT
        COUNT(*)::BIGINT                                             AS total,
        COUNT(*) FILTER (WHERE created_at >= p_month_start)::BIGINT AS this_month,
        COUNT(*) FILTER (WHERE status != 'new')::BIGINT             AS responded
      FROM leads
      WHERE dealer_id = p_dealer_id
    ),
    view_stats AS (
      SELECT COALESCE(MAX(total_views), 0)::BIGINT AS total_views
      FROM dealer_stats
      WHERE dealer_id = p_dealer_id
    ),
    event_stats AS (
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'contact_click')::BIGINT AS contacts,
        COUNT(*) FILTER (WHERE event_type = 'ficha_view')::BIGINT    AS ficha_views
      FROM analytics_events
      WHERE (metadata @> jsonb_build_object('dealer_id', p_dealer_id::text))
        AND event_type IN ('contact_click', 'ficha_view')
        AND created_at >= p_month_start
    )
  SELECT
    ls.cnt,
    ld.total,
    vs.total_views,
    ld.this_month,
    CASE WHEN ld.total > 0
         THEN ROUND((ld.responded::NUMERIC / ld.total) * 100)
         ELSE 0::NUMERIC
    END AS response_rate,
    ev.contacts,
    ev.ficha_views,
    CASE WHEN ev.ficha_views > 0
         THEN ROUND((ev.contacts::NUMERIC / ev.ficha_views) * 1000) / 10
         ELSE 0::NUMERIC
    END AS conversion_rate
  FROM listing_stats ls, lead_stats ld, view_stats vs, event_stats ev
$$;

-- 2. Top vehicles with per-vehicle lead and favorite counts ───────────────────
--
-- Replaces two separate queries (top vehicles + favorites batch):
--   - vehicles ORDER BY views DESC LIMIT N
--   - favorites IN (topVehicleIds)
--   - Also fixes the bug where leads were always returned as 0
--
-- Uses correlated subqueries for the 5-row result — efficient with indexes on
--   leads(vehicle_id), favorites(vehicle_id).

CREATE OR REPLACE FUNCTION get_dealer_top_vehicles(
  p_dealer_id UUID,
  p_vertical  TEXT,
  p_limit     INT DEFAULT 5
)
RETURNS TABLE (
  id        UUID,
  brand     TEXT,
  model     TEXT,
  year      INT,
  price     NUMERIC,
  views     INT,
  leads     BIGINT,
  favorites BIGINT,
  status    TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    v.brand,
    v.model,
    v.year,
    v.price,
    COALESCE(v.views, 0)::INT AS views,
    (
      SELECT COUNT(*)::BIGINT
      FROM leads l
      WHERE l.vehicle_id = v.id
        AND l.dealer_id  = p_dealer_id
    ) AS leads,
    (
      SELECT COUNT(*)::BIGINT
      FROM favorites f
      WHERE f.vehicle_id = v.id
    ) AS favorites,
    v.status::TEXT
  FROM vehicles v
  WHERE v.dealer_id = p_dealer_id
    AND v.status    = 'published'::vehicle_status
    AND v.vertical  = p_vertical
  ORDER BY v.views DESC NULLS LAST
  LIMIT p_limit
$$;

COMMENT ON FUNCTION get_dealer_dashboard_stats IS
  'Returns all 8 dealer dashboard KPI metrics in a single round-trip. Used by useDealerDashboard.ts.';

COMMENT ON FUNCTION get_dealer_top_vehicles IS
  'Returns top N vehicles for a dealer, including per-vehicle lead and favorite counts. Used by useDealerDashboard.ts.';
