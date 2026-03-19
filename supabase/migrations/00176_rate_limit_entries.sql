-- #N29 — DB-backed rate limiting fallback (sliding window)
-- Works without Redis or WAF as a pure PostgreSQL fallback.

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key        TEXT    NOT NULL,         -- composite key: "action:user:abc123:publish"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient window queries and cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_created ON rate_limit_entries (key, created_at DESC);
-- Index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON rate_limit_entries (created_at);

-- RLS: only service role can access
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role can access (default deny for anon/authenticated)

-- ── RPC: check_rate_limit ────────────────────────────────────────────────────
-- Atomic check-and-insert: counts recent entries, inserts if under limit.
-- Returns TRUE if allowed, FALSE if rate limited.

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_window_seconds INT DEFAULT 3600,
  p_max_requests INT DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Count requests in window
  SELECT COUNT(*)
  INTO v_count
  FROM rate_limit_entries
  WHERE key = p_key
    AND created_at >= v_window_start;

  -- Check limit
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Insert new entry
  INSERT INTO rate_limit_entries (key, created_at) VALUES (p_key, now());

  RETURN TRUE;
END;
$$;

-- ── RPC: cleanup_rate_limit_entries ──────────────────────────────────────────
-- Deletes entries older than the specified window. Run periodically via cron.

CREATE OR REPLACE FUNCTION cleanup_rate_limit_entries(
  p_max_age_seconds INT DEFAULT 7200  -- 2 hours default
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM rate_limit_entries
  WHERE created_at < now() - (p_max_age_seconds || ' seconds')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Grant execute to service_role only
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limit_entries TO service_role;
