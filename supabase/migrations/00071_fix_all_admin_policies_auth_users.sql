-- Migration 00071: Fix ALL admin RLS policies from auth.users to is_admin()
-- Root cause: authenticated/anon roles have NO SELECT grant on auth.users
-- Every policy using "FROM auth.users au WHERE au.raw_user_meta_data ->> 'role' = 'admin'"
-- fails with "permission denied for table users" (auth.users table)
-- Fix: replace with is_admin() SECURITY DEFINER function that queries public.users as postgres

-- Step 1: Fix all pure admin policies dynamically
DO $$
DECLARE
  r RECORD;
  affected INT := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
      qual::text LIKE '%auth.users au%'
      OR with_check::text LIKE '%auth.users au%'
    )
    AND policyname NOT LIKE '%own%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);

    IF r.cmd = 'INSERT' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_admin())',
        r.policyname, r.tablename
      );
    ELSIF r.cmd = 'SELECT' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_admin())',
        r.policyname, r.tablename
      );
    ELSIF r.cmd = 'UPDATE' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_admin())',
        r.policyname, r.tablename
      );
    ELSIF r.cmd = 'DELETE' THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_admin())',
        r.policyname, r.tablename
      );
    ELSE -- ALL
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_admin())',
        r.policyname, r.tablename
      );
    END IF;

    affected := affected + 1;
  END LOOP;

  RAISE NOTICE 'Fixed % admin policies', affected;
END $$;

-- Step 2: Fix newsletter_subscriptions mixed policies (own-row + admin check)
-- Replace auth.users email lookup with auth.jwt() ->> 'email'
DROP POLICY IF EXISTS "newsletter_subscriptions_own_select" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_subscriptions_own_select" ON public.newsletter_subscriptions
  FOR SELECT USING (
    email = (auth.jwt() ->> 'email')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "newsletter_subscriptions_own_update" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_subscriptions_own_update" ON public.newsletter_subscriptions
  FOR UPDATE USING (
    email = (auth.jwt() ->> 'email')
    OR public.is_admin()
  );

-- Step 3: Fix demands policies
-- demands_own_select used auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
-- which requires raw_user_meta_data.role to be set in auth.users -- may not be configured
DROP POLICY IF EXISTS "demands_own_select" ON public.demands;
CREATE POLICY "demands_own_select" ON public.demands
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR public.is_admin()
  );

-- demands_admin_delete and demands_admin_update also used jwt user_metadata
DROP POLICY IF EXISTS "demands_admin_delete" ON public.demands;
CREATE POLICY "demands_admin_delete" ON public.demands
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "demands_admin_update" ON public.demands;
CREATE POLICY "demands_admin_update" ON public.demands
  FOR UPDATE USING (public.is_admin());
