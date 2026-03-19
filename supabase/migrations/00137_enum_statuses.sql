-- ================================================
-- 00137: ENUM types for critical status columns
-- Converts VARCHAR status columns to typed ENUM
-- types on 8 high-value domain tables.
--
-- Tables: payments, leads, subscriptions, auctions,
--   verification_documents, reservations, comments,
--   social_posts
-- ================================================

-- ── Step 1: Create ENUM types (idempotent) ─────────────────────────────────

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'succeeded', 'failed', 'refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE payment_status IS
  'Lifecycle states for a payment transaction. Mirrors Stripe payment intent states. '
  'Refunds are tracked by status=refunded, not negative amounts.';

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'new', 'viewed', 'contacted', 'negotiating', 'won', 'lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE lead_status IS
  'CRM pipeline stages for a buyer lead inquiry.';

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active', 'canceled', 'past_due', 'trialing'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE subscription_status IS
  'Billing subscription states. Mirrors Stripe subscription status values. '
  'Note: Stripe spells canceled with one l.';

DO $$ BEGIN
  CREATE TYPE auction_status AS ENUM (
    'draft', 'scheduled', 'active', 'ended', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE auction_status IS
  'Lifecycle states for a vehicle auction.';

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM (
    'pending', 'verified', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE verification_status IS
  'Document verification states. Used on verification_documents and dealer_reviews.';

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'pending', 'active', 'seller_responded', 'completed',
    'expired', 'refunded', 'forfeited'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE reservation_status IS
  'Lifecycle states for a vehicle reservation with deposit.';

DO $$ BEGIN
  CREATE TYPE comment_status AS ENUM (
    'pending', 'approved', 'spam', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE comment_status IS
  'Moderation states for article comments.';

DO $$ BEGIN
  CREATE TYPE social_post_status AS ENUM (
    'draft', 'scheduled', 'posted', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE social_post_status IS
  'Publishing lifecycle for social media posts.';


-- ── Step 2: Alter columns to use ENUM types ────────────────────────────────

-- payments.status — drop redundant CHECK (ENUM enforces same constraint)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_valid;
    ALTER TABLE payments ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE payments
      ALTER COLUMN status TYPE payment_status USING status::text::payment_status;
    ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'::payment_status;
  END IF;
END $$;

-- leads.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE leads
      ALTER COLUMN status TYPE lead_status USING status::text::lead_status;
    ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'::lead_status;
  END IF;
END $$;

-- subscriptions.status — must drop/recreate dependent view first
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    -- Drop dependent view
    DROP VIEW IF EXISTS founding_expiry_check;
    ALTER TABLE subscriptions ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE subscriptions
      ALTER COLUMN status TYPE subscription_status USING status::text::subscription_status;
    ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'active'::subscription_status;
    -- Recreate view with ENUM-compatible cast
    CREATE OR REPLACE VIEW founding_expiry_check AS
    SELECT s.id AS subscription_id,
      s.user_id,
      s.plan,
      s.founding_started_at,
      s.expires_at,
      s.founding_badge_permanent,
      d.company_name,
      d.email AS dealer_email,
      u.email AS user_email,
      CASE
        WHEN s.expires_at IS NULL THEN NULL::text
        WHEN s.expires_at <= now() THEN 'expired'::text
        WHEN s.expires_at <= (now() + '7 days'::interval) THEN 'expiring_7d'::text
        WHEN s.expires_at <= (now() + '30 days'::interval) THEN 'expiring_30d'::text
        ELSE 'active'::text
      END AS expiry_status
    FROM subscriptions s
      LEFT JOIN dealers d ON d.user_id = s.user_id
      LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE s.plan::text = 'founding'::text AND s.status::text = 'active'::text;
  END IF;
END $$;

-- auctions.status — must drop/recreate dependent policy
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auctions'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    -- Sanitize values not in ENUM before conversion
    UPDATE auctions SET status = 'ended'
      WHERE status NOT IN ('draft', 'scheduled', 'active', 'ended', 'cancelled');
    DROP POLICY IF EXISTS "auctions_public_read" ON auctions;
    ALTER TABLE auctions ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE auctions
      ALTER COLUMN status TYPE auction_status USING status::text::auction_status;
    ALTER TABLE auctions ALTER COLUMN status SET DEFAULT 'draft'::auction_status;
    -- Recreate policy using ENUM values
    CREATE POLICY "auctions_public_read" ON auctions
      FOR SELECT USING (status IN ('scheduled'::auction_status, 'active'::auction_status, 'ended'::auction_status));
  END IF;
END $$;

-- verification_documents.status — must drop/recreate dependent trigger
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_documents'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    DROP TRIGGER IF EXISTS trg_update_verification_level ON verification_documents;
    ALTER TABLE verification_documents ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE verification_documents
      ALTER COLUMN status TYPE verification_status USING status::text::verification_status;
    ALTER TABLE verification_documents ALTER COLUMN status SET DEFAULT 'pending'::verification_status;
    -- Recreate trigger
    CREATE TRIGGER trg_update_verification_level
      AFTER INSERT OR DELETE OR UPDATE OF status
      ON verification_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_vehicle_verification_level();
  END IF;
END $$;

-- reservations.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reservations'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE reservations ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE reservations
      ALTER COLUMN status TYPE reservation_status USING status::text::reservation_status;
    ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'pending'::reservation_status;
  END IF;
END $$;

-- comments.status — must drop/recreate dependent policies
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    DROP POLICY IF EXISTS "comments_own_update" ON comments;
    DROP POLICY IF EXISTS "comments_public_read" ON comments;
    ALTER TABLE comments ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE comments
      ALTER COLUMN status TYPE comment_status USING status::text::comment_status;
    ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'pending'::comment_status;
    -- Recreate policies using ENUM type
    CREATE POLICY "comments_own_update" ON comments
      FOR UPDATE USING (auth.uid() = user_id AND status = 'pending'::comment_status);
    CREATE POLICY "comments_public_read" ON comments
      FOR SELECT USING (status = 'approved'::comment_status);
  END IF;
END $$;

-- social_posts.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE social_posts ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE social_posts
      ALTER COLUMN status TYPE social_post_status USING status::text::social_post_status;
    ALTER TABLE social_posts ALTER COLUMN status SET DEFAULT 'draft'::social_post_status;
  END IF;
END $$;
