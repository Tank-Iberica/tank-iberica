-- ================================================
-- TANK IBERICA — Migration 00018: Rename subcategories → types
-- Frees "subcategories" namespace for new feature
-- ================================================

-- =============================================
-- 1. RENAME TABLE: subcategories → types
-- =============================================

ALTER TABLE subcategories RENAME TO types;

-- =============================================
-- 2. RENAME COLUMNS: subcategory_id → type_id
-- =============================================

-- In vehicles table
ALTER TABLE vehicles RENAME COLUMN subcategory_id TO type_id;

-- In filter_definitions table
ALTER TABLE filter_definitions RENAME COLUMN subcategory_id TO type_id;

-- In balance table
ALTER TABLE balance RENAME COLUMN subcategory_id TO type_id;

-- In historico table
ALTER TABLE historico RENAME COLUMN subcategory_id TO type_id;

-- In intermediacion table
ALTER TABLE intermediacion RENAME COLUMN subcategory_id TO type_id;

-- =============================================
-- 3. RENAME INDEXES
-- =============================================

ALTER INDEX idx_subcategories_slug RENAME TO idx_types_slug;
ALTER INDEX idx_subcategories_sort RENAME TO idx_types_sort;
ALTER INDEX idx_vehicles_subcategory RENAME TO idx_vehicles_type;
ALTER INDEX idx_filter_definitions_subcategory RENAME TO idx_filter_definitions_type;
ALTER INDEX idx_balance_subcategory RENAME TO idx_balance_type;
ALTER INDEX idx_historico_subcategory RENAME TO idx_historico_type;
ALTER INDEX idx_intermediacion_subcategory RENAME TO idx_intermediacion_type;

-- =============================================
-- 4. RENAME TRIGGER
-- =============================================

ALTER TRIGGER set_updated_at_subcategories ON types RENAME TO set_updated_at_types;

-- =============================================
-- 5. RENAME RLS POLICIES
-- =============================================

-- Drop old policies on types (formerly subcategories)
DROP POLICY IF EXISTS "subcategories_select_published" ON types;
DROP POLICY IF EXISTS "subcategories_admin_all" ON types;

-- Recreate with new names
CREATE POLICY "types_select_published"
  ON types FOR SELECT
  USING (status = 'published');

CREATE POLICY "types_admin_all"
  ON types FOR ALL
  USING (
    (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- =============================================
-- 6. UPDATE COMMENTS
-- =============================================

COMMENT ON TABLE types IS 'Vehicle types (formerly subcategories) - e.g., Cisternas, Frigoríficos, Portacoches';
COMMENT ON COLUMN vehicles.type_id IS 'FK to types table';
COMMENT ON COLUMN filter_definitions.type_id IS 'FK to types table - filters applicable to this type';
COMMENT ON COLUMN balance.type_id IS 'FK to types table for profit analysis by type';
