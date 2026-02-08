-- ================================================
-- TANK IBERICA — Migration 00020: Fix Subcategories RLS
-- Fixes RLS policies to use public.users instead of auth.users
-- ================================================

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "subcategories_admin_insert" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_update" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_delete" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_select_all" ON subcategories;

DROP POLICY IF EXISTS "type_subcategories_admin_insert" ON type_subcategories;
DROP POLICY IF EXISTS "type_subcategories_admin_delete" ON type_subcategories;

-- ================================================
-- Recreate subcategories policies using public.users
-- ================================================

-- Admin: can insert subcategories
CREATE POLICY "subcategories_admin_insert"
  ON subcategories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin: can update subcategories
CREATE POLICY "subcategories_admin_update"
  ON subcategories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin: can delete subcategories
CREATE POLICY "subcategories_admin_delete"
  ON subcategories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin: can select all subcategories (including draft)
CREATE POLICY "subcategories_admin_select_all"
  ON subcategories FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================
-- Recreate type_subcategories policies using public.users
-- ================================================

-- Admin: can insert junction records
CREATE POLICY "type_subcategories_admin_insert"
  ON type_subcategories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin: can delete junction records
CREATE POLICY "type_subcategories_admin_delete"
  ON type_subcategories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
