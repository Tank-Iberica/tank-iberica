-- ================================================
-- 00040: Transport zones upgrade, post-venta, freshness
-- ================================================
-- Upgrade transport_zones from origin/destination to zone-based schema.
-- Add freshness tracking columns to vehicles.
-- Seed Tracciona transport zones.
-- ================================================

-- A. Upgrade transport_zones table to zone-based schema
ALTER TABLE transport_zones
  ADD COLUMN IF NOT EXISTS vertical VARCHAR DEFAULT 'tracciona',
  ADD COLUMN IF NOT EXISTS zone_name VARCHAR,
  ADD COLUMN IF NOT EXISTS zone_slug VARCHAR,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS regions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active';

-- Drop NOT NULL on legacy columns so zone-based rows can omit them
ALTER TABLE transport_zones ALTER COLUMN origin_country DROP NOT NULL;
ALTER TABLE transport_zones ALTER COLUMN destination_country DROP NOT NULL;

-- Rename base_price_cents → price_cents (idempotent via DO block)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transport_zones' AND column_name = 'base_price_cents'
  ) THEN
    ALTER TABLE transport_zones RENAME COLUMN base_price_cents TO price_cents;
  END IF;
END $$;

-- Add unique constraint on (vertical, zone_slug)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transport_zones_vertical_slug
  ON transport_zones(vertical, zone_slug) WHERE zone_slug IS NOT NULL;

-- B. Seed Tracciona transport zones
INSERT INTO transport_zones (vertical, zone_slug, zone_name, price_cents, regions, sort_order)
VALUES
  ('tracciona', 'local', 'Local', 30000, '{}', 0),
  ('tracciona', 'zona-1', 'Península Norte', 50000,
    '{"galicia","asturias","cantabria","pais_vasco","navarra","aragon","cataluña"}', 1),
  ('tracciona', 'zona-2', 'Península Centro', 60000,
    '{"madrid","castilla_leon","castilla_la_mancha","extremadura","la_rioja"}', 2),
  ('tracciona', 'zona-3', 'Península Sur', 70000,
    '{"andalucia","murcia","comunidad_valenciana"}', 3),
  ('tracciona', 'portugal', 'Portugal', 90000,
    '{"portugal"}', 4),
  ('tracciona', 'francia-sur', 'Francia Sur', 120000,
    '{"francia_sur"}', 5)
ON CONFLICT DO NOTHING;

-- C. Upgrade transport_requests table
ALTER TABLE transport_requests
  ADD COLUMN IF NOT EXISTS origin_zone VARCHAR,
  ADD COLUMN IF NOT EXISTS destination_zone VARCHAR,
  ADD COLUMN IF NOT EXISTS destination_postal_code VARCHAR,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- D. Add 'paused' and 'expired' to vehicle_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paused' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vehicle_status')) THEN
    ALTER TYPE vehicle_status ADD VALUE 'paused';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vehicle_status')) THEN
    ALTER TYPE vehicle_status ADD VALUE 'expired';
  END IF;
END $$;

-- Add freshness tracking to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS freshness_reminded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS freshness_reminder_count INT DEFAULT 0;

-- Index for freshness cron queries
CREATE INDEX IF NOT EXISTS idx_vehicles_freshness
  ON vehicles(status, updated_at);

-- E. Add sold_via_tracciona tracking (for post-sale metrics)
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS sold_via_tracciona BOOLEAN DEFAULT false;

-- F. Update RLS: allow dealers to read their own transport requests
DROP POLICY IF EXISTS "transport_req_dealer_read" ON transport_requests;
CREATE POLICY "transport_req_dealer_read" ON transport_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN dealers d ON v.dealer_id = d.id
      WHERE v.id = vehicle_id AND d.user_id = auth.uid()
    )
  );

COMMENT ON TABLE transport_zones IS 'Transport pricing zones by vertical. Regions match PROVINCE_TO_REGION slugs.';
COMMENT ON TABLE transport_requests IS 'User transport requests for purchased vehicles.';
