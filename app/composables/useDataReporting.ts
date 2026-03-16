/**
 * Data reporting composable — structured report generation.
 *
 * Provides:
 * - Period-over-period comparison (MoM, WoW)
 * - KPI summary generation
 * - CSV/tabular data formatting
 * - Trend detection (growth, decline, stable)
 * - Report metadata (generated at, filters, period)
 *
 * Pure calculation functions exported for testability.
 * Used in admin reports, dealer exports, and scheduled email digests.
 */

export interface MetricPoint {
  label: string
  value: number
}

export interface PeriodComparison {
  metric: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface ReportKpiSummary {
  label: string
  value: number
  formatted: string
  trend?: 'up' | 'down' | 'stable'
  changePercent?: number
}

export interface ReportMeta {
  generatedAt: string
  periodStart: string
  periodEnd: string
  periodDays: number
  recordCount: number
}

/**
 * Compare two periods and calculate changes.
 */
export function comparePeriods(
  metrics: Array<{ metric: string; current: number; previous: number }>,
  stabilityThreshold: number = 2,
): PeriodComparison[] {
  return metrics.map(({ metric, current, previous }) => {
    const change = current - previous
    let changePercent: number
    if (previous !== 0) {
      changePercent = Math.round((change / previous) * 1000) / 10
    } else {
      changePercent = current > 0 ? 100 : 0
    }

    let trend: 'up' | 'down' | 'stable'
    if (Math.abs(changePercent) <= stabilityThreshold) {
      trend = 'stable'
    } else {
      trend = changePercent > 0 ? 'up' : 'down'
    }

    return { metric, current, previous, change, changePercent, trend }
  })
}

/**
 * Detect trend direction from a series of values.
 * Uses simple linear regression slope sign.
 */
export function detectTrend(
  values: number[],
  stabilityThreshold: number = 0.01,
): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'

  const n = values.length
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]!
    sumXY += i * values[i]!
    sumX2 += i * i
  }

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) return 'stable'

  const slope = (n * sumXY - sumX * sumY) / denominator
  const avgValue = sumY / n

  if (avgValue === 0) return 'stable'

  const normalizedSlope = slope / avgValue

  if (Math.abs(normalizedSlope) < stabilityThreshold) return 'stable'
  return normalizedSlope > 0 ? 'up' : 'down'
}

/**
 * Calculate moving average for smoothing noisy data.
 */
export function movingAverage(values: number[], windowSize: number = 3): number[] {
  if (values.length === 0 || windowSize < 1) return []
  if (windowSize > values.length)
    return [Math.round(values.reduce((s, v) => s + v, 0) / values.length)]

  const result: number[] = []
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize)
    const avg = window.reduce((s, v) => s + v, 0) / windowSize
    result.push(Math.round(avg * 100) / 100)
  }
  return result
}

/**
 * Format number for display in reports.
 */
export function formatMetricValue(
  value: number,
  type: 'number' | 'currency' | 'percent' | 'days',
  locale: string = 'es-ES',
): string {
  switch (type) {
    case 'currency':
      return `${value.toLocaleString(locale)} €`
    case 'percent':
      return `${value}%`
    case 'days':
      return `${value}d`
    case 'number':
    default:
      return value.toLocaleString(locale)
  }
}

/**
 * Generate KPI summary cards from raw metrics.
 */
export function generateReportKpiSummary(
  metrics: Array<{
    label: string
    value: number
    previousValue?: number
    type: 'number' | 'currency' | 'percent' | 'days'
  }>,
  locale: string = 'es-ES',
): ReportKpiSummary[] {
  return metrics.map(({ label, value, previousValue, type }) => {
    const formatted = formatMetricValue(value, type, locale)
    let trend: 'up' | 'down' | 'stable' | undefined
    let changePercent: number | undefined

    if (previousValue !== undefined) {
      const change = value - previousValue
      if (previousValue !== 0) {
        changePercent = Math.round((change / previousValue) * 1000) / 10
      } else {
        changePercent = value > 0 ? 100 : 0
      }

      if (Math.abs(changePercent) <= 2) {
        trend = 'stable'
      } else {
        trend = changePercent > 0 ? 'up' : 'down'
      }
    }

    return { label, value, formatted, trend, changePercent }
  })
}

/**
 * Generate CSV from tabular data with headers.
 */
export function generateCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const escape = (val: string | number): string => {
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replaceAll(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = headers.map(escape).join(',')
  const dataLines = rows.map((row) => row.map(escape).join(','))

  return [headerLine, ...dataLines].join('\n')
}

/**
 * Generate report metadata.
 */
export function generateReportMeta(periodDays: number, recordCount: number): ReportMeta {
  const now = new Date()
  const periodEnd = now.toISOString().slice(0, 10)
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  return {
    generatedAt: now.toISOString(),
    periodStart,
    periodEnd,
    periodDays,
    recordCount,
  }
}

/**
 * Calculate percentage change between two values.
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * Bucket numeric values into ranges for histogram-like reports.
 */
export function bucketValues(
  values: number[],
  bucketSize: number,
): Array<{ rangeStart: number; rangeEnd: number; count: number }> {
  if (values.length === 0 || bucketSize <= 0) return []

  const min = Math.floor(Math.min(...values) / bucketSize) * bucketSize
  const max = Math.ceil(Math.max(...values) / bucketSize) * bucketSize
  const buckets: Array<{ rangeStart: number; rangeEnd: number; count: number }> = []

  for (let start = min; start < max; start += bucketSize) {
    const end = start + bucketSize
    const count = values.filter((v) => v >= start && v < end).length
    buckets.push({ rangeStart: start, rangeEnd: end, count })
  }

  return buckets
}
