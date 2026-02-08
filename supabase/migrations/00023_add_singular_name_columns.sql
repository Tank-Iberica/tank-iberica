-- ================================================
-- TANK IBERICA — Migration 00023: Add singular name columns
-- Subcategories and types need both plural (filters) and singular (product names)
-- ================================================

-- Subcategories: singular names
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subcategories' AND column_name = 'name_singular_es'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN name_singular_es TEXT;
    COMMENT ON COLUMN subcategories.name_singular_es IS 'Singular name in Spanish (e.g., Cisterna)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subcategories' AND column_name = 'name_singular_en'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN name_singular_en TEXT;
    COMMENT ON COLUMN subcategories.name_singular_en IS 'Singular name in English (e.g., Tanker)';
  END IF;
END $$;

-- Types: singular names
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'types' AND column_name = 'name_singular_es'
  ) THEN
    ALTER TABLE types ADD COLUMN name_singular_es TEXT;
    COMMENT ON COLUMN types.name_singular_es IS 'Singular name in Spanish (e.g., Frigorífico)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'types' AND column_name = 'name_singular_en'
  ) THEN
    ALTER TABLE types ADD COLUMN name_singular_en TEXT;
    COMMENT ON COLUMN types.name_singular_en IS 'Singular name in English (e.g., Refrigerated)';
  END IF;
END $$;
