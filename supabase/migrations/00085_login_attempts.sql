-- Account lockout: track failed login attempts per email
-- After 5 failures within 15 minutes, account is locked for 30 minutes
-- Turnstile captcha required to unlock

CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — this table is only accessed by server-side endpoints
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Index for cleanup cron
CREATE INDEX IF NOT EXISTS idx_login_attempts_updated
  ON login_attempts (updated_at);

-- Auto-cleanup old entries (>24h) to prevent table bloat
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM login_attempts
  WHERE updated_at < now() - interval '24 hours';
$$;
