-- ================================================
-- TANK IBERICA — Migration 00019: Subcategories and Junction
-- Adds new subcategories table (parent level above types)
-- and type_subcategories junction table for many-to-many
-- ================================================

-- ================================================
-- 1. CREATE subcategories TABLE
-- (Structure mirrors types table)
-- ================================================

CREATE TABLE subcategories (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_es               TEXT NOT NULL,
  name_en               TEXT,
  slug                  TEXT UNIQUE NOT NULL,
  applicable_categories TEXT[] DEFAULT '{}',
  applicable_filters    UUID[] DEFAULT '{}',
  stock_count           INT DEFAULT 0,
  status                vehicle_status DEFAULT 'published',
  sort_order            INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Indexes for subcategories
CREATE INDEX idx_subcategories_slug ON subcategories(slug);
CREATE INDEX idx_subcategories_sort ON subcategories(sort_order);
CREATE INDEX idx_subcategories_status ON subcategories(status);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_subcategories
  BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE subcategories IS 'Vehicle subcategories - parent level above types (e.g., Semirremolques, Cabezas Tractoras)';
COMMENT ON COLUMN subcategories.applicable_categories IS 'Which vehicle categories this subcategory applies to (alquiler, venta, terceros)';
COMMENT ON COLUMN subcategories.applicable_filters IS 'Array of filter_definition IDs that apply at subcategory level';

-- ================================================
-- 2. CREATE type_subcategories JUNCTION TABLE
-- (Many-to-many: types can belong to multiple subcategories)
-- ================================================

CREATE TABLE type_subcategories (
  type_id        UUID NOT NULL REFERENCES types(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (type_id, subcategory_id)
);

-- Indexes for efficient lookups both ways
CREATE INDEX idx_type_subcategories_type ON type_subcategories(type_id);
CREATE INDEX idx_type_subcategories_subcategory ON type_subcategories(subcategory_id);

-- Comment
COMMENT ON TABLE type_subcategories IS 'Junction table linking types to subcategories (many-to-many)';

-- ================================================
-- 3. RLS POLICIES FOR subcategories
-- ================================================

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Public: can read published subcategories
CREATE POLICY "subcategories_select_published"
  ON subcategories FOR SELECT
  USING (status = 'published');

-- Admin: can insert subcategories
CREATE POLICY "subcategories_admin_insert"
  ON subcategories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- Admin: can update subcategories
CREATE POLICY "subcategories_admin_update"
  ON subcategories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- Admin: can delete subcategories
CREATE POLICY "subcategories_admin_delete"
  ON subcategories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- Admin: can select all subcategories (including draft)
CREATE POLICY "subcategories_admin_select_all"
  ON subcategories FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- ================================================
-- 4. RLS POLICIES FOR type_subcategories
-- ================================================

ALTER TABLE type_subcategories ENABLE ROW LEVEL SECURITY;

-- Public: can read all junction records (needed for frontend filtering)
CREATE POLICY "type_subcategories_select_public"
  ON type_subcategories FOR SELECT
  USING (true);

-- Admin: can insert junction records
CREATE POLICY "type_subcategories_admin_insert"
  ON type_subcategories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- Admin: can delete junction records
CREATE POLICY "type_subcategories_admin_delete"
  ON type_subcategories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );
