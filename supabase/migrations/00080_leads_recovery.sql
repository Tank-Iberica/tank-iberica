-- ============================================================
-- Migration 00080: leads recovery tracking + vehicles buyer fields
-- ============================================================

-- ── leads: track re-engagement emails ────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS recovery_sent_at timestamptz;

COMMENT ON COLUMN leads.recovery_sent_at IS
  'Timestamp when interest-recovery cron sent a re-engagement email for this lead.';

-- Index for cron query (find pending leads without recovery email in 24-48h window)
CREATE INDEX IF NOT EXISTS idx_leads_recovery
  ON leads (status, created_at, recovery_sent_at)
  WHERE status = 'pending' AND recovery_sent_at IS NULL;

-- ── vehicles: buyer tracking columns ─────────────────────────────────────
-- Track who bought/reserved the vehicle for transaction history
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS buyer_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN vehicles.buyer_id    IS 'User who completed the purchase of this vehicle.';
COMMENT ON COLUMN vehicles.reserved_by IS 'User who placed a reservation on this vehicle.';

CREATE INDEX IF NOT EXISTS idx_vehicles_buyer    ON vehicles (buyer_id)    WHERE buyer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_reserved ON vehicles (reserved_by) WHERE reserved_by IS NOT NULL;
