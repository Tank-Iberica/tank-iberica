-- ============================================================
-- 00032_active_landings.sql
-- Paso 3: Landing pages SEO dinámicas + normalización marca/ubicación
-- ============================================================

-- ===========================================================
-- 1. TABLA ACTIVE_LANDINGS
-- ===========================================================

CREATE TABLE IF NOT EXISTS active_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR NOT NULL UNIQUE,
  dimension_values UUID[] NOT NULL,
  parent_slug VARCHAR,
  vehicle_count INT NOT NULL DEFAULT 0,
  parent_vehicle_count INT DEFAULT 0,
  overlap_percentage DECIMAL(5,2) DEFAULT 0,
  overlap_threshold DECIMAL(5,2) DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT false,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  intro_text_es TEXT,
  intro_text_en TEXT,
  breadcrumb JSONB,
  schema_data JSONB,
  last_calculated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_landings_active ON active_landings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_landings_vertical ON active_landings(vertical);
CREATE INDEX IF NOT EXISTS idx_active_landings_parent ON active_landings(parent_slug);

-- RLS
ALTER TABLE active_landings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active_landings_public_read"
  ON active_landings FOR SELECT
  USING (is_active = true);

CREATE POLICY "active_landings_admin_all"
  ON active_landings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- ===========================================================
-- URLS FLAT (decisión SEO 17 Feb)
-- ===========================================================
-- El campo `slug` almacena URLs flat con guión:
--   'cisternas'                    (categoría)
--   'cisternas-alimentarias'       (subcategoría)
--   'cisternas-alimentarias-indox' (marca)
--   'alquiler-cisternas'           (acción + categoría)
--   'cabezas-tractoras-renault'    (categoría + marca)
-- NUNCA 'cisternas/alimentarias' (nested). Todo primer nivel.

-- ===========================================================
-- UMBRAL DINÁMICO DE SOLAPAMIENTO (decisión SEO 17 Feb)
-- ===========================================================
-- El umbral de solapamiento no es fijo. Varía según el tamaño
-- del catálogo en la categoría padre. Con pocos vehículos,
-- exigimos más diferenciación para evitar páginas redundantes.
--
-- | Vehículos en padre | Umbral máximo solapamiento |
-- |--------------------|----------------------------|
-- | 3-10               | 40%                        |
-- | 11-30              | 50%                        |
-- | 31-50              | 60%                        |
-- | 50+                | 70%                        |
--
-- Condiciones de activación (AMBAS deben cumplirse):
-- 1. vehicle_count >= 3
-- 2. overlap_percentage < umbral dinámico calculado

CREATE OR REPLACE FUNCTION calculate_dynamic_threshold(parent_count INT)
RETURNS DECIMAL(5,2) AS $$
BEGIN
  RETURN CASE
    WHEN parent_count <= 10 THEN 40.00
    WHEN parent_count <= 30 THEN 50.00
    WHEN parent_count <= 50 THEN 60.00
    ELSE 70.00
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- El job de recálculo de landings debe:
-- 1. Contar vehículos por combinación de dimensiones
-- 2. Calcular overlap_percentage con la landing padre
-- 3. Calcular overlap_threshold = calculate_dynamic_threshold(parent_vehicle_count)
-- 4. is_active = (vehicle_count >= 3 AND overlap_percentage < overlap_threshold)

-- ===========================================================
-- 2. TABLA BRANDS (normalización de marca)
-- ===========================================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, slug)
);

-- RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands_public_read"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "brands_admin_all"
  ON brands FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- Migrar marcas existentes desde vehicles.brand (texto libre)
INSERT INTO brands (vertical, slug, name)
SELECT DISTINCT 'tracciona',
  lower(replace(replace(brand, ' ', '-'), '.', '')),
  brand
FROM vehicles
WHERE brand IS NOT NULL AND brand != ''
ON CONFLICT (vertical, slug) DO NOTHING;

-- Añadir FK a vehicles (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN brand_id UUID REFERENCES brands(id);
  END IF;
END $$;

-- Migrar datos: vincular vehicles.brand_id con brands
UPDATE vehicles v SET brand_id = b.id
FROM brands b
WHERE lower(replace(replace(v.brand, ' ', '-'), '.', '')) = b.slug
AND b.vertical = 'tracciona'
AND v.brand_id IS NULL;

-- ===========================================================
-- 3. TABLA LOCATIONS (normalización de ubicación)
-- ===========================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT,
  parent_id UUID REFERENCES locations(id),
  level VARCHAR DEFAULT 'province', -- 'country', 'region', 'province', 'city'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, slug)
);

-- RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_public_read"
  ON locations FOR SELECT
  USING (true);

CREATE POLICY "locations_admin_all"
  ON locations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

-- Añadir FK a vehicles (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN location_id UUID REFERENCES locations(id);
  END IF;
END $$;
