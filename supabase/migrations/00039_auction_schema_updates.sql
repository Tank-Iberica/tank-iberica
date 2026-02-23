-- ================================================
-- 00039: Auction schema updates (Session 16)
-- ================================================
-- Upgrade auctions, auction_bids, auction_registrations
-- from placeholder schema (00031) to full Anexo H spec.
-- Add validate_bid() trigger with anti-sniping.
-- ================================================

-- A. Upgrade auctions table
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS bid_increment_cents BIGINT NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS deposit_cents BIGINT NOT NULL DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS extended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS winning_bid_cents BIGINT;

-- Rename anti_sniping_minutes → keep it and add anti_snipe_seconds
-- (keep old column for backward compat, add new one)
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS anti_snipe_seconds INT DEFAULT 120;

-- Backfill anti_snipe_seconds from minutes where set
UPDATE auctions SET anti_snipe_seconds = anti_sniping_minutes * 60
WHERE anti_snipe_seconds = 120 AND anti_sniping_minutes != 2;

-- Allow 'scheduled' status in public read policy
DROP POLICY IF EXISTS "auctions_public_read" ON auctions;
CREATE POLICY "auctions_public_read" ON auctions FOR SELECT
  USING (status IN ('scheduled', 'active', 'ended', 'adjudicated', 'no_sale'));

-- B. Upgrade auction_registrations table
-- The existing table has composite PK (auction_id, user_id) and minimal columns.
-- We need to add many columns for the full verification flow.
ALTER TABLE auction_registrations
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS id_type VARCHAR,
  ADD COLUMN IF NOT EXISTS id_number VARCHAR,
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS transport_license_url TEXT,
  ADD COLUMN IF NOT EXISTS additional_docs JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR,
  ADD COLUMN IF NOT EXISTS deposit_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_status VARCHAR DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create unique index on id for single-row lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_auction_registrations_id ON auction_registrations(id);

-- Add index for status lookups
CREATE INDEX IF NOT EXISTS idx_auction_reg_status ON auction_registrations(auction_id, status);

-- C. Create validate_bid() trigger function
-- CRITICAL: Bid validation MUST be in the database, not only frontend.
CREATE OR REPLACE FUNCTION validate_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_registration RECORD;
  v_max_bid BIGINT;
  v_effective_end TIMESTAMPTZ;
  v_time_remaining INTERVAL;
BEGIN
  -- 1. Get auction data
  SELECT * INTO v_auction FROM auctions WHERE id = NEW.auction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subasta no encontrada';
  END IF;

  -- 2. Verify auction is live
  IF v_auction.status != 'active' THEN
    RAISE EXCEPTION 'La subasta no está activa';
  END IF;

  -- 3. Check effective end time (with anti-sniping extension)
  v_effective_end := COALESCE(v_auction.extended_until, v_auction.ends_at);
  IF v_effective_end < NOW() THEN
    RAISE EXCEPTION 'La subasta ha terminado';
  END IF;

  -- 4. Verify bidder has approved registration with held deposit
  SELECT * INTO v_registration FROM auction_registrations
  WHERE user_id = NEW.user_id
    AND auction_id = NEW.auction_id
    AND status = 'approved'
    AND deposit_status = 'held';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes registro aprobado con depósito para esta subasta';
  END IF;

  -- 5. Verify bid meets minimum (current highest + increment)
  SELECT COALESCE(MAX(amount_cents), v_auction.start_price_cents - v_auction.bid_increment_cents)
  INTO v_max_bid
  FROM auction_bids WHERE auction_id = NEW.auction_id;

  IF NEW.amount_cents < v_max_bid + v_auction.bid_increment_cents THEN
    RAISE EXCEPTION 'La puja debe ser al menos % cents', v_max_bid + v_auction.bid_increment_cents;
  END IF;

  -- 6. Update current_bid and bid_count in the auction
  UPDATE auctions
  SET current_bid_cents = NEW.amount_cents,
      bid_count = COALESCE(bid_count, 0) + 1
  WHERE id = NEW.auction_id;

  -- 7. Anti-sniping: if less than anti_snipe_seconds remain, extend
  v_time_remaining := v_effective_end - NOW();
  IF v_time_remaining < (v_auction.anti_snipe_seconds || ' seconds')::INTERVAL THEN
    UPDATE auctions
    SET extended_until = NOW() + (v_auction.anti_snipe_seconds || ' seconds')::INTERVAL
    WHERE id = NEW.auction_id;
  END IF;

  -- 8. Mark previous winning bid as not winning, mark this one as winning
  UPDATE auction_bids SET is_winning = false
  WHERE auction_id = NEW.auction_id AND is_winning = true;
  NEW.is_winning := true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_bid ON auction_bids;
CREATE TRIGGER trg_validate_bid
  BEFORE INSERT ON auction_bids
  FOR EACH ROW
  EXECUTE FUNCTION validate_bid();

-- D. Enable RLS on all auction tables (idempotent)
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_registrations ENABLE ROW LEVEL SECURITY;

-- E. Add Realtime publication for auction tables
-- This enables Supabase Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;

COMMENT ON TABLE auctions IS 'Online auctions for vehicles. Status: scheduled → active → ended → adjudicated/no_sale/cancelled';
COMMENT ON FUNCTION validate_bid() IS 'Validates bids: checks auction status, registration, minimum amount, updates current_bid, handles anti-sniping';
