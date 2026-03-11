-- ============================================================
-- Migration 00078: Scheduled publish for vehicles
-- ============================================================
-- Adds scheduled_publish_at column so dealers can queue a vehicle
-- to be automatically published at a specific date/time.
-- The existing cron/publish-scheduled.post.ts processes this.
-- ============================================================

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz;

-- Index for efficient cron query (find vehicles ready to publish)
CREATE INDEX IF NOT EXISTS idx_vehicles_scheduled_publish
  ON vehicles (scheduled_publish_at)
  WHERE status = 'draft' AND scheduled_publish_at IS NOT NULL;

COMMENT ON COLUMN vehicles.scheduled_publish_at IS
  'If set and status=draft, the publish-scheduled cron will set status=published at this datetime.';
