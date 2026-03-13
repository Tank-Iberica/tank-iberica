-- ================================================
-- 00093: CHECK constraints for data integrity (#86)
-- Adds validation constraints to balance, payments, auction_bids.
-- Backlog item: audit finding — CHECK constraints limitados.
-- ================================================

-- balance: amounts and percentage ranges
ALTER TABLE balance
  ADD CONSTRAINT balance_amount_nonzero
    CHECK (amount != 0),
  ADD CONSTRAINT balance_benefit_percent_range
    CHECK (benefit_percent IS NULL OR (benefit_percent >= 0 AND benefit_percent <= 100));

-- payments: amount must be positive, enums validated
ALTER TABLE payments
  ADD CONSTRAINT payments_amount_positive
    CHECK (amount_cents > 0),
  ADD CONSTRAINT payments_status_values
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
  ADD CONSTRAINT payments_type_values
    CHECK (type IN ('subscription', 'auction_deposit', 'auction_premium', 'verification',
                    'transport', 'transfer', 'ad', 'one_time')),
  ADD CONSTRAINT payments_currency_format
    CHECK (char_length(currency) = 3);

-- auction_bids: bid must be a positive amount
ALTER TABLE auction_bids
  ADD CONSTRAINT auction_bids_amount_positive
    CHECK (amount_cents > 0);

COMMENT ON CONSTRAINT balance_amount_nonzero ON balance
  IS 'Balance entries must have a non-zero amount (credit or debit)';
COMMENT ON CONSTRAINT payments_amount_positive ON payments
  IS 'Payment amounts must be positive (amount in cents)';
COMMENT ON CONSTRAINT auction_bids_amount_positive ON auction_bids
  IS 'Bid amounts must be positive (amount in cents)';
