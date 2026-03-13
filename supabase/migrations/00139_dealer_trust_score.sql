-- Migration 00139: Add trust_score columns to dealers table
-- Trust Score 0-100 for dealers, calculated daily by cron
-- Thresholds: <60 = no badge | 60-79 = verified | >=80 = top

ALTER TABLE dealers
  ADD COLUMN IF NOT EXISTS trust_score               INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score_breakdown     JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trust_score_updated_at    TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'dealers_trust_score_range'
  ) THEN
    ALTER TABLE dealers
      ADD CONSTRAINT dealers_trust_score_range
        CHECK (trust_score >= 0 AND trust_score <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dealers_trust_score
  ON dealers(trust_score DESC)
  WHERE status = 'active';

COMMENT ON COLUMN dealers.trust_score IS
  'Calculated 0-100 trust score. <60=no badge, 60-79=verified, >=80=top';
COMMENT ON COLUMN dealers.trust_score_breakdown IS
  'Per-criterion scores: {has_logo, has_bio, has_contact, has_legal, account_age, listing_activity, responsiveness, reviews, verified_docs}';
COMMENT ON COLUMN dealers.trust_score_updated_at IS
  'Timestamp of last trust_score recalculation';
