/**
 * POST /api/cron/capacity-check
 *
 * Checks Supabase resource usage against plan limits and inserts alerts
 * when any metric exceeds 70% (warning) or 90% (critical).
 *
 * Metrics checked:
 *   - storage:    pg_database_size vs SUPABASE_STORAGE_LIMIT_GB (default 8 GB Free)
 *   - connections: pg_stat_activity count vs SUPABASE_MAX_CONNECTIONS (default 60 Free)
 *
 * Requires: CRON_SECRET in Authorization header.
 * Schedule: every 1h via cron/scheduler.
 *
 * #142 Bloque 18
 */
import { defineEventHandler, getHeader } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { logger } from '../../utils/logger'
import { safeError } from '../../utils/safeError'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

// ── Constants ─────────────────────────────────────────────────────────────────

const WARNING_THRESHOLD = 70   // percentage — trigger alert
const CRITICAL_THRESHOLD = 90  // percentage — flag is_critical

interface CapacityMetric {
  metric: 'storage' | 'connections'
  currentBytes?: number
  currentCount?: number
  limitBytes?: number
  limitCount?: number
  pct: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, (used / limit) * 100)
}

async function checkStorage(
  supabase: any,
): Promise<CapacityMetric | null> {
  const storageLimitGb = Number(process.env.SUPABASE_STORAGE_LIMIT_GB ?? 8)
  const limitBytes = storageLimitGb * 1024 * 1024 * 1024

  const { data, error } = await supabase.rpc('get_db_size_bytes' as never)
  if (error) {
    logger.warn('[capacity-check] Could not get DB size', { error: error.message })
    return null
  }

  const currentBytes = Number((data as unknown as { size_bytes: number })?.size_bytes ?? 0)
  const usage = pct(currentBytes, limitBytes)

  return {
    metric: 'storage',
    currentBytes,
    limitBytes,
    pct: Math.round(usage * 100) / 100,
  }
}

async function checkConnections(
  supabase: any,
): Promise<CapacityMetric | null> {
  const maxConn = Number(process.env.SUPABASE_MAX_CONNECTIONS ?? 60)

  const { data, error } = await supabase.rpc('get_active_connections' as never)
  if (error) {
    logger.warn('[capacity-check] Could not get active connections', { error: error.message })
    return null
  }

  const currentCount = Number((data as unknown as { count: number })?.count ?? 0)
  const usage = pct(currentCount, maxConn)

  return {
    metric: 'connections',
    currentCount,
    limitCount: maxConn,
    pct: Math.round(usage * 100) / 100,
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const vertical = process.env.NUXT_PUBLIC_VERTICAL ?? 'tracciona'
  const supabase = serverSupabaseServiceRole(event) as any

  const metrics = await Promise.all([
    checkStorage(supabase),
    checkConnections(supabase),
  ])

  const alertsInserted: string[] = []
  const skipped: string[] = []

  for (const m of metrics) {
    if (!m) continue
    if (m.pct < WARNING_THRESHOLD) {
      skipped.push(`${m.metric}:${m.pct}%`)
      continue
    }

    const isCritical = m.pct >= CRITICAL_THRESHOLD

    const details: Record<string, unknown> = { pct: m.pct }
    if (m.currentBytes !== undefined) {
      details.currentBytes = m.currentBytes
      details.limitBytes = m.limitBytes
      details.currentGb = Math.round((m.currentBytes / (1024 ** 3)) * 100) / 100
    }
    if (m.currentCount !== undefined) {
      details.currentCount = m.currentCount
      details.limitCount = m.limitCount
    }

    const { error: insertErr } = await supabase
      .from('capacity_alerts')
      .insert({
        vertical,
        metric: m.metric,
        current_value: m.pct,
        threshold: WARNING_THRESHOLD,
        is_critical: isCritical,
        details,
      } as never)

    if (insertErr) {
      logger.error('[capacity-check] Failed to insert alert', { metric: m.metric, error: insertErr.message })
    } else {
      alertsInserted.push(`${m.metric}:${m.pct}%${isCritical ? '!CRITICAL' : ''}`)
      if (isCritical) {
        logger.error(`[capacity-check] CRITICAL: ${m.metric} at ${m.pct}%`, details)
      } else {
        logger.warn(`[capacity-check] WARNING: ${m.metric} at ${m.pct}%`, details)
      }
    }
  }

  logger.info('[capacity-check] Check complete', { alertsInserted, skipped })

  return {
    ok: true,
    checked: metrics.filter(Boolean).length,
    alertsInserted: alertsInserted.length,
    alerts: alertsInserted,
    skipped,
  }
})
