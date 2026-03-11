-- =============================================================================
-- Migration: Job priority queues + distributed event channels
-- §7.4 Priority queues + §6.3 Event bus distribution
-- =============================================================================

-- ============================================================================
-- 1. Add priority column to job_queue
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_queue' AND column_name = 'priority'
  ) THEN
    ALTER TABLE job_queue ADD COLUMN priority INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;

COMMENT ON COLUMN job_queue.priority IS 'Job priority: 1=critical (payments), 3=high (notifications), 5=normal (reports), 7=low (analytics). Lower number = higher priority.';

-- Index for priority-based claim ordering
CREATE INDEX IF NOT EXISTS idx_job_queue_priority_scheduled
  ON job_queue (priority ASC, scheduled_at ASC)
  WHERE status = 'pending';

-- Update claim_pending_jobs to respect priority
CREATE OR REPLACE FUNCTION claim_pending_jobs(batch_size INTEGER DEFAULT 10)
RETURNS SETOF job_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT id
    FROM job_queue
    WHERE status = 'pending'
      AND scheduled_at <= now()
    ORDER BY priority ASC, scheduled_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE job_queue jq
  SET status = 'processing', started_at = now()
  FROM claimed c
  WHERE jq.id = c.id
  RETURNING jq.*;
END;
$$;

-- ============================================================================
-- 2. Event channels table for distributed event persistence
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  vertical TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for channel queries
CREATE INDEX IF NOT EXISTS idx_event_channels_channel_created
  ON event_channels (channel, created_at DESC);

-- Auto-cleanup: events older than 7 days
CREATE INDEX IF NOT EXISTS idx_event_channels_created_at
  ON event_channels (created_at);

-- RLS
ALTER TABLE event_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage event channels" ON event_channels;
CREATE POLICY "Service can manage event channels" ON event_channels
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated can read event channels" ON event_channels;
CREATE POLICY "Authenticated can read event channels" ON event_channels
  FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON TABLE event_channels IS 'Persistent log of distributed events for audit trail and replay. Auto-cleaned after 7 days.';

-- ============================================================================
-- 3. Dead letter alerting: notify function
-- ============================================================================

-- Trigger function that fires pg_notify when a job enters dead letter state
CREATE OR REPLACE FUNCTION notify_dead_letter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'dead' AND (OLD.status IS NULL OR OLD.status != 'dead') THEN
    PERFORM pg_notify(
      'dead_letter_alert',
      json_build_object(
        'job_id', NEW.id,
        'job_type', NEW.job_type,
        'error', NEW.error_message,
        'retries', NEW.retries
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dead_letter_notify ON job_queue;
CREATE TRIGGER trg_dead_letter_notify
  AFTER UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_dead_letter();
