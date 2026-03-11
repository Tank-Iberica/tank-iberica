-- ============================================================
-- Migration 00076: vehicles_archive table + archive function
-- ============================================================
-- Creates a cold-storage archive for sold vehicles older than N months.
-- Reduces main vehicles table size and improves query performance.
-- ============================================================

-- ── Archive table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles_archive (
  LIKE vehicles INCLUDING ALL
);

-- Additional metadata columns
ALTER TABLE vehicles_archive
  ADD COLUMN IF NOT EXISTS archived_at     timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archive_reason  text        NOT NULL DEFAULT 'auto_archive_sold';

-- Index for lookups by original ID
CREATE INDEX IF NOT EXISTS idx_vehicles_archive_id ON vehicles_archive (id);
CREATE INDEX IF NOT EXISTS idx_vehicles_archive_dealer ON vehicles_archive (dealer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_archive_archived_at ON vehicles_archive (archived_at);

-- ── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE vehicles_archive ENABLE ROW LEVEL SECURITY;

-- Admins can read all archived vehicles
CREATE POLICY "Admins can read archive"
  ON vehicles_archive FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Dealers can read their own archived vehicles
CREATE POLICY "Dealers can read own archive"
  ON vehicles_archive FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dealers d
      WHERE d.user_id = auth.uid()
        AND d.id = vehicles_archive.dealer_id
    )
  );

-- ── Archive function ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION archive_sold_vehicles(older_than_days int DEFAULT 180)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count int;
  cutoff_date    timestamptz;
BEGIN
  cutoff_date := now() - (older_than_days || ' days')::interval;

  -- Insert into archive (ignore already-archived)
  INSERT INTO vehicles_archive
  SELECT
    v.*,
    now()           AS archived_at,
    'auto_archive_sold' AS archive_reason
  FROM vehicles v
  WHERE v.status = 'sold'
    AND v.updated_at < cutoff_date
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Remove from main table
  DELETE FROM vehicles
  WHERE status = 'sold'
    AND updated_at < cutoff_date;

  RETURN archived_count;
END;
$$;

COMMENT ON FUNCTION archive_sold_vehicles(int) IS
  'Moves sold vehicles older than N days from vehicles to vehicles_archive. Returns number archived.';

-- ── Restore function ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION restore_archived_vehicle(vehicle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v vehicles_archive%ROWTYPE;
BEGIN
  SELECT * INTO v FROM vehicles_archive WHERE id = vehicle_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vehicle % not found in archive', vehicle_id;
  END IF;

  -- Re-insert only the columns that exist in the main table
  -- (archived_at and archive_reason are archive-only columns)
  INSERT INTO vehicles (
    id, dealer_id, vertical_id, category_id, subcategory_id,
    title_es, title_en, description_es, description_en,
    price, currency, status, visibility,
    brand, model, year, mileage,
    location_country, location_region, location_province,
    attributes_json, images, documents, slug, featured,
    created_at, updated_at, published_at, sold_at, reserved_at,
    views_count, contact_count, favorite_count,
    verification_level, is_imported
  )
  VALUES (
    v.id, v.dealer_id, v.vertical_id, v.category_id, v.subcategory_id,
    v.title_es, v.title_en, v.description_es, v.description_en,
    v.price, v.currency, v.status, v.visibility,
    v.brand, v.model, v.year, v.mileage,
    v.location_country, v.location_region, v.location_province,
    v.attributes_json, v.images, v.documents, v.slug, v.featured,
    v.created_at, v.updated_at, v.published_at, v.sold_at, v.reserved_at,
    v.views_count, v.contact_count, v.favorite_count,
    v.verification_level, v.is_imported
  )
  ON CONFLICT (id) DO NOTHING;

  DELETE FROM vehicles_archive WHERE id = vehicle_id;
END;
$$;

COMMENT ON FUNCTION restore_archived_vehicle(uuid) IS
  'Moves a vehicle from vehicles_archive back to the main vehicles table.';
