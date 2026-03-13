-- Migration: 00147_social_oauth
-- Purpose: OAuth2 state table for social media platform authorization
-- Agent D - #68

-- Tracks CSRF state tokens during OAuth2 authorization flows
CREATE TABLE IF NOT EXISTS social_oauth_states (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT        NOT NULL UNIQUE,
  platform    TEXT        NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'x')),
  admin_id    UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  redirect_to TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_social_oauth_states_state ON social_oauth_states (state);
CREATE INDEX IF NOT EXISTS idx_social_oauth_states_expires ON social_oauth_states (expires_at);

-- Auto-cleanup of expired states (handled by cron or next request)
ALTER TABLE social_oauth_states ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write oauth states (server-side only)
CREATE POLICY "service_role_all_social_oauth_states"
  ON social_oauth_states FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
