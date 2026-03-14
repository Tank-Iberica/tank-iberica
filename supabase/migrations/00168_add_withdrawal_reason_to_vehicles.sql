-- #37: Add withdrawal_reason to vehicles for tracking why vehicles are removed
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

COMMENT ON COLUMN vehicles.withdrawal_reason IS 'Reason for withdrawing/unpublishing: sold_elsewhere, too_expensive, changed_mind, duplicate, other';
