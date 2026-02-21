-- ================================================
-- 00045: Horecaria vertical — seed data
-- ================================================

-- A. Insert vertical_config for Horecaria
INSERT INTO vertical_config (
  vertical, name, tagline, meta_description,
  theme, font_preset,
  active_locales, default_locale,
  active_actions,
  homepage_sections,
  subscription_prices,
  commission_rates,
  require_vehicle_approval,
  require_article_approval,
  auto_translate_on_publish,
  auto_publish_social
) VALUES (
  'horecaria',
  '{"es": "Horecaria", "en": "Horecaria", "fr": "Horecaria"}',
  '{"es": "El marketplace de equipamiento hostelero", "en": "The hospitality equipment marketplace", "fr": "Le marketplace d''équipement hôtelier"}',
  '{"es": "Compra, venta y alquiler de equipamiento de hostelería y restauración: hornos, freidoras, cámaras frigoríficas, mobiliario y más.", "en": "Buy, sell and rent hospitality equipment: ovens, fryers, cold rooms, furniture and more.", "fr": "Achat, vente et location d''équipement de restauration: fours, friteuses, chambres froides, mobilier et plus."}',
  '{"primary": "#C84B31", "secondary": "#ECDBBA", "accent": "#2D4263", "bg_primary": "#FFFFFF", "bg_secondary": "#F8F5F0", "text_primary": "#1A1A2E", "text_secondary": "#4A4A5A", "border_color": "#E0D5C7"}',
  'default',
  '{es,en,fr}',
  'es',
  '{venta,alquiler}',
  '{"featured": true, "categories": true, "latest": true, "auctions": false, "articles": true, "services": false, "stats": true}',
  '{"free": {"monthly_cents": 0, "annual_cents": 0}, "basic": {"monthly_cents": 1900, "annual_cents": 19000}, "premium": {"monthly_cents": 4900, "annual_cents": 49000}, "founding": {"monthly_cents": 0, "annual_cents": 0}}',
  '{"sale_pct": 0, "auction_buyer_premium_pct": 8.0, "transport_commission_pct": 10.0, "verification_level2_cents": 2900, "verification_level3_cents": 9900}',
  false,
  false,
  true,
  false
);

-- B. Insert categories for Horecaria
-- categories table columns: id, name_es, name_en, slug (UNIQUE), applicable_actions, stock_count, status, sort_order, vertical, name (JSONB), name_singular (JSONB)
-- Prefix slugs with 'hor-' to avoid UNIQUE constraint conflicts with Tracciona categories
INSERT INTO categories (vertical, slug, name_es, name_en, name, sort_order, status) VALUES
  ('horecaria', 'hor-coccion', 'Cocción', 'Cooking', '{"es": "Cocción", "en": "Cooking", "fr": "Cuisson"}', 1, 'published'),
  ('horecaria', 'hor-refrigeracion', 'Refrigeración', 'Refrigeration', '{"es": "Refrigeración", "en": "Refrigeration", "fr": "Réfrigération"}', 2, 'published'),
  ('horecaria', 'hor-lavado', 'Lavado', 'Washing', '{"es": "Lavado", "en": "Washing", "fr": "Lavage"}', 3, 'published'),
  ('horecaria', 'hor-mobiliario', 'Mobiliario', 'Furniture', '{"es": "Mobiliario", "en": "Furniture", "fr": "Mobilier"}', 4, 'published'),
  ('horecaria', 'hor-preparacion', 'Preparación', 'Preparation', '{"es": "Preparación", "en": "Preparation", "fr": "Préparation"}', 5, 'published'),
  ('horecaria', 'hor-servicio', 'Servicio y exposición', 'Service & display', '{"es": "Servicio y exposición", "en": "Service & display", "fr": "Service et exposition"}', 6, 'published'),
  ('horecaria', 'hor-panaderia-pasteleria', 'Panadería y pastelería', 'Bakery & pastry', '{"es": "Panadería y pastelería", "en": "Bakery & pastry", "fr": "Boulangerie et pâtisserie"}', 7, 'published'),
  ('horecaria', 'hor-cafeteria-bar', 'Cafetería y bar', 'Café & bar', '{"es": "Cafetería y bar", "en": "Café & bar", "fr": "Café et bar"}', 8, 'published'),
  ('horecaria', 'hor-ventilacion-extraccion', 'Ventilación y extracción', 'Ventilation & extraction', '{"es": "Ventilación y extracción", "en": "Ventilation & extraction", "fr": "Ventilation et extraction"}', 9, 'published'),
  ('horecaria', 'hor-pequeno-equipamiento', 'Pequeño equipamiento', 'Small equipment', '{"es": "Pequeño equipamiento", "en": "Small equipment", "fr": "Petit équipement"}', 10, 'published');

-- C. Insert subcategories for Horecaria
-- subcategories table columns: id, name_es, name_en, slug (UNIQUE), applicable_actions, applicable_filters, stock_count, status, sort_order, vertical, name (JSONB), name_singular (JSONB)
-- Then link via subcategory_categories junction table

-- C.1 Insert subcategories (no direct category_id — linked via junction)
INSERT INTO subcategories (vertical, slug, name_es, name_en, name, sort_order, status) VALUES
  -- Cocción
  ('horecaria', 'hor-horno-conveccion', 'Horno de convección', 'Convection oven', '{"es": "Horno de convección", "en": "Convection oven", "fr": "Four à convection"}', 1, 'published'),
  ('horecaria', 'hor-horno-mixto', 'Horno mixto / rational', 'Combi oven / rational', '{"es": "Horno mixto / rational", "en": "Combi oven / rational", "fr": "Four mixte / rational"}', 2, 'published'),
  ('horecaria', 'hor-cocina-industrial', 'Cocina industrial', 'Industrial range', '{"es": "Cocina industrial", "en": "Industrial range", "fr": "Cuisinière industrielle"}', 3, 'published'),
  ('horecaria', 'hor-plancha', 'Plancha / fry-top', 'Griddle / fry-top', '{"es": "Plancha / fry-top", "en": "Griddle / fry-top", "fr": "Plancha / fry-top"}', 4, 'published'),
  ('horecaria', 'hor-freidora', 'Freidora', 'Fryer', '{"es": "Freidora", "en": "Fryer", "fr": "Friteuse"}', 5, 'published'),
  ('horecaria', 'hor-salamandra', 'Salamandra', 'Salamander grill', '{"es": "Salamandra", "en": "Salamander grill", "fr": "Salamandre"}', 6, 'published'),
  ('horecaria', 'hor-bano-maria', 'Baño maría', 'Bain-marie', '{"es": "Baño maría", "en": "Bain-marie", "fr": "Bain-marie"}', 7, 'published'),
  ('horecaria', 'hor-parrilla-grill', 'Parrilla / grill', 'Charcoal grill', '{"es": "Parrilla / grill", "en": "Charcoal grill", "fr": "Grill / barbecue"}', 8, 'published'),
  ('horecaria', 'hor-marmita-basculante', 'Marmita basculante', 'Tilting kettle', '{"es": "Marmita basculante", "en": "Tilting kettle", "fr": "Marmite basculante"}', 9, 'published'),
  ('horecaria', 'hor-sarten-basculante', 'Sartén basculante', 'Tilting braising pan', '{"es": "Sartén basculante", "en": "Tilting braising pan", "fr": "Sauteuse basculante"}', 10, 'published'),
  -- Refrigeración
  ('horecaria', 'hor-camara-frigorifica', 'Cámara frigorífica', 'Cold room', '{"es": "Cámara frigorífica", "en": "Cold room", "fr": "Chambre froide"}', 11, 'published'),
  ('horecaria', 'hor-camara-congelacion', 'Cámara de congelación', 'Freezer room', '{"es": "Cámara de congelación", "en": "Freezer room", "fr": "Chambre de congélation"}', 12, 'published'),
  ('horecaria', 'hor-armario-refrigerado', 'Armario refrigerado', 'Refrigerated cabinet', '{"es": "Armario refrigerado", "en": "Refrigerated cabinet", "fr": "Armoire réfrigérée"}', 13, 'published'),
  ('horecaria', 'hor-mesa-refrigerada', 'Mesa refrigerada', 'Refrigerated counter', '{"es": "Mesa refrigerada", "en": "Refrigerated counter", "fr": "Table réfrigérée"}', 14, 'published'),
  ('horecaria', 'hor-vitrina-refrigerada', 'Vitrina refrigerada', 'Refrigerated display', '{"es": "Vitrina refrigerada", "en": "Refrigerated display", "fr": "Vitrine réfrigérée"}', 15, 'published'),
  ('horecaria', 'hor-abatidor-temperatura', 'Abatidor de temperatura', 'Blast chiller', '{"es": "Abatidor de temperatura", "en": "Blast chiller", "fr": "Cellule de refroidissement"}', 16, 'published'),
  ('horecaria', 'hor-fabricador-hielo', 'Fabricador de hielo', 'Ice maker', '{"es": "Fabricador de hielo", "en": "Ice maker", "fr": "Machine à glaçons"}', 17, 'published'),
  ('horecaria', 'hor-botellero', 'Botellero / enfriador', 'Bottle cooler', '{"es": "Botellero / enfriador", "en": "Bottle cooler", "fr": "Refroidisseur de bouteilles"}', 18, 'published'),
  -- Lavado
  ('horecaria', 'hor-lavavajillas-capota', 'Lavavajillas de capota', 'Hood dishwasher', '{"es": "Lavavajillas de capota", "en": "Hood dishwasher", "fr": "Lave-vaisselle à capot"}', 19, 'published'),
  ('horecaria', 'hor-lavavajillas-tunel', 'Lavavajillas de túnel', 'Rack conveyor dishwasher', '{"es": "Lavavajillas de túnel", "en": "Rack conveyor dishwasher", "fr": "Lave-vaisselle tunnel"}', 20, 'published'),
  ('horecaria', 'hor-lavavajillas-frontal', 'Lavavajillas frontal', 'Front-loading dishwasher', '{"es": "Lavavajillas frontal", "en": "Front-loading dishwasher", "fr": "Lave-vaisselle frontal"}', 21, 'published'),
  ('horecaria', 'hor-lavavasos', 'Lavavasos', 'Glasswasher', '{"es": "Lavavasos", "en": "Glasswasher", "fr": "Lave-verres"}', 22, 'published'),
  ('horecaria', 'hor-fregadero-industrial', 'Fregadero industrial', 'Industrial sink', '{"es": "Fregadero industrial", "en": "Industrial sink", "fr": "Évier industriel"}', 23, 'published'),
  -- Mobiliario
  ('horecaria', 'hor-mesa-trabajo-acero', 'Mesa de trabajo acero inox', 'Stainless steel worktable', '{"es": "Mesa de trabajo acero inox", "en": "Stainless steel worktable", "fr": "Table de travail inox"}', 24, 'published'),
  ('horecaria', 'hor-estanteria-industrial', 'Estantería industrial', 'Industrial shelving', '{"es": "Estantería industrial", "en": "Industrial shelving", "fr": "Étagère industrielle"}', 25, 'published'),
  ('horecaria', 'hor-campana-extractora', 'Campana extractora', 'Extraction hood', '{"es": "Campana extractora", "en": "Extraction hood", "fr": "Hotte aspirante"}', 26, 'published'),
  ('horecaria', 'hor-carro-transporte', 'Carro de transporte', 'Transport trolley', '{"es": "Carro de transporte", "en": "Transport trolley", "fr": "Chariot de transport"}', 27, 'published'),
  ('horecaria', 'hor-mueble-neutro', 'Mueble neutro', 'Neutral cabinet', '{"es": "Mueble neutro", "en": "Neutral cabinet", "fr": "Meuble neutre"}', 28, 'published'),
  ('horecaria', 'hor-silla-taburete', 'Silla / taburete', 'Chair / stool', '{"es": "Silla / taburete", "en": "Chair / stool", "fr": "Chaise / tabouret"}', 29, 'published'),
  ('horecaria', 'hor-mesa-comedor', 'Mesa de comedor', 'Dining table', '{"es": "Mesa de comedor", "en": "Dining table", "fr": "Table de salle à manger"}', 30, 'published'),
  -- Preparación
  ('horecaria', 'hor-cortadora-fiambre', 'Cortadora de fiambre', 'Meat slicer', '{"es": "Cortadora de fiambre", "en": "Meat slicer", "fr": "Trancheuse"}', 31, 'published'),
  ('horecaria', 'hor-picadora-carne', 'Picadora de carne', 'Meat grinder', '{"es": "Picadora de carne", "en": "Meat grinder", "fr": "Hachoir à viande"}', 32, 'published'),
  ('horecaria', 'hor-procesador-alimentos', 'Procesador de alimentos', 'Food processor', '{"es": "Procesador de alimentos", "en": "Food processor", "fr": "Robot de cuisine"}', 33, 'published'),
  ('horecaria', 'hor-peladora-patatas', 'Peladora de patatas', 'Potato peeler', '{"es": "Peladora de patatas", "en": "Potato peeler", "fr": "Éplucheuse à pommes de terre"}', 34, 'published'),
  ('horecaria', 'hor-envasadora-vacio', 'Envasadora al vacío', 'Vacuum packer', '{"es": "Envasadora al vacío", "en": "Vacuum packer", "fr": "Machine sous vide"}', 35, 'published'),
  ('horecaria', 'hor-bascula-industrial', 'Báscula industrial', 'Industrial scale', '{"es": "Báscula industrial", "en": "Industrial scale", "fr": "Balance industrielle"}', 36, 'published'),
  -- Servicio y exposición
  ('horecaria', 'hor-vitrina-caliente', 'Vitrina caliente', 'Hot display', '{"es": "Vitrina caliente", "en": "Hot display", "fr": "Vitrine chaude"}', 37, 'published'),
  ('horecaria', 'hor-buffet-self-service', 'Buffet / self-service', 'Buffet / self-service', '{"es": "Buffet / self-service", "en": "Buffet / self-service", "fr": "Buffet / self-service"}', 38, 'published'),
  ('horecaria', 'hor-dispensador-bebidas', 'Dispensador de bebidas', 'Beverage dispenser', '{"es": "Dispensador de bebidas", "en": "Beverage dispenser", "fr": "Distributeur de boissons"}', 39, 'published'),
  ('horecaria', 'hor-carro-caliente', 'Carro caliente', 'Hot trolley', '{"es": "Carro caliente", "en": "Hot trolley", "fr": "Chariot chaud"}', 40, 'published'),
  ('horecaria', 'hor-vitrina-tapas', 'Vitrina de tapas', 'Tapas display', '{"es": "Vitrina de tapas", "en": "Tapas display", "fr": "Vitrine à tapas"}', 41, 'published'),
  -- Panadería y pastelería
  ('horecaria', 'hor-horno-panaderia', 'Horno de panadería', 'Bakery oven', '{"es": "Horno de panadería", "en": "Bakery oven", "fr": "Four de boulangerie"}', 42, 'published'),
  ('horecaria', 'hor-amasadora', 'Amasadora', 'Dough mixer', '{"es": "Amasadora", "en": "Dough mixer", "fr": "Pétrin"}', 43, 'published'),
  ('horecaria', 'hor-fermentadora', 'Fermentadora', 'Proofer', '{"es": "Fermentadora", "en": "Proofer", "fr": "Chambre de fermentation"}', 44, 'published'),
  ('horecaria', 'hor-laminadora-masa', 'Laminadora de masa', 'Dough sheeter', '{"es": "Laminadora de masa", "en": "Dough sheeter", "fr": "Laminoir à pâte"}', 45, 'published'),
  ('horecaria', 'hor-batidora-planetaria', 'Batidora planetaria', 'Planetary mixer', '{"es": "Batidora planetaria", "en": "Planetary mixer", "fr": "Batteur planétaire"}', 46, 'published'),
  ('horecaria', 'hor-vitrina-pasteleria', 'Vitrina de pastelería', 'Pastry display', '{"es": "Vitrina de pastelería", "en": "Pastry display", "fr": "Vitrine pâtisserie"}', 47, 'published'),
  -- Cafetería y bar
  ('horecaria', 'hor-cafetera-espresso', 'Cafetera espresso', 'Espresso machine', '{"es": "Cafetera espresso", "en": "Espresso machine", "fr": "Machine à café espresso"}', 48, 'published'),
  ('horecaria', 'hor-molinillo-cafe', 'Molinillo de café', 'Coffee grinder', '{"es": "Molinillo de café", "en": "Coffee grinder", "fr": "Moulin à café"}', 49, 'published'),
  ('horecaria', 'hor-grifo-cerveza', 'Grifo de cerveza', 'Beer tap', '{"es": "Grifo de cerveza", "en": "Beer tap", "fr": "Tireuse à bière"}', 50, 'published'),
  ('horecaria', 'hor-exprimidor-industrial', 'Exprimidor industrial', 'Industrial juicer', '{"es": "Exprimidor industrial", "en": "Industrial juicer", "fr": "Presse-agrumes industriel"}', 51, 'published'),
  ('horecaria', 'hor-coctelera-blender', 'Coctelera / blender', 'Cocktail shaker / blender', '{"es": "Coctelera / blender", "en": "Cocktail shaker / blender", "fr": "Shaker / blender"}', 52, 'published'),
  ('horecaria', 'hor-termo-leche', 'Termo / calentador de leche', 'Milk heater', '{"es": "Termo / calentador de leche", "en": "Milk heater", "fr": "Chauffe-lait"}', 53, 'published'),
  -- Ventilación y extracción
  ('horecaria', 'hor-campana-mural', 'Campana mural', 'Wall hood', '{"es": "Campana mural", "en": "Wall hood", "fr": "Hotte murale"}', 54, 'published'),
  ('horecaria', 'hor-campana-central', 'Campana central', 'Island hood', '{"es": "Campana central", "en": "Island hood", "fr": "Hotte centrale"}', 55, 'published'),
  ('horecaria', 'hor-extractor-humos', 'Extractor de humos', 'Smoke extractor', '{"es": "Extractor de humos", "en": "Smoke extractor", "fr": "Extracteur de fumée"}', 56, 'published'),
  ('horecaria', 'hor-filtro-carbon', 'Filtro de carbón activo', 'Activated carbon filter', '{"es": "Filtro de carbón activo", "en": "Activated carbon filter", "fr": "Filtre à charbon actif"}', 57, 'published'),
  -- Pequeño equipamiento
  ('horecaria', 'hor-batidora-mano', 'Batidora de mano', 'Hand blender', '{"es": "Batidora de mano", "en": "Hand blender", "fr": "Mixeur plongeant"}', 58, 'published'),
  ('horecaria', 'hor-tostador', 'Tostador', 'Toaster', '{"es": "Tostador", "en": "Toaster", "fr": "Grille-pain"}', 59, 'published'),
  ('horecaria', 'hor-microondas-profesional', 'Microondas profesional', 'Commercial microwave', '{"es": "Microondas profesional", "en": "Commercial microwave", "fr": "Micro-ondes professionnel"}', 60, 'published'),
  ('horecaria', 'hor-selladora-bandejas', 'Selladora de bandejas', 'Tray sealer', '{"es": "Selladora de bandejas", "en": "Tray sealer", "fr": "Operculeuse"}', 61, 'published'),
  ('horecaria', 'hor-sandwichera-gofrera', 'Sandwichera / gofrera', 'Sandwich / waffle maker', '{"es": "Sandwichera / gofrera", "en": "Sandwich / waffle maker", "fr": "Croque-monsieur / gaufrier"}', 62, 'published');

-- C.2 Link subcategories to categories via junction table
INSERT INTO subcategory_categories (subcategory_id, category_id)
SELECT s.id, c.id FROM subcategories s, categories c
WHERE s.vertical = 'horecaria' AND c.vertical = 'horecaria'
AND (
  (c.slug = 'hor-coccion' AND s.slug IN ('hor-horno-conveccion','hor-horno-mixto','hor-cocina-industrial','hor-plancha','hor-freidora','hor-salamandra','hor-bano-maria','hor-parrilla-grill','hor-marmita-basculante','hor-sarten-basculante'))
  OR (c.slug = 'hor-refrigeracion' AND s.slug IN ('hor-camara-frigorifica','hor-camara-congelacion','hor-armario-refrigerado','hor-mesa-refrigerada','hor-vitrina-refrigerada','hor-abatidor-temperatura','hor-fabricador-hielo','hor-botellero'))
  OR (c.slug = 'hor-lavado' AND s.slug IN ('hor-lavavajillas-capota','hor-lavavajillas-tunel','hor-lavavajillas-frontal','hor-lavavasos','hor-fregadero-industrial'))
  OR (c.slug = 'hor-mobiliario' AND s.slug IN ('hor-mesa-trabajo-acero','hor-estanteria-industrial','hor-campana-extractora','hor-carro-transporte','hor-mueble-neutro','hor-silla-taburete','hor-mesa-comedor'))
  OR (c.slug = 'hor-preparacion' AND s.slug IN ('hor-cortadora-fiambre','hor-picadora-carne','hor-procesador-alimentos','hor-peladora-patatas','hor-envasadora-vacio','hor-bascula-industrial'))
  OR (c.slug = 'hor-servicio' AND s.slug IN ('hor-vitrina-caliente','hor-buffet-self-service','hor-dispensador-bebidas','hor-carro-caliente','hor-vitrina-tapas'))
  OR (c.slug = 'hor-panaderia-pasteleria' AND s.slug IN ('hor-horno-panaderia','hor-amasadora','hor-fermentadora','hor-laminadora-masa','hor-batidora-planetaria','hor-vitrina-pasteleria'))
  OR (c.slug = 'hor-cafeteria-bar' AND s.slug IN ('hor-cafetera-espresso','hor-molinillo-cafe','hor-grifo-cerveza','hor-exprimidor-industrial','hor-coctelera-blender','hor-termo-leche'))
  OR (c.slug = 'hor-ventilacion-extraccion' AND s.slug IN ('hor-campana-mural','hor-campana-central','hor-extractor-humos','hor-filtro-carbon'))
  OR (c.slug = 'hor-pequeno-equipamiento' AND s.slug IN ('hor-batidora-mano','hor-tostador','hor-microondas-profesional','hor-selladora-bandejas','hor-sandwichera-gofrera'))
);

-- D. Insert attributes for Horecaria
-- attributes table columns: id, subcategory_id, name (TEXT key), type (filter_type enum), label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order, vertical, label (JSONB)
INSERT INTO attributes (vertical, name, type, label_es, label_en, label, unit, options, is_extra, is_hidden, sort_order, status) VALUES
  ('horecaria', 'potencia', 'slider', 'Potencia', 'Power', '{"es": "Potencia", "en": "Power", "fr": "Puissance"}', 'kW', '{}', false, false, 1, 'published'),
  ('horecaria', 'capacidad', 'caja', 'Capacidad', 'Capacity', '{"es": "Capacidad", "en": "Capacity", "fr": "Capacité"}', NULL, '{}', false, false, 2, 'published'),
  ('horecaria', 'voltaje', 'desplegable', 'Voltaje', 'Voltage', '{"es": "Voltaje", "en": "Voltage", "fr": "Tension"}', 'V', '["220V monofásico", "380V trifásico", "Gas natural", "Gas butano", "Mixto"]', false, false, 3, 'published'),
  ('horecaria', 'dimensiones', 'caja', 'Dimensiones (AnxFxAl)', 'Dimensions (WxDxH)', '{"es": "Dimensiones (AnxFxAl)", "en": "Dimensions (WxDxH)", "fr": "Dimensions (LxPxH)"}', 'mm', '{}', true, false, 4, 'published'),
  ('horecaria', 'peso', 'slider', 'Peso', 'Weight', '{"es": "Peso", "en": "Weight", "fr": "Poids"}', 'kg', '{}', true, false, 5, 'published'),
  ('horecaria', 'material', 'desplegable', 'Material', 'Material', '{"es": "Material", "en": "Material", "fr": "Matériau"}', NULL, '["Acero inoxidable AISI 304", "Acero inoxidable AISI 316", "Aluminio", "Hierro fundido", "Policarbonato", "Otro"]', false, false, 6, 'published'),
  ('horecaria', 'estado_equipo', 'desplegable', 'Estado', 'Condition', '{"es": "Estado", "en": "Condition", "fr": "État"}', NULL, '["Nuevo", "Semi-nuevo", "Reacondicionado", "Usado - buen estado", "Usado - funcional", "Para piezas"]', false, false, 7, 'published'),
  ('horecaria', 'garantia', 'desplegable', 'Garantía', 'Warranty', '{"es": "Garantía", "en": "Warranty", "fr": "Garantie"}', NULL, '["Sin garantía", "3 meses", "6 meses", "12 meses", "24 meses"]', false, false, 8, 'published'),
  ('horecaria', 'certificaciones', 'desplegable_tick', 'Certificaciones', 'Certifications', '{"es": "Certificaciones", "en": "Certifications", "fr": "Certifications"}', NULL, '["CE", "NSF", "ISO 9001", "HACCP compatible", "Energy Star"]', true, false, 9, 'published'),
  ('horecaria', 'tipo_energia', 'desplegable', 'Tipo de energía', 'Energy type', '{"es": "Tipo de energía", "en": "Energy type", "fr": "Type d''énergie"}', NULL, '["Eléctrico", "Gas natural", "Gas butano/propano", "Mixto gas-eléctrico", "Leña/carbón"]', false, false, 10, 'published');

-- E. Insert actions for Horecaria
INSERT INTO actions (vertical, slug, name, sort_order) VALUES
  ('horecaria', 'hor-venta', '{"es": "Venta", "en": "Sale", "fr": "Vente"}', 1),
  ('horecaria', 'hor-alquiler', '{"es": "Alquiler", "en": "Rental", "fr": "Location"}', 2);
