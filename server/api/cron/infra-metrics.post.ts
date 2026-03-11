/**
 * POST /api/cron/infra-metrics
 *
 * Hourly cron job that collects infrastructure metrics from each service API,
 * saves snapshots to infra_metrics, and generates alerts when thresholds are exceeded.
 *
 * Protected by CRON_SECRET (Authorization header or request body).
 * Components: supabase (DB size, connections), cloudinary, resend, sentry.
 * Gracefully skips any component whose env vars are not configured.
 */
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────────

interface MetricEntry {
  component: string
  metric_name: string
  metric_value: number
  metric_limit: number | null
  metadata: Record<string, unknown>
}

interface ThresholdConfig {
  warning: number
  critical: number
  emergency: number
}

interface CloudinaryUsageResponse {
  plan: string
  last_updated: string
  transformations: { usage: number; credits_usage: number }
  objects: { usage: number }
  bandwidth: { usage: number; credits_usage: number }
  storage: { usage: number; credits_usage: number }
  credits: { usage: number; limit: number; used_percent: number }
  [key: string]: unknown
}

interface CronBody {
  secret?: string
}

type AlertLevel = 'warning' | 'critical' | 'emergency'

// ── Thresholds ─────────────────────────────────────────────────────────────────

const THRESHOLDS: Record<string, ThresholdConfig> = {
  db_size_bytes: { warning: 70, critical: 85, emergency: 95 },
  connections_used: { warning: 70, critical: 85, emergency: 95 },
  cloudinary_credits: { warning: 70, critical: 85, emergency: 95 },
  cloudinary_storage: { warning: 70, critical: 85, emergency: 95 },
  resend_emails_today: { warning: 70, critical: 85, emergency: 95 },
  stripe_webhook_failures: { warning: 50, critical: 70, emergency: 90 },
}

// Alert cooldown periods in hours
const COOLDOWNS: Record<AlertLevel, number> = {
  emergency: 24,
  critical: 48,
  warning: 168,
}

// Free tier limits (defaults; can be overridden via metadata)
const SUPABASE_DB_LIMIT_BYTES = 500 * 1024 * 1024 // 500 MB free tier
const SUPABASE_CONNECTIONS_LIMIT = 60 // Free tier ~60 direct connections
const RESEND_DAILY_LIMIT = 100 // Free tier 100/day


// ── Metric Collectors ──────────────────────────────────────────────────────

async function collectSupabaseRpc(
  supabase: SupabaseClient,
  rpcName: string,
  metricName: string,
  limit: number,
  source: string,
): Promise<{ metric: MetricEntry | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc(rpcName)
    if (!error && data !== null && data !== undefined) {
      const value = typeof data === 'number' ? data : Number(data)
      if (!Number.isNaN(value)) {
        return {
          metric: {
            component: 'supabase',
            metric_name: metricName,
            metric_value: value,
            metric_limit: limit,
            metadata: { source },
          },
          error: null,
        }
      }
    }
    if (error) return { metric: null, error: `supabase.${metricName}: ${error.message}` }
    return { metric: null, error: null }
  } catch {
    return { metric: null, error: `supabase.${metricName}: exception during collection` }
  }
}

async function collectCloudinaryMetrics(config: {
  public: { cloudinaryCloudName?: string }
}): Promise<{ metrics: MetricEntry[]; error: string | null }> {
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const cloudName = config.public.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME || ''

  if (!apiKey || !apiSecret || !cloudName) return { metrics: [], error: null }

  try {
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    const usageData = await $fetch<CloudinaryUsageResponse>(
      `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
      { headers: { Authorization: `Basic ${credentials}` } },
    )

    const metrics: MetricEntry[] = []
    if (usageData?.credits) {
      metrics.push({
        component: 'cloudinary',
        metric_name: 'cloudinary_credits',
        metric_value: usageData.credits.usage,
        metric_limit: usageData.credits.limit,
        metadata: {
          plan: usageData.plan,
          used_percent: usageData.credits.used_percent,
          last_updated: usageData.last_updated,
        },
      })
    }
    if (usageData?.storage) {
      metrics.push({
        component: 'cloudinary',
        metric_name: 'cloudinary_storage',
        metric_value: usageData.storage.usage,
        metric_limit:
          usageData.storage.credits_usage > 0 ? usageData.storage.credits_usage * 100 : null,
        metadata: { source: 'cloudinary_admin_api' },
      })
    }
    return { metrics, error: null }
  } catch {
    return { metrics: [], error: 'cloudinary: API call failed or credentials invalid' }
  }
}

async function collectResendMetrics(
  supabase: SupabaseClient,
  resendApiKey: string | undefined,
): Promise<{ metric: MetricEntry | null; error: string | null }> {
  if (!resendApiKey) return { metric: null, error: null }
  try {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { count, error } = await supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', todayStart.toISOString())

    if (!error && count !== null) {
      return {
        metric: {
          component: 'resend',
          metric_name: 'resend_emails_today',
          metric_value: count,
          metric_limit: RESEND_DAILY_LIMIT,
          metadata: { source: 'email_logs', since: todayStart.toISOString() },
        },
        error: null,
      }
    }
    return { metric: null, error: null }
  } catch {
    return { metric: null, error: 'resend: failed to count today emails' }
  }
}

async function collectStripeMetrics(
  supabase: SupabaseClient,
): Promise<{ metric: MetricEntry | null; error: string | null }> {
  try {
    const last24h = new Date(Date.now() - 24 * 3600000).toISOString()
    const { count, error } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', last24h)

    if (!error && count !== null) {
      return {
        metric: {
          component: 'stripe',
          metric_name: 'stripe_webhook_failures',
          metric_value: count,
          metric_limit: 5,
          metadata: { source: 'payments_table', since: last24h },
        },
        error: null,
      }
    }
    return { metric: null, error: null }
  } catch {
    return { metric: null, error: 'stripe: failed to count webhook failures' }
  }
}

// ── Alert Processing ───────────────────────────────────────────────────────

function determineAlertLevel(
  usagePercent: number,
  thresholdConfig: ThresholdConfig,
): AlertLevel | null {
  if (usagePercent >= thresholdConfig.emergency) return 'emergency'
  if (usagePercent >= thresholdConfig.critical) return 'critical'
  if (usagePercent >= thresholdConfig.warning) return 'warning'
  return null
}

interface AlertCandidate {
  metric: MetricEntry
  usagePercent: number
  alertLevel: AlertLevel
}

function buildAlertCandidates(collectedMetrics: MetricEntry[]): AlertCandidate[] {
  return collectedMetrics
    .filter((m) => m.metric_limit !== null && m.metric_limit > 0)
    .flatMap((metric) => {
      const usagePercent = (metric.metric_value / metric.metric_limit!) * 100
      const thresholdConfig = THRESHOLDS[metric.metric_name]
      if (!thresholdConfig) return []
      const alertLevel = determineAlertLevel(usagePercent, thresholdConfig)
      if (!alertLevel) return []
      return [{ metric, usagePercent, alertLevel }]
    })
}

async function sendAlertEmail(
  metric: MetricEntry,
  roundedPercent: number,
  alertLevel: AlertLevel,
  internalSecret: string | undefined,
): Promise<void> {
  const { infraAlertEmailHtml, infraAlertSubject } =
    await import('../../utils/email-templates/infra-alert')
  const html = infraAlertEmailHtml({
    component: metric.component,
    metric: metric.metric_name,
    usagePercent: roundedPercent,
    value: metric.metric_value,
    limit: metric.metric_limit ?? 0,
    level: alertLevel,
  })
  await $fetch('/api/email/send', {
    method: 'POST',
    headers: internalSecret ? { 'x-internal-secret': internalSecret } : {},
    body: {
      to: 'tankiberica@gmail.com',
      subject: infraAlertSubject(metric.component, roundedPercent),
      html,
      templateKey: 'infra_alert',
    },
  }).catch(() => {})
}

async function checkAndCreateAlerts(
  supabase: SupabaseClient,
  collectedMetrics: MetricEntry[],
  internalSecret: string | undefined,
): Promise<number> {
  const candidates = buildAlertCandidates(collectedMetrics)
  let alertsCreated = 0

  for (const { metric, usagePercent, alertLevel } of candidates) {
    const cooldownSince = new Date(Date.now() - COOLDOWNS[alertLevel] * 3600000).toISOString()

    const { data: recentAlerts } = await supabase
      .from('infra_alerts')
      .select('id')
      .eq('component', metric.component)
      .eq('metric_name', metric.metric_name)
      .eq('alert_level', alertLevel)
      .gte('sent_at', cooldownSince)
      .limit(1)

    if ((recentAlerts?.length ?? 0) > 0) continue

    const roundedPercent = Math.round(usagePercent * 10) / 10
    const message = `${metric.component}.${metric.metric_name} at ${usagePercent.toFixed(1)}% (${metric.metric_value}/${metric.metric_limit})`

    const { error: alertError } = await supabase.from('infra_alerts').insert({
      component: metric.component,
      metric_name: metric.metric_name,
      alert_level: alertLevel,
      message,
      usage_percent: roundedPercent,
      sent_at: new Date().toISOString(),
    } as never)

    if (alertError) continue
    alertsCreated++
    await sendAlertEmail(metric, roundedPercent, alertLevel, internalSecret).catch(() => {})
  }

  return alertsCreated
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()
  const _internalSecret = config.cronSecret || process.env.CRON_SECRET
  const collectedMetrics: MetricEntry[] = []
  const errors: string[] = []

  // Collect all metrics — single-metric collectors
  const singleResults = [
    await collectSupabaseRpc(
      supabase,
      'get_pg_database_size',
      'db_size_bytes',
      SUPABASE_DB_LIMIT_BYTES,
      'pg_database_size',
    ),
    await collectSupabaseRpc(
      supabase,
      'get_pg_stat_activity_count',
      'connections_used',
      SUPABASE_CONNECTIONS_LIMIT,
      'pg_stat_activity',
    ),
    await collectResendMetrics(supabase, config.resendApiKey || process.env.RESEND_API_KEY),
    await collectStripeMetrics(supabase),
  ]
  for (const r of singleResults) {
    if (r.metric) collectedMetrics.push(r.metric)
    if (r.error) errors.push(r.error)
  }

  // Multi-metric collector (cloudinary)
  const cloudinary = await collectCloudinaryMetrics(config)
  collectedMetrics.push(...cloudinary.metrics)
  if (cloudinary.error) errors.push(cloudinary.error)

  // Insert all collected metrics
  let metricsInserted = 0
  if (collectedMetrics.length > 0) {
    const rows = collectedMetrics.map((m) => ({
      ...m,
      recorded_at: new Date().toISOString(),
    }))
    const { error: insertError } = await supabase.from('infra_metrics').insert(rows as never)
    if (insertError) errors.push(`infra_metrics insert: ${insertError.message}`)
    else metricsInserted = rows.length
  }

  // Check thresholds and generate alerts
  const alertsCreated = await checkAndCreateAlerts(supabase, collectedMetrics, _internalSecret)

  return {
    metricsInserted,
    alertsCreated,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  }
})
