-- ============================================================
-- Migration 00171: Dealer referral program
-- Backlog #230 — Referral program (dealer invites dealer)
-- Each dealer gets a unique referral code. Both inviter and
-- invitee receive a credit bonus on the invitee's first payment.
-- ============================================================

-- Add referral_code to dealers
ALTER TABLE dealers
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES dealers(id) ON DELETE SET NULL;

-- Generate unique referral codes for existing dealers
UPDATE dealers
SET referral_code = UPPER(LEFT(MD5(id::text || NOW()::text), 8))
WHERE referral_code IS NULL;

-- Auto-generate referral code on new dealer INSERT
CREATE OR REPLACE FUNCTION generate_dealer_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(LEFT(MD5(NEW.id::text || NOW()::text), 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dealer_referral_code ON dealers;
CREATE TRIGGER trg_dealer_referral_code
  BEFORE INSERT ON dealers
  FOR EACH ROW
  EXECUTE FUNCTION generate_dealer_referral_code();

-- Referral tracking table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  invitee_dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  inviter_credits_awarded INT NOT NULL DEFAULT 0,
  invitee_credits_awarded INT NOT NULL DEFAULT 0,
  status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending' | 'awarded' | 'expired'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  awarded_at TIMESTAMPTZ,
  UNIQUE (inviter_dealer_id, invitee_dealer_id)
);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Dealers can read their own referral rewards
DROP POLICY IF EXISTS "referral_rewards_own_read" ON referral_rewards;
CREATE POLICY "referral_rewards_own_read" ON referral_rewards
  FOR SELECT USING (
    inviter_dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
    OR invitee_dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

-- Admin full access
DROP POLICY IF EXISTS "referral_rewards_admin_all" ON referral_rewards;
CREATE POLICY "referral_rewards_admin_all" ON referral_rewards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_referral_rewards_inviter ON referral_rewards(inviter_dealer_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_invitee ON referral_rewards(invitee_dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealers_referral_code ON dealers(referral_code);
