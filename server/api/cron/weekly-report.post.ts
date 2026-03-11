/**
 * POST /api/cron/weekly-report
 *
 * Weekly cron job (Monday 08:00) that generates and sends a technical summary:
 *   - Error count by type (from infra_alerts)
 *   - Latency p95 (from infra_metrics)
 *   - Dead letter jobs (from job_queue)
 *   - Vehicle/dealer counts
 *   - Analytics funnel summary
 *
 * Protected by CRON_SECRET.
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { logger } from '../../utils/logger'
import { safeError } from '../../utils/safeError'

interface WeeklyMetrics {
  errorsThisWeek: number
  errorsByLevel: Record<string, number>
  deadLetterJobs: number
  totalVehicles: number
  publishedVehicles: number
  totalDealers: number
  funnelSearches: number
  funnelViews: number
  funnelContacts: number
  latencyP95: number | null
}

async function collectMetrics(supabase: import('@supabase/supabase-js').SupabaseClient): Promise<WeeklyMetrics> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Run queries in parallel
  const [
    alertsRes,
    deadJobsRes,
    vehiclesRes,
    publishedRes,
    dealersRes,
    searchesRes,
    viewsRes,
    contactsRes,
    metricsRes,
  ] = await Promise.all([
    // Alerts this week
    supabase
      .from('infra_alerts')
      .select('level', { count: 'exact', head: false })
      .gte('created_at', oneWeekAgo),

    // Dead letter jobs
    supabase
      .from('job_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'dead'),

    // Total vehicles
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true }),

    // Published vehicles
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),

    // Total dealers
    supabase
      .from('dealers')
      .select('id', { count: 'exact', head: true }),

    // Funnel: searches this week
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'funnel:search')
      .gte('created_at', oneWeekAgo),

    // Funnel: vehicle views this week
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'funnel:view_vehicle')
      .gte('created_at', oneWeekAgo),

    // Funnel: contacts this week
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'funnel:contact_seller')
      .gte('created_at', oneWeekAgo),

    // Latest latency metrics
    supabase
      .from('infra_metrics')
      .select('metric_value')
      .eq('metric_name', 'api_latency_p95')
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  // Count errors by level
  const errorsByLevel: Record<string, number> = {}
  let errorsThisWeek = 0
  if (alertsRes.data) {
    for (const alert of alertsRes.data as Array<{ level: string }>) {
      errorsByLevel[alert.level] = (errorsByLevel[alert.level] || 0) + 1
      errorsThisWeek++
    }
  }

  const latencyRow = metricsRes.data?.[0] as { metric_value: number } | undefined

  return {
    errorsThisWeek,
    errorsByLevel,
    deadLetterJobs: deadJobsRes.count ?? 0,
    totalVehicles: vehiclesRes.count ?? 0,
    publishedVehicles: publishedRes.count ?? 0,
    totalDealers: dealersRes.count ?? 0,
    funnelSearches: searchesRes.count ?? 0,
    funnelViews: viewsRes.count ?? 0,
    funnelContacts: contactsRes.count ?? 0,
    latencyP95: latencyRow?.metric_value ?? null,
  }
}

function formatReport(metrics: WeeklyMetrics): string {
  const date = new Date().toISOString().slice(0, 10)
  const errorLevels = Object.entries(metrics.errorsByLevel)
    .map(([level, count]) => `  - ${level}: ${count}`)
    .join('\n') || '  - None'

  const conversionRate = metrics.funnelSearches > 0
    ? ((metrics.funnelContacts / metrics.funnelSearches) * 100).toFixed(1)
    : 'N/A'

  return `
Weekly Technical Report — ${date}
${'='.repeat(50)}

INFRASTRUCTURE
  Alerts this week: ${metrics.errorsThisWeek}
${errorLevels}
  Dead letter jobs: ${metrics.deadLetterJobs}
  API latency p95: ${metrics.latencyP95 === null ? 'No data' : `${metrics.latencyP95}ms`}

PLATFORM
  Total vehicles: ${metrics.totalVehicles} (${metrics.publishedVehicles} published)
  Total dealers: ${metrics.totalDealers}

FUNNEL (last 7 days)
  Searches: ${metrics.funnelSearches}
  Vehicle views: ${metrics.funnelViews}
  Contacts: ${metrics.funnelContacts}
  Search→Contact rate: ${conversionRate}%

${metrics.deadLetterJobs > 0 ? '⚠️  ACTION REQUIRED: Dead letter jobs need investigation.\n' : ''}${metrics.errorsThisWeek > 5 ? '⚠️  HIGH ALERT COUNT: Review infra_alerts for patterns.\n' : ''}
`.trim()
}

function formatReportHtml(metrics: WeeklyMetrics): string {
  const date = new Date().toISOString().slice(0, 10)
  const conversionRate = metrics.funnelSearches > 0
    ? ((metrics.funnelContacts / metrics.funnelSearches) * 100).toFixed(1)
    : 'N/A'

  let alertBadge: string
  if (metrics.errorsThisWeek > 5) {
    alertBadge = '<span style="color:#dc2626;font-weight:bold">⚠️ HIGH</span>'
  }
  else if (metrics.errorsThisWeek > 0) {
    alertBadge = '<span style="color:#d97706">⚠️</span>'
  }
  else {
    alertBadge = '<span style="color:#16a34a">✅</span>'
  }

  return `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#23424A;">Weekly Technical Report — ${date}</h2>

  <h3>Infrastructure ${alertBadge}</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 8px;">Alerts this week</td><td style="padding:4px 8px;font-weight:bold;">${metrics.errorsThisWeek}</td></tr>
    <tr><td style="padding:4px 8px;">Dead letter jobs</td><td style="padding:4px 8px;font-weight:bold;${metrics.deadLetterJobs > 0 ? 'color:#dc2626' : ''}">${metrics.deadLetterJobs}</td></tr>
    <tr><td style="padding:4px 8px;">API latency p95</td><td style="padding:4px 8px;font-weight:bold;">${metrics.latencyP95 === null ? 'N/A' : `${metrics.latencyP95}ms`}</td></tr>
  </table>

  <h3>Platform</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 8px;">Vehicles</td><td style="padding:4px 8px;font-weight:bold;">${metrics.totalVehicles} (${metrics.publishedVehicles} published)</td></tr>
    <tr><td style="padding:4px 8px;">Dealers</td><td style="padding:4px 8px;font-weight:bold;">${metrics.totalDealers}</td></tr>
  </table>

  <h3>Funnel (7 days)</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 8px;">Searches</td><td style="padding:4px 8px;font-weight:bold;">${metrics.funnelSearches}</td></tr>
    <tr><td style="padding:4px 8px;">Vehicle views</td><td style="padding:4px 8px;font-weight:bold;">${metrics.funnelViews}</td></tr>
    <tr><td style="padding:4px 8px;">Contacts</td><td style="padding:4px 8px;font-weight:bold;">${metrics.funnelContacts}</td></tr>
    <tr><td style="padding:4px 8px;">Search→Contact</td><td style="padding:4px 8px;font-weight:bold;">${conversionRate}%</td></tr>
  </table>

  ${metrics.deadLetterJobs > 0 ? '<p style="color:#dc2626;font-weight:bold;">⚠️ Dead letter jobs need investigation.</p>' : ''}

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
  <p style="font-size:12px;color:#6b7280;">Tracciona — Automated weekly report</p>
</div>`.trim()
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const supabase = serverSupabaseServiceRole(event)

  try {
    const metrics = await collectMetrics(supabase)
    const textReport = formatReport(metrics)
    const htmlReport = formatReportHtml(metrics)

    // Send email to admin
    const adminEmail = process.env.INFRA_ALERT_EMAIL || 'tankiberica@gmail.com'

    try {
      await $fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'x-internal-secret': process.env.CRON_SECRET || '',
          'content-type': 'application/json',
        },
        body: {
          to: adminEmail,
          subject: `[Tracciona] Weekly Report — ${new Date().toISOString().slice(0, 10)}`,
          text: textReport,
          html: htmlReport,
        },
      })
    } catch (error_) {
      logger.warn('[weekly-report] Failed to send email', {
        error: error_ instanceof Error ? error_.message : String(error_),
      })
    }

    logger.info('[weekly-report] Report generated', {
      errorsThisWeek: metrics.errorsThisWeek,
      deadLetterJobs: metrics.deadLetterJobs,
      vehicles: metrics.totalVehicles,
      dealers: metrics.totalDealers,
    })

    return {
      success: true,
      metrics,
      report: textReport,
    }
  } catch (err) {
    logger.error('[weekly-report] Failed to generate report', {
      error: err instanceof Error ? err.message : String(err),
    })
    throw safeError(500, 'Failed to generate weekly report')
  }
})
