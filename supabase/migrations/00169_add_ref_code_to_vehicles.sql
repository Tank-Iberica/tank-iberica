-- #59 — Add ref_code column to vehicles with auto-generated trigger
-- Format: TRC-XXXXX (zero-padded sequential number)

-- 1. Add column
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS ref_code text UNIQUE;

-- 2. Create sequence for generating sequential ref codes
CREATE SEQUENCE IF NOT EXISTS vehicles_ref_code_seq START 1;

-- 3. Function to auto-generate ref_code on INSERT
CREATE OR REPLACE FUNCTION public.generate_vehicle_ref_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix text;
BEGIN
  -- Read prefix from vertical_config, default to 'TRC'
  SELECT COALESCE(
    (SELECT (config->>'ref_code_prefix')
     FROM public.vertical_config
     WHERE slug = COALESCE(NEW.vertical, 'tracciona')
     LIMIT 1),
    'TRC'
  ) INTO prefix;

  -- Generate ref_code if not already set
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := prefix || '-' || LPAD(nextval('vehicles_ref_code_seq')::text, 5, '0');
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Trigger on INSERT
DROP TRIGGER IF EXISTS trg_generate_ref_code ON public.vehicles;
CREATE TRIGGER trg_generate_ref_code
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_vehicle_ref_code();

-- 5. Backfill existing vehicles that don't have ref_code
DO $$
DECLARE
  rec RECORD;
  prefix text := 'TRC';
BEGIN
  FOR rec IN
    SELECT id FROM public.vehicles WHERE ref_code IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE public.vehicles
    SET ref_code = prefix || '-' || LPAD(nextval('vehicles_ref_code_seq')::text, 5, '0')
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 6. Index for quick lookup by ref_code (WhatsApp handler)
CREATE INDEX IF NOT EXISTS idx_vehicles_ref_code ON public.vehicles (ref_code);
