/**
 * Slow Queries Monitor
 *
 * Returns top 10 slowest queries from pg_stat_statements (if available).
 * Only accessible to admin with CRON_SECRET header.
 *
 * GET /api/infra/slow-queries
 * Headers: x-internal-secret: <CRON_SECRET>
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  // Auth: require CRON_SECRET
  verifyCronSecret(event)

  const supabase = serverSupabaseServiceRole(event)

  // Try pg_stat_statements (requires Supabase Pro/Team)
  const { data: slowQueries, error } = await supabase.rpc('get_slow_queries').limit(10)

  if (error) {
    // Fallback: return basic table stats instead
    const { data: tableStats, error: statsError } = await supabase
      .from('pg_stat_user_tables' as string)
      .select('relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch, n_live_tup')
      .order('seq_scan', { ascending: false })
      .limit(10)

    if (statsError) {
      return {
        available: false,
        message: 'Query statistics extension not available',
        hint: 'Enable the pg_stat_statements extension and check slow query logs.',
      }
    }

    return {
      type: 'table_stats',
      description: 'Sequential scan counts (high values may indicate missing indexes)',
      data: tableStats,
    }
  }

  return {
    type: 'slow_queries',
    description: 'Top 10 slowest queries by mean execution time',
    data: slowQueries,
  }
})
