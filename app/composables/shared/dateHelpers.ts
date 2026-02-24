/**
 * Shared date aggregation helpers.
 * Used by useAdminMetrics, useDealerStats, useDealerDashboard, useMarketData.
 */

/** Format a date as 'YYYY-MM'. */
export function getMonthLabel(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Generate an array of month-start dates going back `count` months. */
export function getMonthsRange(count: number): Date[] {
  const months: Date[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d)
  }
  return months
}

/** ISO string for the first millisecond of the given month. */
export function monthStart(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
}

/** ISO string for the first millisecond of the month AFTER the given month. */
export function monthEnd(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString()
}

/** Compute percent change; returns 0 when previous is 0. */
export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}
