-- ================================================
-- 00136: CHECK constraints for financial integrity
-- Adds data-level guards on amount fields in
-- auction_bids, payments, and balance tables.
-- ================================================

-- ── auction_bids ─────────────────────────────────────────────────────────────
-- Bids must be a positive amount (0 or negative bids are invalid)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'auction_bids_amount_positive'
    AND table_name = 'auction_bids'
  ) THEN
    ALTER TABLE auction_bids
      ADD CONSTRAINT auction_bids_amount_positive
      CHECK (amount_cents > 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT auction_bids_amount_positive ON auction_bids
  IS 'Bid amount must be greater than 0 cents';

-- ── payments ─────────────────────────────────────────────────────────────────
-- Payment amounts must be positive (refunds are tracked via status='refunded',
-- not negative amounts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_amount_positive'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_amount_positive
      CHECK (amount_cents > 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT payments_amount_positive ON payments
  IS 'Payment amount must be greater than 0 cents. Refunds tracked via status field.';

-- Payments status must be one of the valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_status_valid'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_status_valid
      CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled'));
  END IF;
END $$;

COMMENT ON CONSTRAINT payments_status_valid ON payments
  IS 'Payment status must be one of: pending, succeeded, failed, refunded, cancelled';

-- ── balance ───────────────────────────────────────────────────────────────────
-- Balance transaction amounts must be positive (tipo field distinguishes
-- ingreso vs gasto; negative amounts are not used)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'balance_importe_positive'
    AND table_name = 'balance'
  ) THEN
    ALTER TABLE balance
      ADD CONSTRAINT balance_importe_positive
      CHECK (importe > 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT balance_importe_positive ON balance
  IS 'Balance amount (importe) must be positive. Use tipo=gasto for expenses.';

-- Coste asociado, when present, must also be positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'balance_coste_positive'
    AND table_name = 'balance'
  ) THEN
    ALTER TABLE balance
      ADD CONSTRAINT balance_coste_positive
      CHECK (coste_asociado IS NULL OR coste_asociado > 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT balance_coste_positive ON balance
  IS 'Associated cost must be NULL (not applicable) or positive';
