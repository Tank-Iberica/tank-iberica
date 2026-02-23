-- ================================================
-- 00037: Dealer sort boost based on subscription plan
-- ================================================
-- Sort boost system:
--   premium  → 3
--   founding → 2
--   basic    → 1
--   free     → 0 (default)
--
-- The sort_boost column is denormalized onto both `dealers` and `vehicles`
-- so PostgREST can ORDER BY it directly without joins.
--
-- Two triggers keep the values in sync:
--   1. When a subscription changes → update the linked dealer's sort_boost
--   2. When a dealer's sort_boost changes → propagate to all their vehicles
-- ================================================

-- A. Add sort_boost column to dealers
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS sort_boost INT DEFAULT 0;

-- B. Add sort_boost column to vehicles (denormalized for direct ORDER BY)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sort_boost INT DEFAULT 0;

-- C. Trigger function: subscription change → update dealer sort_boost
CREATE OR REPLACE FUNCTION update_dealer_sort_boost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dealers
  SET sort_boost = CASE NEW.plan
    WHEN 'premium'  THEN 3
    WHEN 'founding'  THEN 2
    WHEN 'basic'    THEN 1
    ELSE 0
  END
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- D. Trigger: fire when subscription is inserted or updated
DROP TRIGGER IF EXISTS trg_update_dealer_sort_boost ON subscriptions;
CREATE TRIGGER trg_update_dealer_sort_boost
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_dealer_sort_boost();

-- E. Trigger function: dealer sort_boost change → propagate to vehicles
CREATE OR REPLACE FUNCTION propagate_sort_boost_to_vehicles()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vehicles
  SET sort_boost = NEW.sort_boost
  WHERE dealer_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- F. Trigger: fire when dealer's sort_boost column is updated
DROP TRIGGER IF EXISTS trg_propagate_sort_boost ON dealers;
CREATE TRIGGER trg_propagate_sort_boost
  AFTER UPDATE OF sort_boost ON dealers
  FOR EACH ROW
  EXECUTE FUNCTION propagate_sort_boost_to_vehicles();

-- G. Backfill existing dealers from their current active subscription
UPDATE dealers d
SET sort_boost = CASE s.plan
  WHEN 'premium'  THEN 3
  WHEN 'founding'  THEN 2
  WHEN 'basic'    THEN 1
  ELSE 0
END
FROM subscriptions s
WHERE s.user_id = d.user_id
  AND s.status = 'active';

-- H. Backfill existing vehicles from their dealer's sort_boost
UPDATE vehicles v
SET sort_boost = d.sort_boost
FROM dealers d
WHERE v.dealer_id = d.id
  AND d.sort_boost > 0;

-- I. Index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_vehicles_sort_boost ON vehicles(sort_boost DESC);
CREATE INDEX IF NOT EXISTS idx_dealers_sort_boost ON dealers(sort_boost DESC);

COMMENT ON COLUMN dealers.sort_boost IS 'Catalog sort priority derived from subscription plan: premium=3, founding=2, basic=1, free=0';
COMMENT ON COLUMN vehicles.sort_boost IS 'Denormalized from dealer.sort_boost for direct PostgREST ORDER BY';
