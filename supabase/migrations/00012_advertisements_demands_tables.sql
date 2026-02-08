-- ================================================
-- TANK IBERICA — Migration 00012: Advertisements & Demands tables
-- For managing "Anunciantes" (people selling vehicles) and
-- "Solicitantes" (people looking for vehicles)
-- ================================================

-- ================================================
-- Advertisements table (anunciantes - people who want to sell)
-- ================================================

CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Vehicle info
  vehicle_type TEXT, -- Type of vehicle they want to sell
  brand TEXT,
  model TEXT,
  year INT,
  price NUMERIC(12,2),
  location TEXT,
  description TEXT,
  -- Contact info
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  -- Media
  photos JSONB DEFAULT '[]',
  -- Status and matching
  status TEXT DEFAULT 'pending', -- pending, contacted, matched, archived
  match_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_user ON advertisements(user_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_created ON advertisements(created_at DESC);

CREATE TRIGGER set_advertisements_updated_at
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Demands table (solicitantes - people looking for vehicles)
-- ================================================

CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Vehicle requirements
  vehicle_type TEXT, -- What type they're looking for
  year_min INT,
  year_max INT,
  price_min NUMERIC(12,2),
  price_max NUMERIC(12,2),
  specs JSONB DEFAULT '{}', -- Additional specifications
  -- Contact info
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  location TEXT,
  -- Status and matching
  status TEXT DEFAULT 'pending', -- pending, contacted, matched, archived
  match_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_user ON demands(user_id);
CREATE INDEX IF NOT EXISTS idx_demands_created ON demands(created_at DESC);

CREATE TRIGGER set_demands_updated_at
  BEFORE UPDATE ON demands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- RLS Policies (using JWT pattern from migration 00010)
-- ================================================

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;

-- Advertisements: Public can insert (submit their ad), admin can do everything
CREATE POLICY "advertisements_public_insert"
  ON advertisements FOR INSERT
  WITH CHECK (true); -- Anyone can submit an advertisement

CREATE POLICY "advertisements_own_select"
  ON advertisements FOR SELECT
  USING (
    -- Own advertisement
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    -- Or admin
    OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
  );

CREATE POLICY "advertisements_admin_update"
  ON advertisements FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "advertisements_admin_delete"
  ON advertisements FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- Demands: Public can insert (submit request), admin can do everything
CREATE POLICY "demands_public_insert"
  ON demands FOR INSERT
  WITH CHECK (true); -- Anyone can submit a demand

CREATE POLICY "demands_own_select"
  ON demands FOR SELECT
  USING (
    -- Own demand
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    -- Or admin
    OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
  );

CREATE POLICY "demands_admin_update"
  ON demands FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

CREATE POLICY "demands_admin_delete"
  ON demands FOR DELETE
  USING (
    auth.jwt()->>'role' = 'authenticated'
    AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );
