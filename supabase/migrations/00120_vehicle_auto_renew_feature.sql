-- Migration 00120: auto_renew and auto_feature toggles on vehicles
-- Dealers enable these toggles; cron deducts 1 credit per execution.
-- auto_renew: resets sort position (updates updated_at)
-- auto_feature: sets featured = true (makes listing highlighted)

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS auto_renew  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_feature boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.vehicles.auto_renew IS
  'When true, cron will deduct 1 credit and refresh updated_at to keep the listing at the top.';
COMMENT ON COLUMN public.vehicles.auto_feature IS
  'When true, cron will deduct 1 credit and set featured=true on each run.';

-- Partial index for cron query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_auto_settings
  ON public.vehicles(dealer_id)
  WHERE (auto_renew = true OR auto_feature = true) AND status = 'published';
