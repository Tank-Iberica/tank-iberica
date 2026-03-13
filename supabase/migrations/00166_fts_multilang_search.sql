-- ============================================================
-- Migration 00166: Multi-language full-text search function
-- ============================================================
-- Creates a search function over content_translations that uses
-- the appropriate FTS config per locale. Leverages existing
-- idx_ct_fts_es, idx_ct_fts_en, idx_ct_fts_fr, idx_ct_fts_de indices.

CREATE OR REPLACE FUNCTION search_content_translations(
  search_query TEXT,
  search_locale VARCHAR(5) DEFAULT 'es',
  search_entity_type VARCHAR DEFAULT NULL,
  page_limit INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  entity_type VARCHAR,
  entity_id UUID,
  field VARCHAR,
  locale VARCHAR(5),
  value TEXT,
  rank REAL
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  fts_config REGCONFIG;
BEGIN
  -- Map locale to PostgreSQL FTS config
  CASE search_locale
    WHEN 'es' THEN fts_config := 'spanish';
    WHEN 'en' THEN fts_config := 'english';
    WHEN 'fr' THEN fts_config := 'french';
    WHEN 'de' THEN fts_config := 'german';
    ELSE fts_config := 'simple';
  END CASE;

  RETURN QUERY
  SELECT
    ct.entity_type,
    ct.entity_id,
    ct.field,
    ct.locale,
    ct.value,
    ts_rank(to_tsvector(fts_config, ct.value), plainto_tsquery(fts_config, search_query)) AS rank
  FROM content_translations ct
  WHERE ct.locale = search_locale
    AND (search_entity_type IS NULL OR ct.entity_type = search_entity_type)
    AND to_tsvector(fts_config, ct.value) @@ plainto_tsquery(fts_config, search_query)
  ORDER BY rank DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;

COMMENT ON FUNCTION search_content_translations IS
  'Full-text search across content_translations with per-locale FTS config. Uses existing GIN indices for es/en/fr/de.';
