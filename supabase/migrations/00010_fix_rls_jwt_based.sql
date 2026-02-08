-- ================================================
-- TANK IBERICA — Migration 00010: Fix RLS to use JWT claims
-- Previous policies queried auth.users table which didn't work
-- correctly with the Supabase client. Now using auth.jwt() directly.
-- ================================================

-- ================================================
-- SUBCATEGORIES
-- ================================================
DROP POLICY IF EXISTS "subcategories_admin_select" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_insert" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_update" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_delete" ON subcategories;

CREATE POLICY "subcategories_admin_select"
  ON subcategories FOR SELECT
  USING (
    status = 'published'
    OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
  );

CREATE POLICY "subcategories_admin_insert"
  ON subcategories FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "subcategories_admin_update"
  ON subcategories FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "subcategories_admin_delete"
  ON subcategories FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- FILTER_DEFINITIONS
-- ================================================
DROP POLICY IF EXISTS "filter_definitions_select_published" ON filter_definitions;
DROP POLICY IF EXISTS "filter_definitions_admin_select" ON filter_definitions;
DROP POLICY IF EXISTS "filter_definitions_admin_insert" ON filter_definitions;
DROP POLICY IF EXISTS "filter_definitions_admin_update" ON filter_definitions;
DROP POLICY IF EXISTS "filter_definitions_admin_delete" ON filter_definitions;

CREATE POLICY "filter_definitions_admin_select"
  ON filter_definitions FOR SELECT
  USING (
    (status = 'published' AND is_hidden = false)
    OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
  );

CREATE POLICY "filter_definitions_admin_insert"
  ON filter_definitions FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "filter_definitions_admin_update"
  ON filter_definitions FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "filter_definitions_admin_delete"
  ON filter_definitions FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- VEHICLES
-- ================================================
DROP POLICY IF EXISTS "vehicles_admin_insert" ON vehicles;
DROP POLICY IF EXISTS "vehicles_admin_update" ON vehicles;
DROP POLICY IF EXISTS "vehicles_admin_delete" ON vehicles;

CREATE POLICY "vehicles_admin_insert"
  ON vehicles FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "vehicles_admin_update"
  ON vehicles FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "vehicles_admin_delete"
  ON vehicles FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- VEHICLE_IMAGES
-- ================================================
DROP POLICY IF EXISTS "vehicle_images_admin_insert" ON vehicle_images;
DROP POLICY IF EXISTS "vehicle_images_admin_update" ON vehicle_images;
DROP POLICY IF EXISTS "vehicle_images_admin_delete" ON vehicle_images;

CREATE POLICY "vehicle_images_admin_insert"
  ON vehicle_images FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "vehicle_images_admin_update"
  ON vehicle_images FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "vehicle_images_admin_delete"
  ON vehicle_images FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- CONFIG
-- ================================================
DROP POLICY IF EXISTS "config_admin_insert" ON config;
DROP POLICY IF EXISTS "config_admin_update" ON config;
DROP POLICY IF EXISTS "config_admin_delete" ON config;

CREATE POLICY "config_admin_insert"
  ON config FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "config_admin_update"
  ON config FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "config_admin_delete"
  ON config FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );
