-- ================================================
-- TANK IBERICA — Migration 00022: Add location_en column
-- English translation of the location field
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'location_en'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN location_en TEXT;
    COMMENT ON COLUMN vehicles.location_en IS 'Location in English (e.g., Madrid, Spain)';
  END IF;
END $$;
