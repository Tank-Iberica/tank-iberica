-- ============================================================
-- Migration 00082: Price threshold on favorites
-- Enables configurable price drop alerts per favorited vehicle.
-- NULL = notify on any price drop (existing behaviour).
-- A set value means: only notify if vehicle.price drops <=threshold.
-- ============================================================

ALTER TABLE favorites
  ADD COLUMN IF NOT EXISTS price_threshold NUMERIC(12, 2);

COMMENT ON COLUMN favorites.price_threshold IS
  'Optional price alert threshold (same unit as vehicles.price). '
  'NULL = notify on any drop. Set = notify only when price falls at or below this value.';
