-- ================================================
-- TANK IBERICA — Migration 00017: Balance Table
-- Financial tracking for income and expenses
-- ================================================

-- =============================================
-- 1. CREATE ENUMS
-- =============================================

-- Transaction type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'balance_type') THEN
    CREATE TYPE balance_type AS ENUM ('ingreso', 'gasto');
  END IF;
END $$;

-- Payment status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'balance_status') THEN
    CREATE TYPE balance_status AS ENUM ('pendiente', 'pagado', 'cobrado');
  END IF;
END $$;

-- Transaction reason/category
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'balance_reason') THEN
    CREATE TYPE balance_reason AS ENUM (
      'venta',
      'alquiler',
      'exportacion',
      'compra',
      'taller',
      'documentacion',
      'servicios',
      'salario',
      'seguro',
      'dividendos',
      'almacenamiento',
      'bancario',
      'efectivo',
      'otros'
    );
  END IF;
END $$;

-- =============================================
-- 2. CREATE BALANCE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction details
  tipo balance_type NOT NULL DEFAULT 'gasto',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  razon balance_reason NOT NULL DEFAULT 'otros',
  detalle TEXT,
  importe NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estado balance_status NOT NULL DEFAULT 'pendiente',
  notas TEXT,

  -- Invoice/receipt
  factura_url TEXT,

  -- Profit calculation (for income entries)
  coste_asociado NUMERIC(12, 2),

  -- Link to vehicle (optional)
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Link to subcategory for profit analysis
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 3. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_balance_fecha ON balance(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_balance_tipo ON balance(tipo);
CREATE INDEX IF NOT EXISTS idx_balance_razon ON balance(razon);
CREATE INDEX IF NOT EXISTS idx_balance_estado ON balance(estado);
CREATE INDEX IF NOT EXISTS idx_balance_vehicle ON balance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_balance_subcategory ON balance(subcategory_id);

-- =============================================
-- 4. RLS POLICIES (Admin only)
-- =============================================

ALTER TABLE balance ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "balance_admin_all"
  ON balance FOR ALL
  USING (
    (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  );

-- =============================================
-- 5. COMMENTS
-- =============================================

COMMENT ON TABLE balance IS 'Financial transactions tracking - income and expenses';
COMMENT ON COLUMN balance.tipo IS 'Transaction type: ingreso (income) or gasto (expense)';
COMMENT ON COLUMN balance.razon IS 'Transaction category/reason';
COMMENT ON COLUMN balance.importe IS 'Transaction amount in EUR';
COMMENT ON COLUMN balance.estado IS 'Payment status: pendiente, pagado, cobrado';
COMMENT ON COLUMN balance.coste_asociado IS 'Associated cost for profit calculation (income entries only)';
COMMENT ON COLUMN balance.factura_url IS 'URL to invoice/receipt document';

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Calculate profit percentage
CREATE OR REPLACE FUNCTION calculate_balance_profit(p_importe NUMERIC, p_coste NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF p_coste IS NULL OR p_coste = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND(((p_importe - p_coste) / p_coste) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_balance_profit IS 'Calculate profit percentage: ((importe - coste) / coste) * 100';
