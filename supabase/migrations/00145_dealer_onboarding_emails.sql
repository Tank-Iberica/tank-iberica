-- Migration 00145: Dealer onboarding email tracking
-- Tracks which onboarding steps have been sent to each dealer (steps 0-4, 14-day sequence).

CREATE TABLE IF NOT EXISTS dealer_onboarding_emails (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID        NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  step      SMALLINT    NOT NULL CHECK (step BETWEEN 0 AND 4),
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dealer_id, step)
);

CREATE INDEX IF NOT EXISTS idx_dealer_onboarding_dealer_id
  ON dealer_onboarding_emails (dealer_id);

-- RLS: only service role (cron) reads/writes this table
ALTER TABLE dealer_onboarding_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_dealer_onboarding_emails"
  ON dealer_onboarding_emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
