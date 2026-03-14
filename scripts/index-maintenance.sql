-- Index Maintenance Script (#299)
--
-- Run monthly to detect and rebuild fragmented indexes.
-- Usage: psql $DATABASE_URL -f scripts/index-maintenance.sql
--
-- Indexes with >30% bloat are flagged. REINDEX is safe to run online
-- in PostgreSQL 12+ (REINDEX CONCURRENTLY).

-- 1. Show index bloat estimate
SELECT
  schemaname || '.' || relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS times_used,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED — consider dropping'
    ELSE 'OK'
  END AS status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 30;

-- 2. Show unused indexes (0 scans)
SELECT
  schemaname || '.' || relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS wasted_space
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 3. Table bloat check
SELECT
  schemaname || '.' || relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE
    WHEN n_live_tup > 0 THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 1)
    ELSE 0
  END AS dead_pct,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC
LIMIT 20;

-- 4. REINDEX commands for large indexes (uncomment to run)
-- Run these during low-traffic periods:
--
-- REINDEX INDEX CONCURRENTLY idx_vehicles_status;
-- REINDEX INDEX CONCURRENTLY idx_vehicles_dealer_id;
-- REINDEX INDEX CONCURRENTLY idx_analytics_events_created_at;
-- REINDEX INDEX CONCURRENTLY idx_leads_dealer_id;
-- REINDEX INDEX CONCURRENTLY idx_favorites_user_id;

-- 5. Force ANALYZE on tables with stale statistics
ANALYZE vehicles;
ANALYZE leads;
ANALYZE analytics_events;
ANALYZE favorites;
ANALYZE dealers;
ANALYZE subscriptions;
