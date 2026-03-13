-- Migration 00121: highlight_style on vehicles
-- Dealer pays 2 credits to apply a special visual style to their listing in the catalog.
-- Styles: 'gold', 'premium', 'spotlight', 'urgent'
-- A null value means no highlight (default).

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS highlight_style TEXT
    CHECK (highlight_style IN ('gold', 'premium', 'spotlight', 'urgent'));

COMMENT ON COLUMN public.vehicles.highlight_style IS
  'Visual highlight style applied to this listing in the catalog. Dealer pays 2 credits.
   Allowed values: gold, premium, spotlight, urgent. NULL = no highlight.';

-- Partial index for fetching highlighted vehicles efficiently
CREATE INDEX IF NOT EXISTS idx_vehicles_highlight_style
  ON public.vehicles(highlight_style)
  WHERE highlight_style IS NOT NULL AND status = 'published';
