-- ================================================
-- 00138: User device fingerprints for multi-account detection
-- Records browser fingerprint per user/session for anti-fraud.
-- Admin can view users sharing the same device fingerprint.
-- ================================================

-- ── user_fingerprints table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_fingerprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fp_hash         TEXT NOT NULL,        -- djb2(user_agent|accept_language) hex
  ua_hint         TEXT,                 -- first 120 chars of UA (for debugging)
  ip_hint         TEXT,                 -- partial IP: first two octets only
  first_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count   INT NOT NULL DEFAULT 1,
  CONSTRAINT user_fingerprints_unique UNIQUE (user_id, fp_hash)
);

COMMENT ON TABLE user_fingerprints IS
  'Records browser fingerprints (djb2 hash of user-agent + accept-language) per user. '
  'Used for multi-account detection: if multiple user_ids share the same fp_hash, '
  'they may be the same person with multiple accounts.';

COMMENT ON COLUMN user_fingerprints.fp_hash IS
  'DJB2 hash of "user_agent|accept_language" as hex string (non-cryptographic, for rate limiting + fraud detection).';

COMMENT ON COLUMN user_fingerprints.ua_hint IS
  'First 120 characters of the User-Agent string for human-readable debugging. '
  'Never used for exact matching.';

COMMENT ON COLUMN user_fingerprints.ip_hint IS
  'First two octets of the client IP (e.g., "93.184") for geo-correlation. '
  'Not stored in full to reduce PII surface.';

CREATE INDEX IF NOT EXISTS idx_fp_hash ON user_fingerprints(fp_hash);
CREATE INDEX IF NOT EXISTS idx_fp_user ON user_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_last_seen ON user_fingerprints(last_seen DESC);

ALTER TABLE user_fingerprints ENABLE ROW LEVEL SECURITY;

-- Admins can see all fingerprints
CREATE POLICY "fp_admin_all" ON user_fingerprints
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can see their own fingerprints
CREATE POLICY "fp_own_read" ON user_fingerprints
  FOR SELECT
  USING (user_id = auth.uid());


-- ── duplicate_device_users view ──────────────────────────────────────────

CREATE OR REPLACE VIEW duplicate_device_users AS
SELECT
  uf.fp_hash,
  COUNT(DISTINCT uf.user_id)                         AS account_count,
  ARRAY_AGG(DISTINCT uf.user_id ORDER BY uf.user_id) AS user_ids,
  MIN(uf.first_seen)                                 AS first_seen,
  MAX(uf.last_seen)                                  AS last_seen,
  MAX(uf.ua_hint)                                    AS ua_hint
FROM user_fingerprints uf
GROUP BY uf.fp_hash
HAVING COUNT(DISTINCT uf.user_id) > 1
ORDER BY COUNT(DISTINCT uf.user_id) DESC, MAX(uf.last_seen) DESC;

COMMENT ON VIEW duplicate_device_users IS
  'Shows fingerprint hashes shared by more than one user account. '
  'Potential multi-account (ban evasion, duplicate registrations) candidates for admin review.';


-- ── RPC: upsert_user_fingerprint ──────────────────────────────────────────
-- Atomic INSERT ... ON CONFLICT ... DO UPDATE with request_count increment.
-- Called server-side from recordFingerprint.ts (fire-and-forget).

CREATE OR REPLACE FUNCTION upsert_user_fingerprint(
  p_user_id   UUID,
  p_fp_hash   TEXT,
  p_ua_hint   TEXT DEFAULT NULL,
  p_ip_hint   TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO user_fingerprints (user_id, fp_hash, ua_hint, ip_hint, first_seen, last_seen, request_count)
  VALUES (p_user_id, p_fp_hash, p_ua_hint, p_ip_hint, NOW(), NOW(), 1)
  ON CONFLICT (user_id, fp_hash) DO UPDATE
    SET last_seen     = EXCLUDED.last_seen,
        ua_hint       = COALESCE(EXCLUDED.ua_hint, user_fingerprints.ua_hint),
        ip_hint       = COALESCE(EXCLUDED.ip_hint, user_fingerprints.ip_hint),
        request_count = user_fingerprints.request_count + 1;
$$;

COMMENT ON FUNCTION upsert_user_fingerprint IS
  'Atomically inserts or updates a user device fingerprint record. '
  'On conflict: updates last_seen and increments request_count. '
  'SECURITY DEFINER so it can write to the table bypassing RLS.';

-- Grant execute to authenticated role (called via Supabase service role)
GRANT EXECUTE ON FUNCTION upsert_user_fingerprint TO authenticated, service_role;
