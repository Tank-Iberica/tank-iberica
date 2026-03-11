-- Migration 00084: Add digest_frequency to users for configurable email digest cadence
-- Users can choose: daily, weekly (default), or never

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS digest_frequency VARCHAR(10)
    DEFAULT 'weekly'
    CHECK (digest_frequency IN ('daily', 'weekly', 'never'));

COMMENT ON COLUMN users.digest_frequency IS
  'Email digest cadence chosen by the user. '
  'daily = receive digest every morning; weekly = every Monday; never = opt-out. '
  'Default: weekly.';

-- Index for cron queries that batch-send digests by frequency
CREATE INDEX IF NOT EXISTS idx_users_digest_frequency
  ON users (digest_frequency)
  WHERE digest_frequency != 'never';
