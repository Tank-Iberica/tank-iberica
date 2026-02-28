-- Migration 00070: Fix is_admin() search_path and unqualified users references
-- Root cause: is_admin() had no fixed search_path (config=null).
-- When PostgREST runs with empty search_path, FROM users (unqualified) can
-- fail with "permission denied for table users".
-- Also fixes feature_flags and reports RLS policies with unqualified users refs.

-- 1. Recreate is_admin() with explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Fix feature_flags policy
DROP POLICY IF EXISTS "feature_flags_admin_modify" ON public.feature_flags;
CREATE POLICY "feature_flags_admin_modify" ON public.feature_flags
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'::user_role
  ));

-- 3. Fix reports policies
DROP POLICY IF EXISTS "Admins can read reports" ON public.reports;
CREATE POLICY "Admins can read reports" ON public.reports
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
      AND (public.users.user_type)::text = 'admin'::text
  ));

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
      AND (public.users.user_type)::text = 'admin'::text
  ));
