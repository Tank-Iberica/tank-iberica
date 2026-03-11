-- =============================================================================
-- Migration 00073: Complete Tracciona vertical seed data
-- - Enriches vertical_config with full theme, SEO, actions, hero content
-- - Adds core vehicle attributes (brand, year, km, fuel, transmission, etc.)
-- =============================================================================

-- 1. Update Tracciona vertical_config with complete settings
UPDATE vertical_config
SET
  meta_description = '{"es": "Compra, venta y alquiler de vehículos industriales: camiones, cisternas, tractoras, semirremolques y más. El marketplace B2B líder para el transporte pesado.", "en": "Buy, sell and rent industrial vehicles: trucks, tankers, tractor units, semi-trailers and more. The leading B2B marketplace for heavy transport."}'::jsonb,

  theme = '{"primary": "#23424A", "primary_hover": "#1a3338", "secondary": "#2a6049", "accent": "#d4a853", "bg_primary": "#FFFFFF", "bg_secondary": "#F5F7F6", "text_primary": "#1A1E1C", "text_secondary": "#4A524E", "border_color": "#D8DDD9", "success": "#0B6E3B", "warning": "#C47A1A", "error": "#C23A3A"}'::jsonb,

  font_preset = 'default',

  active_locales = ARRAY['es', 'en'],
  default_locale = 'es',

  active_actions = ARRAY['venta', 'alquiler', 'terceros'],

  homepage_sections = '{"featured": true, "categories": true, "latest": true, "auctions": true, "articles": true, "services": true, "stats": true, "dealer_logos": false}'::jsonb,

  hero_title = '{"es": "El marketplace de vehículos industriales", "en": "The industrial vehicle marketplace"}'::jsonb,
  hero_subtitle = '{"es": "Compra, vende y alquila camiones, cisternas, tractoras y mucho más. Miles de anunciantes profesionales.", "en": "Buy, sell and rent trucks, tankers, tractor units and much more. Thousands of professional sellers."}'::jsonb,
  hero_cta_text = '{"es": "Ver catálogo", "en": "Browse catalog"}'::jsonb,
  hero_cta_url = '/catalogo',

  subscription_prices = '{
    "free":     {"monthly_cents": 0,     "annual_cents": 0},
    "basic":    {"monthly_cents": 2900,  "annual_cents": 29000},
    "premium":  {"monthly_cents": 7900,  "annual_cents": 79000},
    "founding": {"monthly_cents": 0,     "annual_cents": 0}
  }'::jsonb,

  commission_rates = '{
    "sale_pct": 0,
    "auction_buyer_premium_pct": 8.0,
    "transport_commission_pct": 10.0,
    "transfer_commission_pct": 15.0,
    "verification_level1_cents": 0,
    "verification_level2_cents": 4900,
    "verification_level3_cents": 14900
  }'::jsonb,

  require_vehicle_approval = false,
  require_article_approval = false,
  auto_translate_on_publish = true,
  auto_publish_social = false

WHERE vertical = 'tracciona';


-- 2. Add core vehicle attributes for Tracciona vertical
-- These are vertical-level attributes (not subcategory-specific).
-- Subcategory-specific attributes (ejes, descarga, volumen, etc.) already exist
-- from filter_definitions migration 00026/00027.
-- Uses WHERE NOT EXISTS for idempotency (no UNIQUE constraint on vertical+name).

DO $$
BEGIN
  INSERT INTO attributes (vertical, name, type, label_es, label_en, label, unit, options, is_extra, is_hidden, sort_order, status)
  SELECT vals.*
  FROM (VALUES
    -- Core identification
    ('tracciona'::varchar, 'marca',               'caja'::filter_type,        'Marca',              'Brand',             '{"es": "Marca",              "en": "Brand"            }'::jsonb, NULL::text, '{}'::jsonb,                                                                                                                                                                                               false, false,  1, 'published'::vehicle_status),
    ('tracciona',          'modelo',              'caja'::filter_type,        'Modelo',             'Model',             '{"es": "Modelo",             "en": "Model"            }'::jsonb, NULL,       '{}',                                                                                                                                                                                                      false, false,  2, 'published'::vehicle_status),
    ('tracciona',          'anio_fabricacion',    'slider'::filter_type,      'Año de fabricación', 'Year',              '{"es": "Año de fabricación", "en": "Year"             }'::jsonb, NULL,       '{}',                                                                                                                                                                                                      false, false,  3, 'published'::vehicle_status),
    -- Condition and use
    ('tracciona',          'estado_vehiculo',     'desplegable'::filter_type, 'Estado',             'Condition',         '{"es": "Estado",             "en": "Condition"        }'::jsonb, NULL,       '["Nuevo", "Semi-nuevo", "Usado - muy bueno", "Usado - bueno", "Usado - funcional", "Para piezas / reparar"]'::jsonb,                                                                                       false, false,  4, 'published'::vehicle_status),
    ('tracciona',          'kilometros',          'slider'::filter_type,      'Kilómetros',         'Kilometres',        '{"es": "Kilómetros",         "en": "Kilometres"       }'::jsonb, 'km',       '{}',                                                                                                                                                                                                      false, false,  5, 'published'::vehicle_status),
    ('tracciona',          'horas_motor',         'slider'::filter_type,      'Horas de motor',     'Engine hours',      '{"es": "Horas de motor",     "en": "Engine hours"     }'::jsonb, 'h',        '{}',                                                                                                                                                                                                      true,  false,  6, 'published'::vehicle_status),
    -- Engine & mechanics
    ('tracciona',          'tipo_combustible',    'desplegable'::filter_type, 'Combustible',        'Fuel type',         '{"es": "Combustible",        "en": "Fuel type"        }'::jsonb, NULL,       '["Diésel", "Gasolina", "Gas natural (GNC)", "Gas licuado (GLP)", "Híbrido diésel-eléctrico", "Eléctrico", "Hidrógeno"]'::jsonb,                                                                           false, false,  7, 'published'::vehicle_status),
    ('tracciona',          'potencia_cv',         'slider'::filter_type,      'Potencia (CV)',       'Power (HP)',        '{"es": "Potencia (CV)",      "en": "Power (HP)"       }'::jsonb, 'CV',       '{}',                                                                                                                                                                                                      false, false,  8, 'published'::vehicle_status),
    ('tracciona',          'norma_euro',          'desplegable'::filter_type, 'Norma Euro',         'Euro norm',         '{"es": "Norma Euro",         "en": "Euro norm"        }'::jsonb, NULL,       '["Euro 3", "Euro 4", "Euro 5", "Euro 6", "Euro 6c", "Euro 6d", "Pre-Euro"]'::jsonb,                                                                                                                        false, false,  9, 'published'::vehicle_status),
    ('tracciona',          'tipo_transmision',    'desplegable'::filter_type, 'Transmisión',        'Transmission',      '{"es": "Transmisión",        "en": "Transmission"     }'::jsonb, NULL,       '["Manual", "Automático", "Automático secuencial", "Retarder"]'::jsonb,                                                                                                                                      false, false, 10, 'published'::vehicle_status),
    -- Weight & dimensions
    ('tracciona',          'peso_bruto_vehiculo', 'slider'::filter_type,      'MMA (kg)',            'GVW (kg)',          '{"es": "MMA (kg)",           "en": "GVW (kg)"         }'::jsonb, 'kg',       '{}',                                                                                                                                                                                                      false, false, 11, 'published'::vehicle_status),
    ('tracciona',          'tara',                'slider'::filter_type,      'Tara (kg)',           'Tare (kg)',         '{"es": "Tara (kg)",          "en": "Tare (kg)"        }'::jsonb, 'kg',       '{}',                                                                                                                                                                                                      true,  false, 12, 'published'::vehicle_status),
    ('tracciona',          'longitud_total',      'slider'::filter_type,      'Longitud total (m)', 'Total length (m)',  '{"es": "Longitud total (m)", "en": "Total length (m)" }'::jsonb, 'm',        '{}',                                                                                                                                                                                                      true,  false, 13, 'published'::vehicle_status),
    -- Regulatory & documentation
    ('tracciona',          'itv_hasta',           'caja'::filter_type,        'ITV hasta',          'Roadworthy until',  '{"es": "ITV hasta",          "en": "Roadworthy until" }'::jsonb, NULL,       '{}',                                                                                                                                                                                                      true,  false, 14, 'published'::vehicle_status),
    ('tracciona',          'adr',                 'desplegable'::filter_type, 'Homologación ADR',   'ADR approval',      '{"es": "Homologación ADR",   "en": "ADR approval"     }'::jsonb, NULL,       '["Sin ADR", "ADR Clase 2", "ADR Clase 3", "ADR Clase 4", "ADR Clase 8", "ADR Clase 9", "ADR Multiclase"]'::jsonb,                                                                                         true,  false, 15, 'published'::vehicle_status),
    -- Extras
    ('tracciona',          'color',               'desplegable'::filter_type, 'Color',              'Colour',            '{"es": "Color",              "en": "Colour"           }'::jsonb, NULL,       '["Blanco", "Gris", "Plateado", "Negro", "Azul", "Rojo", "Verde", "Naranja", "Amarillo", "Otro"]'::jsonb,                                                                                                    true,  false, 16, 'published'::vehicle_status),
    ('tracciona',          'numero_plazas',       'slider'::filter_type,      'Número de plazas',   'Number of seats',   '{"es": "Número de plazas",   "en": "Number of seats"  }'::jsonb, NULL,       '{}',                                                                                                                                                                                                      true,  false, 17, 'published'::vehicle_status)
  ) AS vals(vertical, name, type, label_es, label_en, label, unit, options, is_extra, is_hidden, sort_order, status)
  WHERE NOT EXISTS (
    SELECT 1 FROM attributes a
    WHERE a.vertical = vals.vertical AND a.name = vals.name
  );
END $$;
