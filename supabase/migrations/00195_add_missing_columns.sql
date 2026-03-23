-- Migration: add missing columns to existing tables
-- Resolves all "Schema pending" column references

-- vehicles: title_es, title_en, scheduled_publish_at
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS title_es text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_vehicles_scheduled ON public.vehicles(scheduled_publish_at)
  WHERE status = 'draft' AND scheduled_publish_at IS NOT NULL;

-- users: digest_frequency
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS digest_frequency text DEFAULT 'weekly'
    CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', 'never'));

-- favorites: price_threshold
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS price_threshold integer;

-- email_preferences: created_at
ALTER TABLE public.email_preferences
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- dealers: address (jsonb for structured address data)
ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS address jsonb;

-- vertical_config: feature_flags
ALTER TABLE public.vertical_config
  ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT '{}'::jsonb;

-- subscriptions: newsletter preference columns + email
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS pref_web boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pref_press boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pref_newsletter boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pref_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pref_events boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pref_csr boolean DEFAULT false;
