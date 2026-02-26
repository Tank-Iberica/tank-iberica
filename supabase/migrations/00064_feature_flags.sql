-- Feature flags table for gradual rollout and A/B testing
CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  percentage integer DEFAULT 100,  -- rollout percentage (1-100)
  allowed_dealers text[],          -- specific dealer IDs (NULL = all)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read flags (needed for client-side checks)
CREATE POLICY "feature_flags_select" ON feature_flags
  FOR SELECT USING (true);

-- Only admins can modify flags
CREATE POLICY "feature_flags_admin_modify" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed initial flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('whatsapp_flow', true, 'WhatsApp submission processing'),
  ('auctions', false, 'Live auctions feature'),
  ('social_posts_ai', false, 'AI-generated social media posts'),
  ('market_intelligence', false, 'Market price comparisons for dealers'),
  ('dgt_reports', false, 'DGT vehicle reports (paid)'),
  ('featured_boost', false, 'Paid vehicle boost/highlight')
ON CONFLICT (key) DO NOTHING;
