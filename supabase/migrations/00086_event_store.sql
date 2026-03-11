-- Event sourcing store for critical domain events
-- Tracks: payments, auction state changes, vehicle status transitions, reservation lifecycle

CREATE TABLE IF NOT EXISTS event_store (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL, -- 'payment', 'auction', 'vehicle', 'reservation'
  aggregate_id UUID NOT NULL,          -- ID of the entity
  event_type VARCHAR(100) NOT NULL,    -- 'payment.created', 'auction.bid_placed', etc.
  event_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',         -- actor_id, ip, correlation_id
  version INTEGER NOT NULL DEFAULT 1,  -- optimistic concurrency control
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate
  ON event_store (aggregate_type, aggregate_id, version);
CREATE INDEX IF NOT EXISTS idx_event_store_type
  ON event_store (event_type);
CREATE INDEX IF NOT EXISTS idx_event_store_created
  ON event_store (created_at);

-- Unique constraint for optimistic concurrency (same aggregate + version = conflict)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_version_unique
  ON event_store (aggregate_type, aggregate_id, version);

-- Dead letter queue for failed event processing
CREATE TABLE IF NOT EXISTS event_dead_letter (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES event_store(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'retrying', 'exhausted', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_event_dead_letter_status
  ON event_dead_letter (status, next_retry_at)
  WHERE status IN ('pending', 'retrying');

-- RLS: only service role can write events (server-side only)
ALTER TABLE event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dead_letter ENABLE ROW LEVEL SECURITY;

-- Admin read-only access for debugging
DROP POLICY IF EXISTS "admin_read_events" ON event_store;
CREATE POLICY "admin_read_events" ON event_store
  FOR SELECT USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "admin_read_dlq" ON event_dead_letter;
CREATE POLICY "admin_read_dlq" ON event_dead_letter
  FOR SELECT USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Service role has full access (server-side writes)
DROP POLICY IF EXISTS "service_all_events" ON event_store;
CREATE POLICY "service_all_events" ON event_store
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_all_dlq" ON event_dead_letter;
CREATE POLICY "service_all_dlq" ON event_dead_letter
  FOR ALL USING (auth.role() = 'service_role');
