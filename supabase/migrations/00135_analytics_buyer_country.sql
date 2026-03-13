-- 00135: Analytics — buyer_country column + index
-- Covers backlog item #38 (origen geográfico comprador)
-- The client code (useAnalyticsTracking) already sends buyer_country in every
-- tracked event. This migration adds the column so inserts are actually persisted.

ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS buyer_country VARCHAR(2);

COMMENT ON COLUMN analytics_events.buyer_country IS
  'ISO 3166-1 alpha-2 country code of the buyer, inferred from CF-IPCountry header via /api/geo';

-- Index for geo analytics queries (e.g. "top buyer countries")
CREATE INDEX IF NOT EXISTS idx_analytics_events_buyer_country
  ON analytics_events(buyer_country)
  WHERE buyer_country IS NOT NULL;
