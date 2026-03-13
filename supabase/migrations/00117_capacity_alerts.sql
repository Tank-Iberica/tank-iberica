-- Migration 00117: capacity_alerts table
-- Stores automated capacity threshold alerts (>70%) for infra monitoring.
-- Populated by cron/capacity-check endpoint.

CREATE TABLE IF NOT EXISTS public.capacity_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical    TEXT NOT NULL DEFAULT 'tracciona',
  metric      TEXT NOT NULL,          -- 'storage' | 'connections' | 'bandwidth'
  current_value NUMERIC(10,2) NOT NULL,  -- current usage percentage (0-100)
  threshold   NUMERIC(5,2) NOT NULL DEFAULT 70.0,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,  -- >=90%
  details     JSONB NOT NULL DEFAULT '{}',
  notified_at TIMESTAMPTZ,            -- NULL until notification sent
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for polling recent unresolved alerts
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_unresolved
  ON public.capacity_alerts (vertical, metric, created_at DESC)
  WHERE resolved_at IS NULL;

-- Index for notification batching
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_unnotified
  ON public.capacity_alerts (created_at DESC)
  WHERE notified_at IS NULL AND resolved_at IS NULL;

-- RLS: only service_role can read/write
ALTER TABLE public.capacity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.capacity_alerts
  USING (auth.role() = 'service_role');

-- ── Helper RPC functions ───────────────────────────────────────────────────────

-- Returns current database size in bytes
CREATE OR REPLACE FUNCTION public.get_db_size_bytes()
RETURNS TABLE (size_bytes BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT pg_database_size(current_database())::BIGINT AS size_bytes;
$$;

REVOKE ALL ON FUNCTION public.get_db_size_bytes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_db_size_bytes() TO service_role;

-- Returns count of active (non-idle) database connections
CREATE OR REPLACE FUNCTION public.get_active_connections()
RETURNS TABLE (count BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::BIGINT AS count
  FROM pg_stat_activity
  WHERE state != 'idle' AND datname = current_database();
$$;

REVOKE ALL ON FUNCTION public.get_active_connections() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_connections() TO service_role;
