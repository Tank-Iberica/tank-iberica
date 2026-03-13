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
    ALTER TABLE payments
      ALTER COLUMN status TYPE payment_status USING status::payment_status;
  END IF;
END $$;

-- leads.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE leads
      ALTER COLUMN status TYPE lead_status USING status::lead_status;
  END IF;
END $$;

-- subscriptions.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE subscriptions
      ALTER COLUMN status TYPE subscription_status USING status::subscription_status;
  END IF;
END $$;

-- auctions.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auctions'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE auctions
      ALTER COLUMN status TYPE auction_status USING status::auction_status;
  END IF;
END $$;

-- verification_documents.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_documents'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE verification_documents
      ALTER COLUMN status TYPE verification_status USING status::verification_status;
  END IF;
END $$;

-- reservations.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reservations'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE reservations
      ALTER COLUMN status TYPE reservation_status USING status::reservation_status;
  END IF;
END $$;

-- comments.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE comments
      ALTER COLUMN status TYPE comment_status USING status::comment_status;
  END IF;
END $$;

-- social_posts.status
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts'
    AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE social_posts
      ALTER COLUMN status TYPE social_post_status USING status::social_post_status;
  END IF;
END $$;
