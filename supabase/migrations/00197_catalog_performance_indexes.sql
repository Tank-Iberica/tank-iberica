-- Migration: composite indexes for catalog performance
-- Resolves: Seq Scans on filtered catalog queries (identified in BOTTLENECKS-LOAD-TESTING.md)
-- Targets: P0 bottleneck — catalog filter queries under load

-- Composite index for the main catalog filter pattern:
-- WHERE status = 'published' AND vertical = ? AND category = ? ORDER BY sort_boost DESC, created_at DESC
CREATE INDEX IF NOT EXISTS idx_vehicles_catalog
  ON public.vehicles(status, vertical, category, sort_boost DESC, created_at DESC)
  WHERE status = 'published';

-- Composite index for price range filters + year
CREATE INDEX IF NOT EXISTS idx_vehicles_catalog_price
  ON public.vehicles(status, vertical, year, price)
  WHERE status = 'published';

-- Composite index for location-based browsing
CREATE INDEX IF NOT EXISTS idx_vehicles_catalog_location
  ON public.vehicles(status, vertical, location_country, location_province)
  WHERE status = 'published';

-- Partial index for featured vehicles (used in homepage hero)
CREATE INDEX IF NOT EXISTS idx_vehicles_featured
  ON public.vehicles(vertical, sort_boost DESC, created_at DESC)
  WHERE status = 'published' AND featured = true;
