-- ================================================
-- 00094: Convert VARCHAR status columns to ENUM types (#87)
-- Backlog item: audit finding — VARCHAR statuses a ENUMs.
-- Converts payments.status and payments.type to ENUM for type safety.
-- Other high-frequency statuses (vehicle_status, balance_status) already ENUM.
-- ================================================

-- 1. Create new ENUM types
CREATE TYPE payment_status AS ENUM (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE payment_type AS ENUM (
  'subscription',
  'auction_deposit',
  'auction_premium',
  'verification',
  'transport',
  'transfer',
  'ad',
  'one_time'
);

-- 2. Sanitize any out-of-range values before converting
--    (coerce unknowns to 'pending'/'one_time' to avoid conversion failure)
UPDATE payments
  SET status = 'pending'
  WHERE status NOT IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled');

UPDATE payments
  SET type = 'one_time'
  WHERE type NOT IN ('subscription', 'auction_deposit', 'auction_premium', 'verification',
                     'transport', 'transfer', 'ad', 'one_time');

-- 3. Alter columns from VARCHAR to ENUM
ALTER TABLE payments
  ALTER COLUMN status TYPE payment_status
    USING status::text::payment_status,
  ALTER COLUMN type   TYPE payment_type
    USING type::text::payment_type;

-- 4. Restore defaults with ENUM type
ALTER TABLE payments
  ALTER COLUMN status SET DEFAULT 'pending'::payment_status;

COMMENT ON TYPE payment_status IS 'Stripe payment lifecycle statuses';
COMMENT ON TYPE payment_type   IS 'Tracciona payment product types';
