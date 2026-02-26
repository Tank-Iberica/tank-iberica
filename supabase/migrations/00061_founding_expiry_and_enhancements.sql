-- =============================================================================
-- TRACCIONA — Migration 00061: Founding Expiry Support & Enhancements
-- =============================================================================
-- This migration adds:
--   Bloque A: Founding dealer expiry support columns on subscriptions
--   Bloque B: Materialized view price_history_trends (for /precios page §15)
--   Bloque C: Enhanced refresh_all_materialized_views() function
--   Bloque D: Transport zones realistic seed data for Spanish zones
--   Bloque E: founding_expiry_check view for the founding dealer cron
-- =============================================================================

BEGIN;

-- =============================================================================
-- BLOQUE A: FOUNDING DEALER EXPIRY SUPPORT COLUMNS
-- =============================================================================
-- These columns extend the dealer subscriptions table to track:
--   - When a founding period started (for billing/expiry calculations)
--   - Whether the founding badge should persist after the period ends
--   - Whether this subscription user has ever had a free trial
--     (prevents double-dipping the 14-day trial after switching plans)

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS founding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS founding_badge_permanent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_had_trial BOOLEAN DEFAULT false;

COMMENT ON COLUMN subscriptions.founding_started_at IS
  'Timestamp when the founding dealer period began. Used to calculate expiry relative to the original sign-up date.';

COMMENT ON COLUMN subscriptions.founding_badge_permanent IS
  'When true, the founding badge is preserved on the dealer profile even after the founding period has expired.';

COMMENT ON COLUMN subscriptions.has_had_trial IS
  'Tracks whether this user has ever used the 14-day free trial. Prevents re-use when changing plans.';

-- Index to speed up cron queries that look for expiring founding subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_founding
  ON subscriptions(plan, status, expires_at)
  WHERE plan = 'founding';

-- =============================================================================
-- BLOQUE B: MATERIALIZED VIEW price_history_trends
-- =============================================================================
-- Weekly price trend aggregates joined from the price_history tracking table
-- (created in 00060) and vehicles. Powers the /precios price trends page (§15).
--
-- Named price_history_TRENDS to distinguish it from:
--   - price_history (table, 00060) — raw per-vehicle price change log
--   - price_history (mat. view, 00052) — legacy weekly avg from vehicles.price
--
-- HAVING COUNT(*) >= 3 ensures statistical relevance and RGPD anonymisation.
-- WITH NO DATA defers the initial population to the first cron/manual refresh.

CREATE MATERIALIZED VIEW IF NOT EXISTS price_history_trends AS
SELECT
  COALESCE(c.vertical, 'tracciona') AS vertical,
  v.category_id,
  c.slug AS subcategory_slug,
  c.name_es AS subcategory_name,
  v.brand,
  date_trunc('week', ph.created_at) AS week,
  COUNT(*) AS sample_size,
  AVG(ph.price_cents) AS avg_price_cents,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ph.price_cents) AS median_price_cents,
  MIN(ph.price_cents) AS min_price_cents,
  MAX(ph.price_cents) AS max_price_cents
FROM price_history ph
JOIN vehicles v ON ph.vehicle_id = v.id
LEFT JOIN categories c ON v.category_id = c.id
WHERE ph.price_cents > 0
GROUP BY COALESCE(c.vertical, 'tracciona'), v.category_id, c.slug, c.name_es, v.brand, date_trunc('week', ph.created_at)
HAVING COUNT(*) >= 3
WITH NO DATA;

-- Unique index required for CONCURRENTLY refreshes and guarantees one row
-- per (vertical, category, subcategory, brand, week) combination.
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_trends_pk
  ON price_history_trends(vertical, category_id, subcategory_slug, brand, week);

-- Supporting indexes for common query patterns on the /precios page
CREATE INDEX IF NOT EXISTS idx_price_history_trends_vertical
  ON price_history_trends(vertical, week DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_trends_subcategory
  ON price_history_trends(subcategory_slug, week DESC);

COMMENT ON MATERIALIZED VIEW price_history_trends IS
  'Weekly price trend aggregates from price_history tracking table. Refreshed by cron via refresh_all_materialized_views(). Requires CONCURRENTLY refresh after initial population.';

-- =============================================================================
-- BLOQUE C: ENHANCED refresh_all_materialized_views() FUNCTION
-- =============================================================================
-- Replaces/extends the existing refresh_market_views() function (00052).
-- Now also refreshes price_history_trends introduced in this migration.
-- Named refresh_all_materialized_views to serve as the canonical single entry
-- point called by the cron job (pg_cron or Edge Function scheduler).

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY market_data;
  REFRESH MATERIALIZED VIEW CONCURRENTLY demand_data;
  -- price_history_trends: try CONCURRENTLY first; if it fails (empty/no unique index),
  -- fall back to a regular refresh which always works.
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY price_history_trends;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW price_history_trends;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_all_materialized_views() IS
  'Refreshes all materialized views concurrently. Called by weekly cron job or manually from admin. SECURITY DEFINER so it runs as the defining role regardless of caller.';

-- =============================================================================
-- BLOQUE D: TRANSPORT ZONES — REALISTIC SPANISH SEED DATA
-- =============================================================================
-- Adds named geographic zones matching the Tracciona flujos doc (§ transport).
-- Uses INSERT ... WHERE NOT EXISTS to be idempotent — safe to re-run.
-- These zones replace the generic zona-1/zona-2 slugs from 00040 with
-- descriptive, user-facing slugs and proper JSONB zone_name values.
--
-- price_cents are in euro-cents (e.g. 75000 = €750.00).
-- estimated_days is the typical delivery window in business days.
-- sort_order determines display order in the transport selection UI.

-- Zona Norte: Galicia, Asturias, Cantabria, País Vasco
INSERT INTO transport_zones (vertical, zone_slug, zone_name, regions, price_cents, estimated_days, sort_order, status, active)
SELECT 'tracciona', 'zona-norte', 'Norte peninsular',
       ARRAY['Galicia', 'Asturias', 'Cantabria', 'País Vasco'],
       75000, 3, 10, 'active', true
WHERE NOT EXISTS (
  SELECT 1 FROM transport_zones
  WHERE vertical = 'tracciona' AND zone_slug = 'zona-norte'
);

-- Zona Centro: Madrid, Castilla y León, Castilla-La Mancha
INSERT INTO transport_zones (vertical, zone_slug, zone_name, regions, price_cents, estimated_days, sort_order, status, active)
SELECT 'tracciona', 'zona-centro', 'Centro peninsular',
       ARRAY['Madrid', 'Castilla y León', 'Castilla-La Mancha'],
       65000, 2, 20, 'active', true
WHERE NOT EXISTS (
  SELECT 1 FROM transport_zones
  WHERE vertical = 'tracciona' AND zone_slug = 'zona-centro'
);

-- Zona Sur: Andalucía, Extremadura, Murcia
INSERT INTO transport_zones (vertical, zone_slug, zone_name, regions, price_cents, estimated_days, sort_order, status, active)
SELECT 'tracciona', 'zona-sur', 'Sur peninsular',
       ARRAY['Andalucía', 'Extremadura', 'Murcia'],
       90000, 3, 30, 'active', true
WHERE NOT EXISTS (
  SELECT 1 FROM transport_zones
  WHERE vertical = 'tracciona' AND zone_slug = 'zona-sur'
);

-- Zona Levante: Comunidad Valenciana, Cataluña, Aragón, Baleares
INSERT INTO transport_zones (vertical, zone_slug, zone_name, regions, price_cents, estimated_days, sort_order, status, active)
SELECT 'tracciona', 'zona-levante', 'Levante',
       ARRAY['Comunidad Valenciana', 'Cataluña', 'Aragón', 'Baleares'],
       70000, 2, 40, 'active', true
WHERE NOT EXISTS (
  SELECT 1 FROM transport_zones
  WHERE vertical = 'tracciona' AND zone_slug = 'zona-levante'
);

-- Portugal
INSERT INTO transport_zones (vertical, zone_slug, zone_name, regions, price_cents, estimated_days, sort_order, status, active)
SELECT 'tracciona', 'portugal', 'Portugal',
       ARRAY['Portugal'],
       100000, 4, 50, 'active', true
WHERE NOT EXISTS (
  SELECT 1 FROM transport_zones
  WHERE vertical = 'tracciona' AND zone_slug = 'portugal'
);

-- Francia Sur: Occitanie, Nouvelle-Aquitaine, PACA
INSERT INTO transport_zones (vertical, zone_slug, zone_name, regions, price_cents, estimated_days, sort_order, status, active)
SELECT 'tracciona', 'francia-sur', 'Francia sur',
       ARRAY['Occitanie', 'Nouvelle-Aquitaine', 'Provence-Alpes-Côte d''Azur'],
       125000, 5, 60, 'active', true
WHERE NOT EXISTS (
  SELECT 1 FROM transport_zones
  WHERE vertical = 'tracciona' AND zone_slug = 'francia-sur'
);

-- =============================================================================
-- BLOQUE E: founding_expiry_check VIEW
-- =============================================================================
-- Read-only view used by the founding dealer cron job and admin dashboard
-- to identify founding subscriptions that are active, approaching expiry,
-- or already expired.
--
-- expiry_status logic:
--   'expired'       → expires_at is in the past
--   'expiring_7d'   → expires in ≤ 7 days (triggers urgent notification)
--   'expiring_30d'  → expires in ≤ 30 days (triggers advance warning)
--   'active'        → expires_at is more than 30 days away
--   NULL            → no expiry set (permanent founding deal)
--
-- NOTE: The 7-day check is evaluated BEFORE the 30-day check in the CASE
-- expression below. Because CASE evaluates conditions in order, a subscription
-- expiring in 5 days will match 'expiring_7d' (not 'expiring_30d').

CREATE OR REPLACE VIEW founding_expiry_check AS
SELECT
  s.id AS subscription_id,
  s.user_id,
  s.plan,
  s.founding_started_at,
  s.expires_at,
  s.founding_badge_permanent,
  d.company_name,
  d.email AS dealer_email,
  u.email AS user_email,
  CASE
    WHEN s.expires_at IS NULL THEN NULL
    WHEN s.expires_at <= NOW() THEN 'expired'
    WHEN s.expires_at <= NOW() + INTERVAL '7 days' THEN 'expiring_7d'
    WHEN s.expires_at <= NOW() + INTERVAL '30 days' THEN 'expiring_30d'
    ELSE 'active'
  END AS expiry_status
FROM subscriptions s
LEFT JOIN dealers d ON d.user_id = s.user_id
LEFT JOIN auth.users u ON u.id = s.user_id
WHERE s.plan = 'founding'
  AND s.status = 'active';

COMMENT ON VIEW founding_expiry_check IS
  'Admin/cron view for founding dealer subscription expiry monitoring. Returns all active founding subscriptions with their expiry status (expired, expiring_7d, expiring_30d, active, or NULL for permanent).';

COMMIT;
