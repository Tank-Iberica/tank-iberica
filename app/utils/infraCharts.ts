/**
 * Pure helpers for the admin infrastructure dashboard.
 * Extracted from useAdminInfrastructura for size reduction (#121).
 */
import type { ChartData } from 'chart.js'
import type { InfraMetric } from '~/composables/useInfraMetrics'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TabKey = 'status' | 'alerts' | 'history' | 'migration' | 'crons'
export type PeriodValue = '24h' | '7d' | '30d'

export interface ComponentMetricDisplay {
  name: string
  label: string
  value: number
  limit: number
  percent: number | null
  recommendation: { level: string; message: string; action: string } | null
}

export interface ComponentCardData {
  key: string
  name: string
  icon: string
  overallStatus: 'green' | 'yellow' | 'red' | 'gray'
  metrics: ComponentMetricDisplay[]
}

export interface HistoryChartData {
  component: string
  label: string
  chartData: ChartData<'line'>
}

// ---------------------------------------------------------------------------
// Component definitions
// ---------------------------------------------------------------------------

export const componentDefinitions = [
  {
    key: 'supabase',
    name: 'Supabase',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/><circle cx="10" cy="18" r="1" fill="currentColor"/></svg>',
    metrics: [
      { name: 'db_size_bytes', label: 'DB Size' },
      { name: 'connections', label: 'Connections' },
    ],
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M22 12A10 10 0 1012 2a10 10 0 0010 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    metrics: [{ name: 'workers_requests_day', label: 'Workers Req/day' }],
  },
  {
    key: 'cloudinary',
    name: 'Cloudinary',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
    metrics: [
      { name: 'transformations_used', label: 'Transformations' },
      { name: 'storage_used_bytes', label: 'Storage' },
    ],
  },
  {
    key: 'cf_images',
    name: 'CF Images',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    metrics: [{ name: 'images_stored', label: 'Images Stored' }],
  },
  {
    key: 'resend',
    name: 'Resend',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    metrics: [{ name: 'emails_sent_today', label: 'Emails Sent' }],
  },
  {
    key: 'sentry',
    name: 'Sentry',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    metrics: [{ name: 'events_month', label: 'Events/month' }],
  },
]

export const chartColors: Record<string, string> = {
  supabase: '#3ECF8E',
  cloudflare: '#F6821F',
  cloudinary: '#3448C5',
  cf_images: '#F38020',
  resend: '#000000',
  sentry: '#362D59',
}

// ---------------------------------------------------------------------------
// Helper types (used by buildComponentCard)
// ---------------------------------------------------------------------------

export type GetLatestFn = (
  component: string,
  metric: string,
) => { usage_percent: number | null; metric_value: number; metric_limit?: number } | null
export type GetStatusColorFn = (pct: number | null) => 'green' | 'yellow' | 'red' | 'gray'
export type GetRecommendationFn = (
  component: string,
  metric: string,
  pct: number,
) => { level: string; message: string; action: string } | null

// ---------------------------------------------------------------------------
// Pure chart / card builders
// ---------------------------------------------------------------------------

export function buildComponentCard(
  def: (typeof componentDefinitions)[0],
  getLatest: GetLatestFn,
  getStatusColor: GetStatusColorFn,
  getRecommendation: GetRecommendationFn,
): ComponentCardData {
  const metricDisplays: ComponentMetricDisplay[] = []
  let worstStatus: 'green' | 'yellow' | 'red' | 'gray' = 'gray'

  for (const metricDef of def.metrics) {
    const latest = getLatest(def.key, metricDef.name)
    if (!latest) continue
    const pct = latest.usage_percent ?? null
    const color = getStatusColor(pct)
    if (worstStatus === 'gray') worstStatus = color
    else if (color === 'red') worstStatus = 'red'
    else if (color === 'yellow' && worstStatus !== 'red') worstStatus = 'yellow'
    const rec = pct === null ? null : getRecommendation(def.key, metricDef.name, pct)
    metricDisplays.push({
      name: metricDef.name,
      label: metricDef.label,
      value: latest.metric_value,
      limit: latest.metric_limit ?? 0,
      percent: pct,
      recommendation: rec ? { level: rec.level, message: rec.message, action: rec.action } : null,
    })
  }

  return { key: def.key, name: def.name, icon: def.icon, overallStatus: worstStatus, metrics: metricDisplays }
}

export function groupMetricsByComponent(metricsData: InfraMetric[]): Map<string, InfraMetric[]> {
  const grouped = new Map<string, InfraMetric[]>()
  for (const m of metricsData) {
    if (!grouped.has(m.component)) grouped.set(m.component, [])
    grouped.get(m.component)!.push(m)
  }
  return grouped
}

export function buildDatasetsForComponent(
  compMetrics: InfraMetric[],
  component: string,
  colors: Record<string, string>,
): { datasets: ChartData<'line'>['datasets']; labels: string[] } {
  const byMetric = new Map<string, InfraMetric[]>()
  for (const m of compMetrics) {
    if (!byMetric.has(m.metric_name)) byMetric.set(m.metric_name, [])
    byMetric.get(m.metric_name)!.push(m)
  }

  const datasets: ChartData<'line'>['datasets'] = []
  let labels: string[] = []
  const color = colors[component] || '#23424A'

  for (const [metricName, metricValues] of byMetric) {
    const sorted = [...metricValues].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
    if (labels.length === 0) {
      labels = sorted.map((m) =>
        new Date(m.recorded_at).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      )
    }
    datasets.push({
      label: metricName,
      data: sorted.map((m) => m.metric_value),
      borderColor: color,
      backgroundColor: color + '20',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
    })
  }
  return { datasets, labels }
}

export function buildHistoryCharts(
  metricsData: InfraMetric[],
  colors: Record<string, string>,
  definitions: typeof componentDefinitions,
): HistoryChartData[] {
  const grouped = groupMetricsByComponent(metricsData)
  const charts: HistoryChartData[] = []

  for (const [component, compMetrics] of grouped) {
    const { datasets, labels } = buildDatasetsForComponent(compMetrics, component, colors)
    if (datasets.length > 0) {
      const def = definitions.find((d) => d.key === component)
      charts.push({ component, label: def?.name || component, chartData: { labels, datasets } })
    }
  }
  return charts
}
