import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminMetrics } from '../../app/composables/admin/useAdminMetrics'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  mockLoadKpiSummary,
  mockLoadRevenueSeries,
  mockLoadLeadsSeries,
  mockLoadVehicleActivity,
  mockLoadTopDealers,
  mockLoadTopVehicles,
  mockLoadConversionFunnel,
  mockLoadChurnRate,
  mockExportMetricsCSV,
  kpiSummaryRef,
  revenueSeriesRef,
  leadsSeriesRef,
  vehicleActivityRef,
  topDealersRef,
  topVehiclesRef,
  conversionFunnelRef,
  churnRateRef,
} = vi.hoisted(() => ({
  mockLoadKpiSummary: vi.fn().mockResolvedValue(undefined),
  mockLoadRevenueSeries: vi.fn().mockResolvedValue(undefined),
  mockLoadLeadsSeries: vi.fn().mockResolvedValue(undefined),
  mockLoadVehicleActivity: vi.fn().mockResolvedValue(undefined),
  mockLoadTopDealers: vi.fn().mockResolvedValue(undefined),
  mockLoadTopVehicles: vi.fn().mockResolvedValue(undefined),
  mockLoadConversionFunnel: vi.fn().mockResolvedValue(undefined),
  mockLoadChurnRate: vi.fn().mockResolvedValue(undefined),
  mockExportMetricsCSV: vi.fn(),
  kpiSummaryRef: { value: { monthlyRevenue: { current: 0, previousMonth: 0, changePercent: 0 }, activeVehicles: { current: 0, previousMonth: 0, changePercent: 0 }, activeDealers: { current: 0, previousMonth: 0, changePercent: 0 }, monthlyLeads: { current: 0, previousMonth: 0, changePercent: 0 } } },
  revenueSeriesRef: { value: [] },
  leadsSeriesRef: { value: [] },
  vehicleActivityRef: { value: [] },
  topDealersRef: { value: [] },
  topVehiclesRef: { value: [] },
  conversionFunnelRef: { value: null },
  churnRateRef: { value: null },
}))

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminMetricsRevenue', () => ({
  useAdminMetricsRevenue: () => ({
    kpiSummary: kpiSummaryRef,
    revenueSeries: revenueSeriesRef,
    leadsSeries: leadsSeriesRef,
    loadKpiSummary: mockLoadKpiSummary,
    loadRevenueSeries: mockLoadRevenueSeries,
    loadLeadsSeries: mockLoadLeadsSeries,
  }),
}))

vi.mock('~/composables/admin/useAdminMetricsActivity', () => ({
  useAdminMetricsActivity: () => ({
    vehicleActivity: vehicleActivityRef,
    topDealers: topDealersRef,
    topVehicles: topVehiclesRef,
    conversionFunnel: conversionFunnelRef,
    churnRate: churnRateRef,
    loadVehicleActivity: mockLoadVehicleActivity,
    loadTopDealers: mockLoadTopDealers,
    loadTopVehicles: mockLoadTopVehicles,
    loadConversionFunnel: mockLoadConversionFunnel,
    loadChurnRate: mockLoadChurnRate,
  }),
}))

vi.mock('~/utils/adminMetricsExport', () => ({
  exportMetricsCSV: mockExportMetricsCSV,
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as false', () => {
    const c = useAdminMetrics()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as empty string', () => {
    const c = useAdminMetrics()
    expect(c.error.value).toBe('')
  })

  it('kpiSummary is passed through from revenue', () => {
    const c = useAdminMetrics()
    expect(c.kpiSummary.value).toBeDefined()
  })

  it('revenueSeries starts as empty array', () => {
    const c = useAdminMetrics()
    expect(c.revenueSeries.value).toEqual([])
  })

  it('leadsSeries starts as empty array', () => {
    const c = useAdminMetrics()
    expect(c.leadsSeries.value).toEqual([])
  })

  it('vehicleActivity starts as empty array', () => {
    const c = useAdminMetrics()
    expect(c.vehicleActivity.value).toEqual([])
  })

  it('topDealers starts as empty array', () => {
    const c = useAdminMetrics()
    expect(c.topDealers.value).toEqual([])
  })

  it('topVehicles starts as empty array', () => {
    const c = useAdminMetrics()
    expect(c.topVehicles.value).toEqual([])
  })
})

// ─── loadMetrics ──────────────────────────────────────────────────────────

describe('loadMetrics', () => {
  it('calls all 8 sub-loaders', async () => {
    const c = useAdminMetrics()
    await c.loadMetrics()
    expect(mockLoadKpiSummary).toHaveBeenCalled()
    expect(mockLoadRevenueSeries).toHaveBeenCalled()
    expect(mockLoadVehicleActivity).toHaveBeenCalled()
    expect(mockLoadLeadsSeries).toHaveBeenCalled()
    expect(mockLoadTopDealers).toHaveBeenCalled()
    expect(mockLoadTopVehicles).toHaveBeenCalled()
    expect(mockLoadConversionFunnel).toHaveBeenCalled()
    expect(mockLoadChurnRate).toHaveBeenCalled()
  })

  it('sets loading to false after completion', async () => {
    const c = useAdminMetrics()
    await c.loadMetrics()
    expect(c.loading.value).toBe(false)
  })

  it('keeps error empty when all succeed', async () => {
    const c = useAdminMetrics()
    await c.loadMetrics()
    expect(c.error.value).toBe('')
  })

  it('accumulates error messages when sub-loaders fail', async () => {
    mockLoadKpiSummary.mockRejectedValueOnce(new Error('KPI fail'))
    mockLoadRevenueSeries.mockRejectedValueOnce(new Error('Revenue fail'))
    const c = useAdminMetrics()
    await c.loadMetrics()
    expect(c.error.value).toContain('KPI Summary')
    expect(c.error.value).toContain('KPI fail')
    expect(c.error.value).toContain('Revenue Series')
  })

  it('still completes even when some loaders fail', async () => {
    mockLoadChurnRate.mockRejectedValueOnce(new Error('Churn fail'))
    const c = useAdminMetrics()
    await c.loadMetrics()
    expect(c.loading.value).toBe(false)
  })

  it('sets error from catch block when a loader throws synchronously', async () => {
    mockLoadKpiSummary.mockImplementation(() => { throw new Error('sync boom') })
    const c = useAdminMetrics()
    await c.loadMetrics()
    expect(c.error.value).toBe('sync boom')
    expect(c.loading.value).toBe(false)
  })
})

// ─── exportMetricsCSV ─────────────────────────────────────────────────────

describe('exportMetricsCSV', () => {
  it('calls exportMetricsCSV with all current data', () => {
    const c = useAdminMetrics()
    c.exportMetricsCSV()
    expect(mockExportMetricsCSV).toHaveBeenCalledOnce()
  })

  it('passes kpiSummary to exportMetricsCSV', () => {
    const c = useAdminMetrics()
    c.exportMetricsCSV()
    expect(mockExportMetricsCSV).toHaveBeenCalledWith(
      expect.objectContaining({ kpiSummary: kpiSummaryRef.value }),
    )
  })

  it('passes revenueSeries to exportMetricsCSV', () => {
    const c = useAdminMetrics()
    c.exportMetricsCSV()
    expect(mockExportMetricsCSV).toHaveBeenCalledWith(
      expect.objectContaining({ revenueSeries: revenueSeriesRef.value }),
    )
  })
})
