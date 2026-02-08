-- ================================================
-- TANK IBERICA — Test vehicles (temporary)
-- Delete with:
--   DELETE FROM vehicle_images;
--   DELETE FROM vehicles;
-- ================================================

-- Vehicle 1: Cisterna alquiler
INSERT INTO vehicles (slug, brand, model, year, price, rental_price, category, subcategory_id, location, description_es, description_en, filters_json, status, featured)
VALUES (
  'renault-master-2024',
  'Renault', 'Master Cisterna', 2024, 45000, 1200,
  'alquiler',
  (SELECT id FROM subcategories WHERE slug = 'cisternas'),
  'Madrid',
  'Cisterna de acero inoxidable en perfecto estado. Ideal para transporte de líquidos alimentarios.',
  'Stainless steel tanker in perfect condition. Ideal for food-grade liquid transport.',
  '{"clase": "Alimentaria", "volumen": 15000, "compartimentos": 3}',
  'published', true
);

-- Vehicle 2: Tractora venta
INSERT INTO vehicles (slug, brand, model, year, price, category, subcategory_id, location, description_es, description_en, filters_json, status, featured)
VALUES (
  'iveco-stralis-2022',
  'Iveco', 'Stralis 460', 2022, 62000,
  'venta',
  (SELECT id FROM subcategories WHERE slug = 'tractoras'),
  'Barcelona',
  'Tractora con 180.000 km. Motor en excelente estado. Revisiones al día.',
  'Tractor unit with 180,000 km. Engine in excellent condition. Up-to-date inspections.',
  '{"potencia": 460}',
  'published', false
);

-- Vehicle 3: Semirremolque terceros
INSERT INTO vehicles (slug, brand, model, year, price, category, subcategory_id, location, description_es, description_en, filters_json, status, featured)
VALUES (
  'schmitz-cargobull-2023',
  'Schmitz', 'Cargobull S.CS', 2023, 35000,
  'terceros',
  (SELECT id FROM subcategories WHERE slug = 'semirremolques'),
  'Valencia',
  'Semirremolque lona corredera. 3 ejes. Neumáticos nuevos.',
  'Curtain side semitrailer. 3 axles. New tires.',
  '{"tipo": "Lona"}',
  'published', true
);

-- Vehicle 4: Rígido venta
INSERT INTO vehicles (slug, brand, model, year, price, rental_price, category, subcategory_id, location, description_es, description_en, filters_json, status, featured)
VALUES (
  'man-tgx-2021',
  'MAN', 'TGX 26.470', 2021, 78000, 2500,
  'venta',
  (SELECT id FROM subcategories WHERE slug = 'rigidos'),
  'Sevilla',
  'Rígido 6x2 con cisterna de 18.000L. ADR. ITV vigente.',
  'Rigid 6x2 with 18,000L tank. ADR certified. Valid inspection.',
  '{"potencia": 470, "cisterna": true, "tipo": "Combustible", "capacidad": 18000}',
  'published', false
);

-- Placeholder images (using picsum for testing)
INSERT INTO vehicle_images (vehicle_id, url, thumbnail_url, position, alt_text)
VALUES
  ((SELECT id FROM vehicles WHERE slug = 'renault-master-2024'), 'https://picsum.photos/seed/tank1/800/600', 'https://picsum.photos/seed/tank1/400/300', 0, 'Renault Master Cisterna'),
  ((SELECT id FROM vehicles WHERE slug = 'renault-master-2024'), 'https://picsum.photos/seed/tank1b/800/600', 'https://picsum.photos/seed/tank1b/400/300', 1, 'Renault Master Cisterna interior'),
  ((SELECT id FROM vehicles WHERE slug = 'iveco-stralis-2022'), 'https://picsum.photos/seed/tank2/800/600', 'https://picsum.photos/seed/tank2/400/300', 0, 'Iveco Stralis 460'),
  ((SELECT id FROM vehicles WHERE slug = 'schmitz-cargobull-2023'), 'https://picsum.photos/seed/tank3/800/600', 'https://picsum.photos/seed/tank3/400/300', 0, 'Schmitz Cargobull S.CS'),
  ((SELECT id FROM vehicles WHERE slug = 'man-tgx-2021'), 'https://picsum.photos/seed/tank4/800/600', 'https://picsum.photos/seed/tank4/400/300', 0, 'MAN TGX 26.470'),
  ((SELECT id FROM vehicles WHERE slug = 'man-tgx-2021'), 'https://picsum.photos/seed/tank4b/800/600', 'https://picsum.photos/seed/tank4b/400/300', 1, 'MAN TGX 26.470 cisterna');
