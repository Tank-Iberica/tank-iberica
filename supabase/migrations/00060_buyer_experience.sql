-- =============================================================================
-- TRACCIONA — Migration 00060: Buyer Experience Suite
-- =============================================================================
-- This migration creates all tables, triggers, indexes, and RLS policies
-- needed for the buyer experience features:
--   Bloque A: price_history — Vehicle price change tracking
--   Bloque B: vehicle_comparisons + comparison_notes — User shortlists
--   Bloque C: conversations + conversation_messages — Buyer-seller chat
--   Bloque D: reservations — Quick reserve with deposit
--   Bloque E: visit_slots + visit_bookings — Dealer availability and booking
--   Bloque F: seller_reviews — Reputation reviews
--   Bloque G: ALTER existing tables (vehicles, dealers, config)
--   Bloque H: Trigger for auto-tracking price changes
--   Bloque I: Indexes (16)
--   Bloque J: RLS policies for all new tables
--   Bloque K: Realtime subscriptions
--   Bloque L: updated_at triggers
-- =============================================================================

BEGIN;

-- =============================================================================
-- BLOQUE A: PRICE HISTORY
-- =============================================================================

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  price_cents BIGINT NOT NULL,
  previous_price_cents BIGINT,
  change_type VARCHAR DEFAULT 'manual',
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- BLOQUE B: VEHICLE COMPARISONS + COMPARISON NOTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS vehicle_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Mi comparador',
  vehicle_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comparison_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  comparison_id UUID REFERENCES vehicle_comparisons(id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vehicle_id, comparison_id)
);

-- =============================================================================
-- BLOQUE C: CONVERSATIONS + CONVERSATION MESSAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'active',
  buyer_accepted_share BOOLEAN DEFAULT false,
  seller_accepted_share BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- BLOQUE D: RESERVATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_cents INT NOT NULL DEFAULT 5000,
  stripe_payment_intent_id TEXT,
  status VARCHAR DEFAULT 'pending',
  seller_response TEXT,
  seller_responded_at TIMESTAMPTZ,
  buyer_confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  subscription_freebie BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- BLOQUE E: VISIT SLOTS + VISIT BOOKINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS visit_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_visitors INT DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visit_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_slot_id UUID REFERENCES visit_slots(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- BLOQUE F: SELLER REVIEWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  status VARCHAR DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reviewer_id, seller_id, vehicle_id)
);

-- =============================================================================
-- BLOQUE G: ALTER EXISTING TABLES
-- =============================================================================

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fair_price_cents BIGINT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_trend VARCHAR DEFAULT 'stable';

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS avg_response_minutes INT;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS response_rate_pct NUMERIC(5,2);
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS visits_enabled BOOLEAN DEFAULT false;

INSERT INTO config (key, value) VALUES (
  'user_panel_banner',
  '{"text_es":"","text_en":"","url":"","active":false,"from_date":null,"to_date":null}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- BLOQUE H: TRIGGER — AUTO-TRACK PRICE CHANGES
-- =============================================================================

CREATE OR REPLACE FUNCTION track_price_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price AND NEW.price IS NOT NULL THEN
    INSERT INTO price_history (vehicle_id, price_cents, previous_price_cents, change_type)
    VALUES (NEW.id, (NEW.price * 100)::BIGINT, (OLD.price * 100)::BIGINT, 'manual');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicle_price_change ON vehicles;
CREATE TRIGGER trg_vehicle_price_change
  AFTER UPDATE OF price ON vehicles
  FOR EACH ROW EXECUTE FUNCTION track_price_change();

-- =============================================================================
-- BLOQUE I: INDEXES (16)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_price_history_vehicle_date ON price_history (vehicle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_comparisons_user ON vehicle_comparisons (user_id);

CREATE INDEX IF NOT EXISTS idx_comparison_notes_user_vehicle ON comparison_notes (user_id, vehicle_id);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations (buyer_id);

CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations (seller_id);

CREATE INDEX IF NOT EXISTS idx_conversations_vehicle ON conversations (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv_date ON conversation_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_buyer_status ON reservations (buyer_id, status);

CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_status ON reservations (vehicle_id, status);

CREATE INDEX IF NOT EXISTS idx_visit_slots_dealer_active ON visit_slots (dealer_id, active);

CREATE INDEX IF NOT EXISTS idx_visit_bookings_dealer_date ON visit_bookings (dealer_id, visit_date);

CREATE INDEX IF NOT EXISTS idx_visit_bookings_buyer ON visit_bookings (buyer_id);

CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller ON seller_reviews (seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_reviews_reviewer ON seller_reviews (reviewer_id);

-- Audit P1: these already exist from migration 00058, using IF NOT EXISTS for safety
CREATE INDEX IF NOT EXISTS idx_vehicles_category_id ON vehicles (category_id);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids (auction_id, created_at DESC);

-- =============================================================================
-- BLOQUE J: RLS POLICIES
-- =============================================================================

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_history_public_read" ON price_history
  FOR SELECT USING (
    true
  );

CREATE POLICY "price_history_admin_insert" ON price_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "price_history_admin_update" ON price_history
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "price_history_admin_delete" ON price_history
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE vehicle_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_comparisons_own_select" ON vehicle_comparisons
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "vehicle_comparisons_own_insert" ON vehicle_comparisons
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "vehicle_comparisons_own_update" ON vehicle_comparisons
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "vehicle_comparisons_own_delete" ON vehicle_comparisons
  FOR DELETE USING (
    user_id = auth.uid()
  );

CREATE POLICY "vehicle_comparisons_admin_all" ON vehicle_comparisons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE comparison_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparison_notes_own_select" ON comparison_notes
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "comparison_notes_own_insert" ON comparison_notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "comparison_notes_own_update" ON comparison_notes
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "comparison_notes_own_delete" ON comparison_notes
  FOR DELETE USING (
    user_id = auth.uid()
  );

CREATE POLICY "comparison_notes_admin_all" ON comparison_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_participant_select" ON conversations
  FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );

CREATE POLICY "conversations_participant_update" ON conversations
  FOR UPDATE USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );

CREATE POLICY "conversations_user_insert" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND buyer_id = auth.uid()
  );

CREATE POLICY "conversations_admin_all" ON conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_messages_participant_select" ON conversation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "conversation_messages_participant_insert" ON conversation_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "conversation_messages_admin_all" ON conversation_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_buyer_select" ON reservations
  FOR SELECT USING (
    buyer_id = auth.uid()
  );

CREATE POLICY "reservations_buyer_insert" ON reservations
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid()
  );

CREATE POLICY "reservations_seller_select" ON reservations
  FOR SELECT USING (
    seller_id = auth.uid()
  );

CREATE POLICY "reservations_seller_update" ON reservations
  FOR UPDATE USING (
    seller_id = auth.uid()
  );

CREATE POLICY "reservations_admin_all" ON reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE visit_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visit_slots_public_read" ON visit_slots
  FOR SELECT USING (
    active = true
  );

CREATE POLICY "visit_slots_dealer_select" ON visit_slots
  FOR SELECT USING (
    dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "visit_slots_dealer_insert" ON visit_slots
  FOR INSERT WITH CHECK (
    dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "visit_slots_dealer_update" ON visit_slots
  FOR UPDATE USING (
    dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "visit_slots_dealer_delete" ON visit_slots
  FOR DELETE USING (
    dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "visit_slots_admin_all" ON visit_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE visit_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visit_bookings_buyer_select" ON visit_bookings
  FOR SELECT USING (
    buyer_id = auth.uid()
  );

CREATE POLICY "visit_bookings_buyer_insert" ON visit_bookings
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid()
  );

CREATE POLICY "visit_bookings_dealer_select" ON visit_bookings
  FOR SELECT USING (
    dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "visit_bookings_dealer_update" ON visit_bookings
  FOR UPDATE USING (
    dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "visit_bookings_admin_all" ON visit_bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );

ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_reviews_public_read" ON seller_reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "seller_reviews_own_insert" ON seller_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
  );

CREATE POLICY "seller_reviews_own_update" ON seller_reviews
  FOR UPDATE USING (
    reviewer_id = auth.uid()
  );

CREATE POLICY "seller_reviews_own_delete" ON seller_reviews
  FOR DELETE USING (
    reviewer_id = auth.uid()
  );

CREATE POLICY "seller_reviews_admin_all" ON seller_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );


-- =============================================================================
-- BLOQUE K: ENABLE REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;

-- =============================================================================
-- BLOQUE L: updated_at TRIGGERS
-- =============================================================================
-- Reuses the existing update_updated_at() function from migration 00002.

CREATE TRIGGER set_updated_at_vehicle_comparisons
  BEFORE UPDATE ON vehicle_comparisons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_comparison_notes
  BEFORE UPDATE ON comparison_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_reservations
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_visit_bookings
  BEFORE UPDATE ON visit_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_seller_reviews
  BEFORE UPDATE ON seller_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
