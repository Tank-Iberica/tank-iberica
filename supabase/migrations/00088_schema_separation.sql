-- Schema separation: shared (cross-vertical) vs vertical-specific
--
-- Strategy: use PostgreSQL schemas to logically separate concerns.
-- - public: remains the default, contains shared tables (users, vertical_config, etc.)
-- - shared: explicit schema for cross-vertical lookup/reference data
-- - Each vertical could get its own schema in the future (e.g., tracciona, horecaria)
--
-- Phase 1 (this migration): Create shared schema + views that aggregate cross-vertical data.
-- Phase 2 (future): Move vertical-specific data to per-vertical schemas.

-- ============================================================================
-- 1. Create shared schema for cross-vertical reference data
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS shared;

-- Grant usage to authenticated and service_role
GRANT USAGE ON SCHEMA shared TO authenticated;
GRANT USAGE ON SCHEMA shared TO service_role;

-- ============================================================================
-- 2. Shared views: cross-vertical aggregations
-- ============================================================================

-- View: all published vehicles across verticals (catalog federation)
CREATE OR REPLACE VIEW shared.all_vehicles AS
SELECT
  v.id,
  v.slug,
  v.brand,
  v.model,
  v.year,
  v.price,
  v.category,
  v.status,
  v.vertical,
  v.created_at,
  v.updated_at,
  vc.name AS vertical_name,
  vc.theme
FROM public.vehicles v
LEFT JOIN public.vertical_config vc ON vc.vertical = v.vertical
WHERE v.status = 'published';

-- View: cross-vertical market summary
CREATE OR REPLACE VIEW shared.market_summary AS
SELECT
  vertical,
  category,
  COUNT(*) AS total_listings,
  AVG(avg_price)::NUMERIC(12,2) AS avg_price,
  MIN(min_price)::NUMERIC(12,2) AS min_price,
  MAX(max_price)::NUMERIC(12,2) AS max_price,
  period
FROM public.market_data
GROUP BY vertical, category, period;

-- View: dealers across verticals
CREATE OR REPLACE VIEW shared.all_dealers AS
SELECT
  d.id,
  d.business_name,
  d.slug,
  d.vertical,
  d.subscription_plan,
  d.status,
  d.created_at,
  (SELECT COUNT(*) FROM public.vehicles v
   WHERE v.dealer_id = d.id AND v.status = 'published') AS active_listings
FROM public.dealers d
WHERE d.status = 'active';

-- ============================================================================
-- 3. Shared reference tables (moved from public in future)
-- ============================================================================

-- Shared taxonomy: universal characteristics that apply across verticals
CREATE TABLE IF NOT EXISTS shared.universal_characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,  -- e.g., 'condition', 'warranty', 'documentation'
  label JSONB NOT NULL DEFAULT '{}',  -- {"es": "Estado", "en": "Condition"}
  type TEXT NOT NULL DEFAULT 'select',  -- select, boolean, number, text
  options JSONB DEFAULT '[]',  -- for select type: [{"value": "new", "label": {"es": "Nuevo"}}]
  applies_to TEXT[] DEFAULT '{}',  -- which verticals use this (empty = all)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grant select to authenticated
GRANT SELECT ON shared.universal_characteristics TO authenticated;
GRANT ALL ON shared.universal_characteristics TO service_role;

-- Seed universal characteristics
INSERT INTO shared.universal_characteristics (key, label, type, options, applies_to, sort_order)
VALUES
  ('condition', '{"es": "Estado", "en": "Condition"}', 'select',
   '[{"value": "new", "label": {"es": "Nuevo", "en": "New"}}, {"value": "used", "label": {"es": "Usado", "en": "Used"}}, {"value": "refurbished", "label": {"es": "Reacondicionado", "en": "Refurbished"}}]',
   '{}', 1),
  ('warranty', '{"es": "Garantía", "en": "Warranty"}', 'boolean', '[]', '{}', 2),
  ('documentation_complete', '{"es": "Documentación completa", "en": "Complete documentation"}', 'boolean', '[]', '{}', 3),
  ('location_province', '{"es": "Provincia", "en": "Province"}', 'text', '[]', '{}', 4)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 4. RLS on shared views
-- ============================================================================

-- Views inherit RLS from underlying tables, but we add explicit grants
GRANT SELECT ON shared.all_vehicles TO authenticated;
GRANT SELECT ON shared.market_summary TO authenticated;
GRANT SELECT ON shared.all_dealers TO authenticated;
GRANT SELECT ON shared.all_vehicles TO service_role;
GRANT SELECT ON shared.market_summary TO service_role;
GRANT SELECT ON shared.all_dealers TO service_role;

-- RLS on universal_characteristics
ALTER TABLE shared.universal_characteristics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read universal characteristics" ON shared.universal_characteristics;
CREATE POLICY "Anyone can read universal characteristics" ON shared.universal_characteristics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can manage universal characteristics" ON shared.universal_characteristics;
CREATE POLICY "Service can manage universal characteristics" ON shared.universal_characteristics
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. Commentary: vertical-specific schema pattern (Phase 2)
-- ============================================================================
-- When a new vertical is created:
--   CREATE SCHEMA IF NOT EXISTS vert_<slug>;
--   GRANT USAGE ON SCHEMA vert_<slug> TO authenticated, service_role;
--   -- Move/partition tables:
--   CREATE TABLE vert_<slug>.vehicles (LIKE public.vehicles INCLUDING ALL);
--   CREATE TABLE vert_<slug>.categories (LIKE public.categories INCLUDING ALL);
--   -- Federation view:
--   CREATE OR REPLACE VIEW shared.all_vehicles AS
--     SELECT ... FROM public.vehicles WHERE vertical='tracciona'
--     UNION ALL
--     SELECT ... FROM vert_horecaria.vehicles
--     ...;
