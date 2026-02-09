-- ================================================
-- TANK IBERICA — Migration 00027: Seed types and their filter definitions
-- 6 new filters + reuse 4 existing, 25 unique types
-- All new filters type 'caja', status 'published'
-- ================================================

DO $$
DECLARE
  -- New filter IDs
  f_serpentin UUID;
  f_isotermica UUID;
  f_atp UUID;
  f_exolum UUID;
  f_adr UUID;
  f_byc UUID;
  -- Existing filter IDs (from migration 00026)
  f_capacidad UUID;
  f_descarga UUID;
  f_volumen UUID;
  f_mercancia UUID;
BEGIN
  -- ============================================
  -- 1. CREATE NEW FILTER DEFINITIONS (6)
  -- ============================================

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('serpentin', 'caja', 'Serpentin', 'Coil', 'published', 20)
  RETURNING id INTO f_serpentin;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('isotermica', 'caja', 'Isotermica', 'Isothermal', 'published', 21)
  RETURNING id INTO f_isotermica;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('atp', 'caja', 'ATP', 'ATP', 'published', 22)
  RETURNING id INTO f_atp;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('exolum', 'caja', 'Exolum', 'Exolum', 'published', 23)
  RETURNING id INTO f_exolum;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('adr', 'caja', 'ADR', 'ADR', 'published', 24)
  RETURNING id INTO f_adr;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('byc', 'caja', 'ByC', 'ByC', 'published', 25)
  RETURNING id INTO f_byc;

  -- ============================================
  -- 2. FETCH EXISTING FILTER IDS (from migration 00026)
  -- ============================================

  SELECT id INTO f_capacidad FROM filter_definitions WHERE name = 'capacidad' LIMIT 1;
  SELECT id INTO f_descarga FROM filter_definitions WHERE name = 'descarga' LIMIT 1;
  SELECT id INTO f_volumen FROM filter_definitions WHERE name = 'volumen' LIMIT 1;
  SELECT id INTO f_mercancia FROM filter_definitions WHERE name = 'mercancia' LIMIT 1;

  -- ============================================
  -- 3. INSERT TYPES (25 unique)
  --    ON CONFLICT update applicable_filters
  -- ============================================

  -- Alimentarias (Serpentin, Isotermica, ATP)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Alimentarias', 'Food Grade', 'alimentarias', '{alquiler,venta,terceros}',
    ARRAY[f_serpentin, f_isotermica, f_atp], 'published', 1)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Combustibles (Exolum, ADR, ByC)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Combustibles', 'Fuel', 'combustibles', '{alquiler,venta,terceros}',
    ARRAY[f_exolum, f_adr, f_byc], 'published', 2)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Basculantes (sin filtros)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Basculantes', 'Tippers', 'basculantes', '{alquiler,venta,terceros}',
    '{}', 'published', 3)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Betun (Serpentin, Isotermica, ADR)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Betun', 'Bitumen', 'betun', '{alquiler,venta,terceros}',
    ARRAY[f_serpentin, f_isotermica, f_adr], 'published', 4)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Quimicas (Serpentin, Isotermica, ADR)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Quimicas', 'Chemical', 'quimicas', '{alquiler,venta,terceros}',
    ARRAY[f_serpentin, f_isotermica, f_adr], 'published', 5)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Gases (ADR)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Gases', 'Gas', 'gases', '{alquiler,venta,terceros}',
    ARRAY[f_adr], 'published', 6)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Agricolas (ADR)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Agricolas', 'Agricultural', 'agricolas', '{alquiler,venta,terceros}',
    ARRAY[f_adr], 'published', 7)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Cemento (sin filtros)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Cemento', 'Cement', 'cemento', '{alquiler,venta,terceros}',
    '{}', 'published', 8)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Estandar (sin filtros)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Estandar', 'Standard', 'estandar', '{alquiler,venta,terceros}',
    '{}', 'published', 9)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Materiales peligrosos (ADR)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Materiales peligrosos', 'Hazardous Materials', 'materiales-peligrosos', '{alquiler,venta,terceros}',
    ARRAY[f_adr], 'published', 10)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Cisterna (Mercancia, Descarga, Volumen)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Cisterna', 'Tanker', 'cisterna', '{alquiler,venta,terceros}',
    ARRAY[f_mercancia, f_descarga, f_volumen], 'published', 11)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Autocargante (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Autocargante', 'Self-loading', 'autocargante', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 12)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Frigorifico (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Frigorifico', 'Refrigerated', 'frigorifico', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 13)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Lona (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Lona', 'Tarpaulin', 'lona', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 14)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Plataforma (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Plataforma', 'Flatbed', 'plataforma', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 15)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Caja abierta (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Caja abierta', 'Open Box', 'caja-abierta', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 16)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Furgon (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Furgon', 'Van Body', 'furgon', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 17)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Basculante (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Basculante', 'Tipper', 'basculante', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 18)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Portavehiculos (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Portavehiculos', 'Car Carrier', 'portavehiculos', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 19)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Gondola (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Gondola', 'Lowbed', 'gondola', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 20)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Caja cerrada (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Caja cerrada', 'Closed Box', 'caja-cerrada', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 21)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Portacontenedores (Capacidad)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Portacontenedores', 'Container Carrier', 'portacontenedores', '{alquiler,venta,terceros}',
    ARRAY[f_capacidad], 'published', 22)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Furgonetas (sin filtros)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Furgonetas', 'Vans', 'furgonetas', '{alquiler,venta,terceros}',
    '{}', 'published', 23)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- RSU (sin filtros)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('RSU', 'MSW', 'rsu', '{alquiler,venta,terceros}',
    '{}', 'published', 24)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

  -- Hormigonera (sin filtros)
  INSERT INTO types (name_es, name_en, slug, applicable_categories, applicable_filters, status, sort_order)
  VALUES ('Hormigonera', 'Concrete Mixer', 'hormigonera', '{alquiler,venta,terceros}',
    '{}', 'published', 25)
  ON CONFLICT (slug) DO UPDATE SET applicable_filters = EXCLUDED.applicable_filters;

END $$;
