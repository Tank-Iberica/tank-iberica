-- =============================================================================
-- SEED: geo_regions España — 1 país + 17 CCAA + 52 provincias
-- Archivo: docs/tracciona-docs/seeds/geo_regions_spain.sql
-- Uso: ejecutar como parte de la sesión 2 Bloque D o después de crear la tabla geo_regions
-- Para añadir otro país: copiar este patrón cambiando country_code y regiones
-- =============================================================================

-- País
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, sort_order) VALUES
('ES', 'country', 'espana', '{"es":"España","en":"Spain","fr":"Espagne","de":"Spanien","it":"Spagna","nl":"Spanje","pl":"Hiszpania"}', NULL, 0);

-- 17 Comunidades Autónomas
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, sort_order) VALUES
('ES', 'region', 'andalucia',           '{"es":"Andalucía","en":"Andalusia","fr":"Andalousie","de":"Andalusien"}',         'espana', 1),
('ES', 'region', 'aragon',              '{"es":"Aragón","en":"Aragon","fr":"Aragon","de":"Aragonien"}',                     'espana', 2),
('ES', 'region', 'asturias',            '{"es":"Asturias","en":"Asturias","fr":"Asturies","de":"Asturien"}',                 'espana', 3),
('ES', 'region', 'baleares',            '{"es":"Islas Baleares","en":"Balearic Islands","fr":"Îles Baléares","de":"Balearen"}', 'espana', 4),
('ES', 'region', 'canarias',            '{"es":"Canarias","en":"Canary Islands","fr":"Îles Canaries","de":"Kanarische Inseln"}', 'espana', 5),
('ES', 'region', 'cantabria',           '{"es":"Cantabria","en":"Cantabria","fr":"Cantabrie","de":"Kantabrien"}',             'espana', 6),
('ES', 'region', 'castilla_la_mancha',  '{"es":"Castilla-La Mancha","en":"Castilla-La Mancha","fr":"Castille-La Manche","de":"Kastilien-La Mancha"}', 'espana', 7),
('ES', 'region', 'castilla_y_leon',     '{"es":"Castilla y León","en":"Castile and León","fr":"Castille-et-León","de":"Kastilien und León"}', 'espana', 8),
('ES', 'region', 'cataluna',            '{"es":"Cataluña","en":"Catalonia","fr":"Catalogne","de":"Katalonien"}',             'espana', 9),
('ES', 'region', 'extremadura',         '{"es":"Extremadura","en":"Extremadura","fr":"Estrémadure","de":"Extremadura"}',     'espana', 10),
('ES', 'region', 'galicia',             '{"es":"Galicia","en":"Galicia","fr":"Galice","de":"Galicien"}',                     'espana', 11),
('ES', 'region', 'madrid',              '{"es":"Comunidad de Madrid","en":"Community of Madrid","fr":"Communauté de Madrid","de":"Autonome Gemeinschaft Madrid"}', 'espana', 12),
('ES', 'region', 'murcia',              '{"es":"Región de Murcia","en":"Region of Murcia","fr":"Région de Murcie","de":"Region Murcia"}', 'espana', 13),
('ES', 'region', 'navarra',             '{"es":"Navarra","en":"Navarre","fr":"Navarre","de":"Navarra"}',                     'espana', 14),
('ES', 'region', 'pais_vasco',          '{"es":"País Vasco","en":"Basque Country","fr":"Pays basque","de":"Baskenland"}',     'espana', 15),
('ES', 'region', 'la_rioja',            '{"es":"La Rioja","en":"La Rioja","fr":"La Rioja","de":"La Rioja"}',                 'espana', 16),
('ES', 'region', 'valencia',            '{"es":"Comunidad Valenciana","en":"Valencian Community","fr":"Communauté valencienne","de":"Valencianische Gemeinschaft"}', 'espana', 17);

-- Ciudades autónomas
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, sort_order) VALUES
('ES', 'region', 'ceuta',  '{"es":"Ceuta","en":"Ceuta","fr":"Ceuta","de":"Ceuta"}',     'espana', 18),
('ES', 'region', 'melilla','{"es":"Melilla","en":"Melilla","fr":"Melilla","de":"Melilla"}','espana', 19);

-- 52 Provincias (agrupadas por CCAA)
-- Andalucía (8)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'almeria',    '{"es":"Almería","en":"Almería"}',       'andalucia', '04___', 1),
('ES', 'province', 'cadiz',      '{"es":"Cádiz","en":"Cádiz"}',           'andalucia', '11___', 2),
('ES', 'province', 'cordoba',    '{"es":"Córdoba","en":"Córdoba"}',       'andalucia', '14___', 3),
('ES', 'province', 'granada',    '{"es":"Granada","en":"Granada"}',       'andalucia', '18___', 4),
('ES', 'province', 'huelva',     '{"es":"Huelva","en":"Huelva"}',         'andalucia', '21___', 5),
('ES', 'province', 'jaen',       '{"es":"Jaén","en":"Jaén"}',             'andalucia', '23___', 6),
('ES', 'province', 'malaga',     '{"es":"Málaga","en":"Málaga"}',         'andalucia', '29___', 7),
('ES', 'province', 'sevilla',    '{"es":"Sevilla","en":"Seville"}',       'andalucia', '41___', 8);
-- Aragón (3)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'huesca',     '{"es":"Huesca","en":"Huesca"}',         'aragon', '22___', 1),
('ES', 'province', 'teruel',     '{"es":"Teruel","en":"Teruel"}',         'aragon', '44___', 2),
('ES', 'province', 'zaragoza',   '{"es":"Zaragoza","en":"Zaragoza"}',     'aragon', '50___', 3);
-- Asturias (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'asturias_p', '{"es":"Asturias","en":"Asturias"}',     'asturias', '33___', 1);
-- Baleares (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'baleares_p', '{"es":"Islas Baleares","en":"Balearic Islands"}', 'baleares', '07___', 1);
-- Canarias (2)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'las_palmas',       '{"es":"Las Palmas","en":"Las Palmas"}',             'canarias', '35___', 1),
('ES', 'province', 'santa_cruz',       '{"es":"Santa Cruz de Tenerife","en":"Santa Cruz de Tenerife"}', 'canarias', '38___', 2);
-- Cantabria (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'cantabria_p','{"es":"Cantabria","en":"Cantabria"}',   'cantabria', '39___', 1);
-- Castilla-La Mancha (5)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'albacete',   '{"es":"Albacete","en":"Albacete"}',     'castilla_la_mancha', '02___', 1),
('ES', 'province', 'ciudad_real','{"es":"Ciudad Real","en":"Ciudad Real"}','castilla_la_mancha', '13___', 2),
('ES', 'province', 'cuenca',     '{"es":"Cuenca","en":"Cuenca"}',         'castilla_la_mancha', '16___', 3),
('ES', 'province', 'guadalajara','{"es":"Guadalajara","en":"Guadalajara"}','castilla_la_mancha', '19___', 4),
('ES', 'province', 'toledo',     '{"es":"Toledo","en":"Toledo"}',         'castilla_la_mancha', '45___', 5);
-- Castilla y León (9)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'avila',      '{"es":"Ávila","en":"Ávila"}',           'castilla_y_leon', '05___', 1),
('ES', 'province', 'burgos',     '{"es":"Burgos","en":"Burgos"}',         'castilla_y_leon', '09___', 2),
('ES', 'province', 'leon',       '{"es":"León","en":"León"}',             'castilla_y_leon', '24___', 3),
('ES', 'province', 'palencia',   '{"es":"Palencia","en":"Palencia"}',     'castilla_y_leon', '34___', 4),
('ES', 'province', 'salamanca',  '{"es":"Salamanca","en":"Salamanca"}',   'castilla_y_leon', '37___', 5),
('ES', 'province', 'segovia',    '{"es":"Segovia","en":"Segovia"}',       'castilla_y_leon', '40___', 6),
('ES', 'province', 'soria',      '{"es":"Soria","en":"Soria"}',           'castilla_y_leon', '42___', 7),
('ES', 'province', 'valladolid', '{"es":"Valladolid","en":"Valladolid"}', 'castilla_y_leon', '47___', 8),
('ES', 'province', 'zamora',     '{"es":"Zamora","en":"Zamora"}',         'castilla_y_leon', '49___', 9);
-- Cataluña (4)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'barcelona',  '{"es":"Barcelona","en":"Barcelona"}',   'cataluna', '08___', 1),
('ES', 'province', 'girona',     '{"es":"Girona","en":"Girona"}',         'cataluna', '17___', 2),
('ES', 'province', 'lleida',     '{"es":"Lleida","en":"Lleida"}',         'cataluna', '25___', 3),
('ES', 'province', 'tarragona',  '{"es":"Tarragona","en":"Tarragona"}',   'cataluna', '43___', 4);
-- Extremadura (2)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'badajoz',    '{"es":"Badajoz","en":"Badajoz"}',       'extremadura', '06___', 1),
('ES', 'province', 'caceres',    '{"es":"Cáceres","en":"Cáceres"}',       'extremadura', '10___', 2);
-- Galicia (4)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'a_coruna',   '{"es":"A Coruña","en":"A Coruña"}',     'galicia', '15___', 1),
('ES', 'province', 'lugo',       '{"es":"Lugo","en":"Lugo"}',             'galicia', '27___', 2),
('ES', 'province', 'ourense',    '{"es":"Ourense","en":"Ourense"}',       'galicia', '32___', 3),
('ES', 'province', 'pontevedra', '{"es":"Pontevedra","en":"Pontevedra"}', 'galicia', '36___', 4);
-- Madrid (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'madrid_p',   '{"es":"Madrid","en":"Madrid"}',         'madrid', '28___', 1);
-- Murcia (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'murcia_p',   '{"es":"Murcia","en":"Murcia"}',         'murcia', '30___', 1);
-- Navarra (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'navarra_p',  '{"es":"Navarra","en":"Navarre"}',       'navarra', '31___', 1);
-- País Vasco (3)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'alava',      '{"es":"Álava","en":"Álava"}',           'pais_vasco', '01___', 1),
('ES', 'province', 'guipuzcoa',  '{"es":"Guipúzcoa","en":"Gipuzkoa"}',   'pais_vasco', '20___', 2),
('ES', 'province', 'vizcaya',    '{"es":"Vizcaya","en":"Biscay"}',        'pais_vasco', '48___', 3);
-- La Rioja (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'la_rioja_p', '{"es":"La Rioja","en":"La Rioja"}',     'la_rioja', '26___', 1);
-- Comunidad Valenciana (3)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'alicante',   '{"es":"Alicante","en":"Alicante"}',     'valencia', '03___', 1),
('ES', 'province', 'castellon',  '{"es":"Castellón","en":"Castellón"}',   'valencia', '12___', 2),
('ES', 'province', 'valencia_p', '{"es":"Valencia","en":"Valencia"}',     'valencia', '46___', 3);

-- =============================================================================
-- Total: 1 país + 19 regiones (17 CCAA + Ceuta + Melilla) + 52 provincias = 72 registros
-- 
-- PARA AÑADIR OTRO PAÍS (ejemplo Francia):
-- INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug) VALUES
-- ('FR', 'country', 'france', '{"es":"Francia","en":"France","fr":"France","de":"Frankreich"}', NULL),
-- ('FR', 'region', 'ile_de_france', '{"es":"Isla de Francia","en":"Île-de-France","fr":"Île-de-France"}', 'france'),
-- ('FR', 'province', 'paris', '{"es":"París","en":"Paris","fr":"Paris"}', 'ile_de_france');
-- Sin cambios de código. Solo INSERT.
-- =============================================================================
