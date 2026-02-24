-- Session 36 Part A: Missing indexes identified in cross-audit
-- These complement the indexes from migration 00056_performance_indexes.sql

-- Filtrado por categoría en catálogo (query frecuente)
CREATE INDEX IF NOT EXISTS idx_vehicles_category_id ON vehicles (category_id);

-- Pujas por subasta (consulta constante durante subasta en vivo)
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids (auction_id, created_at DESC);

-- Artículos publicados por fecha (listado público de noticias/guías)
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles (status, published_at DESC) WHERE status = 'published';
