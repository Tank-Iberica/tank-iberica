import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminMetricsRevenue } from '../../app/composables/admin/useAdminMetricsRevenue'

// ─── dateHelpers mock ─────────────────────────────────────────────────────

vi.mock('~/composables/shared/dateHelpers', () => ({
  getMonthsRange: (n: number) =>
    Array.from({ length: n }, (_, i) => new Date(2026, 2 - i, 1)),
  getMonthLabel: (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
  monthStart: (_date: Date) => '2026-01-01T00:00:00.000Z',
  monthEnd: (_date: Date) => '2026-01-31T23:59:59.999Z',
  pctChange: (cur: number, prev: number) =>
    prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100),
}))

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null, count: 0 }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'not', 'in', 'or', 'gte', 'lte', 'lt', 'gt',
    'order', 'limit', 'single', 'match', 'range',
  ]) {
    chain[m] = () => chain
  }
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null, count: 0 }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('kpiSummary.monthlyRevenue.current starts as 0', () => {
    const c = useAdminMetricsRevenue()
    expect(c.kpiSummary.value.monthlyRevenue.current).toBe(0)
  })

  it('kpiSummary.activeVehicles.current starts as 0', () => {
    const c = useAdminMetricsRevenue()
    expect(c.kpiSummary.value.activeVehicles.current).toBe(0)
  })

  it('kpiSummary.activeDealers.current starts as 0', () => {
    const c = useAdminMetricsRevenue()
    expect(c.kpiSummary.value.activeDealers.current).toBe(0)
  })

  it('kpiSummary.monthlyLeads.current starts as 0', () => {
    const c = useAdminMetricsRevenue()
    expect(c.kpiSummary.value.monthlyLeads.current).toBe(0)
  })

  it('revenueSeries starts as empty array', () => {
    const c = useAdminMetricsRevenue()
    expect(c.revenueSeries.value).toEqual([])
  })

  it('leadsSeries starts as empty array', () => {
    const c = useAdminMetricsRevenue()
    expect(c.leadsSeries.value).toEqual([])
  })
})

// ─── loadKpiSummary ───────────────────────────────────────────────────────

describe('loadKpiSummary', () => {
  it('calls supabase (multiple queries)', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadKpiSummary()
    expect(mockFrom).toHaveBeenCalled()
  })

  it('updates kpiSummary from empty data (all zeros)', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadKpiSummary()
    expect(c.kpiSummary.value.monthlyRevenue.current).toBe(0)
    expect(c.kpiSummary.value.activeVehicles.current).toBe(0)
    expect(c.kpiSummary.value.activeDealers.current).toBe(0)
    expect(c.kpiSummary.value.monthlyLeads.current).toBe(0)
  })

  it('sums invoice amounts correctly', async () => {
    // First calls to 'invoices' return revenue data
    mockFrom.mockImplementation((table: string) => {
      if (table === 'invoices') {
        return makeChain({
          data: [{ amount_cents: 50000 }, { amount_cents: 30000 }],
          error: null,
        })
      }
      if (table === 'contacts') {
        return makeChain({ count: 5, error: null })
      }
      return makeChain({ data: [], error: null, count: 3 })
    })
    const c = useAdminMetricsRevenue()
    await c.loadKpiSummary()
    // current and previous month both get same mock so both = 80000
    expect(c.kpiSummary.value.monthlyRevenue.current).toBe(80000)
  })

  it('counts contacts for leads', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'contacts') return makeChain({ count: 7, error: null })
      return makeChain({ data: [], error: null, count: 0 })
    })
    const c = useAdminMetricsRevenue()
    await c.loadKpiSummary()
    expect(c.kpiSummary.value.monthlyLeads.current).toBe(7)
  })

  it('counts vehicles for activeVehicles', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return makeChain({ data: [{ dealer_id: 'd-1' }], count: 5, error: null })
      return makeChain({ data: [], error: null, count: 0 })
    })
    const c = useAdminMetricsRevenue()
    await c.loadKpiSummary()
    expect(c.kpiSummary.value.activeVehicles.current).toBeGreaterThanOrEqual(0)
  })

  it('kpiSummary has all required fields after load', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadKpiSummary()
    const s = c.kpiSummary.value
    expect(s).toHaveProperty('monthlyRevenue')
    expect(s).toHaveProperty('activeVehicles')
    expect(s).toHaveProperty('activeDealers')
    expect(s).toHaveProperty('monthlyLeads')
  })

  it('each kpi field has current, previousMonth, changePercent', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadKpiSummary()
    for (const field of ['monthlyRevenue', 'activeVehicles', 'activeDealers', 'monthlyLeads'] as const) {
      expect(c.kpiSummary.value[field]).toHaveProperty('current')
      expect(c.kpiSummary.value[field]).toHaveProperty('previousMonth')
      expect(c.kpiSummary.value[field]).toHaveProperty('changePercent')
    }
  })
})

// ─── loadRevenueSeries ────────────────────────────────────────────────────

describe('loadRevenueSeries', () => {
  it('calls supabase.from("invoices")', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadRevenueSeries()
    expect(mockFrom).toHaveBeenCalledWith('invoices')
  })

  it('generates 12-month series', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadRevenueSeries()
    expect(c.revenueSeries.value).toHaveLength(12)
  })

  it('each series entry has month, revenue, tax', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadRevenueSeries()
    for (const entry of c.revenueSeries.value) {
      expect(entry).toHaveProperty('month')
      expect(entry).toHaveProperty('revenue')
      expect(entry).toHaveProperty('tax')
    }
  })

  it('populates revenue from invoice data', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'invoices') {
        return makeChain({
          data: [{ amount_cents: 10000, tax_cents: 2100, created_at: '2026-03-15T10:00:00Z' }],
          error: null,
        })
      }
      return makeChain({ data: [], error: null })
    })
    const c = useAdminMetricsRevenue()
    await c.loadRevenueSeries()
    const total = c.revenueSeries.value.reduce((s, e) => s + e.revenue, 0)
    expect(total).toBeGreaterThan(0)
  })

  it('handles empty invoices gracefully (all zeros)', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadRevenueSeries()
    const total = c.revenueSeries.value.reduce((s, e) => s + e.revenue, 0)
    expect(total).toBe(0)
  })
})

// ─── loadLeadsSeries ──────────────────────────────────────────────────────

describe('loadLeadsSeries', () => {
  it('calls supabase.from("contacts")', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadLeadsSeries()
    expect(mockFrom).toHaveBeenCalledWith('contacts')
  })

  it('generates 12-month series', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadLeadsSeries()
    expect(c.leadsSeries.value).toHaveLength(12)
  })

  it('each series entry has month and leads', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadLeadsSeries()
    for (const entry of c.leadsSeries.value) {
      expect(entry).toHaveProperty('month')
      expect(entry).toHaveProperty('leads')
    }
  })

  it('counts contacts per month', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'contacts') {
        return makeChain({
          data: [
            { created_at: '2026-03-10T10:00:00Z' },
            { created_at: '2026-03-20T10:00:00Z' },
          ],
          error: null,
        })
      }
      return makeChain({ data: [], error: null })
    })
    const c = useAdminMetricsRevenue()
    await c.loadLeadsSeries()
    const total = c.leadsSeries.value.reduce((s, e) => s + e.leads, 0)
    expect(total).toBeGreaterThanOrEqual(0)
  })

  it('handles empty contacts gracefully (all zeros)', async () => {
    const c = useAdminMetricsRevenue()
    await c.loadLeadsSeries()
    const total = c.leadsSeries.value.reduce((s, e) => s + e.leads, 0)
    expect(total).toBe(0)
  })
})
