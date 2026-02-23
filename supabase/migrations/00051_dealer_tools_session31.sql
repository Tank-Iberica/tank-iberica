-- Session 31: Dealer advanced tools tables
-- dealer_invoices, dealer_contracts, dealer_quotes, maintenance_records, rental_records, merch_orders

-- ============================================================
-- 1. dealer_invoices — Invoice history for dealers
-- ============================================================
CREATE TABLE IF NOT EXISTS dealer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_name TEXT NOT NULL,
  client_doc_type TEXT DEFAULT 'NIF',
  client_doc_number TEXT,
  client_address TEXT,
  vehicle_ids UUID[],
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  conditions TEXT DEFAULT 'Pago a 30 días',
  language TEXT DEFAULT 'es',
  pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dealer_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own invoices"
  ON dealer_invoices FOR ALL
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access dealer_invoices"
  ON dealer_invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Auto-increment invoice number per dealer
CREATE OR REPLACE FUNCTION generate_dealer_invoice_number(p_dealer_id UUID)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  seq INT;
  yr INT;
BEGIN
  yr := EXTRACT(YEAR FROM NOW());
  SELECT COUNT(*) + 1 INTO seq
  FROM dealer_invoices
  WHERE dealer_id = p_dealer_id
    AND EXTRACT(YEAR FROM created_at) = yr;
  SELECT COALESCE(SUBSTRING(company_name FROM 1 FOR 3), 'DLR') INTO prefix
  FROM dealers WHERE id = p_dealer_id;
  RETURN UPPER(prefix) || '-' || yr || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. dealer_contracts — Contract history for dealers
-- ============================================================
CREATE TABLE IF NOT EXISTS dealer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('arrendamiento', 'compraventa')),
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_id UUID REFERENCES vehicles(id),
  vehicle_plate TEXT,
  vehicle_type TEXT,
  client_name TEXT NOT NULL,
  client_doc_number TEXT,
  client_address TEXT,
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dealer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own contracts"
  ON dealer_contracts FOR ALL
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access dealer_contracts"
  ON dealer_contracts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 3. dealer_quotes — Presupuestos/quotes for dealers
-- ============================================================
CREATE TABLE IF NOT EXISTS dealer_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_days INT DEFAULT 15,
  client_name TEXT,
  vehicle_id UUID REFERENCES vehicles(id),
  vehicle_price NUMERIC(12,2),
  optional_services JSONB DEFAULT '[]'::jsonb,
  payment_conditions TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dealer_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own quotes"
  ON dealer_quotes FOR ALL
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access dealer_quotes"
  ON dealer_quotes FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 4. maintenance_records — Maintenance log for dealer vehicles
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('preventivo', 'correctivo', 'itv')),
  description TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  km INT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own maintenance"
  ON maintenance_records FOR ALL
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access maintenance_records"
  ON maintenance_records FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 5. rental_records — Rental tracking for dealer vehicles
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  client_name TEXT NOT NULL,
  client_contact TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent NUMERIC(12,2) NOT NULL,
  deposit NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rental_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own rentals"
  ON rental_records FOR ALL
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access rental_records"
  ON rental_records FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 6. merch_orders — Merchandising orders from dealers
-- ============================================================
CREATE TABLE IF NOT EXISTS merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  design_pdf_url TEXT,
  stripe_payment_id TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'producing', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers manage own merch"
  ON merch_orders FOR ALL
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access merch_orders"
  ON merch_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 7. Add intermediation fields to vehicles
-- ============================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS intermediation_status TEXT CHECK (intermediation_status IN ('disponible', 'reservado', 'en_gestion', 'vendido'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_contact TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_notes TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS intermediation_commission NUMERIC(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS intermediation_expenses NUMERIC(12,2) DEFAULT 0;
