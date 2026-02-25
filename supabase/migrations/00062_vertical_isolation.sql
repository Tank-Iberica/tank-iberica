-- =============================================================================
-- Migration: Vertical Isolation Indexes
-- Composite indexes for efficient vertical-scoped queries + RLS enhancement
-- =============================================================================

-- NOTE: vehicles and advertisements tables do NOT have a 'vertical' column,
-- so indexes for those tables are intentionally skipped.

-- Composite indexes for vertical-scoped queries
-- idx_dealers_vertical already exists (from 00031) but IF NOT EXISTS keeps it safe
CREATE INDEX IF NOT EXISTS idx_dealers_vertical ON dealers(vertical);
CREATE INDEX IF NOT EXISTS idx_articles_vertical ON articles(vertical);
CREATE INDEX IF NOT EXISTS idx_categories_vertical ON categories(vertical);
CREATE INDEX IF NOT EXISTS idx_subcategories_vertical ON subcategories(vertical);
