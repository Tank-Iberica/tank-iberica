-- Session 35b: RLS standardization for newer tables
-- Ensures RLS is enabled and standardizes policies using is_admin() from migration 00055.
-- All operations are idempotent: DROP POLICY IF EXISTS before CREATE, and DO blocks
-- check table existence before operating.

-- =============================================================================
-- 1. ENABLE RLS ON TABLES THAT MAY BE MISSING IT
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'infra_clusters') THEN
    EXECUTE 'ALTER TABLE public.infra_clusters ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'infra_metrics') THEN
    EXECUTE 'ALTER TABLE public.infra_metrics ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'infra_alerts') THEN
    EXECUTE 'ALTER TABLE public.infra_alerts ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'social_posts') THEN
    EXECUTE 'ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_documents') THEN
    EXECUTE 'ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
    EXECUTE 'ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
    EXECUTE 'ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inspection_requests') THEN
    EXECUTE 'ALTER TABLE public.inspection_requests ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;


-- =============================================================================
-- 2. ADMIN-ONLY POLICIES FOR INFRASTRUCTURE TABLES (defense-in-depth)
--    These tables are accessed via service role in server routes, but we
--    standardize policies to use is_admin() for consistency.
-- =============================================================================

-- ---- infra_clusters: SELECT, INSERT, UPDATE, DELETE for admin only ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'infra_clusters') THEN
    -- Drop legacy policies from migration 00053
    EXECUTE 'DROP POLICY IF EXISTS "infra_clusters_admin_all" ON public.infra_clusters';
    -- Drop new policies if re-running
    EXECUTE 'DROP POLICY IF EXISTS "infra_clusters_admin_select" ON public.infra_clusters';
    EXECUTE 'DROP POLICY IF EXISTS "infra_clusters_admin_insert" ON public.infra_clusters';
    EXECUTE 'DROP POLICY IF EXISTS "infra_clusters_admin_update" ON public.infra_clusters';
    EXECUTE 'DROP POLICY IF EXISTS "infra_clusters_admin_delete" ON public.infra_clusters';

    EXECUTE 'CREATE POLICY "infra_clusters_admin_select" ON public.infra_clusters FOR SELECT USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "infra_clusters_admin_insert" ON public.infra_clusters FOR INSERT WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "infra_clusters_admin_update" ON public.infra_clusters FOR UPDATE USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "infra_clusters_admin_delete" ON public.infra_clusters FOR DELETE USING (public.is_admin())';
  END IF;
END $$;

-- ---- infra_metrics: SELECT, INSERT for admin only ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'infra_metrics') THEN
    -- Drop legacy policies from migration 00053
    EXECUTE 'DROP POLICY IF EXISTS "infra_metrics_admin_read" ON public.infra_metrics';
    EXECUTE 'DROP POLICY IF EXISTS "infra_metrics_insert_all" ON public.infra_metrics';
    -- Drop new policies if re-running
    EXECUTE 'DROP POLICY IF EXISTS "infra_metrics_admin_select" ON public.infra_metrics';
    EXECUTE 'DROP POLICY IF EXISTS "infra_metrics_admin_insert" ON public.infra_metrics';

    EXECUTE 'CREATE POLICY "infra_metrics_admin_select" ON public.infra_metrics FOR SELECT USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "infra_metrics_admin_insert" ON public.infra_metrics FOR INSERT WITH CHECK (public.is_admin())';
  END IF;
END $$;

-- ---- infra_alerts: SELECT, UPDATE for admin only ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'infra_alerts') THEN
    -- Drop legacy policy from migration 00053
    EXECUTE 'DROP POLICY IF EXISTS "infra_alerts_admin_all" ON public.infra_alerts';
    -- Drop new policies if re-running
    EXECUTE 'DROP POLICY IF EXISTS "infra_alerts_admin_select" ON public.infra_alerts';
    EXECUTE 'DROP POLICY IF EXISTS "infra_alerts_admin_update" ON public.infra_alerts';

    EXECUTE 'CREATE POLICY "infra_alerts_admin_select" ON public.infra_alerts FOR SELECT USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "infra_alerts_admin_update" ON public.infra_alerts FOR UPDATE USING (public.is_admin())';
  END IF;
END $$;


-- =============================================================================
-- 3. USER-LEVEL POLICIES
-- =============================================================================

-- ---- social_posts: owner (vehicle → dealer → user_id) or admin ----
-- Ownership chain: social_posts.vehicle_id → vehicles.dealer_id → dealers.user_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'social_posts') THEN
    -- Drop legacy policy from migration 00031
    EXECUTE 'DROP POLICY IF EXISTS "social_posts_admin_all" ON public.social_posts';
    -- Drop new policies if re-running
    EXECUTE 'DROP POLICY IF EXISTS "social_posts_owner_or_admin_select" ON public.social_posts';
    EXECUTE 'DROP POLICY IF EXISTS "social_posts_owner_or_admin_insert" ON public.social_posts';
    EXECUTE 'DROP POLICY IF EXISTS "social_posts_owner_or_admin_update" ON public.social_posts';
    EXECUTE 'DROP POLICY IF EXISTS "social_posts_owner_or_admin_delete" ON public.social_posts';

    EXECUTE '
      CREATE POLICY "social_posts_owner_or_admin_select" ON public.social_posts
        FOR SELECT USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = social_posts.vehicle_id
              AND d.user_id = auth.uid()
          )
        )';

    EXECUTE '
      CREATE POLICY "social_posts_owner_or_admin_insert" ON public.social_posts
        FOR INSERT WITH CHECK (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = social_posts.vehicle_id
              AND d.user_id = auth.uid()
          )
        )';

    EXECUTE '
      CREATE POLICY "social_posts_owner_or_admin_update" ON public.social_posts
        FOR UPDATE USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = social_posts.vehicle_id
              AND d.user_id = auth.uid()
          )
        )';

    EXECUTE '
      CREATE POLICY "social_posts_owner_or_admin_delete" ON public.social_posts
        FOR DELETE USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = social_posts.vehicle_id
              AND d.user_id = auth.uid()
          )
        )';
  END IF;
END $$;

-- ---- verification_documents: owner (vehicle → dealer → user_id) or admin ----
-- SELECT: owner or admin
-- INSERT/UPDATE: owner or admin
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_documents') THEN
    -- Drop legacy policies from migration 00031
    EXECUTE 'DROP POLICY IF EXISTS "verif_docs_public_read" ON public.verification_documents';
    EXECUTE 'DROP POLICY IF EXISTS "verif_docs_admin_all" ON public.verification_documents';
    -- Drop new policies if re-running
    EXECUTE 'DROP POLICY IF EXISTS "verif_docs_owner_or_admin_select" ON public.verification_documents';
    EXECUTE 'DROP POLICY IF EXISTS "verif_docs_owner_or_admin_insert" ON public.verification_documents';
    EXECUTE 'DROP POLICY IF EXISTS "verif_docs_owner_or_admin_update" ON public.verification_documents';

    EXECUTE '
      CREATE POLICY "verif_docs_owner_or_admin_select" ON public.verification_documents
        FOR SELECT USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = verification_documents.vehicle_id
              AND d.user_id = auth.uid()
          )
        )';

    EXECUTE '
      CREATE POLICY "verif_docs_owner_or_admin_insert" ON public.verification_documents
        FOR INSERT WITH CHECK (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = verification_documents.vehicle_id
              AND d.user_id = auth.uid()
          )
        )';

    EXECUTE '
      CREATE POLICY "verif_docs_owner_or_admin_update" ON public.verification_documents
        FOR UPDATE USING (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.dealers d ON d.id = v.dealer_id
            WHERE v.id = verification_documents.vehicle_id
              AND d.user_id = auth.uid()
          )
        )';
  END IF;
END $$;

-- ---- activity_logs: SELECT for admin only, INSERT for authenticated users ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
    -- Drop legacy policies from migrations 00031 and 00034
    EXECUTE 'DROP POLICY IF EXISTS "logs_admin_read" ON public.activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "logs_admin_insert" ON public.activity_logs';
    -- Drop new policies if re-running
    EXECUTE 'DROP POLICY IF EXISTS "activity_logs_admin_select" ON public.activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "activity_logs_authenticated_insert" ON public.activity_logs';

    EXECUTE 'CREATE POLICY "activity_logs_admin_select" ON public.activity_logs FOR SELECT USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "activity_logs_authenticated_insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- ---- notification_preferences: CRUD for own records (user_id = auth.uid()) ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
    EXECUTE 'DROP POLICY IF EXISTS "notif_prefs_own_select" ON public.notification_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "notif_prefs_own_insert" ON public.notification_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "notif_prefs_own_update" ON public.notification_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "notif_prefs_own_delete" ON public.notification_preferences';

    EXECUTE 'CREATE POLICY "notif_prefs_own_select" ON public.notification_preferences FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notif_prefs_own_insert" ON public.notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notif_prefs_own_update" ON public.notification_preferences FOR UPDATE USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notif_prefs_own_delete" ON public.notification_preferences FOR DELETE USING (user_id = auth.uid())';
  END IF;
END $$;

-- ---- inspection_requests: SELECT for owner or admin, INSERT for authenticated, UPDATE for admin ----
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inspection_requests') THEN
    EXECUTE 'DROP POLICY IF EXISTS "inspection_requests_owner_or_admin_select" ON public.inspection_requests';
    EXECUTE 'DROP POLICY IF EXISTS "inspection_requests_authenticated_insert" ON public.inspection_requests';
    EXECUTE 'DROP POLICY IF EXISTS "inspection_requests_admin_update" ON public.inspection_requests';

    EXECUTE '
      CREATE POLICY "inspection_requests_owner_or_admin_select" ON public.inspection_requests
        FOR SELECT USING (
          user_id = auth.uid() OR public.is_admin()
        )';

    EXECUTE '
      CREATE POLICY "inspection_requests_authenticated_insert" ON public.inspection_requests
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';

    EXECUTE '
      CREATE POLICY "inspection_requests_admin_update" ON public.inspection_requests
        FOR UPDATE USING (public.is_admin())';
  END IF;
END $$;
