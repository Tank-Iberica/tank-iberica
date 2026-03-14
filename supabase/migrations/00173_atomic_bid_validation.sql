-- Migration 00173: Fix auction bid race condition #377
-- Adds FOR UPDATE to serialize concurrent bid triggers

CREATE OR REPLACE FUNCTION validate_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_registration RECORD;
  v_max_bid BIGINT;
  v_effective_end TIMESTAMPTZ;
  v_time_remaining INTERVAL;
BEGIN
  -- 1. Get auction data — FOR UPDATE serializes concurrent bids
  SELECT * INTO v_auction FROM auctions WHERE id = NEW.auction_id FOR UPDATE;

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

COMMENT ON FUNCTION validate_bid() IS 'Validates bids: checks auction status, registration, minimum amount, updates current_bid, handles anti-sniping. Uses FOR UPDATE to prevent concurrent bid race conditions.';
