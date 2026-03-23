-- ============================================================
-- 00198: saved_searches + feature_unlocks tables
-- ============================================================
-- saved_searches: DB-backed saved filter presets per user
-- feature_unlocks: one-time credit unlock per feature per user

-- ============================================================
-- 1. saved_searches
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  filters        jsonb       NOT NULL DEFAULT '{}',
  search_query   text,
  location_level text,
  is_favorite    boolean     NOT NULL DEFAULT false,
  last_used_at   timestamptz,
  use_count      integer     NOT NULL DEFAULT 0,
  vertical       text        NOT NULL DEFAULT 'tracciona',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches_select_own" ON public.saved_searches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_searches_insert_own" ON public.saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_searches_update_own" ON public.saved_searches
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_searches_delete_own" ON public.saved_searches
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_saved_searches_user_id
  ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_user_sort
  ON public.saved_searches(user_id, is_favorite DESC, last_used_at DESC NULLS LAST);

-- ============================================================
-- 2. feature_unlocks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_unlocks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature       text        NOT NULL,
  credits_spent integer     NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature)
);

ALTER TABLE public.feature_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_unlocks_select_own" ON public.feature_unlocks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feature_unlocks_insert_own" ON public.feature_unlocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_feature_unlocks_user_feature
  ON public.feature_unlocks(user_id, feature);
