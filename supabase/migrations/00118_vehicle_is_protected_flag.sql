-- Migration 00118: vehicle is_protected flag
-- Dealer pays 2 credits to protect a vehicle: it bypasses visible_from delay
-- (visible to ALL users immediately) and is immune to Reserva Prioritaria (#11).

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS is_protected boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.vehicles.is_protected IS
  'Dealer paid 2 credits to protect this vehicle: immune to Reserva Prioritaria, visible regardless of visible_from';

-- Partial index — only for protected vehicles (few rows in practice)
CREATE INDEX IF NOT EXISTS idx_vehicles_is_protected ON public.vehicles(is_protected)
  WHERE is_protected = true;
