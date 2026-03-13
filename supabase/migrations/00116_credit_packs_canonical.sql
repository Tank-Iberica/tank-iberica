-- Migration 00116: Canonicalize credit_packs — ensure 5 correct packs
-- Agent A — Task #7 (cleanup)
-- Previous sessions created messy duplicate data. This migration:
--   1. Deactivates non-canonical slugs
--   2. Upserts the 5 canonical packs with correct values

-- Deactivate all non-canonical slugs
UPDATE public.credit_packs
  SET is_active = false
WHERE slug NOT IN ('starter', 'basic', 'pro', 'business', 'enterprise');

-- Upsert canonical packs (INSERT or UPDATE)
INSERT INTO public.credit_packs (slug, name_es, name_en, credits, price_cents, is_active, sort_order)
VALUES
  ('starter',    'Arranca', 'Starter',    1,  200, true, 1),
  ('basic',      'Básico',  'Basic',      3,  500, true, 2),
  ('pro',        'Pro',     'Pro',       11, 1500, true, 3),
  ('business',   'Negocio', 'Business',  28, 3500, true, 4),
  ('enterprise', 'Empresa', 'Enterprise',60, 6000, true, 5)
ON CONFLICT (slug) DO UPDATE SET
  name_es     = EXCLUDED.name_es,
  name_en     = EXCLUDED.name_en,
  credits     = EXCLUDED.credits,
  price_cents = EXCLUDED.price_cents,
  is_active   = EXCLUDED.is_active,
  sort_order  = EXCLUDED.sort_order;
