-- ================================================
-- 00093: CHECK constraints for data integrity (#86)
-- Adds validation constraints to balance, payments, auction_bids.
-- All blocks check column existence first (schema may differ).
-- ================================================

-- balance: amounts and percentage ranges (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='balance' AND column_name='amount') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='balance_amount_nonzero' AND table_name='balance') THEN
      ALTER TABLE balance ADD CONSTRAINT balance_amount_nonzero CHECK (amount != 0);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='balance' AND column_name='benefit_percent') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='balance_benefit_percent_range' AND table_name='balance') THEN
      ALTER TABLE balance ADD CONSTRAINT balance_benefit_percent_range CHECK (benefit_percent IS NULL OR (benefit_percent >= 0 AND benefit_percent <= 100));
    END IF;
  END IF;
END $$;

-- payments: amount must be positive, enums validated (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='amount_cents') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payments_amount_positive' AND table_name='payments') THEN
      ALTER TABLE payments ADD CONSTRAINT payments_amount_positive CHECK (amount_cents > 0);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='status') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payments_status_values' AND table_name='payments') THEN
      ALTER TABLE payments ADD CONSTRAINT payments_status_values CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled'));
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='type') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payments_type_values' AND table_name='payments') THEN
      ALTER TABLE payments ADD CONSTRAINT payments_type_values CHECK (type IN ('subscription', 'auction_deposit', 'auction_premium', 'verification', 'transport', 'transfer', 'ad', 'one_time'));
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='currency') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payments_currency_format' AND table_name='payments') THEN
      ALTER TABLE payments ADD CONSTRAINT payments_currency_format CHECK (char_length(currency) = 3);
    END IF;
  END IF;
END $$;

-- auction_bids: bid must be a positive amount (only if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auction_bids' AND column_name='amount_cents') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='auction_bids_amount_positive' AND table_name='auction_bids') THEN
      ALTER TABLE auction_bids ADD CONSTRAINT auction_bids_amount_positive CHECK (amount_cents > 0);
    END IF;
  END IF;
END $$;

-- Comments only if constraints were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='balance_amount_nonzero') THEN
    COMMENT ON CONSTRAINT balance_amount_nonzero ON balance IS 'Balance entries must have a non-zero amount';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payments_amount_positive') THEN
    COMMENT ON CONSTRAINT payments_amount_positive ON payments IS 'Payment amounts must be positive (amount in cents)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='auction_bids_amount_positive') THEN
    COMMENT ON CONSTRAINT auction_bids_amount_positive ON auction_bids IS 'Bid amounts must be positive (amount in cents)';
  END IF;
END $$;
