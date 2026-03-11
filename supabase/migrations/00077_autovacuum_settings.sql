-- ============================================================
-- Migration 00077: Autovacuum tuning for high-churn tables
-- ============================================================
-- Supabase (PostgreSQL) has autovacuum enabled by default.
-- This migration sets per-table autovacuum parameters to be
-- more aggressive for tables with high INSERT/UPDATE/DELETE rates.
-- ============================================================

-- ── vehicles (high write: publish/update/status changes) ─────────────────
ALTER TABLE vehicles SET (
  autovacuum_vacuum_scale_factor   = 0.01,   -- vacuum when 1% of rows changed (default 20%)
  autovacuum_analyze_scale_factor  = 0.005,  -- analyze when 0.5% changed (default 10%)
  autovacuum_vacuum_cost_delay     = 2       -- ms between vacuum I/O ops (lower = faster)
);

-- ── leads (high write: new leads constantly) ─────────────────────────────
ALTER TABLE leads SET (
  autovacuum_vacuum_scale_factor   = 0.01,
  autovacuum_analyze_scale_factor  = 0.005,
  autovacuum_vacuum_cost_delay     = 2
);

-- ── market_data (time-series: daily inserts, infrequent reads) ────────────
ALTER TABLE market_data SET (
  autovacuum_vacuum_scale_factor   = 0.02,
  autovacuum_analyze_scale_factor  = 0.01,
  autovacuum_vacuum_cost_delay     = 5
);

-- ── auctions / bids (bursts during auction events) ────────────────────────
ALTER TABLE auctions SET (
  autovacuum_vacuum_scale_factor   = 0.02,
  autovacuum_analyze_scale_factor  = 0.01
);

ALTER TABLE auction_bids SET (
  autovacuum_vacuum_scale_factor   = 0.01,
  autovacuum_analyze_scale_factor  = 0.005
);

-- ── vehicles_archive (append-only, rarely queried) ────────────────────────
ALTER TABLE vehicles_archive SET (
  autovacuum_vacuum_scale_factor   = 0.05,
  autovacuum_analyze_scale_factor  = 0.02,
  autovacuum_vacuum_cost_delay     = 10
);

-- ── admin_audit_log (append-only log) ─────────────────────────────────────
ALTER TABLE admin_audit_log SET (
  autovacuum_vacuum_scale_factor   = 0.05,
  autovacuum_analyze_scale_factor  = 0.02
);

COMMENT ON TABLE vehicles IS
  'autovacuum tuned: scale_factor=1% vacuum, 0.5% analyze — see migration 00077';
