-- =============================================================================
-- TRACCIONA — Migration 00031: Complete Tracciona Migration
-- Session 2: Rename tables + i18n JSONB + content_translations + placeholder tables
-- =============================================================================
-- This migration does everything in a single transaction:
--   Bloque A: Rename tables (actions, categories, subcategories, attributes)
--   Bloque B: Migrate _es/_en columns to JSONB
--   Bloque C: Create content_translations table
--   Bloque D: Placeholder tables (dealers, leads, auctions, etc.)
--   Bloque E: Articles table
--   Bloque F: vertical_config + activity_logs
--   Bloque G: RLS for ALL new tables
-- =============================================================================

BEGIN;

-- =============================================================================
-- BLOQUE A: RENOMBRAR TABLAS
-- =============================================================================

-- A.1 — Create actions table (replaces vehicle_category enum)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL,            -- {"es": "Venta", "en": "Sale"}
  slug VARCHAR UNIQUE NOT NULL,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  sort_order INT DEFAULT 0,
  status VARCHAR DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actions_slug ON actions(slug);
CREATE INDEX idx_actions_vertical ON actions(vertical);

-- Seed actions from existing vehicle_category enum values
INSERT INTO actions (name, slug, vertical, sort_order) VALUES
  ('{"es": "Venta", "en": "Sale"}', 'venta', 'tracciona', 1),
  ('{"es": "Alquiler", "en": "Rental"}', 'alquiler', 'tracciona', 2),
  ('{"es": "Terceros", "en": "Third-party"}', 'terceros', 'tracciona', 3);

-- A.2 — Add action_id to vehicles (FK to actions)
ALTER TABLE vehicles ADD COLUMN action_id UUID REFERENCES actions(id) ON DELETE SET NULL;

-- Migrate existing enum values to action_id
UPDATE vehicles SET action_id = (SELECT id FROM actions WHERE slug = 'venta') WHERE category = 'venta';
UPDATE vehicles SET action_id = (SELECT id FROM actions WHERE slug = 'alquiler') WHERE category = 'alquiler';
UPDATE vehicles SET action_id = (SELECT id FROM actions WHERE slug = 'terceros') WHERE category = 'terceros';

-- Don't drop category column yet — keep for safety
-- ALTER TABLE vehicles DROP COLUMN category;

CREATE INDEX idx_vehicles_action ON vehicles(action_id);

-- A.3 — Rename subcategories → categories
-- Current "subcategories" table (created in 00019) becomes "categories"
-- Drop existing RLS policies first
DROP POLICY IF EXISTS "subcategories_select_published" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_insert" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_update" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_delete" ON subcategories;
DROP POLICY IF EXISTS "subcategories_admin_select_all" ON subcategories;

ALTER TABLE subcategories RENAME TO categories;

-- Rename indexes
ALTER INDEX idx_subcategories_slug RENAME TO idx_categories_slug;
ALTER INDEX idx_subcategories_sort RENAME TO idx_categories_sort;
ALTER INDEX idx_subcategories_status RENAME TO idx_categories_status;

-- Rename trigger
ALTER TRIGGER set_updated_at_subcategories ON categories RENAME TO set_updated_at_categories;

-- Add vertical column
ALTER TABLE categories ADD COLUMN vertical VARCHAR NOT NULL DEFAULT 'tracciona';

-- Rename applicable_categories → applicable_actions
ALTER TABLE categories RENAME COLUMN applicable_categories TO applicable_actions;

-- A.4 — Rename types → subcategories
-- Current "types" table (originally subcategories, renamed in 00018) becomes "subcategories"
-- Drop existing RLS policies first
DROP POLICY IF EXISTS "types_select_published" ON types;
DROP POLICY IF EXISTS "types_admin_all" ON types;

ALTER TABLE types RENAME TO subcategories;

-- Rename indexes
ALTER INDEX idx_types_slug RENAME TO idx_subcategories_slug;
ALTER INDEX idx_types_sort RENAME TO idx_subcategories_sort;

-- Rename trigger
ALTER TRIGGER set_updated_at_types ON subcategories RENAME TO set_updated_at_subcategories;

-- Add vertical column
ALTER TABLE subcategories ADD COLUMN vertical VARCHAR NOT NULL DEFAULT 'tracciona';

-- Rename applicable_categories → applicable_actions
ALTER TABLE subcategories RENAME COLUMN applicable_categories TO applicable_actions;

-- A.5 — Rename type_subcategories → subcategory_categories
-- Drop existing RLS policies
DROP POLICY IF EXISTS "type_subcategories_select_public" ON type_subcategories;
DROP POLICY IF EXISTS "type_subcategories_admin_insert" ON type_subcategories;
DROP POLICY IF EXISTS "type_subcategories_admin_delete" ON type_subcategories;

ALTER TABLE type_subcategories RENAME TO subcategory_categories;

-- Rename columns (order matters: rename subcategory_id first to free the name)
ALTER TABLE subcategory_categories RENAME COLUMN subcategory_id TO category_id;
ALTER TABLE subcategory_categories RENAME COLUMN type_id TO subcategory_id;

-- Rename indexes
ALTER INDEX idx_type_subcategories_type RENAME TO idx_subcategory_categories_subcategory;
ALTER INDEX idx_type_subcategories_subcategory RENAME TO idx_subcategory_categories_category;

-- A.6 — Rename filter_definitions → attributes
-- Drop existing RLS policies
DROP POLICY IF EXISTS "filter_definitions_select_published" ON filter_definitions;
DROP POLICY IF EXISTS "filter_definitions_admin_all" ON filter_definitions;

ALTER TABLE filter_definitions RENAME TO attributes;

-- Rename type_id → subcategory_id (the FK column)
ALTER TABLE attributes RENAME COLUMN type_id TO subcategory_id;

-- Rename indexes
ALTER INDEX idx_filter_definitions_type RENAME TO idx_attributes_subcategory;
ALTER INDEX idx_filter_definitions_sort RENAME TO idx_attributes_sort;

-- Rename trigger
ALTER TRIGGER set_updated_at_filter_definitions ON attributes RENAME TO set_updated_at_attributes;

-- Add vertical column
ALTER TABLE attributes ADD COLUMN vertical VARCHAR NOT NULL DEFAULT 'tracciona';

-- A.7 — Rename vehicles columns
-- vehicles.type_id → vehicles.category_id (type_id was renamed from subcategory_id in 00018)
ALTER TABLE vehicles RENAME COLUMN type_id TO category_id;

-- vehicles.filters_json → vehicles.attributes_json
ALTER TABLE vehicles RENAME COLUMN filters_json TO attributes_json;

-- Drop old index on enum column, then rename type index
DROP INDEX IF EXISTS idx_vehicles_category;
ALTER INDEX idx_vehicles_type RENAME TO idx_vehicles_category;

-- A.8 — Update FK columns in legacy admin tables (balance, historico, intermediacion)
-- These had subcategory_id → type_id in 00018, now type_id references "subcategories" (formerly "types")
-- Wrapped in DO blocks because these tables may not exist on all environments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'balance' AND table_schema = 'public') THEN
    ALTER TABLE balance RENAME COLUMN type_id TO subcategory_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historico' AND table_schema = 'public') THEN
    ALTER TABLE historico RENAME COLUMN type_id TO subcategory_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intermediacion' AND table_schema = 'public') THEN
    ALTER TABLE intermediacion RENAME COLUMN type_id TO subcategory_id;
  END IF;
END $$;

-- Rename legacy indexes (safe with IF EXISTS pattern via DO block)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_balance_type') THEN
    ALTER INDEX idx_balance_type RENAME TO idx_balance_subcategory;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_historico_type') THEN
    ALTER INDEX idx_historico_type RENAME TO idx_historico_subcategory;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_intermediacion_type') THEN
    ALTER INDEX idx_intermediacion_type RENAME TO idx_intermediacion_subcategory;
  END IF;
END $$;

-- A.9 — Update advertisements & demands columns
-- They reference types(id) via type_id, and subcategories(id) via subcategory_id
-- After renames: types→subcategories, subcategories→categories
-- Rename subcategory_id → category_id FIRST to free the name, then type_id → subcategory_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advertisements' AND table_schema = 'public') THEN
    -- Rename subcategory_id first (now points to categories)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'subcategory_id') THEN
      ALTER TABLE advertisements RENAME COLUMN subcategory_id TO category_id;
    END IF;
    -- Then rename type_id (now points to subcategories)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'type_id') THEN
      ALTER TABLE advertisements RENAME COLUMN type_id TO subcategory_id;
    END IF;
    -- Rename filters_json
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'filters_json') THEN
      ALTER TABLE advertisements RENAME COLUMN filters_json TO attributes_json;
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demands' AND table_schema = 'public') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'subcategory_id') THEN
      ALTER TABLE demands RENAME COLUMN subcategory_id TO category_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'type_id') THEN
      ALTER TABLE demands RENAME COLUMN type_id TO subcategory_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'filters_json') THEN
      ALTER TABLE demands RENAME COLUMN filters_json TO attributes_json;
    END IF;
  END IF;
END $$;

-- Rename indexes for advertisements and demands (safe)
DO $$ BEGIN
  -- advertisements indexes: must rename subcategory first to free the name
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advertisements_subcategory') THEN
    ALTER INDEX idx_advertisements_subcategory RENAME TO idx_advertisements_category;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advertisements_type') THEN
    ALTER INDEX idx_advertisements_type RENAME TO idx_advertisements_subcategory;
  END IF;
  -- demands indexes
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_demands_subcategory') THEN
    ALTER INDEX idx_demands_subcategory RENAME TO idx_demands_category;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_demands_type') THEN
    ALTER INDEX idx_demands_type RENAME TO idx_demands_subcategory;
  END IF;
END $$;

-- A.10 — Updated_at trigger for actions
CREATE TRIGGER set_updated_at_actions
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- BLOQUE B: MIGRAR COLUMNAS DE IDIOMA A JSONB
-- =============================================================================

-- B.1 — categories (formerly subcategories from 00019)
ALTER TABLE categories ADD COLUMN name JSONB;
ALTER TABLE categories ADD COLUMN name_singular JSONB;

UPDATE categories SET name = jsonb_build_object('es', name_es, 'en', COALESCE(name_en, name_es));
UPDATE categories SET name_singular = jsonb_build_object('es', COALESCE(name_singular_es, name_es), 'en', COALESCE(name_singular_en, name_en, name_singular_es, name_es));

-- Don't drop old columns yet
-- ALTER TABLE categories DROP COLUMN name_es, DROP COLUMN name_en, DROP COLUMN name_singular_es, DROP COLUMN name_singular_en;

-- B.2 — subcategories (formerly types from 00002/00018)
ALTER TABLE subcategories ADD COLUMN name JSONB;
ALTER TABLE subcategories ADD COLUMN name_singular JSONB;

UPDATE subcategories SET name = jsonb_build_object('es', name_es, 'en', COALESCE(name_en, name_es));
UPDATE subcategories SET name_singular = jsonb_build_object('es', COALESCE(name_singular_es, name_es), 'en', COALESCE(name_singular_en, name_en, name_singular_es, name_es));

-- Don't drop old columns yet
-- ALTER TABLE subcategories DROP COLUMN name_es, DROP COLUMN name_en, DROP COLUMN name_singular_es, DROP COLUMN name_singular_en;

-- B.3 — attributes (formerly filter_definitions)
ALTER TABLE attributes ADD COLUMN label JSONB;

UPDATE attributes SET label = jsonb_build_object('es', COALESCE(label_es, name), 'en', COALESCE(label_en, label_es, name));

-- Don't drop old columns yet
-- ALTER TABLE attributes DROP COLUMN label_es, DROP COLUMN label_en;

-- B.4 — news table: title, description to JSONB (content goes to content_translations in Bloque C)
ALTER TABLE news ADD COLUMN title JSONB;
ALTER TABLE news ADD COLUMN description JSONB;

UPDATE news SET title = jsonb_build_object('es', title_es, 'en', COALESCE(title_en, title_es));
UPDATE news SET description = jsonb_build_object('es', description_es, 'en', COALESCE(description_en, description_es)) WHERE description_es IS NOT NULL;

-- Don't drop old columns yet
-- ALTER TABLE news DROP COLUMN title_es, DROP COLUMN title_en, DROP COLUMN description_es, DROP COLUMN description_en;

-- B.5 — vehicles: location → location_data JSONB
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location_data JSONB DEFAULT '{}';

UPDATE vehicles SET location_data = jsonb_build_object(
  'es', COALESCE(location, ''),
  'en', COALESCE(location_en, location, '')
) WHERE location IS NOT NULL;

-- Don't drop old columns yet
-- ALTER TABLE vehicles DROP COLUMN location, DROP COLUMN location_en;

-- B.6 — vehicles: pending_translations flag
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pending_translations BOOLEAN DEFAULT false;


-- =============================================================================
-- BLOQUE C: TABLA content_translations
-- =============================================================================

CREATE TABLE content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR NOT NULL,    -- 'vehicle', 'article', 'news', 'dealer'
  entity_id UUID NOT NULL,
  field VARCHAR NOT NULL,           -- 'description', 'content', 'excerpt', 'bio'
  locale VARCHAR(5) NOT NULL,       -- 'es', 'en', 'fr', 'de', 'nl', 'pl', 'it'
  value TEXT NOT NULL,
  source VARCHAR DEFAULT 'original', -- 'original', 'auto_gpt4omini', 'auto_haiku', 'auto_deepl', 'reviewed', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_type, entity_id, field, locale)
);

-- Indexes for the real queries
CREATE INDEX idx_ct_lookup ON content_translations(entity_type, entity_id, locale);
CREATE INDEX idx_ct_entity ON content_translations(entity_type, entity_id, field);
CREATE INDEX idx_ct_source ON content_translations(source);

-- Full-text search by language
CREATE INDEX idx_ct_fts_es ON content_translations USING GIN(to_tsvector('spanish', value)) WHERE locale = 'es';
CREATE INDEX idx_ct_fts_en ON content_translations USING GIN(to_tsvector('english', value)) WHERE locale = 'en';
CREATE INDEX idx_ct_fts_fr ON content_translations USING GIN(to_tsvector('french', value)) WHERE locale = 'fr';
CREATE INDEX idx_ct_fts_de ON content_translations USING GIN(to_tsvector('german', value)) WHERE locale = 'de';

-- Updated_at trigger
CREATE TRIGGER set_updated_at_content_translations
  BEFORE UPDATE ON content_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- C.2 — Migrate existing vehicle descriptions to content_translations
INSERT INTO content_translations (entity_type, entity_id, field, locale, value, source)
SELECT 'vehicle', id, 'description', 'es', description_es, 'original'
FROM vehicles WHERE description_es IS NOT NULL AND description_es != '';

INSERT INTO content_translations (entity_type, entity_id, field, locale, value, source)
SELECT 'vehicle', id, 'description', 'en', description_en, 'original'
FROM vehicles WHERE description_en IS NOT NULL AND description_en != '';

-- C.3 — Migrate existing news content to content_translations
INSERT INTO content_translations (entity_type, entity_id, field, locale, value, source)
SELECT 'news', id, 'content', 'es', content_es, 'original'
FROM news WHERE content_es IS NOT NULL AND content_es != '';

INSERT INTO content_translations (entity_type, entity_id, field, locale, value, source)
SELECT 'news', id, 'content', 'en', content_en, 'original'
FROM news WHERE content_en IS NOT NULL AND content_en != '';

-- Don't drop old content columns yet
-- ALTER TABLE news DROP COLUMN content_es, DROP COLUMN content_en;
-- ALTER TABLE vehicles DROP COLUMN description_es, DROP COLUMN description_en;


-- =============================================================================
-- BLOQUE D: TABLAS PLACEHOLDER
-- =============================================================================

-- D.1 — dealers
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR UNIQUE NOT NULL,
  company_name JSONB NOT NULL,       -- {"es": "Transportes García", "en": "Garcia Transport"}
  legal_name TEXT,
  cif_nif TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  locale VARCHAR(5) DEFAULT 'es',
  location_data JSONB DEFAULT '{}',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  subscription_type VARCHAR DEFAULT 'free',
  subscription_valid_until TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  badge VARCHAR,                     -- 'founding', 'premium', 'verified'
  auto_reply_message JSONB DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{}',
  total_listings INT DEFAULT 0,
  active_listings INT DEFAULT 0,
  total_leads INT DEFAULT 0,
  avg_response_time_hours NUMERIC(6,1),
  rating NUMERIC(3,2),
  status VARCHAR DEFAULT 'active',
  -- Portal dealer fields (from Anexo W.4)
  theme JSONB DEFAULT '{}',
  bio JSONB DEFAULT '{}',
  contact_config JSONB DEFAULT '{
    "show_phone": true,
    "show_email": true,
    "show_address": true,
    "show_website": true,
    "phone_mode": "visible",
    "cta_text": {"es": "Contactar", "en": "Contact"},
    "auto_reply_text": {"es": "Gracias por contactar con nosotros. Responderemos en 24h.", "en": "Thank you for reaching out. We will reply within 24h."},
    "working_hours": {"es": "Lunes a Viernes 9:00-18:00", "en": "Monday to Friday 9:00-18:00"}
  }',
  social_links JSONB DEFAULT '{}',
  certifications JSONB DEFAULT '[]',
  pinned_vehicles UUID[] DEFAULT '{}',
  catalog_sort VARCHAR DEFAULT 'newest',
  notification_config JSONB DEFAULT '{
    "email_on_lead": true,
    "email_on_sale": true,
    "email_weekly_stats": true,
    "email_auction_updates": true,
    "push_enabled": false
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dealers_slug ON dealers(slug);
CREATE INDEX idx_dealers_vertical ON dealers(vertical);
CREATE INDEX idx_dealers_user ON dealers(user_id);

CREATE TRIGGER set_updated_at_dealers
  BEFORE UPDATE ON dealers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.2 — Additional columns on vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS documents_json JSONB;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealers(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS listing_type VARCHAR DEFAULT 'sale';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS verification_level INT DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_price_cents BIGINT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS auto_auction_after_days INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS auto_auction_starting_pct NUMERIC(5,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS visible_from TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_vehicles_dealer ON vehicles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_listing ON vehicles(listing_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_visible_from ON vehicles(visible_from);

-- D.3 — Additional columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'buyer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;

-- D.4 — leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  buyer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  buyer_location TEXT,
  message TEXT,
  source VARCHAR DEFAULT 'form',    -- 'form', 'whatsapp', 'phone', 'chat'
  status VARCHAR DEFAULT 'new',     -- 'new', 'viewed', 'contacted', 'negotiating', 'won', 'lost'
  dealer_notes TEXT,
  first_viewed_at TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  close_reason TEXT,
  sale_price_cents BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_dealer ON leads(dealer_id, status);
CREATE INDEX idx_leads_vehicle ON leads(vehicle_id);
CREATE INDEX idx_leads_buyer ON leads(buyer_user_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.5 — user_vehicle_views
CREATE TABLE user_vehicle_views (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INT DEFAULT 1,
  PRIMARY KEY (user_id, vehicle_id)
);

CREATE INDEX idx_user_vehicle_views_vehicle ON user_vehicle_views(vehicle_id);

-- D.6 — favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_vehicle ON favorites(vehicle_id);

-- D.7 — search_alerts
CREATE TABLE search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  filters JSONB NOT NULL DEFAULT '{}',
  frequency VARCHAR DEFAULT 'daily',  -- 'instant', 'daily', 'weekly'
  active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_alerts_user ON search_alerts(user_id, active);

CREATE TRIGGER set_updated_at_search_alerts
  BEFORE UPDATE ON search_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.8 — Rename existing subscriptions → newsletter_subscriptions, then create new subscriptions
ALTER TABLE subscriptions RENAME TO newsletter_subscriptions;

-- Drop and recreate RLS policies with new table name
DROP POLICY IF EXISTS "subscriptions_public_insert" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "subscriptions_own_select" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "subscriptions_own_update" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_delete" ON newsletter_subscriptions;

CREATE POLICY "newsletter_subscriptions_public_insert" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "newsletter_subscriptions_own_select" ON newsletter_subscriptions FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
);
CREATE POLICY "newsletter_subscriptions_own_update" ON newsletter_subscriptions FOR UPDATE USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR (auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin')
);
CREATE POLICY "newsletter_subscriptions_admin_delete" ON newsletter_subscriptions FOR DELETE USING (
  auth.jwt()->>'role' = 'authenticated' AND (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
);

-- New subscriptions table (dealer plans)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  plan VARCHAR NOT NULL DEFAULT 'free',  -- 'free', 'basic', 'premium', 'founding'
  status VARCHAR DEFAULT 'active',       -- 'active', 'canceled', 'past_due', 'trialing'
  price_cents INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, vertical);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.9 — dealer_stats
CREATE TABLE dealer_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  vehicle_views INT DEFAULT 0,
  profile_views INT DEFAULT 0,
  leads_received INT DEFAULT 0,
  leads_responded INT DEFAULT 0,
  favorites_added INT DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  avg_response_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dealer_id, period_date)
);

CREATE INDEX idx_dealer_stats_dealer ON dealer_stats(dealer_id, period_date DESC);

-- D.10 — dealer_events
CREATE TABLE dealer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dealer_events_dealer ON dealer_events(dealer_id, created_at DESC);
CREATE INDEX idx_dealer_events_type ON dealer_events(event_type);

-- D.11 — dealer_stripe_accounts
CREATE TABLE dealer_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID UNIQUE NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_dealer_stripe_accounts
  BEFORE UPDATE ON dealer_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.12 — dealer_fiscal_data
CREATE TABLE dealer_fiscal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID UNIQUE NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  tax_id TEXT,
  tax_country VARCHAR(2) DEFAULT 'ES',
  tax_address TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_dealer_fiscal_data
  BEFORE UPDATE ON dealer_fiscal_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.13 — dealer_leads (captación de dealers)
CREATE TABLE dealer_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR NOT NULL,           -- 'web_form', 'linkedin', 'cold_call', 'referral', 'event'
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  location TEXT,
  fleet_size INT,
  status VARCHAR DEFAULT 'new',      -- 'new', 'contacted', 'interested', 'signed', 'rejected'
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dealer_leads_status ON dealer_leads(status);
CREATE INDEX idx_dealer_leads_created ON dealer_leads(created_at DESC);

CREATE TRIGGER set_updated_at_dealer_leads
  BEFORE UPDATE ON dealer_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.14 — auctions
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  start_price_cents BIGINT NOT NULL,
  reserve_price_cents BIGINT,
  current_bid_cents BIGINT DEFAULT 0,
  bid_count INT DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'draft',    -- 'draft', 'scheduled', 'active', 'ended', 'cancelled'
  buyer_premium_pct NUMERIC(4,2) DEFAULT 8.00,
  anti_sniping_minutes INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auctions_vehicle ON auctions(vehicle_id);
CREATE INDEX idx_auctions_status ON auctions(status, ends_at);
CREATE INDEX idx_auctions_vertical ON auctions(vertical);

-- D.15 — auction_bids
CREATE TABLE auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount_cents BIGINT NOT NULL,
  is_winning BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auction_bids_auction ON auction_bids(auction_id, amount_cents DESC);
CREATE INDEX idx_auction_bids_user ON auction_bids(user_id);

-- D.16 — auction_registrations
CREATE TABLE auction_registrations (
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  deposit_paid BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (auction_id, user_id)
);

-- D.17 — verification_documents
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  doc_type VARCHAR NOT NULL,         -- 'dgt', 'inspection', 'km_score', 'photos', 'manual'
  file_url TEXT,
  data JSONB DEFAULT '{}',
  verified_by UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'pending',  -- 'pending', 'verified', 'rejected'
  level INT NOT NULL DEFAULT 1,      -- 1, 2, 3
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  price_cents INT
);

CREATE INDEX idx_verification_docs_vehicle ON verification_documents(vehicle_id);
CREATE INDEX idx_verification_docs_status ON verification_documents(status);

-- D.18 — advertisers
CREATE TABLE advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  tax_id TEXT,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_advertisers
  BEFORE UPDATE ON advertisers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.19 — ads
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  title TEXT,
  description TEXT,
  image_url TEXT,
  logo_url TEXT,
  link_url TEXT,
  phone TEXT,
  email TEXT,
  cta_text JSONB DEFAULT '{}',       -- {"es": "Ver más", "en": "Learn more"}
  countries TEXT[] DEFAULT '{}',
  regions TEXT[] DEFAULT '{}',
  provinces TEXT[] DEFAULT '{}',
  category_slugs TEXT[] DEFAULT '{}',
  action_slugs TEXT[] DEFAULT '{}',
  positions TEXT[] DEFAULT '{}',     -- 'catalog_top', 'catalog_sidebar', 'vehicle_detail', 'homepage'
  format VARCHAR DEFAULT 'banner',   -- 'banner', 'native', 'sponsored'
  include_in_pdf BOOLEAN DEFAULT false,
  include_in_email BOOLEAN DEFAULT false,
  price_monthly_cents INT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status VARCHAR DEFAULT 'draft',    -- 'draft', 'active', 'paused', 'ended'
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ads_advertiser ON ads(advertiser_id);
CREATE INDEX idx_ads_status ON ads(status, starts_at, ends_at);
CREATE INDEX idx_ads_vertical ON ads(vertical);
CREATE INDEX idx_ads_positions ON ads USING GIN(positions);

CREATE TRIGGER set_updated_at_ads
  BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.20 — ad_events
CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,       -- 'impression', 'click', 'conversion'
  user_country VARCHAR,
  user_region VARCHAR,
  user_province VARCHAR,
  page_path TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_events_ad ON ad_events(ad_id, event_type);
CREATE INDEX idx_ad_events_created ON ad_events(created_at DESC);

-- D.21 — geo_regions
CREATE TABLE geo_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(2) NOT NULL,
  region_level VARCHAR NOT NULL,     -- 'country', 'region', 'province'
  region_slug VARCHAR NOT NULL,
  region_name JSONB NOT NULL,        -- {"es": "León", "en": "León", "fr": "León"}
  parent_slug VARCHAR,
  postal_code_pattern VARCHAR,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  sort_order INT DEFAULT 0,
  UNIQUE(country_code, region_slug)
);

CREATE INDEX idx_geo_regions_country ON geo_regions(country_code, region_level);
CREATE INDEX idx_geo_regions_parent ON geo_regions(parent_slug);

-- Seed Spain geo_regions (72 records)
-- País
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, sort_order) VALUES
('ES', 'country', 'espana', '{"es":"España","en":"Spain","fr":"Espagne","de":"Spanien","it":"Spagna","nl":"Spanje","pl":"Hiszpania"}', NULL, 0);

-- 17 Comunidades Autónomas + Ceuta + Melilla
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, sort_order) VALUES
('ES', 'region', 'andalucia',           '{"es":"Andalucía","en":"Andalusia","fr":"Andalousie","de":"Andalusien"}',         'espana', 1),
('ES', 'region', 'aragon',              '{"es":"Aragón","en":"Aragon","fr":"Aragon","de":"Aragonien"}',                     'espana', 2),
('ES', 'region', 'asturias',            '{"es":"Asturias","en":"Asturias","fr":"Asturies","de":"Asturien"}',                 'espana', 3),
('ES', 'region', 'baleares',            '{"es":"Islas Baleares","en":"Balearic Islands","fr":"Îles Baléares","de":"Balearen"}', 'espana', 4),
('ES', 'region', 'canarias',            '{"es":"Canarias","en":"Canary Islands","fr":"Îles Canaries","de":"Kanarische Inseln"}', 'espana', 5),
('ES', 'region', 'cantabria',           '{"es":"Cantabria","en":"Cantabria","fr":"Cantabrie","de":"Kantabrien"}',             'espana', 6),
('ES', 'region', 'castilla_la_mancha',  '{"es":"Castilla-La Mancha","en":"Castilla-La Mancha","fr":"Castille-La Manche","de":"Kastilien-La Mancha"}', 'espana', 7),
('ES', 'region', 'castilla_y_leon',     '{"es":"Castilla y León","en":"Castile and León","fr":"Castille-et-León","de":"Kastilien und León"}', 'espana', 8),
('ES', 'region', 'cataluna',            '{"es":"Cataluña","en":"Catalonia","fr":"Catalogne","de":"Katalonien"}',             'espana', 9),
('ES', 'region', 'extremadura',         '{"es":"Extremadura","en":"Extremadura","fr":"Estrémadure","de":"Extremadura"}',     'espana', 10),
('ES', 'region', 'galicia',             '{"es":"Galicia","en":"Galicia","fr":"Galice","de":"Galicien"}',                     'espana', 11),
('ES', 'region', 'madrid',              '{"es":"Comunidad de Madrid","en":"Community of Madrid","fr":"Communauté de Madrid","de":"Autonome Gemeinschaft Madrid"}', 'espana', 12),
('ES', 'region', 'murcia',              '{"es":"Región de Murcia","en":"Region of Murcia","fr":"Région de Murcie","de":"Region Murcia"}', 'espana', 13),
('ES', 'region', 'navarra',             '{"es":"Navarra","en":"Navarre","fr":"Navarre","de":"Navarra"}',                     'espana', 14),
('ES', 'region', 'pais_vasco',          '{"es":"País Vasco","en":"Basque Country","fr":"Pays basque","de":"Baskenland"}',     'espana', 15),
('ES', 'region', 'la_rioja',            '{"es":"La Rioja","en":"La Rioja","fr":"La Rioja","de":"La Rioja"}',                 'espana', 16),
('ES', 'region', 'valencia',            '{"es":"Comunidad Valenciana","en":"Valencian Community","fr":"Communauté valencienne","de":"Valencianische Gemeinschaft"}', 'espana', 17),
('ES', 'region', 'ceuta',               '{"es":"Ceuta","en":"Ceuta","fr":"Ceuta","de":"Ceuta"}',                             'espana', 18),
('ES', 'region', 'melilla',             '{"es":"Melilla","en":"Melilla","fr":"Melilla","de":"Melilla"}',                     'espana', 19);

-- 52 Provincias
-- Andalucía (8)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'almeria',    '{"es":"Almería","en":"Almería"}',       'andalucia', '04___', 1),
('ES', 'province', 'cadiz',      '{"es":"Cádiz","en":"Cádiz"}',           'andalucia', '11___', 2),
('ES', 'province', 'cordoba',    '{"es":"Córdoba","en":"Córdoba"}',       'andalucia', '14___', 3),
('ES', 'province', 'granada',    '{"es":"Granada","en":"Granada"}',       'andalucia', '18___', 4),
('ES', 'province', 'huelva',     '{"es":"Huelva","en":"Huelva"}',         'andalucia', '21___', 5),
('ES', 'province', 'jaen',       '{"es":"Jaén","en":"Jaén"}',             'andalucia', '23___', 6),
('ES', 'province', 'malaga',     '{"es":"Málaga","en":"Málaga"}',         'andalucia', '29___', 7),
('ES', 'province', 'sevilla',    '{"es":"Sevilla","en":"Seville"}',       'andalucia', '41___', 8);
-- Aragón (3)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'huesca',     '{"es":"Huesca","en":"Huesca"}',         'aragon', '22___', 1),
('ES', 'province', 'teruel',     '{"es":"Teruel","en":"Teruel"}',         'aragon', '44___', 2),
('ES', 'province', 'zaragoza',   '{"es":"Zaragoza","en":"Zaragoza"}',     'aragon', '50___', 3);
-- Asturias (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'asturias_p', '{"es":"Asturias","en":"Asturias"}',     'asturias', '33___', 1);
-- Baleares (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'baleares_p', '{"es":"Islas Baleares","en":"Balearic Islands"}', 'baleares', '07___', 1);
-- Canarias (2)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'las_palmas',       '{"es":"Las Palmas","en":"Las Palmas"}',                           'canarias', '35___', 1),
('ES', 'province', 'santa_cruz',       '{"es":"Santa Cruz de Tenerife","en":"Santa Cruz de Tenerife"}',   'canarias', '38___', 2);
-- Cantabria (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'cantabria_p','{"es":"Cantabria","en":"Cantabria"}',   'cantabria', '39___', 1);
-- Castilla-La Mancha (5)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'albacete',   '{"es":"Albacete","en":"Albacete"}',     'castilla_la_mancha', '02___', 1),
('ES', 'province', 'ciudad_real','{"es":"Ciudad Real","en":"Ciudad Real"}','castilla_la_mancha', '13___', 2),
('ES', 'province', 'cuenca',     '{"es":"Cuenca","en":"Cuenca"}',         'castilla_la_mancha', '16___', 3),
('ES', 'province', 'guadalajara','{"es":"Guadalajara","en":"Guadalajara"}','castilla_la_mancha', '19___', 4),
('ES', 'province', 'toledo',     '{"es":"Toledo","en":"Toledo"}',         'castilla_la_mancha', '45___', 5);
-- Castilla y León (9)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'avila',      '{"es":"Ávila","en":"Ávila"}',           'castilla_y_leon', '05___', 1),
('ES', 'province', 'burgos',     '{"es":"Burgos","en":"Burgos"}',         'castilla_y_leon', '09___', 2),
('ES', 'province', 'leon',       '{"es":"León","en":"León"}',             'castilla_y_leon', '24___', 3),
('ES', 'province', 'palencia',   '{"es":"Palencia","en":"Palencia"}',     'castilla_y_leon', '34___', 4),
('ES', 'province', 'salamanca',  '{"es":"Salamanca","en":"Salamanca"}',   'castilla_y_leon', '37___', 5),
('ES', 'province', 'segovia',    '{"es":"Segovia","en":"Segovia"}',       'castilla_y_leon', '40___', 6),
('ES', 'province', 'soria',      '{"es":"Soria","en":"Soria"}',           'castilla_y_leon', '42___', 7),
('ES', 'province', 'valladolid', '{"es":"Valladolid","en":"Valladolid"}', 'castilla_y_leon', '47___', 8),
('ES', 'province', 'zamora',     '{"es":"Zamora","en":"Zamora"}',         'castilla_y_leon', '49___', 9);
-- Cataluña (4)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'barcelona',  '{"es":"Barcelona","en":"Barcelona"}',   'cataluna', '08___', 1),
('ES', 'province', 'girona',     '{"es":"Girona","en":"Girona"}',         'cataluna', '17___', 2),
('ES', 'province', 'lleida',     '{"es":"Lleida","en":"Lleida"}',         'cataluna', '25___', 3),
('ES', 'province', 'tarragona',  '{"es":"Tarragona","en":"Tarragona"}',   'cataluna', '43___', 4);
-- Extremadura (2)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'badajoz',    '{"es":"Badajoz","en":"Badajoz"}',       'extremadura', '06___', 1),
('ES', 'province', 'caceres',    '{"es":"Cáceres","en":"Cáceres"}',       'extremadura', '10___', 2);
-- Galicia (4)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'a_coruna',   '{"es":"A Coruña","en":"A Coruña"}',     'galicia', '15___', 1),
('ES', 'province', 'lugo',       '{"es":"Lugo","en":"Lugo"}',             'galicia', '27___', 2),
('ES', 'province', 'ourense',    '{"es":"Ourense","en":"Ourense"}',       'galicia', '32___', 3),
('ES', 'province', 'pontevedra', '{"es":"Pontevedra","en":"Pontevedra"}', 'galicia', '36___', 4);
-- Madrid (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'madrid_p',   '{"es":"Madrid","en":"Madrid"}',         'madrid', '28___', 1);
-- Murcia (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'murcia_p',   '{"es":"Murcia","en":"Murcia"}',         'murcia', '30___', 1);
-- Navarra (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'navarra_p',  '{"es":"Navarra","en":"Navarre"}',       'navarra', '31___', 1);
-- País Vasco (3)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'alava',      '{"es":"Álava","en":"Álava"}',           'pais_vasco', '01___', 1),
('ES', 'province', 'guipuzcoa',  '{"es":"Guipúzcoa","en":"Gipuzkoa"}',   'pais_vasco', '20___', 2),
('ES', 'province', 'vizcaya',    '{"es":"Vizcaya","en":"Biscay"}',        'pais_vasco', '48___', 3);
-- La Rioja (1)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'la_rioja_p', '{"es":"La Rioja","en":"La Rioja"}',     'la_rioja', '26___', 1);
-- Comunidad Valenciana (3)
INSERT INTO geo_regions (country_code, region_level, region_slug, region_name, parent_slug, postal_code_pattern, sort_order) VALUES
('ES', 'province', 'alicante',   '{"es":"Alicante","en":"Alicante"}',     'valencia', '03___', 1),
('ES', 'province', 'castellon',  '{"es":"Castellón","en":"Castellón"}',   'valencia', '12___', 2),
('ES', 'province', 'valencia_p', '{"es":"Valencia","en":"Valencia"}',     'valencia', '46___', 3);

-- D.22 — transport_zones
CREATE TABLE transport_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country VARCHAR(2) NOT NULL,
  origin_region VARCHAR,
  destination_country VARCHAR(2) NOT NULL,
  destination_region VARCHAR,
  base_price_cents INT,
  price_per_km_cents INT,
  estimated_days INT,
  partner_name TEXT,
  partner_contact TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transport_zones_route ON transport_zones(origin_country, destination_country);

-- D.23 — transport_requests
CREATE TABLE transport_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  origin_province VARCHAR,
  destination_province VARCHAR,
  origin_country VARCHAR(2) DEFAULT 'ES',
  destination_country VARCHAR(2) DEFAULT 'ES',
  vehicle_type VARCHAR,              -- 'gondola', 'grua', 'portacoches'
  estimated_price_cents INT,
  distance_km INT,
  status VARCHAR DEFAULT 'quoted',   -- 'quoted', 'accepted', 'in_transit', 'completed', 'cancelled'
  partner_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transport_requests_vehicle ON transport_requests(vehicle_id);
CREATE INDEX idx_transport_requests_status ON transport_requests(status);

CREATE TRIGGER set_updated_at_transport_requests
  BEFORE UPDATE ON transport_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.24 — service_requests
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR NOT NULL,             -- 'transfer', 'inspection', 'insurance', 'financing'
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'cancelled'
  partner_notified_at TIMESTAMPTZ,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_requests_type ON service_requests(type, status);
CREATE INDEX idx_service_requests_vehicle ON service_requests(vehicle_id);

CREATE TRIGGER set_updated_at_service_requests
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.25 — social_posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  article_id UUID,                   -- FK added after articles table creation
  platform VARCHAR NOT NULL,         -- 'linkedin', 'instagram', 'facebook', 'x'
  content JSONB DEFAULT '{}',        -- {"es": "...", "en": "..."}
  image_url TEXT,
  status VARCHAR DEFAULT 'draft',    -- 'draft', 'scheduled', 'posted', 'failed'
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  external_post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_status ON social_posts(status, scheduled_at);
CREATE INDEX idx_social_posts_vehicle ON social_posts(vehicle_id);

-- D.26 — invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  service_type VARCHAR NOT NULL,     -- 'subscription', 'auction_premium', 'transport', 'verification', 'ad'
  amount_cents INT NOT NULL,
  tax_cents INT DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  pdf_url TEXT,
  status VARCHAR DEFAULT 'pending',  -- 'pending', 'paid', 'failed', 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_dealer ON invoices(dealer_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_created ON invoices(created_at DESC);

-- D.27 — consents
CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR NOT NULL,     -- 'cookies', 'marketing', 'data_processing', 'terms'
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consents_user ON consents(user_id, consent_type);

-- D.28 — analytics_events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR NOT NULL,       -- 'page_view', 'vehicle_view', 'search', 'filter', 'contact_click'
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_vehicle ON analytics_events(vehicle_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- D.29 — merch_orders
CREATE TABLE merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
  product_type VARCHAR NOT NULL,     -- 'tarjetas_visita', 'banner_lona', 'flyer', 'carpeta'
  quantity INT DEFAULT 1,
  design_pdf_url TEXT,
  stripe_payment_id TEXT,
  amount_cents INT,
  status VARCHAR DEFAULT 'pending',  -- 'pending', 'paid', 'producing', 'shipped', 'delivered'
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merch_orders_dealer ON merch_orders(dealer_id);
CREATE INDEX idx_merch_orders_status ON merch_orders(status);

CREATE TRIGGER set_updated_at_merch_orders
  BEFORE UPDATE ON merch_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D.30 — dealer_invoices (invoices generated BY the dealer, not FROM Tracciona)
CREATE TABLE dealer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  buyer_name TEXT,
  buyer_tax_id TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL,
  tax_cents BIGINT DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  invoice_number VARCHAR,
  pdf_url TEXT,
  status VARCHAR DEFAULT 'draft',    -- 'draft', 'sent', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dealer_invoices_dealer ON dealer_invoices(dealer_id);
CREATE INDEX idx_dealer_invoices_vehicle ON dealer_invoices(vehicle_id);

CREATE TRIGGER set_updated_at_dealer_invoices
  BEFORE UPDATE ON dealer_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- BLOQUE E: TABLA articles
-- =============================================================================

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR UNIQUE NOT NULL,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  section VARCHAR NOT NULL,            -- 'guia' o 'noticias'
  title JSONB NOT NULL,                -- {"es": "Cómo elegir...", "en": "How to choose..."}
  meta_description JSONB,
  excerpt JSONB,                       -- For indexes and social media
  cover_image_url TEXT,
  author VARCHAR DEFAULT 'Tracciona',
  tags TEXT[],
  related_categories TEXT[],
  faq_schema JSONB,                    -- FAQ schema for featured snippets
  status VARCHAR DEFAULT 'draft',      -- 'draft', 'scheduled', 'published', 'archived'
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  seo_score INT,
  reading_time_minutes INT,
  views INT DEFAULT 0,
  pending_translations BOOLEAN DEFAULT false,
  target_markets TEXT[] DEFAULT '{all}',
  social_posted BOOLEAN DEFAULT false,
  social_post_text JSONB DEFAULT '{}',
  social_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_section ON articles(vertical, section, status, published_at DESC);
CREATE INDEX idx_articles_scheduled ON articles(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_articles_market ON articles USING GIN(target_markets);
CREATE INDEX idx_articles_slug ON articles(slug);

CREATE TRIGGER set_updated_at_articles
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add FK from social_posts to articles
ALTER TABLE social_posts ADD CONSTRAINT fk_social_posts_article
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;


-- =============================================================================
-- BLOQUE F: TABLAS DE CONFIGURACIÓN
-- =============================================================================

-- F.1 — vertical_config
CREATE TABLE vertical_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR UNIQUE NOT NULL,

  -- Identity
  name JSONB NOT NULL,
  tagline JSONB,
  meta_description JSONB,
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  og_image_url TEXT,

  -- Theme
  theme JSONB NOT NULL DEFAULT '{
    "primary": "#2D5BFF",
    "primary_hover": "#1A3DB8",
    "secondary": "#0B8A4B",
    "accent": "#D4760A",
    "background": "#FAFAF8",
    "surface": "#FFFFFF",
    "surface_alt": "#F3F2EE",
    "text": "#1A1A18",
    "text_secondary": "#4A4A45",
    "text_muted": "#8A8A82",
    "border": "#E5E4E0",
    "error": "#C23A3A",
    "success": "#0B8A4B",
    "warning": "#D4760A"
  }',

  -- Typography
  font_preset VARCHAR DEFAULT 'default',

  -- Header
  header_links JSONB DEFAULT '[]',

  -- Footer
  footer_text JSONB,
  footer_links JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',

  -- Homepage
  hero_title JSONB,
  hero_subtitle JSONB,
  hero_cta_text JSONB,
  hero_cta_url VARCHAR DEFAULT '/catalogo',
  hero_image_url TEXT,
  homepage_sections JSONB DEFAULT '{
    "featured_vehicles": true,
    "categories_grid": true,
    "latest_news": true,
    "comparatives": false,
    "auctions": false,
    "stats_counter": true,
    "dealer_logos": false,
    "newsletter_cta": true
  }',

  -- Languages
  active_locales TEXT[] DEFAULT '{es,en}',
  default_locale VARCHAR(5) DEFAULT 'es',

  -- Active actions
  active_actions TEXT[] DEFAULT '{venta,alquiler}',

  -- SEO & integrations
  google_analytics_id VARCHAR,
  google_search_console VARCHAR,
  google_adsense_id VARCHAR,
  cloudinary_cloud_name VARCHAR,
  translation_api_key_encrypted TEXT,
  translation_engine VARCHAR DEFAULT 'gpt4omini',

  -- Monetization
  subscription_prices JSONB DEFAULT '{
    "free":     {"monthly_cents": 0,     "annual_cents": 0},
    "basic":    {"monthly_cents": 2900,  "annual_cents": 29000},
    "premium":  {"monthly_cents": 7900,  "annual_cents": 79000},
    "founding": {"monthly_cents": 0,     "annual_cents": 0, "note": "Gratis permanente"}
  }',
  commission_rates JSONB DEFAULT '{
    "sale_pct": 0,
    "auction_buyer_premium_pct": 8.0,
    "transport_commission_pct": 10.0,
    "transfer_commission_pct": 15.0,
    "verification_level1_cents": 0,
    "verification_level2_cents": 4900,
    "verification_level3_cents": 14900
  }',

  -- Email templates
  email_templates JSONB DEFAULT '{}',

  -- Banners
  banners JSONB DEFAULT '[]',

  -- Moderation
  require_vehicle_approval BOOLEAN DEFAULT false,
  require_article_approval BOOLEAN DEFAULT false,
  auto_translate_on_publish BOOLEAN DEFAULT true,
  auto_publish_social BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_vertical_config
  BEFORE UPDATE ON vertical_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed Tracciona config
INSERT INTO vertical_config (vertical, name, tagline) VALUES (
  'tracciona',
  '{"es": "Tracciona", "en": "Tracciona"}',
  '{"es": "El marketplace de vehículos industriales", "en": "The industrial vehicle marketplace"}'
);

-- F.2 — activity_logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL,
  user_id UUID REFERENCES users(id),
  actor_type VARCHAR NOT NULL,       -- 'admin', 'dealer', 'system', 'cron'
  action VARCHAR NOT NULL,           -- 'create', 'update', 'delete', 'publish', 'translate', 'login'
  entity_type VARCHAR,               -- 'vehicle', 'article', 'dealer', 'category', 'config'
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_vertical ON activity_logs(vertical, created_at DESC);
CREATE INDEX idx_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);


-- =============================================================================
-- BLOQUE G: RLS PARA TODAS LAS TABLAS
-- =============================================================================

-- Helper: admin check expression used across policies
-- Pattern: EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')

-- G.1 — actions
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions_public_read" ON actions FOR SELECT USING (true);
CREATE POLICY "actions_admin_all" ON actions FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.2 — categories (formerly subcategories)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (status = 'published');
CREATE POLICY "categories_admin_select_all" ON categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.3 — subcategories (formerly types)
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategories_public_read" ON subcategories FOR SELECT USING (status = 'published');
CREATE POLICY "subcategories_admin_all" ON subcategories FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.4 — subcategory_categories (formerly type_subcategories)
ALTER TABLE subcategory_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategory_categories_public_read" ON subcategory_categories FOR SELECT USING (true);
CREATE POLICY "subcategory_categories_admin_all" ON subcategory_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.5 — attributes (formerly filter_definitions)
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attributes_public_read" ON attributes FOR SELECT USING (status = 'published');
CREATE POLICY "attributes_admin_all" ON attributes FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.6 — content_translations
ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ct_public_read" ON content_translations FOR SELECT USING (true);
CREATE POLICY "ct_admin_all" ON content_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.7 — dealers
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealers_public_read" ON dealers FOR SELECT USING (true);
CREATE POLICY "dealers_own_update" ON dealers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "dealers_admin_all" ON dealers FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.8 — leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_dealer_read" ON leads FOR SELECT USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "leads_buyer_insert" ON leads FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "leads_admin_all" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.9 — user_vehicle_views
ALTER TABLE user_vehicle_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views_own_read" ON user_vehicle_views FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "views_own_insert" ON user_vehicle_views FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "views_own_update" ON user_vehicle_views FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "views_admin_all" ON user_vehicle_views FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.10 — favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own_read" ON favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "favorites_own_insert" ON favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "favorites_own_delete" ON favorites FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "favorites_admin_all" ON favorites FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.11 — search_alerts
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_own_all" ON search_alerts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "alerts_admin_all" ON search_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.12 — subscriptions (dealer plans)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own_read" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "subscriptions_admin_all" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.13 — dealer_stats
ALTER TABLE dealer_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealer_stats_dealer_read" ON dealer_stats FOR SELECT USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "dealer_stats_admin_all" ON dealer_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.14 — dealer_events
ALTER TABLE dealer_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealer_events_dealer_read" ON dealer_events FOR SELECT USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "dealer_events_admin_all" ON dealer_events FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.15 — dealer_stripe_accounts
ALTER TABLE dealer_stripe_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealer_stripe_dealer_read" ON dealer_stripe_accounts FOR SELECT USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "dealer_stripe_admin_all" ON dealer_stripe_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.16 — dealer_fiscal_data
ALTER TABLE dealer_fiscal_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealer_fiscal_dealer_read" ON dealer_fiscal_data FOR SELECT USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "dealer_fiscal_dealer_update" ON dealer_fiscal_data FOR UPDATE USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "dealer_fiscal_admin_all" ON dealer_fiscal_data FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.17 — dealer_leads
ALTER TABLE dealer_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealer_leads_admin_all" ON dealer_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.18 — auctions
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auctions_public_read" ON auctions FOR SELECT USING (status IN ('active', 'ended'));
CREATE POLICY "auctions_admin_all" ON auctions FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.19 — auction_bids
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bids_public_read" ON auction_bids FOR SELECT USING (true);
CREATE POLICY "bids_auth_insert" ON auction_bids FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "bids_admin_all" ON auction_bids FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.20 — auction_registrations
ALTER TABLE auction_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auction_reg_own_read" ON auction_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "auction_reg_own_insert" ON auction_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "auction_reg_admin_all" ON auction_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.21 — verification_documents
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif_docs_public_read" ON verification_documents FOR SELECT USING (status = 'verified');
CREATE POLICY "verif_docs_admin_all" ON verification_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.22 — advertisers
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advertisers_admin_all" ON advertisers FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.23 — ads
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_public_read" ON ads FOR SELECT USING (status = 'active');
CREATE POLICY "ads_admin_all" ON ads FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.24 — ad_events
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_events_public_insert" ON ad_events FOR INSERT WITH CHECK (true);
CREATE POLICY "ad_events_admin_all" ON ad_events FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.25 — geo_regions
ALTER TABLE geo_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geo_regions_public_read" ON geo_regions FOR SELECT USING (true);
CREATE POLICY "geo_regions_admin_all" ON geo_regions FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.26 — transport_zones
ALTER TABLE transport_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_zones_public_read" ON transport_zones FOR SELECT USING (active = true);
CREATE POLICY "transport_zones_admin_all" ON transport_zones FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.27 — transport_requests
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_req_own_read" ON transport_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transport_req_auth_insert" ON transport_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "transport_req_admin_all" ON transport_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.28 — service_requests
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_req_own_read" ON service_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "service_req_auth_insert" ON service_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "service_req_admin_all" ON service_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.29 — social_posts
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_posts_admin_all" ON social_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.30 — invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_own_read" ON invoices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "invoices_admin_all" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.31 — consents
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consents_own_read" ON consents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consents_own_insert" ON consents FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)
);
CREATE POLICY "consents_admin_all" ON consents FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.32 — analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_public_insert" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_admin_all" ON analytics_events FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.33 — merch_orders
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merch_dealer_read" ON merch_orders FOR SELECT USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "merch_dealer_insert" ON merch_orders FOR INSERT WITH CHECK (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "merch_admin_all" ON merch_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.34 — dealer_invoices
ALTER TABLE dealer_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealer_inv_dealer_all" ON dealer_invoices FOR ALL USING (
  dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
);
CREATE POLICY "dealer_inv_admin_all" ON dealer_invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.35 — articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "articles_admin_all" ON articles FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.36 — vertical_config
ALTER TABLE vertical_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vertical_config_public_read" ON vertical_config FOR SELECT USING (true);
CREATE POLICY "vertical_config_admin_write" ON vertical_config FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);

-- G.37 — activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_admin_read" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
-- System writes via service role (no INSERT policy needed for regular users)


-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE actions IS 'Vehicle actions (replaces vehicle_category enum): venta, alquiler, terceros, subasta';
COMMENT ON TABLE categories IS 'Vehicle categories (formerly subcategories from 00019): Semirremolques, Cabezas Tractoras, etc.';
COMMENT ON TABLE subcategories IS 'Vehicle subcategories (formerly types from 00002/00018): Cisternas, Frigoríficos, Portacoches, etc.';
COMMENT ON TABLE attributes IS 'Vehicle attributes/filters (formerly filter_definitions): Capacidad, Ejes, etc.';
COMMENT ON TABLE subcategory_categories IS 'Junction: subcategories belong to categories (many-to-many)';
COMMENT ON TABLE content_translations IS 'Long-form translations for vehicles, articles, news, dealers';
COMMENT ON TABLE dealers IS 'Dealer profiles with portal customization';
COMMENT ON TABLE leads IS 'Buyer-to-dealer contact leads';
COMMENT ON TABLE articles IS 'Editorial content: guides and news for SEO';
COMMENT ON TABLE vertical_config IS 'One row per vertical: full config (branding, theme, pricing, features)';
COMMENT ON TABLE activity_logs IS 'Audit trail for all admin/dealer/system actions';

COMMIT;
