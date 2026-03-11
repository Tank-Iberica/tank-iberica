-- Add schema_version column to event_store for event schema evolution
ALTER TABLE public.event_store
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.event_store.schema_version IS 'Schema version of the event_data payload. Increment when event structure changes.';

-- Index for querying events by schema version (useful for migrations)
CREATE INDEX IF NOT EXISTS idx_event_store_schema_version
  ON public.event_store (event_type, schema_version);
