-- Partitioning readiness for large tables
-- Supabase hosted PostgreSQL does not support native PARTITION OF on existing tables.
-- This migration adds optimized composite indexes and a market_data_partitioned
-- table with native RANGE partitioning for future data ingestion.

-- ============================================================================
-- 1. vehicles — composite indexes for vertical-scoped queries
-- ============================================================================

-- Covering index for catalog listing queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical_status_created
  ON public.vehicles (vertical, status, created_at DESC);

-- Covering index for admin product list with price filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical_price
  ON public.vehicles (vertical, price)
  WHERE status = 'published';

-- ============================================================================
-- 2. market_data — composite indexes by period + vertical
-- ============================================================================

-- Index for time-series queries: "get market data for vertical X in period Y"
CREATE INDEX IF NOT EXISTS idx_market_data_vertical_period
  ON public.market_data (vertical, period);

-- Index for brand/model lookups within a vertical
CREATE INDEX IF NOT EXISTS idx_market_data_vertical_brand_model
  ON public.market_data (vertical, brand, model);

-- Index for aggregation queries by period
CREATE INDEX IF NOT EXISTS idx_market_data_period_created
  ON public.market_data (period, created_at DESC);

-- ============================================================================
-- 3. event_store — composite index by created_at for time-range pruning
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_event_store_aggregate_created
  ON public.event_store (aggregate_type, created_at DESC);

-- ============================================================================
-- 4. market_data_partitioned — native range partitioning (for new data)
--    Partitioned by created_at month. Old data stays in market_data,
--    new ingestion should target this table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.market_data_partitioned (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for 2026 (quarterly)
CREATE TABLE IF NOT EXISTS market_data_p2026q1 PARTITION OF market_data_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS market_data_p2026q2 PARTITION OF market_data_partitioned
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS market_data_p2026q3 PARTITION OF market_data_partitioned
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS market_data_p2026q4 PARTITION OF market_data_partitioned
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Index on partitioned table
CREATE INDEX IF NOT EXISTS idx_market_data_part_vertical_period
  ON market_data_partitioned (vertical, period);

-- RLS on partitioned table
ALTER TABLE market_data_partitioned ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read market_data_partitioned" ON market_data_partitioned;
CREATE POLICY "Authenticated read market_data_partitioned" ON market_data_partitioned
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service write market_data_partitioned" ON market_data_partitioned;
CREATE POLICY "Service write market_data_partitioned" ON market_data_partitioned
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. Comment: migration path for vehicles partitioning
-- ============================================================================
-- When Supabase supports ALTER TABLE ... PARTITION BY or when traffic justifies
-- a full migration:
-- 1. CREATE TABLE vehicles_partitioned (LIKE vehicles INCLUDING ALL) PARTITION BY LIST (vertical);
-- 2. CREATE TABLE vehicles_p_tracciona PARTITION OF vehicles_partitioned FOR VALUES IN ('tracciona');
-- 3. INSERT INTO vehicles_partitioned SELECT * FROM vehicles;
-- 4. Rename tables atomically in a maintenance window.
-- For now, the composite indexes above provide adequate query pruning.
