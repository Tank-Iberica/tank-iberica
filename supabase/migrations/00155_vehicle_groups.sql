-- Migration: vehicle_groups — grouping vehicles into named collections
-- Agent E, Bloque 15, Item #125
-- Groups can be platform-wide (curated) or dealer-specific (collections)

-- ============================================================================
-- 1. vehicle_groups table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        jsonb NOT NULL DEFAULT '{}',       -- {"es": "...", "en": "..."}
  slug        text NOT NULL,
  description jsonb DEFAULT '{}',                -- {"es": "...", "en": "..."}
  dealer_id   uuid REFERENCES dealers(id) ON DELETE CASCADE,  -- NULL = platform-wide
  group_type  text NOT NULL DEFAULT 'collection'
    CHECK (group_type IN ('curated', 'collection', 'seasonal', 'lot')),
  icon_url    text,
  cover_image text,
  sort_order  int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'draft', 'archived')),
  vertical    text NOT NULL DEFAULT 'tracciona',
  metadata    jsonb DEFAULT '{}',                -- extensible properties
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, vertical)
);

COMMENT ON TABLE vehicle_groups IS 'Named collections of vehicles — curated by platform or created by dealers';
COMMENT ON COLUMN vehicle_groups.group_type IS 'curated=platform picks, collection=dealer organized, seasonal=time-limited, lot=bulk sale';
COMMENT ON COLUMN vehicle_groups.dealer_id IS 'NULL for platform-wide groups, FK for dealer-specific collections';

-- ============================================================================
-- 2. vehicle_group_items junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_group_items (
  group_id    uuid NOT NULL REFERENCES vehicle_groups(id) ON DELETE CASCADE,
  vehicle_id  uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  sort_order  int NOT NULL DEFAULT 0,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, vehicle_id)
);

COMMENT ON TABLE vehicle_group_items IS 'Many-to-many: vehicles can belong to multiple groups';

-- ============================================================================
-- 3. Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicle_groups_dealer ON vehicle_groups(dealer_id) WHERE dealer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_groups_vertical_status ON vehicle_groups(vertical, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_groups_type ON vehicle_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_group_items_vehicle ON vehicle_group_items(vehicle_id);

-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

ALTER TABLE vehicle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_group_items ENABLE ROW LEVEL SECURITY;

-- Public can see active groups
DROP POLICY IF EXISTS "vehicle_groups_select_public" ON vehicle_groups;
CREATE POLICY "vehicle_groups_select_public"
  ON vehicle_groups FOR SELECT
  USING (status = 'active');

-- Dealers can manage their own groups
DROP POLICY IF EXISTS "vehicle_groups_insert_dealer" ON vehicle_groups;
CREATE POLICY "vehicle_groups_insert_dealer"
  ON vehicle_groups FOR INSERT
  WITH CHECK (
    dealer_id IS NOT NULL
    AND dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vehicle_groups_update_dealer" ON vehicle_groups;
CREATE POLICY "vehicle_groups_update_dealer"
  ON vehicle_groups FOR UPDATE
  USING (
    dealer_id IS NOT NULL
    AND dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vehicle_groups_delete_dealer" ON vehicle_groups;
CREATE POLICY "vehicle_groups_delete_dealer"
  ON vehicle_groups FOR DELETE
  USING (
    dealer_id IS NOT NULL
    AND dealer_id IN (
      SELECT id FROM dealers WHERE user_id = auth.uid()
    )
  );

-- Admin can manage all groups (including platform-wide curated ones)
DROP POLICY IF EXISTS "vehicle_groups_admin_all" ON vehicle_groups;
CREATE POLICY "vehicle_groups_admin_all"
  ON vehicle_groups FOR ALL
  USING (is_admin());

-- Junction table: same visibility as parent group
DROP POLICY IF EXISTS "vehicle_group_items_select_public" ON vehicle_group_items;
CREATE POLICY "vehicle_group_items_select_public"
  ON vehicle_group_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_groups
      WHERE id = vehicle_group_items.group_id AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "vehicle_group_items_manage_dealer" ON vehicle_group_items;
CREATE POLICY "vehicle_group_items_manage_dealer"
  ON vehicle_group_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_groups g
      JOIN dealers d ON g.dealer_id = d.id
      WHERE g.id = vehicle_group_items.group_id
        AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vehicle_group_items_admin_all" ON vehicle_group_items;
CREATE POLICY "vehicle_group_items_admin_all"
  ON vehicle_group_items FOR ALL
  USING (is_admin());

-- ============================================================================
-- 5. Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vehicle_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicle_groups_updated_at ON vehicle_groups;
CREATE TRIGGER trg_vehicle_groups_updated_at
  BEFORE UPDATE ON vehicle_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_groups_updated_at();
