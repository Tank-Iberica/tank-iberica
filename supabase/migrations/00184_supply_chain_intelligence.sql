-- Migration: Supply chain intelligence (#49)
-- Buyer company type classification + transaction graph for supply chain analysis.

-- Company type enum for buyer classification
DO $$ BEGIN
  CREATE TYPE buyer_company_type AS ENUM (
    'dealer',
    'fleet',
    'rental',
    'leasing',
    'export',
    'end_user'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add company type to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_type buyer_company_type DEFAULT NULL;

-- Transaction graph table for recording buyer-seller relationships
CREATE TABLE IF NOT EXISTS transaction_graph (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id     UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_category VARCHAR(128),
  price_range    VARCHAR(32),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata       JSONB DEFAULT '{}'::JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tg_no_self_transaction CHECK (seller_id != buyer_id)
);

-- Indexes for graph queries
CREATE INDEX IF NOT EXISTS idx_tg_seller ON transaction_graph (seller_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tg_buyer ON transaction_graph (buyer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tg_category ON transaction_graph (vehicle_category, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tg_date ON transaction_graph (transaction_date DESC);

-- Price range helper function
CREATE OR REPLACE FUNCTION classify_price_range(price NUMERIC)
RETURNS VARCHAR(32) AS $$
BEGIN
  IF price IS NULL THEN RETURN 'unknown';
  ELSIF price < 10000 THEN RETURN '0-10k';
  ELSIF price < 25000 THEN RETURN '10k-25k';
  ELSIF price < 50000 THEN RETURN '25k-50k';
  ELSIF price < 100000 THEN RETURN '50k-100k';
  ELSIF price < 250000 THEN RETURN '100k-250k';
  ELSE RETURN '250k+';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RLS
ALTER TABLE transaction_graph ENABLE ROW LEVEL SECURITY;

-- Admins can read all transactions
CREATE POLICY tg_admin_read ON transaction_graph
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Admins can insert transactions
CREATE POLICY tg_admin_insert ON transaction_graph
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Sellers can see their own transactions
CREATE POLICY tg_seller_read ON transaction_graph
  FOR SELECT
  USING (seller_id = auth.uid());

-- Buyers can see their own transactions
CREATE POLICY tg_buyer_read ON transaction_graph
  FOR SELECT
  USING (buyer_id = auth.uid());

COMMENT ON TABLE transaction_graph IS 'Records buyer-seller transactions for supply chain analysis.';
COMMENT ON COLUMN users.company_type IS 'Buyer classification for supply chain intelligence.';
