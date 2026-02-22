-- Session 28: CRM de dealers + onboarding guiado
-- Tables: competitor_vehicles, platforms, pipeline_items, dealer_events, dealer_onboarding_steps

-- ============================================
-- 1. PLATFORMS (configurable per dealer)
-- ============================================
CREATE TABLE IF NOT EXISTS platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url_base TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platforms_public_read" ON platforms FOR SELECT
  USING (true);

CREATE POLICY "platforms_admin_all" ON platforms FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));

-- Seed default platforms
INSERT INTO platforms (name, url_base, icon, sort_order, is_default) VALUES
  ('Milanuncios', 'https://www.milanuncios.com', 'milanuncios', 1, true),
  ('Wallapop', 'https://es.wallapop.com', 'wallapop', 2, true),
  ('Autoscout24', 'https://www.autoscout24.es', 'autoscout24', 3, true),
  ('Mobile.de', 'https://www.mobile.de', 'mobilede', 4, true),
  ('TruckScout24', 'https://www.truckscout24.es', 'truckscout24', 5, true),
  ('Mascus', 'https://www.mascus.es', 'mascus', 6, true),
  ('Facebook Marketplace', 'https://www.facebook.com/marketplace', 'facebook', 7, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. COMPETITOR_VEHICLES (observatory)
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id),
  platform_name TEXT, -- fallback for custom "other" platforms
  url TEXT,
  brand TEXT,
  model TEXT,
  year INT,
  price DECIMAL(12,2),
  location TEXT,
  notes TEXT,
  status VARCHAR DEFAULT 'watching' CHECK (status IN ('watching', 'sold', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competitor_vehicles_dealer ON competitor_vehicles(dealer_id, status);
CREATE INDEX idx_competitor_vehicles_platform ON competitor_vehicles(platform_id);

ALTER TABLE competitor_vehicles ENABLE ROW LEVEL SECURITY;

-- Dealer CRUD on their own entries
CREATE POLICY "competitor_vehicles_dealer_select" ON competitor_vehicles FOR SELECT
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "competitor_vehicles_dealer_insert" ON competitor_vehicles FOR INSERT
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "competitor_vehicles_dealer_update" ON competitor_vehicles FOR UPDATE
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "competitor_vehicles_dealer_delete" ON competitor_vehicles FOR DELETE
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

-- Admin full access
CREATE POLICY "competitor_vehicles_admin_all" ON competitor_vehicles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));

-- ============================================
-- 3. PIPELINE_ITEMS (commercial pipeline)
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  vehicle_id UUID REFERENCES vehicles(id),
  -- Pipeline info
  stage VARCHAR NOT NULL DEFAULT 'interested' CHECK (stage IN ('interested', 'contacted', 'negotiating', 'closed_won', 'closed_lost')),
  title TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  estimated_value DECIMAL(12,2),
  notes TEXT,
  -- Position within the column for ordering
  position INT DEFAULT 0,
  -- Timestamps
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  close_reason VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pipeline_items_dealer ON pipeline_items(dealer_id, stage);
CREATE INDEX idx_pipeline_items_lead ON pipeline_items(lead_id);
CREATE INDEX idx_pipeline_items_vehicle ON pipeline_items(vehicle_id);

ALTER TABLE pipeline_items ENABLE ROW LEVEL SECURITY;

-- Dealer CRUD on their own entries
CREATE POLICY "pipeline_items_dealer_select" ON pipeline_items FOR SELECT
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "pipeline_items_dealer_insert" ON pipeline_items FOR INSERT
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "pipeline_items_dealer_update" ON pipeline_items FOR UPDATE
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "pipeline_items_dealer_delete" ON pipeline_items FOR DELETE
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

-- Admin full access
CREATE POLICY "pipeline_items_admin_all" ON pipeline_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));

-- ============================================
-- 4. DEALER_EVENTS (reactivation tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS dealer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  -- Examples: 'login', 'vehicle_published', 'lead_responded', 'reactivation_7d', 'reactivation_30d', 'reactivation_60d'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dealer_events_dealer ON dealer_events(dealer_id, event_type);
CREATE INDEX idx_dealer_events_date ON dealer_events(created_at);

ALTER TABLE dealer_events ENABLE ROW LEVEL SECURITY;

-- Dealer reads their own events
CREATE POLICY "dealer_events_dealer_select" ON dealer_events FOR SELECT
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

-- System inserts (service_role)
CREATE POLICY "dealer_events_insert" ON dealer_events FOR INSERT
  WITH CHECK (true);

-- Admin full access
CREATE POLICY "dealer_events_admin_all" ON dealer_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));

-- ============================================
-- 5. DEALER_ONBOARDING_STEPS (track 5-step wizard)
-- ============================================
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS health_score INT DEFAULT 0;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- ============================================
-- 6. DEALER_PLATFORMS (dealer's configured platforms)
-- ============================================
CREATE TABLE IF NOT EXISTS dealer_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  custom_name TEXT, -- for "Other" platform overrides
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dealer_id, platform_id)
);

ALTER TABLE dealer_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dealer_platforms_dealer_select" ON dealer_platforms FOR SELECT
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "dealer_platforms_dealer_insert" ON dealer_platforms FOR INSERT
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "dealer_platforms_dealer_delete" ON dealer_platforms FOR DELETE
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "dealer_platforms_admin_all" ON dealer_platforms FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_user_meta_data->>'role' = 'admin'
  ));
