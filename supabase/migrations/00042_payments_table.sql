-- ================================================
-- 00042: Payments table for Stripe payment tracking
-- ================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  type VARCHAR NOT NULL,  -- 'subscription', 'auction_deposit', 'auction_premium', 'verification', 'transport', 'transfer', 'ad', 'one_time'
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status VARCHAR DEFAULT 'pending',  -- 'pending', 'succeeded', 'failed', 'refunded', 'cancelled'
  metadata JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_own_read" ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "payments_admin_all" ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

COMMENT ON TABLE payments IS 'All Stripe payment records. Types: subscription, auction_deposit, auction_premium, verification, transport, transfer, ad, one_time.';
