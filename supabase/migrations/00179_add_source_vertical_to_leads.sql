-- Migration: Add source_vertical to leads for cross-vertical tracking (#46)
-- analytics_events already has vertical column; leads needs it for cross-vertical buyer analysis

-- Add source_vertical column to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source_vertical VARCHAR(64);

-- Index for cross-vertical queries
CREATE INDEX IF NOT EXISTS idx_leads_source_vertical
  ON leads (source_vertical)
  WHERE source_vertical IS NOT NULL;

-- Backfill existing leads from their dealer's vertical
UPDATE leads
SET source_vertical = d.vertical
FROM dealers d
WHERE leads.dealer_id = d.id
  AND leads.source_vertical IS NULL;

-- Comment for documentation
COMMENT ON COLUMN leads.source_vertical IS 'Vertical where the lead originated (denormalized from dealer for cross-vertical tracking)';
