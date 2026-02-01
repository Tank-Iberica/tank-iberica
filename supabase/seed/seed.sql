-- ================================================
-- TANK IBERICA — Seed: initial data from CSV export
-- Run in Supabase SQL Editor after migrations
-- ================================================

-- ================================================
-- 1. Subcategories
-- ================================================

INSERT INTO subcategories (name_es, name_en, slug, applicable_categories, stock_count, status, sort_order) VALUES
  ('Cisternas', 'Tankers', 'cisternas', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 1),
  ('Tractoras', 'Tractors', 'tractoras', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 2),
  ('Semirremolques', 'Semitrailers', 'semirremolques', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 3),
  ('Remolques', 'Trailers', 'remolques', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 4),
  ('Rígidos', 'Trucks', 'rigidos', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 5);

-- ================================================
-- 2. Filter definitions
-- Linked to subcategories via subquery
-- ================================================

-- Clase → Cisternas
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'cisternas'),
  'clase', 'desplegable', 'Clase', 'Class', NULL, '{}', false, false, 'published', 1
);

-- Volumen → Cisternas
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'cisternas'),
  'volumen', 'slider', 'Volumen', 'Volume', 'L', '{}', false, false, 'published', 2
);

-- Compartimentos → Cisternas
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'cisternas'),
  'compartimentos', 'desplegable', 'Compartimentos', 'Sections', NULL, '{}', false, false, 'published', 3
);

-- Potencia (CV) → Tractoras
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'tractoras'),
  'potencia', 'slider', 'Potencia (CV)', 'Power (HP)', 'CV', '{}', false, false, 'published', 1
);

-- Tipo → Semirremolques
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'semirremolques'),
  'tipo', 'desplegable', 'Tipo', 'Type', NULL, '{}', false, false, 'published', 1
);

-- Cisterna (tick) → Remolques
-- When active, shows extra filters: Tipo, Volumen, Compartimentos
-- Hides: Capacidad
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'remolques'),
  'cisterna', 'tick', 'Cisterna', 'Tanker', NULL,
  '{"extra_filters": ["tipo", "volumen", "compartimentos"], "hides": ["capacidad"]}',
  false, false, 'published', 1
);

-- Tipo → Remolques
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'remolques'),
  'tipo', 'desplegable', 'Tipo', 'Type', NULL, '{}', true, false, 'published', 2
);

-- Potencia (CV) → Rígidos
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'rigidos'),
  'potencia', 'slider', 'Potencia (CV)', 'Power (HP)', 'CV', '{}', false, false, 'published', 1
);

-- Cisterna (tick) → Rígidos
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'rigidos'),
  'cisterna', 'tick', 'Cisterna', 'Tanker', NULL,
  '{"extra_filters": ["tipo", "volumen", "compartimentos"], "hides": ["capacidad"]}',
  false, false, 'published', 2
);

-- Tipo → Rígidos
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'rigidos'),
  'tipo', 'desplegable', 'Tipo', 'Type', NULL, '{}', true, false, 'published', 3
);

-- Capacidad → Remolques (hidden when Cisterna is active)
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'remolques'),
  'capacidad', 'slider', 'Capacidad', 'Load', 'Kg', '{}', false, false, 'published', 3
);

-- Capacidad → Rígidos (hidden when Cisterna is active)
INSERT INTO filter_definitions (subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order)
VALUES (
  (SELECT id FROM subcategories WHERE slug = 'rigidos'),
  'capacidad', 'slider', 'Capacidad', 'Load', 'Kg', '{}', false, false, 'published', 4
);

-- ================================================
-- 3. Config
-- ================================================

INSERT INTO config (key, value) VALUES
  ('banner', '{"text_es": "dasdad", "text_en": "asdada", "active": true}');
