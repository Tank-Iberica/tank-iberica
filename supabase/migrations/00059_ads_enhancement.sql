-- Migration 00059: Ads Enhancement
-- Adds targeting segments, floor pricing, user ad profiles, and revenue logging
-- for the advanced programmatic ads system (Prebid + contextual targeting).

-- ============================================================
-- 1. New columns on existing tables
-- ============================================================

ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ad_events ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'direct';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_segments TEXT[] DEFAULT '{}';

-- ============================================================
-- 2. New table: ad_floor_prices
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_floor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position VARCHAR NOT NULL,
  floor_cpm_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(position, vertical)
);

-- ============================================================
-- 3. New table: user_ad_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS user_ad_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  segments TEXT[] DEFAULT '{}',
  categories_viewed TEXT[] DEFAULT '{}',
  brands_searched TEXT[] DEFAULT '{}',
  price_range_min INT,
  price_range_max INT,
  geo_country VARCHAR(2),
  geo_region VARCHAR,
  page_views INT DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id)
);

-- ============================================================
-- 4. New table: ad_revenue_log
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_revenue_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  position VARCHAR NOT NULL,
  source VARCHAR NOT NULL,
  bidder VARCHAR,
  cpm_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  page_path TEXT,
  user_country VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ad_floor_prices_position ON ad_floor_prices(position, vertical);
CREATE INDEX IF NOT EXISTS idx_user_ad_profiles_session ON user_ad_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_user_ad_profiles_user ON user_ad_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ad_profiles_segments ON user_ad_profiles USING GIN(segments);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_log_position ON ad_revenue_log(position, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_log_source ON ad_revenue_log(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_log_created ON ad_revenue_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_events_source ON ad_events(source);

-- ============================================================
-- 6. RLS Policies
-- ============================================================

-- 6a. ad_floor_prices
ALTER TABLE ad_floor_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_floor_prices_public_select"
  ON ad_floor_prices FOR SELECT
  USING (true);

CREATE POLICY "ad_floor_prices_admin_all"
  ON ad_floor_prices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
        AND au.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6b. user_ad_profiles
ALTER TABLE user_ad_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ad_profiles_public_insert"
  ON user_ad_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "user_ad_profiles_public_update"
  ON user_ad_profiles FOR UPDATE
  USING (true);

CREATE POLICY "user_ad_profiles_select"
  ON user_ad_profiles FOR SELECT
  USING (user_id = auth.uid() OR session_id IS NOT NULL);

CREATE POLICY "user_ad_profiles_admin_all"
  ON user_ad_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
        AND au.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6c. ad_revenue_log
ALTER TABLE ad_revenue_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_revenue_log_public_insert"
  ON ad_revenue_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ad_revenue_log_admin_select"
  ON ad_revenue_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
        AND au.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- 7. Triggers for updated_at
-- Uses the existing update_updated_at() function from migration 00002.
-- ============================================================

CREATE TRIGGER set_updated_at_ad_floor_prices
  BEFORE UPDATE ON ad_floor_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_user_ad_profiles
  BEFORE UPDATE ON user_ad_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
