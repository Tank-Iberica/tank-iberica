-- ============================================================
-- SESSION 32 — Data Commercialization (Idealista-style)
-- Materialized views, analytics events, data subscriptions,
-- valuation reports, API usage tracking
-- ============================================================

-- ============================================================
-- A.1 — analytics_events (internal event tracking)
-- ============================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  event_type VARCHAR NOT NULL,          -- vehicle_view, search_performed, lead_sent, favorite_added, price_change, vehicle_sold
  entity_type VARCHAR,                  -- vehicle, search, lead, favorite
  entity_id UUID,
  metadata JSONB DEFAULT '{}',          -- flexible payload per event type
  session_id VARCHAR,                   -- anonymous session identifier
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_hash VARCHAR,                      -- hashed IP for anonymised dedup
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_vertical ON analytics_events(vertical, event_type);
CREATE INDEX idx_analytics_events_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read analytics events
CREATE POLICY "analytics_admin_read" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role or anon can insert (for server-side tracking)
CREATE POLICY "analytics_insert_all" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- A.2 — Materialized View: market_data
-- Aggregated market statistics per category/brand/province/month
-- HAVING >= 5 ensures anonymisation (RGPD compliant)
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS market_data AS
SELECT
  COALESCE(a.vertical, 'tracciona') AS vertical,
  COALESCE(a.slug, v.listing_type) AS action,
  s.slug AS subcategory,
  v.brand,
  v.location_province,
  v.location_country,
  DATE_TRUNC('month', v.created_at) AS month,
  COUNT(*) AS listings,
  ROUND(AVG(v.price)::NUMERIC, 2) AS avg_price,
  ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY v.price))::NUMERIC, 2) AS median_price,
  ROUND(MIN(v.price)::NUMERIC, 2) AS min_price,
  ROUND(MAX(v.price)::NUMERIC, 2) AS max_price,
  ROUND(AVG(
    CASE WHEN v.sold_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (v.sold_at - v.created_at)) / 86400.0
      ELSE NULL
    END
  )::NUMERIC, 1) AS avg_days_to_sell,
  COUNT(*) FILTER (WHERE v.status = 'sold') AS sold_count
FROM vehicles v
LEFT JOIN actions a ON v.action_id = a.id
LEFT JOIN subcategories s ON v.subcategory_id = s.id
WHERE v.status IN ('published', 'sold', 'archived')
  AND v.price > 0
GROUP BY
  COALESCE(a.vertical, 'tracciona'),
  COALESCE(a.slug, v.listing_type),
  s.slug, v.brand, v.location_province, v.location_country,
  DATE_TRUNC('month', v.created_at)
HAVING COUNT(*) >= 5;

CREATE UNIQUE INDEX idx_market_data_pk ON market_data (
  vertical, action, subcategory, brand, location_province, location_country, month
);

-- ============================================================
-- A.3 — Materialized View: demand_data
-- What people search for (from search_alerts)
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS demand_data AS
SELECT
  vertical,
  (filters->>'category')::TEXT AS category,
  (filters->>'subcategory')::TEXT AS subcategory,
  (filters->>'brand')::TEXT AS brand,
  (filters->>'province')::TEXT AS province,
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS alert_count
FROM search_alerts
WHERE active = true
GROUP BY vertical, category, subcategory, brand, province, month;

CREATE UNIQUE INDEX idx_demand_data_pk ON demand_data (
  vertical, category, subcategory, brand, province, month
);

-- ============================================================
-- A.4 — Materialized View: price_history
-- Weekly price trends for charts
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS price_history AS
SELECT
  COALESCE(a.vertical, 'tracciona') AS vertical,
  s.slug AS subcategory,
  v.brand,
  DATE_TRUNC('week', v.created_at) AS week,
  ROUND(AVG(v.price)::NUMERIC, 2) AS avg_price,
  ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY v.price))::NUMERIC, 2) AS median_price,
  COUNT(*) AS sample_size
FROM vehicles v
LEFT JOIN actions a ON v.action_id = a.id
LEFT JOIN subcategories s ON v.subcategory_id = s.id
WHERE v.price > 0
  AND v.status IN ('published', 'sold')
GROUP BY
  COALESCE(a.vertical, 'tracciona'),
  s.slug, v.brand,
  DATE_TRUNC('week', v.created_at)
HAVING COUNT(*) >= 3;

CREATE UNIQUE INDEX idx_price_history_pk ON price_history (
  vertical, subcategory, brand, week
);

-- ============================================================
-- A.5 — Function to refresh all materialized views
-- Called by cron (weekly) or manually by admin
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_market_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY market_data;
  REFRESH MATERIALIZED VIEW CONCURRENTLY demand_data;
  REFRESH MATERIALIZED VIEW CONCURRENTLY price_history;
END;
$$;

-- ============================================================
-- B.1 — data_subscriptions (for B2B data clients)
-- ============================================================
CREATE TABLE data_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  plan VARCHAR NOT NULL DEFAULT 'basic',   -- 'basic', 'premium', 'enterprise'
  stripe_subscription_id TEXT,
  api_key VARCHAR UNIQUE,
  rate_limit_daily INT DEFAULT 100,        -- requests per day
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_subs_api_key ON data_subscriptions(api_key) WHERE active = true;
CREATE INDEX idx_data_subs_active ON data_subscriptions(active);

CREATE TRIGGER set_updated_at_data_subscriptions
  BEFORE UPDATE ON data_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE data_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_subs_admin_all" ON data_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- B.2 — api_usage (track API calls for billing)
-- ============================================================
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key VARCHAR NOT NULL,
  endpoint VARCHAR NOT NULL,
  params JSONB DEFAULT '{}',
  response_time_ms INT,
  status_code INT DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_key ON api_usage(api_key, created_at);
CREATE INDEX idx_api_usage_created ON api_usage(created_at);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_admin_read" ON api_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "api_usage_insert_all" ON api_usage
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- B.3 — valuation_reports (individual paid valuations)
-- ============================================================
CREATE TABLE valuation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  brand TEXT NOT NULL,
  model TEXT,
  year INT,
  km INT,
  province TEXT,
  subcategory TEXT,
  -- Results
  estimated_min NUMERIC(12, 2),
  estimated_median NUMERIC(12, 2),
  estimated_max NUMERIC(12, 2),
  market_trend VARCHAR,                    -- 'rising', 'falling', 'stable'
  trend_pct NUMERIC(5, 2),
  avg_days_to_sell NUMERIC(6, 1),
  sample_size INT,
  confidence VARCHAR DEFAULT 'low',        -- 'low', 'medium', 'high'
  -- Payment
  report_type VARCHAR DEFAULT 'basic',     -- 'basic' (free), 'detailed' (paid)
  stripe_payment_id TEXT,
  amount_cents INT,
  pdf_url TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_valuation_reports_user ON valuation_reports(user_id);
CREATE INDEX idx_valuation_reports_type ON valuation_reports(report_type);

ALTER TABLE valuation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "valuation_own_read" ON valuation_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "valuation_insert_all" ON valuation_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "valuation_admin_all" ON valuation_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- B.4 — Helper: generate API key
-- ============================================================
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_key TEXT;
BEGIN
  v_key := 'trk_' || encode(gen_random_bytes(24), 'hex');
  RETURN v_key;
END;
$$;

-- ============================================================
-- B.5 — Price change tracking trigger
-- Records price_change events automatically in analytics_events
-- ============================================================
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price AND OLD.price IS NOT NULL AND NEW.price IS NOT NULL THEN
    INSERT INTO analytics_events (vertical, event_type, entity_type, entity_id, metadata)
    VALUES (
      'tracciona',
      'price_change',
      'vehicle',
      NEW.id,
      jsonb_build_object(
        'old_price', OLD.price,
        'new_price', NEW.price,
        'change_pct', ROUND(((NEW.price - OLD.price) / NULLIF(OLD.price, 0) * 100)::NUMERIC, 2)
      )
    );
  END IF;

  -- Track vehicle sold event
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'sold' THEN
    INSERT INTO analytics_events (vertical, event_type, entity_type, entity_id, metadata)
    VALUES (
      'tracciona',
      'vehicle_sold',
      'vehicle',
      NEW.id,
      jsonb_build_object(
        'final_price', NEW.price,
        'sold_price_cents', NEW.sold_price_cents,
        'days_listed', EXTRACT(EPOCH FROM (NOW() - OLD.created_at)) / 86400.0,
        'brand', NEW.brand,
        'subcategory_id', NEW.subcategory_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicle_price_change
  AFTER UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION track_price_change();
