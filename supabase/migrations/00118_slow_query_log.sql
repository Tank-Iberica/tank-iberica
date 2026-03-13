-- Migration 00118: slow_query_log table + pg_stat_statements setup
-- Stores slow query snapshots (>500ms) captured by cron/slow-query-check.
-- pg_stat_statements extension is enabled by Supabase by default.

-- Enable pg_stat_statements (safe if already enabled — Supabase default)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slow query log table
CREATE TABLE IF NOT EXISTS public.slow_query_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical      TEXT NOT NULL DEFAULT 'tracciona',
  query_hash    TEXT NOT NULL,        -- pg_stat_statements.queryid as hex
  query_text    TEXT NOT NULL,        -- anonymized query (no literals)
  calls         BIGINT NOT NULL,
  mean_exec_ms  NUMERIC(10,3) NOT NULL,  -- mean execution time in ms
  max_exec_ms   NUMERIC(10,3) NOT NULL,
  total_exec_ms NUMERIC(10,3) NOT NULL,
  rows_per_call NUMERIC(10,2),
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate snapshots of the same query in the same minute
CREATE UNIQUE INDEX IF NOT EXISTS uq_slow_query_minute
  ON public.slow_query_logs (query_hash, date_trunc('minute', captured_at));

-- Index for recent slow queries dashboard
CREATE INDEX IF NOT EXISTS idx_slow_query_recent
  ON public.slow_query_logs (captured_at DESC);

-- Index for worst offenders
CREATE INDEX IF NOT EXISTS idx_slow_query_mean_exec
  ON public.slow_query_logs (mean_exec_ms DESC);

-- RLS: only service_role
ALTER TABLE public.slow_query_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.slow_query_logs
  USING (auth.role() = 'service_role');

-- Helper RPC: returns current slow queries from pg_stat_statements
CREATE OR REPLACE FUNCTION public.get_slow_queries(p_threshold_ms NUMERIC DEFAULT 500)
RETURNS TABLE (
  query_hash    TEXT,
  query_text    TEXT,
  calls         BIGINT,
  mean_exec_ms  NUMERIC,
  max_exec_ms   NUMERIC,
  total_exec_ms NUMERIC,
  rows_per_call NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    queryid::TEXT                                          AS query_hash,
    SUBSTRING(query FROM 1 FOR 500)                        AS query_text,
    calls,
    ROUND((mean_exec_time)::NUMERIC, 3)                   AS mean_exec_ms,
    ROUND((max_exec_time)::NUMERIC, 3)                    AS max_exec_ms,
    ROUND((total_exec_time)::NUMERIC, 3)                  AS total_exec_ms,
    CASE WHEN calls > 0
      THEN ROUND((rows::NUMERIC / calls), 2)
      ELSE 0
    END                                                    AS rows_per_call
  FROM pg_stat_statements
  WHERE mean_exec_time >= p_threshold_ms
    AND dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  ORDER BY mean_exec_time DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.get_slow_queries(NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_slow_queries(NUMERIC) TO service_role;
