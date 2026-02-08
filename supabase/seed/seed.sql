-- ================================================
-- TANK IBERICA — Seed: initial data from CSV export
-- Run in Supabase SQL Editor after migrations
-- ================================================

-- ================================================
-- 0. Clear existing data (in correct order for FK)
-- ================================================
DELETE FROM type_subcategories;
DELETE FROM types;
DELETE FROM subcategories;
DELETE FROM filter_definitions;

-- ================================================
-- 1. Subcategories
-- ================================================

INSERT INTO subcategories (name_es, name_en, slug, applicable_categories, stock_count, status, sort_order) VALUES
  ('Cisternas', 'Tankers', 'cisternas', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 1),
  ('Tractoras', 'Tractors', 'tractoras', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 2),
  ('Rígidos', 'Rigid Trucks', 'rigidos', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 3),
  ('Semirremolques', 'Semitrailers', 'semirremolques', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 4),
  ('Trailers', 'Trailers', 'trailers', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 5),
  ('Ligeros', 'Light Vehicles', 'ligeros', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 6),
  ('Especializados', 'Specialized', 'especializados', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 7);

-- ================================================
-- 2. Types
-- ================================================

INSERT INTO types (name_es, name_en, slug, applicable_categories, stock_count, status, sort_order) VALUES
  -- Cisternas types
  ('Alimentarias', 'Food Grade', 'alimentarias', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 1),
  ('Combustibles', 'Fuel', 'combustibles', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 2),
  ('Basculantes', 'Tipper', 'basculantes', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 3),
  ('Betún', 'Bitumen', 'betun', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 4),
  ('Químicas', 'Chemical', 'quimicas', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 5),
  ('Gases', 'Gases', 'gases', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 6),
  ('Agrícolas', 'Agricultural', 'agricolas', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 7),
  ('Cemento', 'Cement', 'cemento', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 8),
  -- Tractoras types
  ('Estándar', 'Standard', 'estandar', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 9),
  ('Materiales Peligrosos', 'Hazardous Materials', 'materiales-peligrosos', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 10),
  -- Rígidos types
  ('Cisterna', 'Tanker', 'cisterna', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 11),
  ('Autocargante', 'Self-loading', 'autocargante', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 12),
  ('Frigorífico', 'Refrigerated', 'frigorifico', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 13),
  ('Lona', 'Tarpaulin', 'lona', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 14),
  ('Plataforma', 'Flatbed', 'plataforma', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 15),
  ('Caja Abierta', 'Open Box', 'caja-abierta', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 16),
  ('Furgón', 'Van Body', 'furgon', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 17),
  ('Basculante', 'Tipper', 'basculante', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 18),
  -- Semirremolques types (some shared with Rígidos)
  ('Góndola', 'Lowboy', 'gondola', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 19),
  ('Portacontenedores', 'Container Carrier', 'portacontenedores', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 20),
  ('Caja Cerrada', 'Closed Box', 'caja-cerrada', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 21),
  ('Portavehículos', 'Car Carrier', 'portavehiculos', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 22),
  -- Trailers types (some shared)
  ('Volquete', 'Dump', 'volquete', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 23),
  -- Ligeros types
  ('Furgonetas', 'Vans', 'furgonetas', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 24),
  -- Especializados types
  ('RSU', 'Waste Collection', 'rsu', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 25),
  ('Hormigonera', 'Concrete Mixer', 'hormigonera', ARRAY['alquiler', 'venta', 'terceros'], 0, 'published', 26);

-- ================================================
-- 3. Type-Subcategory links (junction table)
-- ================================================

-- Cisternas -> Alimentarias, Combustibles, Basculantes, Betún, Químicas, Gases, Agrícolas, Cemento
INSERT INTO type_subcategories (type_id, subcategory_id) VALUES
  ((SELECT id FROM types WHERE slug = 'alimentarias'), (SELECT id FROM subcategories WHERE slug = 'cisternas')),
  ((SELECT id FROM types WHERE slug = 'combustibles'), (SELECT id FROM subcategories WHERE slug = 'cisternas')),
  ((SELECT id FROM types WHERE slug = 'basculantes'), (SELECT id FROM subcategories WHERE slug = 'cisternas')),
  ((SELECT id FROM types WHERE slug = 'betun'), (SELECT id FROM subcategories WHERE slug = 'cisternas')),
  ((SELECT id FROM types WHERE slug = 'quimicas'), (SELECT id FROM subcategories WHERE slug = 'cisternas')),
  ((SELECT id FROM types WHERE slug = 'gases'), (SELECT id FROM subcategories WHERE slug = 'cisternas')),
  ((SELECT id FROM types WHERE slug = 'agricolas'), (SELECT id FROM subcategories WHERE slug = 'cisternas')),
  ((SELECT id FROM types WHERE slug = 'cemento'), (SELECT id FROM subcategories WHERE slug = 'cisternas'));

-- Tractoras -> Estándar, Materiales Peligrosos
INSERT INTO type_subcategories (type_id, subcategory_id) VALUES
  ((SELECT id FROM types WHERE slug = 'estandar'), (SELECT id FROM subcategories WHERE slug = 'tractoras')),
  ((SELECT id FROM types WHERE slug = 'materiales-peligrosos'), (SELECT id FROM subcategories WHERE slug = 'tractoras'));

-- Rígidos -> Cisterna, Autocargante, Frigorífico, Lona, Plataforma, Caja Abierta, Furgón, Basculante
INSERT INTO type_subcategories (type_id, subcategory_id) VALUES
  ((SELECT id FROM types WHERE slug = 'cisterna'), (SELECT id FROM subcategories WHERE slug = 'rigidos')),
  ((SELECT id FROM types WHERE slug = 'autocargante'), (SELECT id FROM subcategories WHERE slug = 'rigidos')),
  ((SELECT id FROM types WHERE slug = 'frigorifico'), (SELECT id FROM subcategories WHERE slug = 'rigidos')),
  ((SELECT id FROM types WHERE slug = 'lona'), (SELECT id FROM subcategories WHERE slug = 'rigidos')),
  ((SELECT id FROM types WHERE slug = 'plataforma'), (SELECT id FROM subcategories WHERE slug = 'rigidos')),
  ((SELECT id FROM types WHERE slug = 'caja-abierta'), (SELECT id FROM subcategories WHERE slug = 'rigidos')),
  ((SELECT id FROM types WHERE slug = 'furgon'), (SELECT id FROM subcategories WHERE slug = 'rigidos')),
  ((SELECT id FROM types WHERE slug = 'basculante'), (SELECT id FROM subcategories WHERE slug = 'rigidos'));

-- Semirremolques -> Frigorífico, Lona, Basculante, Góndola, Portacontenedores, Caja Cerrada, Plataforma, Portavehículos
INSERT INTO type_subcategories (type_id, subcategory_id) VALUES
  ((SELECT id FROM types WHERE slug = 'frigorifico'), (SELECT id FROM subcategories WHERE slug = 'semirremolques')),
  ((SELECT id FROM types WHERE slug = 'lona'), (SELECT id FROM subcategories WHERE slug = 'semirremolques')),
  ((SELECT id FROM types WHERE slug = 'basculante'), (SELECT id FROM subcategories WHERE slug = 'semirremolques')),
  ((SELECT id FROM types WHERE slug = 'gondola'), (SELECT id FROM subcategories WHERE slug = 'semirremolques')),
  ((SELECT id FROM types WHERE slug = 'portacontenedores'), (SELECT id FROM subcategories WHERE slug = 'semirremolques')),
  ((SELECT id FROM types WHERE slug = 'caja-cerrada'), (SELECT id FROM subcategories WHERE slug = 'semirremolques')),
  ((SELECT id FROM types WHERE slug = 'plataforma'), (SELECT id FROM subcategories WHERE slug = 'semirremolques')),
  ((SELECT id FROM types WHERE slug = 'portavehiculos'), (SELECT id FROM subcategories WHERE slug = 'semirremolques'));

-- Trailers -> Cisterna, Volquete, Plataforma, Góndola, Caja Cerrada, Portacontenedores, Caja Abierta
INSERT INTO type_subcategories (type_id, subcategory_id) VALUES
  ((SELECT id FROM types WHERE slug = 'cisterna'), (SELECT id FROM subcategories WHERE slug = 'trailers')),
  ((SELECT id FROM types WHERE slug = 'volquete'), (SELECT id FROM subcategories WHERE slug = 'trailers')),
  ((SELECT id FROM types WHERE slug = 'plataforma'), (SELECT id FROM subcategories WHERE slug = 'trailers')),
  ((SELECT id FROM types WHERE slug = 'gondola'), (SELECT id FROM subcategories WHERE slug = 'trailers')),
  ((SELECT id FROM types WHERE slug = 'caja-cerrada'), (SELECT id FROM subcategories WHERE slug = 'trailers')),
  ((SELECT id FROM types WHERE slug = 'portacontenedores'), (SELECT id FROM subcategories WHERE slug = 'trailers')),
  ((SELECT id FROM types WHERE slug = 'caja-abierta'), (SELECT id FROM subcategories WHERE slug = 'trailers'));

-- Ligeros -> Furgonetas
INSERT INTO type_subcategories (type_id, subcategory_id) VALUES
  ((SELECT id FROM types WHERE slug = 'furgonetas'), (SELECT id FROM subcategories WHERE slug = 'ligeros'));

-- Especializados -> RSU, Hormigonera
INSERT INTO type_subcategories (type_id, subcategory_id) VALUES
  ((SELECT id FROM types WHERE slug = 'rsu'), (SELECT id FROM subcategories WHERE slug = 'especializados')),
  ((SELECT id FROM types WHERE slug = 'hormigonera'), (SELECT id FROM subcategories WHERE slug = 'especializados'));

-- ================================================
-- 4. Config
-- ================================================

INSERT INTO config (key, value) VALUES
  ('banner', '{"text_es": "Bienvenido a Tank Iberica", "text_en": "Welcome to Tank Iberica", "active": true}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
