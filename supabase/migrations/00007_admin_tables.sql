-- ================================================
-- TANK IBERICA — Migration 00007: Admin-only tables
-- Creates tables for admin panel: balance, intermediacion,
-- historico, viewed_vehicles. All tables are admin-only.
-- ================================================

-- ================================================
-- Enums
-- ================================================

CREATE TYPE balance_type AS ENUM ('income', 'expense');
CREATE TYPE balance_status AS ENUM ('pending', 'paid', 'collected');
CREATE TYPE intermediacion_status AS ENUM ('available', 'reserved', 'rented', 'sold');

-- ================================================
-- Balance table (financial transactions)
-- ================================================

CREATE TABLE balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  type balance_type NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  amount NUMERIC(12,2) NOT NULL,
  benefit_percent NUMERIC(5,2),
  status balance_status DEFAULT 'pending',
  invoice_url TEXT,
  notes TEXT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_balance_type ON balance(type);
CREATE INDEX idx_balance_date ON balance(date DESC);
CREATE INDEX idx_balance_reason ON balance(reason);
CREATE INDEX idx_balance_status ON balance(status);
CREATE INDEX idx_balance_vehicle ON balance(vehicle_id);

CREATE TRIGGER set_balance_updated_at
  BEFORE UPDATE ON balance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Intermediacion table (third-party vehicles - internal)
-- ================================================

CREATE TABLE intermediacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  price NUMERIC(12,2),
  status intermediacion_status DEFAULT 'available',
  -- Owner info
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  owner_notes TEXT,
  -- Vehicle details
  location TEXT,
  description TEXT,
  filters_json JSONB DEFAULT '{}',
  -- Media
  images JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  -- Financials
  commission_percent NUMERIC(5,2),
  expenses JSONB DEFAULT '[]',
  income JSONB DEFAULT '[]',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_intermediacion_status ON intermediacion(status);
CREATE INDEX idx_intermediacion_brand ON intermediacion(brand);
CREATE INDEX idx_intermediacion_subcategory ON intermediacion(subcategory_id);

CREATE TRIGGER set_intermediacion_updated_at
  BEFORE UPDATE ON intermediacion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Historico table (sold vehicles archive)
-- ================================================

CREATE TABLE historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_vehicle_id UUID,
  -- Vehicle snapshot
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  -- Sale info
  original_price NUMERIC(12,2),
  sale_price NUMERIC(12,2),
  sale_date DATE,
  sale_category TEXT, -- venta, terceros, exportacion
  buyer_name TEXT,
  buyer_contact TEXT,
  -- Cost tracking
  acquisition_cost NUMERIC(12,2),
  total_maintenance NUMERIC(12,2) DEFAULT 0,
  total_rental_income NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2), -- acquisition + maintenance - rental
  benefit NUMERIC(12,2), -- sale_price - total_cost
  benefit_percent NUMERIC(5,2),
  -- Full data snapshot
  vehicle_data JSONB,
  maintenance_history JSONB DEFAULT '[]',
  rental_history JSONB DEFAULT '[]',
  -- Timestamps
  archived_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_historico_sale_date ON historico(sale_date DESC);
CREATE INDEX idx_historico_sale_category ON historico(sale_category);
CREATE INDEX idx_historico_brand ON historico(brand);
CREATE INDEX idx_historico_subcategory ON historico(subcategory_id);

-- ================================================
-- Viewed vehicles table (ojeados - competition tracking)
-- ================================================

CREATE TABLE viewed_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  platform TEXT,
  link TEXT,
  price NUMERIC(12,2),
  negotiated_price NUMERIC(12,2),
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'inactive',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_viewed_vehicles_platform ON viewed_vehicles(platform);
CREATE INDEX idx_viewed_vehicles_status ON viewed_vehicles(status);

CREATE TRIGGER set_viewed_vehicles_updated_at
  BEFORE UPDATE ON viewed_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- History log table (audit trail)
-- ================================================

CREATE TABLE history_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'vehicle', 'intermediacion', 'balance', etc.
  entity_id UUID,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'archive', 'restore', 'sell'
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_history_log_entity ON history_log(entity_type, entity_id);
CREATE INDEX idx_history_log_action ON history_log(action);
CREATE INDEX idx_history_log_date ON history_log(created_at DESC);
CREATE INDEX idx_history_log_user ON history_log(performed_by);

-- ================================================
-- RLS: Admin only for all tables
-- Pattern: Check auth.users directly to avoid recursion
-- ================================================

ALTER TABLE balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE intermediacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewed_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_log ENABLE ROW LEVEL SECURITY;

-- Balance policies
CREATE POLICY "balance_admin_select" ON balance FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "balance_admin_insert" ON balance FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "balance_admin_update" ON balance FOR UPDATE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "balance_admin_delete" ON balance FOR DELETE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- Intermediacion policies
CREATE POLICY "intermediacion_admin_select" ON intermediacion FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "intermediacion_admin_insert" ON intermediacion FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "intermediacion_admin_update" ON intermediacion FOR UPDATE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "intermediacion_admin_delete" ON intermediacion FOR DELETE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- Historico policies
CREATE POLICY "historico_admin_select" ON historico FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "historico_admin_insert" ON historico FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "historico_admin_update" ON historico FOR UPDATE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "historico_admin_delete" ON historico FOR DELETE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- Viewed vehicles policies
CREATE POLICY "viewed_vehicles_admin_select" ON viewed_vehicles FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "viewed_vehicles_admin_insert" ON viewed_vehicles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "viewed_vehicles_admin_update" ON viewed_vehicles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "viewed_vehicles_admin_delete" ON viewed_vehicles FOR DELETE
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- History log policies
CREATE POLICY "history_log_admin_select" ON history_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

CREATE POLICY "history_log_admin_insert" ON history_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));

-- History log: no update/delete (immutable audit trail)
