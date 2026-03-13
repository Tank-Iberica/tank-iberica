-- Migration 00119: Priority Reservations (Reserva Prioritaria)
-- Buyer pays 2 credits → vehicle paused 48h → seller must respond or auto-refund.
-- is_protected vehicles and Premium/Founding dealers are immune.

-- 1. Add priority_reserved_until to vehicles (null = not reserved)
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS priority_reserved_until timestamptz;

COMMENT ON COLUMN public.vehicles.priority_reserved_until IS
  'When set and in the future, vehicle is under Reserva Prioritaria. Other buyers cannot initiate purchase.';

-- 2. Priority reservations table
CREATE TABLE IF NOT EXISTS public.priority_reservations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id          uuid        NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  buyer_id            uuid        NOT NULL REFERENCES auth.users(id),
  seller_id           uuid        NOT NULL REFERENCES auth.users(id),
  credits_spent       integer     NOT NULL DEFAULT 2,
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'refunded')),
  expires_at          timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  seller_responded_at timestamptz,
  refunded_at         timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_priority_reservations_vehicle_id
  ON public.priority_reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_priority_reservations_buyer_id
  ON public.priority_reservations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_priority_reservations_pending
  ON public.priority_reservations(expires_at)
  WHERE status = 'pending';

-- RLS
ALTER TABLE public.priority_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "priority_reservations_buyer_select" ON public.priority_reservations;
CREATE POLICY "priority_reservations_buyer_select"
  ON public.priority_reservations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "priority_reservations_buyer_insert" ON public.priority_reservations;
CREATE POLICY "priority_reservations_buyer_insert"
  ON public.priority_reservations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "priority_reservations_seller_update" ON public.priority_reservations;
CREATE POLICY "priority_reservations_seller_update"
  ON public.priority_reservations FOR UPDATE
  USING (auth.uid() = seller_id);
