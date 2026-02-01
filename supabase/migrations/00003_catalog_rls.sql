-- ================================================
-- TANK IBERICA — Migration 00003: catalog RLS
-- Public SELECT on published vehicles, images,
-- subcategories, filters, config.
-- Admin full access.
-- ================================================

-- ================================================
-- vehicles
-- ================================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Public: only published vehicles
CREATE POLICY "vehicles_select_published"
  ON vehicles FOR SELECT
  USING (status = 'published');

-- Admin: full access
CREATE POLICY "vehicles_admin_all"
  ON vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================
-- vehicle_images
-- ================================================

ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

-- Public: images of published vehicles
CREATE POLICY "vehicle_images_select_published"
  ON vehicle_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_images.vehicle_id AND vehicles.status = 'published'
    )
  );

-- Admin: full access
CREATE POLICY "vehicle_images_admin_all"
  ON vehicle_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================
-- subcategories
-- ================================================

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Public: all published subcategories
CREATE POLICY "subcategories_select_published"
  ON subcategories FOR SELECT
  USING (status = 'published');

-- Admin: full access
CREATE POLICY "subcategories_admin_all"
  ON subcategories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================
-- filter_definitions
-- ================================================

ALTER TABLE filter_definitions ENABLE ROW LEVEL SECURITY;

-- Public: all published, non-hidden filters
CREATE POLICY "filter_definitions_select_published"
  ON filter_definitions FOR SELECT
  USING (status = 'published' AND is_hidden = false);

-- Admin: full access
CREATE POLICY "filter_definitions_admin_all"
  ON filter_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================
-- config
-- ================================================

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Public: read all config
CREATE POLICY "config_select_public"
  ON config FOR SELECT
  USING (true);

-- Admin: update config
CREATE POLICY "config_admin_all"
  ON config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
