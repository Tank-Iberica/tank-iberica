-- ================================================
-- TANK IBERICA — Migration 00015: Consolidate vehicle fields
-- Ensures all required fields exist for admin product management
-- This is a safe migration that only adds if not exists
-- ================================================

-- =============================================
-- 1. ADD ENUM VALUES (if not exist)
-- PostgreSQL requires special handling for enum additions
-- =============================================

-- Add 'rented' status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'rented'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vehicle_status')
  ) THEN
    ALTER TYPE vehicle_status ADD VALUE 'rented';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add 'maintenance' status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'maintenance'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vehicle_status')
  ) THEN
    ALTER TYPE vehicle_status ADD VALUE 'maintenance';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. ADD ONLINE/OFFLINE FIELDS (from migration 00011)
-- =============================================

-- Add is_online flag
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;

-- Add intermediation-specific fields
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_contact TEXT,
ADD COLUMN IF NOT EXISTS owner_notes TEXT;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_is_online ON vehicles(is_online);

-- =============================================
-- 3. ADD FINANCIAL FIELDS (from migration 00014)
-- =============================================

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS min_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS plate TEXT;

-- Note: internal_id with SERIAL needs special handling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'internal_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN internal_id SERIAL;
  END IF;
END $$;

-- Index for plate search
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);

-- =============================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN vehicles.is_online IS 'true = public web (Vehículos), false = internal only (Intermediación)';
COMMENT ON COLUMN vehicles.owner_name IS 'Owner name for intermediation vehicles (is_online = false)';
COMMENT ON COLUMN vehicles.owner_contact IS 'Owner contact for intermediation vehicles';
COMMENT ON COLUMN vehicles.owner_notes IS 'Internal notes about the owner/intermediation';
COMMENT ON COLUMN vehicles.acquisition_cost IS 'Cost of acquisition for profit calculation';
COMMENT ON COLUMN vehicles.acquisition_date IS 'Date of acquisition';
COMMENT ON COLUMN vehicles.min_price IS 'Minimum acceptable price for negotiation';
COMMENT ON COLUMN vehicles.plate IS 'Vehicle license plate / matrícula';
COMMENT ON COLUMN vehicles.internal_id IS 'Sequential internal ID for display (1, 2, 3...)';

-- =============================================
-- 5. UPDATE RLS POLICIES
-- =============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "vehicles_select_published" ON vehicles;

-- Recreate with proper online/offline handling
CREATE POLICY "vehicles_select_published"
  ON vehicles FOR SELECT
  USING (
    -- Public: only online and published
    (is_online = true AND status = 'published')
    -- Admin: can see everything
    OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
  );
