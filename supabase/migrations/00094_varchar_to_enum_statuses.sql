-- ================================================
-- 00094: Convert VARCHAR status columns to ENUM types (#87)
-- Backlog item: audit finding — VARCHAR statuses a ENUMs.
-- Converts payments.status and payments.type to ENUM for type safety.
-- Other high-frequency statuses (vehicle_status, balance_status) already ENUM.
-- ================================================

-- 1. Create new ENUM types (idempotent)
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'refunded',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Sanitize any out-of-range values before converting
--    (coerce unknowns to 'pending'/'one_time' to avoid conversion failure)
UPDATE payments
  SET status = 'pending'
  WHERE status NOT IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled');

UPDATE payments
  SET type = 'one_time'
  WHERE type NOT IN ('subscription', 'auction_deposit', 'auction_premium', 'verification',
                     'transport', 'transfer', 'ad', 'one_time');

-- 3. Alter columns from VARCHAR to ENUM (only if still VARCHAR)
-- Must drop default before type change, then restore after
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE payments ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE payments
      ALTER COLUMN status TYPE payment_status
        USING status::text::payment_status;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments'
    AND column_name = 'type' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE payments ALTER COLUMN type DROP DEFAULT;
    ALTER TABLE payments
      ALTER COLUMN type TYPE payment_type
        USING type::text::payment_type;
  END IF;
END $$;

-- 4. Restore defaults with ENUM type (idempotent — SET DEFAULT is safe to re-run)
ALTER TABLE payments
  ALTER COLUMN status SET DEFAULT 'pending'::payment_status;

COMMENT ON TYPE payment_status IS 'Stripe payment lifecycle statuses';
COMMENT ON TYPE payment_type   IS 'Tracciona payment product types';
