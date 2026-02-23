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
import { createError, defineEventHandler, getHeader, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

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

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // ── Verify cron secret ────────────────────────────────────────────────────
  const config = useRuntimeConfig()
  const cronSecret = config.cronSecret || process.env.CRON_SECRET

  if (cronSecret) {
    const authHeader = getHeader(event, 'authorization')
    const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
    const headerSecret = getHeader(event, 'x-cron-secret')

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      headerSecret === cronSecret ||
      body?.secret === cronSecret

    if (!isAuthorized) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  }

  const supabase = serverSupabaseServiceRole(event)
  const collectedMetrics: MetricEntry[] = []
  const errors: string[] = []

  // ═════════════════════════════════════════════════════════════════════════
  // 1. Supabase — Database size
  // ═════════════════════════════════════════════════════════════════════════
  try {
    const { data: dbSizeData, error: dbSizeError } = await supabase.rpc('get_pg_database_size')

    if (!dbSizeError && dbSizeData !== null && dbSizeData !== undefined) {
      const sizeBytes = typeof dbSizeData === 'number' ? dbSizeData : Number(dbSizeData)
      if (!Number.isNaN(sizeBytes)) {
        collectedMetrics.push({
          component: 'supabase',
          metric_name: 'db_size_bytes',
          metric_value: sizeBytes,
          metric_limit: SUPABASE_DB_LIMIT_BYTES,
          metadata: { source: 'pg_database_size' },
        })
      }
    } else if (dbSizeError) {
      // RPC function may not exist yet — try a fallback estimation
      errors.push(`supabase.db_size: ${dbSizeError.message}`)
    }
  } catch {
    errors.push('supabase.db_size: exception during collection')
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. Supabase — Active connections
  // ═════════════════════════════════════════════════════════════════════════
  try {
    const { data: connData, error: connError } = await supabase.rpc('get_pg_stat_activity_count')

    if (!connError && connData !== null && connData !== undefined) {
      const connections = typeof connData === 'number' ? connData : Number(connData)
      if (!Number.isNaN(connections)) {
        collectedMetrics.push({
          component: 'supabase',
          metric_name: 'connections_used',
          metric_value: connections,
          metric_limit: SUPABASE_CONNECTIONS_LIMIT,
          metadata: { source: 'pg_stat_activity' },
        })
      }
    } else if (connError) {
      errors.push(`supabase.connections: ${connError.message}`)
    }
  } catch {
    errors.push('supabase.connections: exception during collection')
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. Cloudinary — Usage (credits, storage, bandwidth)
  // ═════════════════════════════════════════════════════════════════════════
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET
  const cloudinaryCloudName =
    config.public?.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME

  if (cloudinaryApiKey && cloudinaryApiSecret && cloudinaryCloudName) {
    try {
      const credentials = Buffer.from(`${cloudinaryApiKey}:${cloudinaryApiSecret}`).toString(
        'base64',
      )
      const usageData = await $fetch<CloudinaryUsageResponse>(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/usage`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        },
      )

      if (usageData?.credits) {
        collectedMetrics.push({
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
        collectedMetrics.push({
          component: 'cloudinary',
          metric_name: 'cloudinary_storage',
          metric_value: usageData.storage.usage,
          metric_limit:
            usageData.storage.credits_usage > 0 ? usageData.storage.credits_usage * 100 : null,
          metadata: { source: 'cloudinary_admin_api' },
        })
      }
    } catch {
      errors.push('cloudinary: API call failed or credentials invalid')
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. Resend — Count today's emails from analytics_events
  // ═════════════════════════════════════════════════════════════════════════
  const resendApiKey = config.resendApiKey || process.env.RESEND_API_KEY

  if (resendApiKey) {
    try {
      const todayStart = new Date()
      todayStart.setUTCHours(0, 0, 0, 0)

      const { count, error: countError } = await supabase
        .from('email_logs')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', todayStart.toISOString())

      if (!countError && count !== null) {
        collectedMetrics.push({
          component: 'resend',
          metric_name: 'resend_emails_today',
          metric_value: count,
          metric_limit: RESEND_DAILY_LIMIT,
          metadata: { source: 'email_logs', since: todayStart.toISOString() },
        })
      }
    } catch {
      errors.push('resend: failed to count today emails')
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. Sentry — Skip if no token configured
  // ═════════════════════════════════════════════════════════════════════════
  const sentryToken = process.env.SENTRY_AUTH_TOKEN
  if (sentryToken) {
    // Sentry API integration can be added here when needed
    // For now, just acknowledge the token exists but don't collect metrics
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Insert all collected metrics into infra_metrics
  // ═════════════════════════════════════════════════════════════════════════
  let metricsInserted = 0

  if (collectedMetrics.length > 0) {
    const rows = collectedMetrics.map((m) => ({
      component: m.component,
      metric_name: m.metric_name,
      metric_value: m.metric_value,
      metric_limit: m.metric_limit,
      metadata: m.metadata,
      recorded_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from('infra_metrics').insert(rows as never)

    if (!insertError) {
      metricsInserted = rows.length
    } else {
      errors.push(`infra_metrics insert: ${insertError.message}`)
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Check thresholds and generate alerts with cooldown
  // ═════════════════════════════════════════════════════════════════════════
  let alertsCreated = 0

  for (const metric of collectedMetrics) {
    if (metric.metric_limit === null || metric.metric_limit <= 0) continue

    const usagePercent = (metric.metric_value / metric.metric_limit) * 100
    const thresholdConfig = THRESHOLDS[metric.metric_name]
    if (!thresholdConfig) continue

    // Determine the highest alert level exceeded
    let alertLevel: AlertLevel | null = null
    if (usagePercent >= thresholdConfig.emergency) {
      alertLevel = 'emergency'
    } else if (usagePercent >= thresholdConfig.critical) {
      alertLevel = 'critical'
    } else if (usagePercent >= thresholdConfig.warning) {
      alertLevel = 'warning'
    }

    if (!alertLevel) continue

    // Check cooldown — skip if a recent alert exists for this combo
    const cooldownHours = COOLDOWNS[alertLevel]
    const cooldownSince = new Date(Date.now() - cooldownHours * 3600000).toISOString()

    const { data: recentAlerts } = await supabase
      .from('infra_alerts')
      .select('id')
      .eq('component', metric.component)
      .eq('metric_name', metric.metric_name)
      .eq('alert_level', alertLevel)
      .gte('sent_at', cooldownSince)
      .limit(1)

    if (recentAlerts && recentAlerts.length > 0) continue // Still in cooldown

    // Create the alert
    const message = `${metric.component}.${metric.metric_name} at ${usagePercent.toFixed(1)}% (${metric.metric_value}/${metric.metric_limit})`

    const { error: alertError } = await supabase.from('infra_alerts').insert({
      component: metric.component,
      metric_name: metric.metric_name,
      alert_level: alertLevel,
      message,
      usage_percent: Math.round(usagePercent * 10) / 10,
      sent_at: new Date().toISOString(),
    } as never)

    if (!alertError) {
      alertsCreated++

      // Attempt to send alert email via internal email route
      try {
        const { infraAlertEmailHtml, infraAlertSubject } =
          await import('../../utils/email-templates/infra-alert')
        const html = infraAlertEmailHtml({
          component: metric.component,
          metric: metric.metric_name,
          usagePercent: Math.round(usagePercent * 10) / 10,
          value: metric.metric_value,
          limit: metric.metric_limit,
          level: alertLevel,
        })
        const subject = infraAlertSubject(metric.component, Math.round(usagePercent * 10) / 10)

        await $fetch('/api/email/send', {
          method: 'POST',
          body: {
            to: 'tankiberica@gmail.com',
            subject,
            html,
            templateKey: 'infra_alert',
          },
        }).catch(() => {
          // Email send is best-effort; alert was already saved
        })
      } catch {
        // Email template import or send failed; alert was already saved
      }
    }
  }

  return {
    metricsInserted,
    alertsCreated,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  }
})
