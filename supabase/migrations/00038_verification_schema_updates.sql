-- ================================================
-- 00038: Verification schema updates
-- ================================================
-- Convert verification_level from INT to VARCHAR
-- Add dealer RLS policies for verification_documents
-- Add rejection_reason and submitted_by columns
-- Auto-calculate verification level trigger
-- ================================================

-- A. Convert vehicles.verification_level to VARCHAR if needed
-- Use DO block to handle both INT and VARCHAR states (idempotent)
DO $$
BEGIN
  -- Check if the column is already VARCHAR
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'verification_level'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE vehicles
      ALTER COLUMN verification_level TYPE VARCHAR
      USING CASE verification_level
        WHEN 0 THEN 'none'
        WHEN 1 THEN 'verified'
        WHEN 2 THEN 'extended'
        WHEN 3 THEN 'detailed'
        ELSE 'none'
      END;
  END IF;
END $$;

ALTER TABLE vehicles
  ALTER COLUMN verification_level SET DEFAULT 'none';

-- B. Add missing columns to verification_documents
ALTER TABLE verification_documents
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- C. Add dealer RLS policies for verification_documents
DROP POLICY IF EXISTS "verif_docs_dealer_read" ON verification_documents;
CREATE POLICY "verif_docs_dealer_read" ON verification_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN dealers d ON v.dealer_id = d.id
      WHERE v.id = vehicle_id AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "verif_docs_dealer_insert" ON verification_documents;
CREATE POLICY "verif_docs_dealer_insert" ON verification_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN dealers d ON v.dealer_id = d.id
      WHERE v.id = vehicle_id AND d.user_id = auth.uid()
    )
  );

-- Note: admin policies already exist from migration 00031 (verif_docs_admin_all)

-- D. Function to auto-calculate verification level from approved documents
CREATE OR REPLACE FUNCTION calculate_verification_level(v_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  approved_types TEXT[];
  has_ficha BOOLEAN;
  has_km_photo BOOLEAN;
  has_exterior BOOLEAN;
  has_placa BOOLEAN;
  has_permiso BOOLEAN;
  has_itv BOOLEAN;
  has_sector_specific BOOLEAN;
  has_dgt_report BOOLEAN;
  has_inspection BOOLEAN;
BEGIN
  -- Collect all approved doc types for this vehicle
  SELECT ARRAY_AGG(doc_type)
  INTO approved_types
  FROM verification_documents
  WHERE vehicle_id = v_id AND status = 'verified';

  IF approved_types IS NULL THEN
    RETURN 'none';
  END IF;

  -- Level checks (Tracciona-specific from Anexo G.2)
  has_ficha := 'ficha_tecnica' = ANY(approved_types);
  has_km_photo := 'foto_km' = ANY(approved_types);
  has_exterior := 'fotos_exteriores' = ANY(approved_types);
  has_placa := 'placa_fabricante' = ANY(approved_types);
  has_permiso := 'permiso_circulacion' = ANY(approved_types);
  has_itv := 'tarjeta_itv' = ANY(approved_types);
  has_sector_specific := 'adr' = ANY(approved_types) OR 'atp' = ANY(approved_types)
    OR 'exolum' = ANY(approved_types) OR 'estanqueidad' = ANY(approved_types);
  has_dgt_report := 'dgt_report' = ANY(approved_types);
  has_inspection := 'inspection_report' = ANY(approved_types);

  -- Determine level (highest matching)
  IF has_inspection THEN
    RETURN 'certified';
  ELSIF has_dgt_report THEN
    RETURN 'audited';
  ELSIF has_ficha AND has_km_photo AND has_exterior AND has_placa AND has_permiso AND has_itv AND has_sector_specific THEN
    RETURN 'detailed';
  ELSIF has_ficha AND has_km_photo AND has_exterior AND has_placa AND has_permiso AND has_itv THEN
    RETURN 'extended';
  ELSIF has_ficha AND has_km_photo AND has_exterior THEN
    RETURN 'verified';
  ELSE
    RETURN 'none';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- E. Trigger to auto-update verification_level when documents change
CREATE OR REPLACE FUNCTION update_vehicle_verification_level()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vehicles
  SET verification_level = calculate_verification_level(
    COALESCE(NEW.vehicle_id, OLD.vehicle_id)
  )
  WHERE id = COALESCE(NEW.vehicle_id, OLD.vehicle_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_verification_level ON verification_documents;
CREATE TRIGGER trg_update_verification_level
  AFTER INSERT OR UPDATE OF status OR DELETE ON verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_verification_level();

-- F. Index for faster verification level lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_verification_level ON vehicles(verification_level)
  WHERE verification_level != 'none';

COMMENT ON COLUMN vehicles.verification_level IS 'Verification level: none, verified, extended, detailed, audited, certified';
