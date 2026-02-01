-- ================================================
-- TANK IBERICA — Migration 00004: Fix RLS recursion
-- Users policies queried users table causing infinite
-- recursion. Admin policies now use auth.users directly.
-- Catalog policies split into per-operation to avoid
-- FOR ALL triggering admin check on public SELECT.
-- ================================================

-- ================================================
-- Fix users table policies
-- ================================================

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "admins_select_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_update_all" ON users;

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "admins_select_all"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_update_all"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ================================================
-- Fix vehicles policies
-- ================================================

DROP POLICY IF EXISTS "vehicles_select_published" ON vehicles;
DROP POLICY IF EXISTS "vehicles_admin_all" ON vehicles;

CREATE POLICY "vehicles_select_published"
  ON vehicles FOR SELECT
  USING (status = 'published');

CREATE POLICY "vehicles_admin_insert"
  ON vehicles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "vehicles_admin_update"
  ON vehicles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "vehicles_admin_delete"
  ON vehicles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- ================================================
-- Fix vehicle_images policies
-- ================================================

DROP POLICY IF EXISTS "vehicle_images_select_published" ON vehicle_images;
DROP POLICY IF EXISTS "vehicle_images_admin_all" ON vehicle_images;

CREATE POLICY "vehicle_images_select_published"
  ON vehicle_images FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_images.vehicle_id AND vehicles.status = 'published')
  );

CREATE POLICY "vehicle_images_admin_insert"
  ON vehicle_images FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "vehicle_images_admin_update"
  ON vehicle_images FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "vehicle_images_admin_delete"
  ON vehicle_images FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- ================================================
-- Fix subcategories policies
-- ================================================

DROP POLICY IF EXISTS "subcategories_select_published" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_all" ON subcategories;

CREATE POLICY "subcategories_select_published"
  ON subcategories FOR SELECT
  USING (status = 'published');

CREATE POLICY "subcategories_admin_insert"
  ON subcategories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "subcategories_admin_update"
  ON subcategories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "subcategories_admin_delete"
  ON subcategories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- ================================================
-- Fix filter_definitions policies
-- ================================================

DROP POLICY IF EXISTS "filter_definitions_select_published" ON filter_definitions;
DROP POLICY IF EXISTS "filter_definitions_admin_all" ON filter_definitions;

CREATE POLICY "filter_definitions_select_published"
  ON filter_definitions FOR SELECT
  USING (status = 'published' AND is_hidden = false);

CREATE POLICY "filter_definitions_admin_insert"
  ON filter_definitions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "filter_definitions_admin_update"
  ON filter_definitions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "filter_definitions_admin_delete"
  ON filter_definitions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- ================================================
-- Fix config policies
-- ================================================

DROP POLICY IF EXISTS "config_select_public" ON config;
DROP POLICY IF EXISTS "config_admin_all" ON config;

CREATE POLICY "config_select_public"
  ON config FOR SELECT
  USING (true);

CREATE POLICY "config_admin_insert"
  ON config FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "config_admin_update"
  ON config FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "config_admin_delete"
  ON config FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );
