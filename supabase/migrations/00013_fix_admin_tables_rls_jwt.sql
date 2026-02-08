-- ================================================
-- TANK IBERICA — Migration 00013: Fix Admin Tables RLS to use JWT
-- Same fix as migration 00010, but for admin-only tables
-- ================================================

-- ================================================
-- BALANCE
-- ================================================
DROP POLICY IF EXISTS "balance_admin_select" ON balance;
DROP POLICY IF EXISTS "balance_admin_insert" ON balance;
DROP POLICY IF EXISTS "balance_admin_update" ON balance;
DROP POLICY IF EXISTS "balance_admin_delete" ON balance;

CREATE POLICY "balance_admin_select"
  ON balance FOR SELECT
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "balance_admin_insert"
  ON balance FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "balance_admin_update"
  ON balance FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "balance_admin_delete"
  ON balance FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- INTERMEDIACION
-- ================================================
DROP POLICY IF EXISTS "intermediacion_admin_select" ON intermediacion;
DROP POLICY IF EXISTS "intermediacion_admin_insert" ON intermediacion;
DROP POLICY IF EXISTS "intermediacion_admin_update" ON intermediacion;
DROP POLICY IF EXISTS "intermediacion_admin_delete" ON intermediacion;

CREATE POLICY "intermediacion_admin_select"
  ON intermediacion FOR SELECT
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "intermediacion_admin_insert"
  ON intermediacion FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "intermediacion_admin_update"
  ON intermediacion FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "intermediacion_admin_delete"
  ON intermediacion FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- HISTORICO
-- ================================================
DROP POLICY IF EXISTS "historico_admin_select" ON historico;
DROP POLICY IF EXISTS "historico_admin_insert" ON historico;
DROP POLICY IF EXISTS "historico_admin_update" ON historico;
DROP POLICY IF EXISTS "historico_admin_delete" ON historico;

CREATE POLICY "historico_admin_select"
  ON historico FOR SELECT
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "historico_admin_insert"
  ON historico FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "historico_admin_update"
  ON historico FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "historico_admin_delete"
  ON historico FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- VIEWED_VEHICLES
-- ================================================
DROP POLICY IF EXISTS "viewed_vehicles_admin_select" ON viewed_vehicles;
DROP POLICY IF EXISTS "viewed_vehicles_admin_insert" ON viewed_vehicles;
DROP POLICY IF EXISTS "viewed_vehicles_admin_update" ON viewed_vehicles;
DROP POLICY IF EXISTS "viewed_vehicles_admin_delete" ON viewed_vehicles;

CREATE POLICY "viewed_vehicles_admin_select"
  ON viewed_vehicles FOR SELECT
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "viewed_vehicles_admin_insert"
  ON viewed_vehicles FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "viewed_vehicles_admin_update"
  ON viewed_vehicles FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "viewed_vehicles_admin_delete"
  ON viewed_vehicles FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- ================================================
-- HISTORY_LOG
-- ================================================
DROP POLICY IF EXISTS "history_log_admin_select" ON history_log;
DROP POLICY IF EXISTS "history_log_admin_insert" ON history_log;

CREATE POLICY "history_log_admin_select"
  ON history_log FOR SELECT
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "history_log_admin_insert"
  ON history_log FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );
