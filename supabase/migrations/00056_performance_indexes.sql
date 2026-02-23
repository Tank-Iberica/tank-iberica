-- Session 35: Performance indexes for scalability

-- Enable pg_trgm extension for fuzzy search (may already exist)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Location indexes for geographic filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_location_province ON public.vehicles (location_province);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_region ON public.vehicles (location_region);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_country ON public.vehicles (location_country);

-- Brand trigram index for fuzzy search
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_trgm ON public.vehicles USING gin (brand gin_trgm_ops);

-- Composite index for common query pattern: active vehicles sorted by date
CREATE INDEX IF NOT EXISTS idx_vehicles_status_created ON public.vehicles (status, created_at DESC);

-- Scheduled publishing index
CREATE INDEX IF NOT EXISTS idx_vehicles_visible_from ON public.vehicles (visible_from) WHERE visible_from IS NOT NULL;

-- Invoice lookup by dealer + date
CREATE INDEX IF NOT EXISTS idx_invoices_dealer_created ON public.invoices (dealer_id, created_at DESC);

-- Payment lookup by checkout session (only if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'checkout_session_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payments_checkout_session ON public.payments (checkout_session_id) WHERE checkout_session_id IS NOT NULL';
  END IF;
END $$;
