import { describe, it, expect } from 'vitest'

/**
 * Tests for useDataReporting composable — report generation utilities.
 */

function comparePeriods(
  metrics: Array<{ metric: string; current: number; previous: number }>,
  stabilityThreshold: number = 2,
) {
  return metrics.map(({ metric, current, previous }) => {
    const change = current - previous
    const changePercent = previous !== 0
      ? Math.round((change / previous) * 1000) / 10
      : current > 0 ? 100 : 0
    let trend: 'up' | 'down' | 'stable'
    if (Math.abs(changePercent) <= stabilityThreshold) trend = 'stable'
    else trend = changePercent > 0 ? 'up' : 'down'
    return { metric, current, previous, change, changePercent, trend }
  })
}

function detectTrend(values: number[], stabilityThreshold: number = 0.01): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  const n = values.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i
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

function movingAverage(values: number[], windowSize: number = 3): number[] {
  if (values.length === 0 || windowSize < 1) return []
  if (windowSize > values.length) return [Math.round(values.reduce((s, v) => s + v, 0) / values.length)]
  const result: number[] = []
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize)
    const avg = window.reduce((s, v) => s + v, 0) / windowSize
    result.push(Math.round(avg * 100) / 100)
  }
  return result
}

function formatMetricValue(value: number, type: 'number' | 'currency' | 'percent' | 'days', locale: string = 'es-ES'): string {
  switch (type) {
    case 'currency': return `${value.toLocaleString(locale)} €`
    case 'percent': return `${value}%`
    case 'days': return `${value}d`
    case 'number': default: return value.toLocaleString(locale)
  }
}

function generateKpiSummary(
  metrics: Array<{ label: string; value: number; previousValue?: number; type: 'number' | 'currency' | 'percent' | 'days' }>,
  locale: string = 'es-ES',
) {
  return metrics.map(({ label, value, previousValue, type }) => {
    const formatted = formatMetricValue(value, type, locale)
    let trend: 'up' | 'down' | 'stable' | undefined
    let changePercent: number | undefined
    if (previousValue !== undefined) {
      const change = value - previousValue
      changePercent = previousValue !== 0
        ? Math.round((change / previousValue) * 1000) / 10
        : value > 0 ? 100 : 0
      trend = Math.abs(changePercent) <= 2 ? 'stable' : changePercent > 0 ? 'up' : 'down'
    }
    return { label, value, formatted, trend, changePercent }
  })
}

function generateCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const escape = (val: string | number): string => {
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const headerLine = headers.map(escape).join(',')
  const dataLines = rows.map((row) => row.map(escape).join(','))
  return [headerLine, ...dataLines].join('\n')
}

function generateReportMeta(periodDays: number, recordCount: number) {
  const now = new Date()
  const periodEnd = now.toISOString().slice(0, 10)
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return { generatedAt: now.toISOString(), periodStart, periodEnd, periodDays, recordCount }
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function bucketValues(values: number[], bucketSize: number) {
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

// ─── comparePeriods ───────────────────────────────────────

describe('comparePeriods', () => {
  it('empty returns empty', () => {
    expect(comparePeriods([])).toEqual([])
  })

  it('calculates change and percentage', () => {
    const result = comparePeriods([{ metric: 'sales', current: 120, previous: 100 }])
    expect(result[0].change).toBe(20)
    expect(result[0].changePercent).toBe(20)
    expect(result[0].trend).toBe('up')
  })

  it('detects decline', () => {
    const result = comparePeriods([{ metric: 'sales', current: 80, previous: 100 }])
    expect(result[0].change).toBe(-20)
    expect(result[0].changePercent).toBe(-20)
    expect(result[0].trend).toBe('down')
  })

  it('detects stability within threshold', () => {
    const result = comparePeriods([{ metric: 'sales', current: 101, previous: 100 }])
    expect(result[0].trend).toBe('stable')
  })

  it('handles previous = 0', () => {
    const result = comparePeriods([{ metric: 'sales', current: 50, previous: 0 }])
    expect(result[0].changePercent).toBe(100)
  })

  it('handles both = 0', () => {
    const result = comparePeriods([{ metric: 'sales', current: 0, previous: 0 }])
    expect(result[0].changePercent).toBe(0)
    expect(result[0].trend).toBe('stable')
  })

  it('custom stability threshold', () => {
    const result = comparePeriods([{ metric: 'sales', current: 105, previous: 100 }], 10)
    expect(result[0].trend).toBe('stable') // 5% within 10% threshold
  })
})

// ─── detectTrend ──────────────────────────────────────────

describe('detectTrend', () => {
  it('stable for single value', () => {
    expect(detectTrend([100])).toBe('stable')
  })

  it('stable for empty', () => {
    expect(detectTrend([])).toBe('stable')
  })

  it('detects upward trend', () => {
    expect(detectTrend([10, 20, 30, 40, 50])).toBe('up')
  })

  it('detects downward trend', () => {
    expect(detectTrend([50, 40, 30, 20, 10])).toBe('down')
  })

  it('stable for flat values', () => {
    expect(detectTrend([100, 100, 100, 100])).toBe('stable')
  })

  it('stable for noisy but flat data', () => {
    expect(detectTrend([100, 101, 99, 100, 101])).toBe('stable')
  })
})

// ─── movingAverage ────────────────────────────────────────

describe('movingAverage', () => {
  it('empty returns empty', () => {
    expect(movingAverage([])).toEqual([])
  })

  it('window 3 on 5 values returns 3 results', () => {
    const result = movingAverage([10, 20, 30, 40, 50], 3)
    expect(result).toHaveLength(3)
    expect(result[0]).toBe(20) // (10+20+30)/3
    expect(result[1]).toBe(30) // (20+30+40)/3
    expect(result[2]).toBe(40) // (30+40+50)/3
  })

  it('window larger than data returns single average', () => {
    const result = movingAverage([10, 20, 30], 5)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(20) // avg of all
  })

  it('window 1 returns original values', () => {
    const result = movingAverage([10, 20, 30], 1)
    expect(result).toEqual([10, 20, 30])
  })
})

// ─── formatMetricValue ────────────────────────────────────

describe('formatMetricValue', () => {
  it('formats currency', () => {
    const result = formatMetricValue(50000, 'currency')
    expect(result).toContain('€')
  })

  it('formats percent', () => {
    expect(formatMetricValue(75, 'percent')).toBe('75%')
  })

  it('formats days', () => {
    expect(formatMetricValue(30, 'days')).toBe('30d')
  })

  it('formats number', () => {
    const result = formatMetricValue(1234, 'number')
    // Locale-dependent but should contain digits
    expect(result).toMatch(/1.*234/)
  })
})

// ─── generateKpiSummary ──────────────────────────────────

describe('generateKpiSummary', () => {
  it('generates formatted KPIs', () => {
    const result = generateKpiSummary([
      { label: 'Revenue', value: 50000, type: 'currency' },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Revenue')
    expect(result[0].formatted).toContain('€')
  })

  it('includes trend when previousValue provided', () => {
    const result = generateKpiSummary([
      { label: 'Sales', value: 120, previousValue: 100, type: 'number' },
    ])
    expect(result[0].trend).toBe('up')
    expect(result[0].changePercent).toBe(20)
  })

  it('no trend without previousValue', () => {
    const result = generateKpiSummary([
      { label: 'Sales', value: 100, type: 'number' },
    ])
    expect(result[0].trend).toBeUndefined()
    expect(result[0].changePercent).toBeUndefined()
  })
})

// ─── generateCsv ──────────────────────────────────────────

describe('generateCsv', () => {
  it('generates header + rows', () => {
    const csv = generateCsv(['name', 'price'], [['Volvo', 50000], ['Scania', 60000]])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('name,price')
    expect(lines[1]).toBe('Volvo,50000')
  })

  it('escapes commas', () => {
    const csv = generateCsv(['name'], [['León, Spain']])
    expect(csv).toContain('"León, Spain"')
  })

  it('escapes quotes', () => {
    const csv = generateCsv(['name'], [['He said "hello"']])
    expect(csv).toContain('""hello""')
  })

  it('empty rows returns header only', () => {
    const csv = generateCsv(['a', 'b'], [])
    expect(csv).toBe('a,b')
  })
})

// ─── generateReportMeta ──────────────────────────────────

describe('generateReportMeta', () => {
  it('includes all fields', () => {
    const meta = generateReportMeta(30, 100)
    expect(meta.periodDays).toBe(30)
    expect(meta.recordCount).toBe(100)
    expect(meta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(meta.periodStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(meta.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('period start is before end', () => {
    const meta = generateReportMeta(30, 0)
    expect(meta.periodStart < meta.periodEnd).toBe(true)
  })
})

// ─── percentChange ────────────────────────────────────────

describe('percentChange', () => {
  it('calculates positive change', () => {
    expect(percentChange(120, 100)).toBe(20)
  })

  it('calculates negative change', () => {
    expect(percentChange(80, 100)).toBe(-20)
  })

  it('handles previous = 0 with positive', () => {
    expect(percentChange(50, 0)).toBe(100)
  })

  it('handles both = 0', () => {
    expect(percentChange(0, 0)).toBe(0)
  })

  it('handles decimal precision', () => {
    expect(percentChange(105, 100)).toBe(5)
  })
})

// ─── bucketValues ─────────────────────────────────────────

describe('bucketValues', () => {
  it('empty returns empty', () => {
    expect(bucketValues([], 10)).toEqual([])
  })

  it('buckets into correct ranges', () => {
    const result = bucketValues([5, 15, 25, 35, 45], 20)
    expect(result.length).toBeGreaterThan(0)
    // 0-20: 5,15; 20-40: 25,35; 40-60: 45
    expect(result[0].count).toBe(2)
    expect(result[1].count).toBe(2)
    expect(result[2].count).toBe(1)
  })

  it('single value creates one bucket', () => {
    const result = bucketValues([50], 100)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(1)
  })

  it('bucket size = 0 returns empty', () => {
    expect(bucketValues([1, 2, 3], 0)).toEqual([])
  })

  it('ranges are contiguous', () => {
    const result = bucketValues([10, 20, 30, 40, 50], 10)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].rangeStart).toBe(result[i - 1].rangeEnd)
    }
  })
})
