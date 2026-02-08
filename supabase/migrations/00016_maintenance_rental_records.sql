-- ================================================
-- TANK IBERICA — Migration 00016: Maintenance and Rental Records
-- Adds JSONB columns for tracking maintenance and rental income
-- ================================================

-- =============================================
-- 1. ADD JSONB COLUMNS FOR RECORDS
-- =============================================

-- Maintenance records (array of objects)
-- Structure: [{ id, date, reason, cost, invoice_url }]
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS maintenance_records JSONB DEFAULT '[]'::jsonb;

-- Rental records (array of objects)
-- Structure: [{ id, from_date, to_date, amount, notes }]
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS rental_records JSONB DEFAULT '[]'::jsonb;

-- Multiple categories support (array of strings)
-- Values: ['alquiler', 'venta', 'terceros']
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT ARRAY[]::TEXT[];

-- =============================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN vehicles.maintenance_records IS 'JSONB array of maintenance entries: [{id, date, reason, cost, invoice_url}]';
COMMENT ON COLUMN vehicles.rental_records IS 'JSONB array of rental income entries: [{id, from_date, to_date, amount, notes}]';
COMMENT ON COLUMN vehicles.categories IS 'Array of categories (alquiler, venta, terceros) - vehicle can belong to multiple';

-- =============================================
-- 3. CREATE FUNCTION TO CALCULATE TOTAL COSTS
-- =============================================

-- Function to calculate total maintenance cost
CREATE OR REPLACE FUNCTION calculate_maintenance_total(records JSONB)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC := 0;
  record JSONB;
BEGIN
  IF records IS NULL OR jsonb_array_length(records) = 0 THEN
    RETURN 0;
  END IF;

  FOR record IN SELECT * FROM jsonb_array_elements(records)
  LOOP
    total := total + COALESCE((record->>'cost')::NUMERIC, 0);
  END LOOP;

  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate total rental income
CREATE OR REPLACE FUNCTION calculate_rental_total(records JSONB)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC := 0;
  record JSONB;
BEGIN
  IF records IS NULL OR jsonb_array_length(records) = 0 THEN
    RETURN 0;
  END IF;

  FOR record IN SELECT * FROM jsonb_array_elements(records)
  LOOP
    total := total + COALESCE((record->>'amount')::NUMERIC, 0);
  END LOOP;

  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_maintenance_total IS 'Calculates total maintenance cost from JSONB records array';
COMMENT ON FUNCTION calculate_rental_total IS 'Calculates total rental income from JSONB records array';
