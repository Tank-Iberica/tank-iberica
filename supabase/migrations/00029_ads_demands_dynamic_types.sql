-- ================================================
-- 00029: Ensure advertisements & demands tables exist + add dynamic type/subcategory/filters
-- Recreates tables if missing (00012 may have failed) and adds new columns
-- ================================================

-- ================================================
-- Ensure advertisements table exists (from 00012)
-- ================================================
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vehicle_type TEXT,
  brand TEXT,
  model TEXT,
  year INT,
  price NUMERIC(12,2),
  location TEXT,
  description TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  photos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  match_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_user ON advertisements(user_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_created ON advertisements(created_at DESC);

-- ================================================
-- Ensure demands table exists (from 00012)
-- ================================================
CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vehicle_type TEXT,
  brand_preference TEXT,
  year_min INT,
  year_max INT,
  price_min NUMERIC(12,2),
  price_max NUMERIC(12,2),
  specs JSONB DEFAULT '{}',
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  match_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_user ON demands(user_id);
CREATE INDEX IF NOT EXISTS idx_demands_created ON demands(created_at DESC);

-- ================================================
-- RLS (idempotent — only if not already enabled)
-- ================================================
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'advertisements' AND policyname = 'advertisements_public_insert') THEN
    CREATE POLICY "advertisements_public_insert" ON advertisements FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'advertisements' AND policyname = 'advertisements_own_select') THEN
    CREATE POLICY "advertisements_own_select" ON advertisements FOR SELECT USING (
      (auth.uid() IS NOT NULL AND user_id = auth.uid())
      OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'advertisements' AND policyname = 'advertisements_admin_update') THEN
    CREATE POLICY "advertisements_admin_update" ON advertisements FOR UPDATE USING (
      auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'advertisements' AND policyname = 'advertisements_admin_delete') THEN
    CREATE POLICY "advertisements_admin_delete" ON advertisements FOR DELETE USING (
      auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demands' AND policyname = 'demands_public_insert') THEN
    CREATE POLICY "demands_public_insert" ON demands FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demands' AND policyname = 'demands_own_select') THEN
    CREATE POLICY "demands_own_select" ON demands FOR SELECT USING (
      (auth.uid() IS NOT NULL AND user_id = auth.uid())
      OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demands' AND policyname = 'demands_admin_update') THEN
    CREATE POLICY "demands_admin_update" ON demands FOR UPDATE USING (
      auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demands' AND policyname = 'demands_admin_delete') THEN
    CREATE POLICY "demands_admin_delete" ON demands FOR DELETE USING (
      auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
    );
  END IF;
END $$;

-- ================================================
-- New columns: dynamic type/subcategory/filters support
-- ================================================
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES types(id) ON DELETE SET NULL;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS filters_json JSONB DEFAULT '{}';
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS kilometers INT;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS contact_preference TEXT DEFAULT 'email';

CREATE INDEX IF NOT EXISTS idx_advertisements_subcategory ON advertisements(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_type ON advertisements(type_id);

ALTER TABLE demands ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
ALTER TABLE demands ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES types(id) ON DELETE SET NULL;
ALTER TABLE demands ADD COLUMN IF NOT EXISTS filters_json JSONB DEFAULT '{}';
ALTER TABLE demands ADD COLUMN IF NOT EXISTS contact_preference TEXT DEFAULT 'email';
ALTER TABLE demands ADD COLUMN IF NOT EXISTS brand_preference TEXT;
ALTER TABLE demands ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_demands_subcategory ON demands(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_demands_type ON demands(type_id);
