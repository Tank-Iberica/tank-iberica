-- ================================================
-- TANK IBERICA — Migration 00002: catalog tables
-- vehicles, vehicle_images, subcategories,
-- filter_definitions, config
-- ================================================

-- Enums
CREATE TYPE vehicle_status AS ENUM ('draft', 'published', 'sold', 'archived');
CREATE TYPE vehicle_category AS ENUM ('alquiler', 'venta', 'terceros');
CREATE TYPE filter_type AS ENUM ('caja', 'desplegable', 'desplegable_tick', 'tick', 'slider', 'calc');

-- ================================================
-- subcategories (created first, FK target)
-- ================================================

CREATE TABLE subcategories (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_es               TEXT NOT NULL,
  name_en               TEXT,
  slug                  TEXT UNIQUE NOT NULL,
  applicable_categories TEXT[] DEFAULT '{}',
  stock_count           INT DEFAULT 0,
  status                vehicle_status DEFAULT 'published',
  sort_order            INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subcategories_slug ON subcategories(slug);
CREATE INDEX idx_subcategories_sort ON subcategories(sort_order);

-- ================================================
-- vehicles
-- ================================================

CREATE TABLE vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INT,
  price           NUMERIC(12, 2),
  rental_price    NUMERIC(12, 2),
  category        vehicle_category NOT NULL,
  subcategory_id  UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  location        TEXT,
  description_es  TEXT,
  description_en  TEXT,
  filters_json    JSONB DEFAULT '{}',
  status          vehicle_status DEFAULT 'draft',
  featured        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vehicles_slug ON vehicles(slug);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_vehicles_subcategory ON vehicles(subcategory_id);
CREATE INDEX idx_vehicles_featured ON vehicles(featured) WHERE featured = true;
CREATE INDEX idx_vehicles_price ON vehicles(price);
CREATE INDEX idx_vehicles_year ON vehicles(year);

-- ================================================
-- vehicle_images
-- ================================================

CREATE TABLE vehicle_images (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id           UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT,
  url                  TEXT NOT NULL,
  thumbnail_url        TEXT,
  position             INT DEFAULT 0,
  alt_text             TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);
CREATE INDEX idx_vehicle_images_position ON vehicle_images(vehicle_id, position);

-- ================================================
-- filter_definitions
-- ================================================

CREATE TABLE filter_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id  UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            filter_type NOT NULL,
  label_es        TEXT,
  label_en        TEXT,
  unit            TEXT,
  options         JSONB DEFAULT '{}',
  is_extra        BOOLEAN DEFAULT false,
  is_hidden       BOOLEAN DEFAULT false,
  status          vehicle_status DEFAULT 'published',
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_filter_definitions_subcategory ON filter_definitions(subcategory_id);
CREATE INDEX idx_filter_definitions_sort ON filter_definitions(sort_order);

-- ================================================
-- config (key-value store)
-- ================================================

CREATE TABLE config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- updated_at trigger function (reusable)
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_vehicles
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_subcategories
  BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_filter_definitions
  BEFORE UPDATE ON filter_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_config
  BEFORE UPDATE ON config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
