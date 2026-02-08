-- ================================================
-- TANK IBERICA — Migration 00022: Fix News RLS for admin access
-- The original 00006 migration only allows SELECT for published news.
-- Admin needs to see draft/archived articles for the news editor.
-- Also updates INSERT/UPDATE/DELETE to JWT-based pattern (consistent with 00010).
-- ================================================

-- Drop old policies
DROP POLICY IF EXISTS "news_select_published" ON news;
DROP POLICY IF EXISTS "news_admin_insert" ON news;
DROP POLICY IF EXISTS "news_admin_update" ON news;
DROP POLICY IF EXISTS "news_admin_delete" ON news;

-- SELECT: public sees published, admin sees all
CREATE POLICY "news_select_published"
  ON news FOR SELECT
  USING (
    status = 'published'
    OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
  );

-- INSERT: admin only (JWT-based)
CREATE POLICY "news_admin_insert"
  ON news FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- UPDATE: admin only (JWT-based)
CREATE POLICY "news_admin_update"
  ON news FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- DELETE: admin only (JWT-based)
CREATE POLICY "news_admin_delete"
  ON news FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );
