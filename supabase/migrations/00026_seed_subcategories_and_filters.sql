-- ================================================
-- TANK IBERICA — Migration 00026: Seed filter definitions
-- and link them to existing subcategories via applicable_filters
-- 13 unique filters (all type 'caja', status 'published')
-- ================================================

DO $$
DECLARE
  -- Filter IDs
  f_ejes UUID;
  f_marca_ejes UUID;
  f_descarga UUID;
  f_compartimentos UUID;
  f_volumen UUID;
  f_44tn UUID;
  f_frenos UUID;
  f_cv UUID;
  f_euro UUID;
  f_kms UUID;
  f_frenado UUID;
  f_capacidad UUID;
  f_mercancia UUID;
BEGIN
  -- ============================================
  -- 1. INSERT FILTER DEFINITIONS (13 unique)
  --    All type 'caja' (free text), status 'published'
  -- ============================================

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('ejes', 'caja', 'Ejes', 'Axles', 'published', 1)
  RETURNING id INTO f_ejes;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('marca_ejes', 'caja', 'Marca Ejes', 'Axle Brand', 'published', 2)
  RETURNING id INTO f_marca_ejes;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('descarga', 'caja', 'Descarga', 'Discharge', 'published', 3)
  RETURNING id INTO f_descarga;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('compartimentos', 'caja', 'Compartimentos', 'Compartments', 'published', 4)
  RETURNING id INTO f_compartimentos;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('volumen', 'caja', 'Volumen', 'Volume', 'published', 5)
  RETURNING id INTO f_volumen;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('44tn', 'caja', '44tn', '44tn', 'published', 6)
  RETURNING id INTO f_44tn;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('frenos', 'caja', 'Frenos', 'Brakes', 'published', 7)
  RETURNING id INTO f_frenos;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('cv', 'caja', 'CV', 'HP', 'published', 8)
  RETURNING id INTO f_cv;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('euro', 'caja', 'Euro', 'Euro', 'published', 9)
  RETURNING id INTO f_euro;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('kms', 'caja', 'KMs', 'KMs', 'published', 10)
  RETURNING id INTO f_kms;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('frenado', 'caja', 'Frenado', 'Braking', 'published', 11)
  RETURNING id INTO f_frenado;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('capacidad', 'caja', 'Capacidad', 'Capacity', 'published', 12)
  RETURNING id INTO f_capacidad;

  INSERT INTO filter_definitions (name, type, label_es, label_en, status, sort_order)
  VALUES ('mercancia', 'caja', 'Mercancia', 'Goods', 'published', 13)
  RETURNING id INTO f_mercancia;

  -- ============================================
  -- 2. LINK FILTERS TO EXISTING SUBCATEGORIES
  --    Update applicable_filters on each subcategory
  -- ============================================

  -- Cisternas (Ejes, Marca Ejes, Descarga, Compartimentos, Volumen, 44tn, Frenos)
  UPDATE subcategories SET applicable_filters = ARRAY[f_ejes, f_marca_ejes, f_descarga, f_compartimentos, f_volumen, f_44tn, f_frenos]
  WHERE slug = 'cisternas';

  -- Tractoras (Ejes, Marca Ejes, CV, Euro, KMs, Frenado, 44tn, Frenos)
  UPDATE subcategories SET applicable_filters = ARRAY[f_ejes, f_marca_ejes, f_cv, f_euro, f_kms, f_frenado, f_44tn, f_frenos]
  WHERE slug = 'tractoras';

  -- Rigidos (Ejes, Marca Ejes, CV, Euro, KMs, Frenos)
  UPDATE subcategories SET applicable_filters = ARRAY[f_ejes, f_marca_ejes, f_cv, f_euro, f_kms, f_frenos]
  WHERE slug = 'rigidos';

  -- Semirremolques (Ejes, Marca Ejes, Capacidad, 44tn, Frenos)
  UPDATE subcategories SET applicable_filters = ARRAY[f_ejes, f_marca_ejes, f_capacidad, f_44tn, f_frenos]
  WHERE slug = 'semirremolques';

  -- Remolques (Ejes, Marca Ejes, Mercancia, Frenos)
  UPDATE subcategories SET applicable_filters = ARRAY[f_ejes, f_marca_ejes, f_mercancia, f_frenos]
  WHERE slug = 'remolques';

  -- Ligeros (Capacidad, CV, KMs, Frenos)
  UPDATE subcategories SET applicable_filters = ARRAY[f_capacidad, f_cv, f_kms, f_frenos]
  WHERE slug = 'ligeros';

  -- Especializados (Ejes, CV, Euro, KMs, Frenos)
  UPDATE subcategories SET applicable_filters = ARRAY[f_ejes, f_cv, f_euro, f_kms, f_frenos]
  WHERE slug = 'especializados';

END $$;
