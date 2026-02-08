-- ================================================
-- TANK IBERICA — Migration 00014: Add missing vehicle fields
-- Adds financial fields, plate, and updates status enum
-- ================================================

-- Add new status values to the enum
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in a transaction easily
-- So we need to do it outside or use a workaround

-- Add 'rented' status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rented' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vehicle_status')) THEN
    ALTER TYPE vehicle_status ADD VALUE 'rented';
  END IF;
END $$;

-- Add 'maintenance' status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'maintenance' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vehicle_status')) THEN
    ALTER TYPE vehicle_status ADD VALUE 'maintenance';
  END IF;
END $$;

-- Add financial fields
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS min_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS plate TEXT,
ADD COLUMN IF NOT EXISTS internal_id SERIAL;

-- Add comments
COMMENT ON COLUMN vehicles.acquisition_cost IS 'Cost of acquisition for profit calculation';
COMMENT ON COLUMN vehicles.min_price IS 'Minimum acceptable price for negotiation';
COMMENT ON COLUMN vehicles.plate IS 'Vehicle license plate / matrícula';
COMMENT ON COLUMN vehicles.internal_id IS 'Sequential internal ID for display (1, 2, 3...)';

-- Add index for plate search
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
