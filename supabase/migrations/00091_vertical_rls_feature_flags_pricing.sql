-- =============================================================================
-- Migration: Vertical-specific RLS + Feature Flags per Vertical + Pricing Rules
-- §5.2 P2 items from Plan Maestro
-- =============================================================================

-- ============================================================================
-- 1. Helper function: get dealer's vertical from auth context
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_dealer_vertical()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.vertical
  FROM dealers d
  WHERE d.user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- 2. Vertical-specific RLS: dealers only see/manage data from their vertical
-- ============================================================================

-- 2a. Vehicles: dealers can INSERT/UPDATE/DELETE only in their vertical
DROP POLICY IF EXISTS "vehicles_dealer_insert" ON vehicles;
CREATE POLICY "vehicles_dealer_insert" ON vehicles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dealers d
      WHERE d.user_id = auth.uid()
        AND d.id = dealer_id
        AND d.vertical = vertical
    )
  );

DROP POLICY IF EXISTS "vehicles_dealer_update" ON vehicles;
CREATE POLICY "vehicles_dealer_update" ON vehicles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dealers d
      WHERE d.user_id = auth.uid()
        AND d.id = dealer_id
        AND d.vertical = vertical
    )
  );

DROP POLICY IF EXISTS "vehicles_dealer_delete" ON vehicles;
CREATE POLICY "vehicles_dealer_delete" ON vehicles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dealers d
      WHERE d.user_id = auth.uid()
        AND d.id = dealer_id
        AND d.vertical = vertical
    )
  );

-- 2b. Historico: dealer only sees archive from their vertical
-- Only create if historico has a vertical column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'historico' AND column_name = 'vertical'
  ) THEN
    DROP POLICY IF EXISTS "historico_vertical_dealer" ON historico;
    CREATE POLICY "historico_vertical_dealer" ON historico
      FOR SELECT
      USING (
        dealer_id IN (
          SELECT id FROM dealers WHERE user_id = auth.uid()
        )
        AND vertical = get_dealer_vertical()
      );
  END IF;
END $$;

-- ============================================================================
-- 3. Feature flags: add vertical column for per-vertical flags
-- ============================================================================

ALTER TABLE feature_flags
  ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT NULL;

-- Composite unique for per-vertical overrides (key + vertical)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flags_key_vertical_unique'
  ) THEN
    ALTER TABLE feature_flags
      ADD CONSTRAINT feature_flags_key_vertical_unique UNIQUE (key, vertical);
  END IF;
END $$;

COMMENT ON COLUMN feature_flags.vertical IS 'NULL = global flag; set to vertical slug for per-vertical override';

-- Helper function to check if a feature is enabled for a vertical
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  p_key TEXT,
  p_vertical TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM feature_flags WHERE key = p_key AND vertical = p_vertical),
    (SELECT enabled FROM feature_flags WHERE key = p_key AND vertical IS NULL),
    false
  );
$$;

-- ============================================================================
-- 4. Vertical pricing/compliance rules in vertical_config
-- ============================================================================

ALTER TABLE vertical_config
  ADD COLUMN IF NOT EXISTS compliance_rules JSONB DEFAULT '{
    "require_vehicle_images": true,
    "min_images": 3,
    "max_images": 30,
    "require_price": true,
    "min_price_cents": 100,
    "max_price_cents": 99999900,
    "require_description": true,
    "min_description_length": 50,
    "allowed_currencies": ["EUR"],
    "require_iva_info": true,
    "max_listing_days": 180,
    "auto_unpublish_stale": true
  }';

ALTER TABLE vertical_config
  ADD COLUMN IF NOT EXISTS stock_limits JSONB DEFAULT '{
    "free": {"max_vehicles": 3, "max_images_per_vehicle": 10},
    "basic": {"max_vehicles": 20, "max_images_per_vehicle": 20},
    "premium": {"max_vehicles": -1, "max_images_per_vehicle": 30},
    "founding": {"max_vehicles": -1, "max_images_per_vehicle": 30}
  }';

COMMENT ON COLUMN vertical_config.compliance_rules IS 'Per-vertical compliance rules: image requirements, price limits, description rules';
COMMENT ON COLUMN vertical_config.stock_limits IS 'Per-vertical stock limits by plan: max vehicles, max images per vehicle (-1 = unlimited)';

-- ============================================================================
-- 5. Grant execute on new functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_dealer_vertical() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT, TEXT) TO anon;
