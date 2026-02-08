-- ================================================
-- TANK IBERICA — Migration 00011: Add Online/Offline distinction
-- Combines "Vehículos" (online/public) and "Intermediación" (offline/internal)
-- into a unified "Productos" system with a filter.
-- ================================================

-- Add is_online flag to distinguish public vs internal vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;

-- Add intermediation-specific fields (only used when is_online = false)
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_contact TEXT,
ADD COLUMN IF NOT EXISTS owner_notes TEXT;

-- Add index for filtering by online/offline
CREATE INDEX IF NOT EXISTS idx_vehicles_is_online ON vehicles(is_online);

-- Add comments for documentation
COMMENT ON COLUMN vehicles.is_online IS 'true = public web (Vehículos), false = internal only (Intermediación)';
COMMENT ON COLUMN vehicles.owner_name IS 'Owner name for intermediation vehicles (is_online = false)';
COMMENT ON COLUMN vehicles.owner_contact IS 'Owner contact for intermediation vehicles';
COMMENT ON COLUMN vehicles.owner_notes IS 'Internal notes about the owner/intermediation';

-- Update RLS policy to allow admin access to offline vehicles
-- (Public users should only see online + published vehicles)
DROP POLICY IF EXISTS "vehicles_select_published" ON vehicles;

CREATE POLICY "vehicles_select_published"
  ON vehicles FOR SELECT
  USING (
    -- Public: only online and published
    (is_online = true AND status = 'published')
    -- Admin: can see everything
    OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
  );
