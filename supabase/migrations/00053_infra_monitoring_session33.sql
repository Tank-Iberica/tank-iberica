-- Migration 00053: Infrastructure monitoring tables (Session 33)
-- Creates infra_metrics, infra_alerts, infra_clusters tables
-- Adds infra_weight column to vertical_config

-- ============================================================
-- 1. infra_metrics — Hourly metric snapshots
-- ============================================================

CREATE TABLE infra_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR DEFAULT 'global',
  component VARCHAR NOT NULL,  -- 'supabase', 'cloudflare', 'cloudinary', 'cf_images', 'resend', 'sentry'
  metric_name VARCHAR NOT NULL, -- 'db_size_bytes', 'connections_used', 'transformations_used', etc.
  metric_value NUMERIC NOT NULL,
  metric_limit NUMERIC,
  usage_percent NUMERIC GENERATED ALWAYS AS (
    CASE WHEN metric_limit > 0 THEN ROUND((metric_value / metric_limit) * 100, 1) ELSE NULL END
  ) STORED,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_infra_metrics_component ON infra_metrics(component, metric_name);
CREATE INDEX idx_infra_metrics_recorded ON infra_metrics(recorded_at DESC);
CREATE INDEX idx_infra_metrics_usage ON infra_metrics(usage_percent DESC) WHERE usage_percent IS NOT NULL;

ALTER TABLE infra_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "infra_metrics_admin_read" ON infra_metrics
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "infra_metrics_insert_all" ON infra_metrics
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 2. infra_alerts — Generated alerts with cooldown
-- ============================================================

CREATE TABLE infra_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component VARCHAR NOT NULL,
  metric_name VARCHAR NOT NULL,
  alert_level VARCHAR NOT NULL, -- 'warning', 'critical', 'emergency'
  message TEXT NOT NULL,
  usage_percent NUMERIC,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id)
);

CREATE INDEX idx_infra_alerts_unack ON infra_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX idx_infra_alerts_component ON infra_alerts(component, sent_at DESC);

ALTER TABLE infra_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "infra_alerts_admin_all" ON infra_alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 3. infra_clusters — Supabase cluster configuration
-- ============================================================

CREATE TABLE infra_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_anon_key TEXT,
  supabase_service_role_key TEXT,
  verticals TEXT[] DEFAULT '{}',
  weight_used NUMERIC DEFAULT 0,
  weight_limit NUMERIC DEFAULT 4.0,
  status VARCHAR DEFAULT 'active', -- 'active', 'migrating', 'full'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE infra_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "infra_clusters_admin_all" ON infra_clusters
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Seed current cluster
INSERT INTO infra_clusters (name, supabase_url, verticals, weight_used, weight_limit)
VALUES ('cluster-principal', 'https://gmnrfuzekbwyzkgsaftv.supabase.co', ARRAY['tracciona'], 1.0, 4.0);

-- ============================================================
-- 4. Add infra_weight to vertical_config
-- ============================================================

ALTER TABLE vertical_config ADD COLUMN IF NOT EXISTS infra_weight NUMERIC DEFAULT 1.0;
