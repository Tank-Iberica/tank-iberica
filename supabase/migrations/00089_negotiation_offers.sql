-- Migration: Negotiation workflow + Operation status timeline
-- §4.3 Plan Maestro P2

-- 1. Negotiation offers table
-- Tracks the offer → counteroffer → acceptance workflow between buyer and seller.
CREATE TABLE IF NOT EXISTS negotiation_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'EUR',
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn')),
  parent_offer_id uuid REFERENCES negotiation_offers(id),
  expires_at timestamptz DEFAULT (now() + interval '72 hours'),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_negotiation_offers_conversation ON negotiation_offers(conversation_id);
CREATE INDEX idx_negotiation_offers_vehicle ON negotiation_offers(vehicle_id);
CREATE INDEX idx_negotiation_offers_sender ON negotiation_offers(sender_id);
CREATE INDEX idx_negotiation_offers_status ON negotiation_offers(status) WHERE status = 'pending';

-- RLS: Only conversation participants can see/create offers
ALTER TABLE negotiation_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view offers in their conversations" ON negotiation_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = negotiation_offers.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create offers in their conversations" ON negotiation_offers
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = negotiation_offers.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      AND c.status != 'closed'
    )
  );

CREATE POLICY "Offer participants can update status" ON negotiation_offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = negotiation_offers.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Admin full access
CREATE POLICY "Admins full access to negotiation_offers" ON negotiation_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- 2. Operation timeline (transaction status tracking)
-- Each row = a status change event in the lifecycle of a vehicle transaction.
CREATE TABLE IF NOT EXISTS operation_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES auth.users(id),
  buyer_id uuid REFERENCES auth.users(id),
  stage text NOT NULL CHECK (stage IN (
    'listed', 'contacted', 'visit_scheduled', 'visit_done',
    'offer_made', 'offer_accepted', 'payment_pending', 'payment_received',
    'documentation', 'delivery_scheduled', 'delivered', 'completed',
    'cancelled', 'returned'
  )),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_operation_timeline_vehicle ON operation_timeline(vehicle_id);
CREATE INDEX idx_operation_timeline_dealer ON operation_timeline(dealer_id);
CREATE INDEX idx_operation_timeline_stage ON operation_timeline(stage);

-- RLS: Dealer and buyer can see timeline for their transactions
ALTER TABLE operation_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view operation timeline" ON operation_timeline
  FOR SELECT USING (
    dealer_id = auth.uid() OR buyer_id = auth.uid()
  );

CREATE POLICY "Dealer can add timeline entries" ON operation_timeline
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (dealer_id = auth.uid() OR buyer_id = auth.uid())
  );

CREATE POLICY "Admins full access to operation_timeline" ON operation_timeline
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );
