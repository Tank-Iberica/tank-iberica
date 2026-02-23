-- ============================================
-- Migration 00036: Technical debt resolution
-- Geocoding cache, favorites table, advertisement constraints
-- ============================================

-- 1. Geocoding cache table (Nominatim fallback)
CREATE TABLE IF NOT EXISTS geocoding_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lat_rounded NUMERIC(5,2) NOT NULL,
  lng_rounded NUMERIC(6,2) NOT NULL,
  country_code TEXT,
  city TEXT,
  province TEXT,
  region TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index on rounded coordinates for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_geocoding_cache_coords
  ON geocoding_cache (lat_rounded, lng_rounded);

-- RLS: public read (no auth needed for geo lookups), admin write
ALTER TABLE geocoding_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read geocoding cache"
  ON geocoding_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert geocoding cache"
  ON geocoding_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 2. Favorites table (migrate from localStorage)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vehicle ON favorites (vehicle_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 3. CHECK constraints on advertisements table
ALTER TABLE advertisements
  ADD CONSTRAINT chk_adv_brand_length CHECK (char_length(brand) BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_adv_model_length CHECK (char_length(model) BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_adv_year_range CHECK (year BETWEEN 1950 AND EXTRACT(YEAR FROM now())::int + 2),
  ADD CONSTRAINT chk_adv_price_positive CHECK (price > 0),
  ADD CONSTRAINT chk_adv_contact_email_format CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT chk_adv_contact_name_length CHECK (char_length(contact_name) BETWEEN 1 AND 200),
  ADD CONSTRAINT chk_adv_description_length CHECK (char_length(description) BETWEEN 1 AND 5000),
  ADD CONSTRAINT chk_adv_status_values CHECK (status IN ('pending', 'approved', 'rejected', 'archived'));
