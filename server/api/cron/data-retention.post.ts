/**
 * POST /api/cron/data-retention
 *
 * GDPR-compliant data retention enforcement.
 * Deletes records that have exceeded their configured retention window
 * according to docs/tracciona-docs/referencia/DATA-RETENTION.md.
 *
 * Retention windows applied:
 *   - whatsapp_submissions  → 1 year
 *   - analytics_events      → 1 year  (ad impressions / click tracking)
 *   - api_usage             → 1 year  (technical API call logs)
 *   - activity_logs         → 2 years (admin/dealer/system audit trail)
 *   - idempotency_keys      → expired (uses built-in expires_at column)
 *
 * Protected by x-cron-secret header. Run daily (03:00 UTC recommended).
 * Uses a 24 h cron lock to prevent duplicate runs.
 */
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireCronLock } from '../../utils/cronLock'
import { logger } from '../../utils/logger'

interface CronBody {
  secret?: string
}

interface RetentionTarget {
  table: string
  column: string
  cutoff: Date
  description: string
}

interface DeletionResult {
  table: string
  deleted: number
  error: string | null
}

function buildCutoff(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export default defineEventHandler(async (event) => {
  // 1. Verify cron secret
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event) as any

  // 2. Cron lock — 24 h window, one run per day max
  if (!(await acquireCronLock(supabase, 'data-retention', 24 * 60 * 60 * 1000))) {
    return { skipped: true, reason: 'already_ran_in_window', timestamp: new Date().toISOString() }
  }

  const now = new Date()

  // 3. Define retention targets (ordered cheapest → most expensive)
  const targets: RetentionTarget[] = [
    {
      table: 'idempotency_keys',
      column: 'expires_at',
      cutoff: now,
      description: 'Expired idempotency keys',
    },
    {
      table: 'api_usage',
      column: 'created_at',
      cutoff: buildCutoff(now, 365),
      description: 'API usage logs >1 year',
    },
    {
      table: 'analytics_events',
      column: 'created_at',
      cutoff: buildCutoff(now, 365),
      description: 'Analytics events >1 year',
    },
    {
      table: 'whatsapp_submissions',
      column: 'created_at',
      cutoff: buildCutoff(now, 365),
      description: 'WhatsApp submissions >1 year',
    },
    {
      table: 'activity_logs',
      column: 'created_at',
      cutoff: buildCutoff(now, 730),
      description: 'Activity logs >2 years',
    },
  ]

  // 4. Execute deletions and collect results
  const results: DeletionResult[] = []
  let totalDeleted = 0

  for (const target of targets) {
    const { error, count } = await supabase
      .from(target.table)
      .delete({ count: 'exact' })
      .lt(target.column, target.cutoff.toISOString())

    const deleted = count ?? 0

    if (error) {
      logger.warn(`[data-retention] Failed to clean ${target.table}: ${error.message}`)
      results.push({ table: target.table, deleted: 0, error: error.message })
    } else {
      if (deleted > 0) {
        logger.info(`[data-retention] Deleted ${deleted} rows from ${target.table}`)
      }
      results.push({ table: target.table, deleted, error: null })
      totalDeleted += deleted
    }
  }

  const hasErrors = results.some((r) => r.error !== null)
  if (hasErrors) {
    logger.warn('[data-retention] Completed with some errors', { results })
  } else {
    logger.info('[data-retention] Completed successfully', { totalDeleted })
  }

  return {
    timestamp: now.toISOString(),
    totalDeleted,
    results,
  }
})
