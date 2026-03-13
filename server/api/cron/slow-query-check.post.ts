/**
 * POST /api/cron/slow-query-check
 *
 * Captures DB queries with mean execution time >500ms from pg_stat_statements
 * and persists them to slow_query_logs for monitoring and optimization.
 *
 * Behavior:
 *   - Calls get_slow_queries() RPC (reads pg_stat_statements)
 *   - Inserts new snapshots into slow_query_logs (upsert by hash+minute)
 *   - Logs a warning if any query exceeds ALERT_THRESHOLD_MS (2000ms)
 *
 * Requires: CRON_SECRET in Authorization header.
 * Schedule: every 30min via cron/scheduler.
 *
 * #143 Bloque 18
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { logger } from '../../utils/logger'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

const SLOW_THRESHOLD_MS = 500   // log queries slower than this
const ALERT_THRESHOLD_MS = 2000 // emit logger.warn for queries this slow

interface SlowQueryRow {
  query_hash: string
  query_text: string
  calls: number
  mean_exec_ms: number
  max_exec_ms: number
  total_exec_ms: number
  rows_per_call: number | null
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const vertical = process.env.NUXT_PUBLIC_VERTICAL ?? 'tracciona'
  const supabase = serverSupabaseServiceRole(event)

  // 1. Query pg_stat_statements via RPC
  const { data: rows, error: rpcErr } = await supabase.rpc(
    'get_slow_queries' as never,
    { p_threshold_ms: SLOW_THRESHOLD_MS },
  )

  if (rpcErr) {
    logger.error('[slow-query-check] RPC failed', { error: rpcErr.message })
    return { ok: false, error: 'RPC failed', captured: 0 }
  }

  const slowQueries = (rows as unknown as SlowQueryRow[]) ?? []

  if (slowQueries.length === 0) {
    logger.info('[slow-query-check] No slow queries found')
    return { ok: true, captured: 0, alerted: 0 }
  }

  // 2. Insert into slow_query_logs (conflict = skip, not error)
  const insertRows = slowQueries.map((q) => ({
    vertical,
    query_hash: q.query_hash,
    query_text: q.query_text,
    calls: q.calls,
    mean_exec_ms: q.mean_exec_ms,
    max_exec_ms: q.max_exec_ms,
    total_exec_ms: q.total_exec_ms,
    rows_per_call: q.rows_per_call ?? null,
  }))

  const { error: insertErr } = await supabase
    .from('slow_query_logs')
    .upsert(insertRows as never[], { onConflict: 'query_hash,captured_at', ignoreDuplicates: true })

  if (insertErr) {
    logger.error('[slow-query-check] Insert failed', { error: insertErr.message })
  }

  // 3. Alert on queries exceeding ALERT_THRESHOLD_MS
  const alerted = slowQueries.filter((q) => q.mean_exec_ms >= ALERT_THRESHOLD_MS)

  for (const q of alerted) {
    logger.warn('[slow-query-check] SLOW QUERY ALERT', {
      hash: q.query_hash,
      mean_exec_ms: q.mean_exec_ms,
      max_exec_ms: q.max_exec_ms,
      calls: q.calls,
      query: q.query_text.substring(0, 200),
    })
  }

  logger.info('[slow-query-check] Capture complete', {
    captured: slowQueries.length,
    alerted: alerted.length,
  })

  return {
    ok: true,
    captured: slowQueries.length,
    alerted: alerted.length,
  }
})
