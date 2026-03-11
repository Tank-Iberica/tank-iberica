import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  CHART_COLORS,
  useAdminDashboardPage,
} from '../../app/composables/admin/useAdminDashboardPage'

// ─── Mock useAdminMetrics ─────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminMetrics', () => ({
  useAdminMetrics: () => ({
    kpiSummary: { value: null },
    revenueSeries: { value: [] },
    vehicleActivity: { value: [] },
    leadsSeries: { value: [] },
    topDealers: { value: [] },
    topVehicles: { value: [] },
    conversionFunnel: { value: null },
    churnRate: { value: null },
    loading: { value: false },
    error: { value: null },
    loadMetrics: vi.fn().mockResolvedValue(undefined),
    exportMetricsCSV: vi.fn(),
  }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── formatCurrency ───────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats 0 as "0 €" (or equivalent es-ES)', () => {
    const result = formatCurrency(0)
    expect(typeof result).toBe('string')
    expect(result).toContain('0')
  })

  it('formats 1000 as a currency string containing 1.000', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('formats 29 as a string containing "29"', () => {
    const result = formatCurrency(29)
    expect(result).toContain('29')
  })

  it('returns a string with no decimal part for whole numbers', () => {
    const result = formatCurrency(100)
    // minimumFractionDigits: 0 → no ".00"
    expect(result).not.toContain(',00')
    expect(result).not.toContain('.00')
  })
})

// ─── formatNumber ─────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats 0 as "0"', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats 1000 using es-ES locale (dot thousands separator)', () => {
    const result = formatNumber(1000)
    // es-ES uses "." as thousands separator → "1.000"
    expect(result).toContain('1')
    expect(result.replace(/\./g, '').replace(/,/g, '')).toContain('1000')
  })

  it('formats 42 as "42"', () => {
    expect(formatNumber(42)).toBe('42')
  })
})

// ─── formatPercent ────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('adds "+" sign for positive values', () => {
    expect(formatPercent(5.0)).toBe('+5.0%')
  })

  it('shows no sign for negative values', () => {
    expect(formatPercent(-3.5)).toBe('-3.5%')
  })

  it('formats 0 as "0.0%"', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('rounds to 1 decimal place', () => {
    expect(formatPercent(1.234)).toBe('+1.2%')
  })
})

// ─── CHART_COLORS ─────────────────────────────────────────────────────────

describe('CHART_COLORS', () => {
  it('has primary color #23424A', () => {
    expect(CHART_COLORS.primary).toBe('#23424A')
  })

  it('has accent color #10b981', () => {
    expect(CHART_COLORS.accent).toBe('#10b981')
  })

  it('has warning color #f59e0b', () => {
    expect(CHART_COLORS.warning).toBe('#f59e0b')
  })

  it('has error color #ef4444', () => {
    expect(CHART_COLORS.error).toBe('#ef4444')
  })

  it('has primaryLight as rgba string', () => {
    expect(CHART_COLORS.primaryLight).toContain('rgba')
  })

  it('has accentLight as rgba string', () => {
    expect(CHART_COLORS.accentLight).toContain('rgba')
  })
})

// ─── useAdminDashboardPage initial state ──────────────────────────────────

describe('useAdminDashboardPage initial state', () => {
  it('loading starts as false', () => {
    const c = useAdminDashboardPage()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminDashboardPage()
    expect(c.error.value).toBeNull()
  })

  it('kpiSummary starts as null', () => {
    const c = useAdminDashboardPage()
    expect(c.kpiSummary.value).toBeNull()
  })

  it('hasRevenueData is false when revenueSeries is empty', () => {
    const c = useAdminDashboardPage()
    expect(c.hasRevenueData.value).toBe(false)
  })

  it('hasVehiclesData is false when vehicleActivity is empty', () => {
    const c = useAdminDashboardPage()
    expect(c.hasVehiclesData.value).toBe(false)
  })

  it('hasLeadsData is false when leadsSeries is empty', () => {
    const c = useAdminDashboardPage()
    expect(c.hasLeadsData.value).toBe(false)
  })

  it('revenueChartData is an object with labels and datasets', () => {
    const c = useAdminDashboardPage()
    expect(c.revenueChartData.value).toHaveProperty('labels')
    expect(c.revenueChartData.value).toHaveProperty('datasets')
  })

  it('revenueChartData.labels is empty when revenueSeries is empty', () => {
    const c = useAdminDashboardPage()
    expect(c.revenueChartData.value.labels).toEqual([])
  })
})
