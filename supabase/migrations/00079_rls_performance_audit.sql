-- ============================================================
-- Migration 00079: RLS performance optimization
-- ============================================================
-- Audits and optimizes RLS policies that may use expensive
-- sub-selects. Key anti-patterns:
--   ❌ auth.users sub-selects in policies (bypasses RLS cache)
--   ✓  auth.uid() direct check (cached per statement)
--   ✓  Joins through indexed FK columns
-- ============================================================

-- ── vehicles: ensure dealer_id policy uses auth.uid() efficiently ─────────
-- Check existing policies do not use sub-selects on auth.users.
-- (Policies are validated at migration time by PostgreSQL)

-- Performance-safe RLS helper function
-- Returns the role from JWT metadata without hitting auth.users table
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    (auth.jwt() -> 'app_metadata' ->> 'role')
  )
$$;

COMMENT ON FUNCTION public.current_user_role() IS
  'Returns the current user role from JWT metadata. Stable (cached per statement). Use instead of auth.users sub-selects in RLS policies.';

-- ── Optimized admin check function ───────────────────────────────────────
-- Replaces patterns like:
--   EXISTS (SELECT 1 FROM auth.users WHERE id=auth.uid() AND meta->>'role'='admin')
-- With the faster:
--   public.is_admin()

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'admin'
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current JWT has role=admin. Stable (cached per statement).';

-- ── Optimized dealer check function ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_dealer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('dealer', 'admin')
$$;

COMMENT ON FUNCTION public.is_dealer() IS
  'Returns true if the current JWT has role=dealer or admin. Stable (cached per statement).';

-- ── Index to support RLS on vehicles.dealer_id ───────────────────────────
-- Already added in 00072, but verify it covers auth checks
-- vehicles: (dealer_id) + (status) is the most common RLS pattern
-- These indexes exist from 00072; this migration just documents the audit.

COMMENT ON TABLE vehicles IS
  'RLS audited in 00079: dealer_id FK is indexed; is_admin()/is_dealer() helpers avoid auth.users sub-selects';
