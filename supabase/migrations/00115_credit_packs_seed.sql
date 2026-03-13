-- Migration 00115: credit_packs table + seed data
-- Agent A — Task #7
-- Creates the credit_packs table and seeds 5 packs for the credit system.

CREATE TABLE IF NOT EXISTS public.credit_packs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,
  name_es     text        NOT NULL,
  name_en     text        NOT NULL,
  credits     integer     NOT NULL CHECK (credits > 0),
  price_cents integer     NOT NULL CHECK (price_cents > 0),
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.credit_packs IS 'Credit packs available for purchase (one-time Stripe payments).';
COMMENT ON COLUMN public.credit_packs.credits     IS 'Number of credits granted on purchase (includes bonuses).';
COMMENT ON COLUMN public.credit_packs.price_cents IS 'Price in euro cents (e.g. 200 = €2.00).';

-- RLS: readable by all (public pricing page), writable only by service role
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_packs_select_public"
  ON public.credit_packs FOR SELECT
  USING (is_active = true);

-- Seed data: 5 packs
-- starter:    1 credit   = €2   (no bonus)
-- basic:      3 credits  = €5   (no bonus)
-- pro:       11 credits  = €15  (10 + 1 bonus — FEATURED)
-- business:  28 credits  = €35  (25 + 3 bonus)
-- enterprise: 60 credits = €60  (50 + 10 bonus)

INSERT INTO public.credit_packs (slug, name_es, name_en, credits, price_cents, sort_order)
VALUES
  ('starter',    'Arranca',  'Starter',    1,  200,  1),
  ('basic',      'Básico',   'Basic',      3,  500,  2),
  ('pro',        'Pro',      'Pro',       11, 1500,  3),
  ('business',   'Negocio',  'Business',  28, 3500,  4),
  ('enterprise', 'Empresa',  'Enterprise',60, 6000,  5)
ON CONFLICT (slug) DO NOTHING;
