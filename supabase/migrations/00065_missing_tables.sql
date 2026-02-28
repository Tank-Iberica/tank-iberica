-- Migration 00065: Create missing tables referenced by application code
-- These tables were coded in the frontend/server but never created in the DB.

-- ============================================================================
-- 1. historico — Sales history / archived vehicle transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  original_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  dealer_id UUID NOT NULL,
  action TEXT,
  sale_date TIMESTAMPTZ,
  sale_price INTEGER,
  original_price INTEGER,
  buyer_type TEXT,
  buyer_country TEXT,
  payment_method TEXT,
  transport_included BOOLEAN DEFAULT false,
  category_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  km INTEGER,
  hours INTEGER,
  vehicle_data JSONB DEFAULT '{}'::jsonb,
  maintenance_history JSONB DEFAULT '[]'::jsonb,
  rental_history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own historico" ON public.historico
  FOR ALL USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access historico" ON public.historico
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 2. infra_clusters — Multi-cluster database infrastructure
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.infra_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT,
  region TEXT,
  host TEXT,
  port INTEGER DEFAULT 5432,
  database TEXT,
  status TEXT DEFAULT 'active',
  vertical TEXT DEFAULT 'tracciona',
  is_primary BOOLEAN DEFAULT false,
  version TEXT,
  connection_string_encrypted TEXT,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  supabase_service_role_key TEXT,
  max_connections INTEGER DEFAULT 100,
  storage_gb NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.infra_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage clusters" ON public.infra_clusters
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 3. infra_alerts — Infrastructure monitoring alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.infra_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES public.infra_clusters(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  message TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.infra_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alerts" ON public.infra_alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 4. infra_metrics — Infrastructure performance metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.infra_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES public.infra_clusters(id) ON DELETE CASCADE,
  cpu_percent NUMERIC,
  memory_percent NUMERIC,
  disk_percent NUMERIC,
  connections_active INTEGER,
  connections_idle INTEGER,
  replication_lag_ms NUMERIC,
  cache_hit_ratio NUMERIC,
  transactions_per_sec NUMERIC,
  db_size_mb NUMERIC,
  vertical TEXT DEFAULT 'tracciona',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.infra_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read metrics" ON public.infra_metrics
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 5. market_data — Aggregated market pricing data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT,
  model TEXT,
  subcategory TEXT,
  category TEXT,
  location_province TEXT,
  avg_price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  avg_days_to_sell NUMERIC,
  listings INTEGER,
  sample_size INTEGER,
  action TEXT,
  vertical TEXT DEFAULT 'tracciona',
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read market_data" ON public.market_data
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage market_data" ON public.market_data
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 6. pipeline_items — Dealer sales pipeline / CRM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  stage TEXT DEFAULT 'lead',
  source TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  expected_close_date DATE,
  amount NUMERIC,
  probability INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pipeline_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own pipeline" ON public.pipeline_items
  FOR ALL USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access pipeline" ON public.pipeline_items
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 7. api_usage — API usage tracking for data subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT,
  endpoint TEXT,
  params JSONB,
  response_time_ms INTEGER,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage api_usage" ON public.api_usage
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 8. data_subscriptions — API data subscription plans
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.data_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT UNIQUE,
  active BOOLEAN DEFAULT true,
  rate_limit_daily INTEGER DEFAULT 100,
  user_id UUID,
  contact_email TEXT,
  company_name TEXT,
  plan TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.data_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage data_subscriptions" ON public.data_subscriptions
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 9. competitor_vehicles — Competitor pricing data (scraped)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.competitor_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID,
  platform_id UUID,
  brand TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC,
  km INTEGER,
  hours INTEGER,
  source TEXT,
  platform TEXT,
  url TEXT,
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.competitor_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers read own competitor data" ON public.competitor_vehicles
  FOR SELECT USING (dealer_id = auth.uid());

CREATE POLICY "Admins manage competitor_vehicles" ON public.competitor_vehicles
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 10. dealer_contracts — Digital contracts for dealers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dealer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  type TEXT,
  status TEXT DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  pdf_url TEXT,
  template TEXT,
  terms JSONB DEFAULT '{}'::jsonb,
  buyer_name TEXT,
  buyer_nif TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dealer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own contracts" ON public.dealer_contracts
  FOR ALL USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access contracts" ON public.dealer_contracts
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 11. dealer_platforms — Dealer multi-platform sync
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dealer_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL,
  platform_id UUID,
  platform TEXT,
  url TEXT,
  synced_at TIMESTAMPTZ,
  vehicle_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dealer_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own platforms" ON public.dealer_platforms
  FOR ALL USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access dealer_platforms" ON public.dealer_platforms
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 12. dealer_quotes — Quotes / presupuestos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dealer_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  amount NUMERIC,
  discount_percent NUMERIC,
  tax_percent NUMERIC DEFAULT 21,
  total NUMERIC,
  status TEXT DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  optional_services JSONB DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dealer_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own quotes" ON public.dealer_quotes
  FOR ALL USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access quotes" ON public.dealer_quotes
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 13. demand_data — Market demand analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.demand_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  brand TEXT,
  region TEXT,
  demand_score NUMERIC,
  search_volume INTEGER,
  trend TEXT,
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demand_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read demand_data" ON public.demand_data
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage demand_data" ON public.demand_data
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 14. maintenance_records — Vehicle maintenance log
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL,
  type TEXT,
  description TEXT,
  cost NUMERIC,
  date DATE,
  km_at_maintenance INTEGER,
  provider_name TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own maintenance" ON public.maintenance_records
  FOR ALL USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access maintenance" ON public.maintenance_records
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 15. rental_records — Vehicle rental tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL,
  tenant_name TEXT,
  tenant_nif TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  start_date DATE,
  end_date DATE,
  monthly_price NUMERIC,
  deposit NUMERIC,
  status TEXT DEFAULT 'active',
  notes TEXT,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rental_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own rentals" ON public.rental_records
  FOR ALL USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access rentals" ON public.rental_records
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 16. platforms — External platforms catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  url TEXT,
  logo_url TEXT,
  type TEXT DEFAULT 'marketplace',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platforms" ON public.platforms
  FOR SELECT USING (true);

CREATE POLICY "Admins manage platforms" ON public.platforms
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 17. profiles — Extended user profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'es',
  role TEXT DEFAULT 'user',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins full access profiles" ON public.profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- ============================================================================
-- 18. search_logs — Search query analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT,
  filters JSONB,
  results_count INTEGER,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read search_logs" ON public.search_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- Allow inserts from authenticated and anon (for tracking)
CREATE POLICY "Anyone can insert search_logs" ON public.search_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_historico_dealer ON public.historico(dealer_id);
CREATE INDEX IF NOT EXISTS idx_historico_sale_date ON public.historico(sale_date);
CREATE INDEX IF NOT EXISTS idx_infra_metrics_cluster ON public.infra_metrics(cluster_id, created_at);
CREATE INDEX IF NOT EXISTS idx_market_data_brand ON public.market_data(brand, vertical);
CREATE INDEX IF NOT EXISTS idx_pipeline_dealer ON public.pipeline_items(dealer_id, stage);
CREATE INDEX IF NOT EXISTS idx_api_usage_key ON public.api_usage(api_key, created_at);
CREATE INDEX IF NOT EXISTS idx_competitor_dealer ON public.competitor_vehicles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rental_vehicle ON public.rental_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dealer_contracts_dealer ON public.dealer_contracts(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_platforms_dealer ON public.dealer_platforms(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_quotes_dealer ON public.dealer_quotes(dealer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON public.search_logs(created_at);
