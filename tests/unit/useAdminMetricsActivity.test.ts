import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminMetricsActivity } from '../../app/composables/admin/useAdminMetricsActivity'

// ─── dateHelpers mock ─────────────────────────────────────────────────────

vi.mock('~/composables/shared/dateHelpers', () => ({
  getMonthsRange: (n: number) =>
    Array.from({ length: n }, (_, i) => new Date(2026, 2 - i, 1)),
  getMonthLabel: (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
  monthStart: (_date: Date) => '2026-01-01T00:00:00.000Z',
  monthEnd: (_date: Date) => '2026-01-31T23:59:59.999Z',
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
  it('vehicleActivity starts as empty array', () => {
    const c = useAdminMetricsActivity()
    expect(c.vehicleActivity.value).toEqual([])
  })

  it('topDealers starts as empty array', () => {
    const c = useAdminMetricsActivity()
    expect(c.topDealers.value).toEqual([])
  })

  it('topVehicles starts as empty array', () => {
    const c = useAdminMetricsActivity()
    expect(c.topVehicles.value).toEqual([])
  })

  it('conversionFunnel.visits starts as 0', () => {
    const c = useAdminMetricsActivity()
    expect(c.conversionFunnel.value.visits).toBe(0)
  })

  it('conversionFunnel.vehicleViews starts as 0', () => {
    const c = useAdminMetricsActivity()
    expect(c.conversionFunnel.value.vehicleViews).toBe(0)
  })

  it('conversionFunnel.leads starts as 0', () => {
    const c = useAdminMetricsActivity()
    expect(c.conversionFunnel.value.leads).toBe(0)
  })

  it('conversionFunnel.sales starts as 0', () => {
    const c = useAdminMetricsActivity()
    expect(c.conversionFunnel.value.sales).toBe(0)
  })

  it('churnRate.totalDealers starts as 0', () => {
    const c = useAdminMetricsActivity()
    expect(c.churnRate.value.totalDealers).toBe(0)
  })

  it('churnRate.cancelledDealers starts as 0', () => {
    const c = useAdminMetricsActivity()
    expect(c.churnRate.value.cancelledDealers).toBe(0)
  })

  it('churnRate.churnRate starts as 0', () => {
    const c = useAdminMetricsActivity()
    expect(c.churnRate.value.churnRate).toBe(0)
  })
})

// ─── loadVehicleActivity ──────────────────────────────────────────────────

describe('loadVehicleActivity', () => {
  it('calls supabase.from("vehicles")', async () => {
    const c = useAdminMetricsActivity()
    await c.loadVehicleActivity()
    expect(mockFrom).toHaveBeenCalledWith('vehicles')
  })

  it('generates 12-month series', async () => {
    const c = useAdminMetricsActivity()
    await c.loadVehicleActivity()
    expect(c.vehicleActivity.value).toHaveLength(12)
  })

  it('each entry has month, published, sold', async () => {
    const c = useAdminMetricsActivity()
    await c.loadVehicleActivity()
    for (const entry of c.vehicleActivity.value) {
      expect(entry).toHaveProperty('month')
      expect(entry).toHaveProperty('published')
      expect(entry).toHaveProperty('sold')
    }
  })

  it('handles empty vehicle data gracefully (all zeros)', async () => {
    const c = useAdminMetricsActivity()
    await c.loadVehicleActivity()
    const totalPublished = c.vehicleActivity.value.reduce((s, e) => s + e.published, 0)
    expect(totalPublished).toBe(0)
  })
})

// ─── loadTopDealers ───────────────────────────────────────────────────────

describe('loadTopDealers', () => {
  it('calls supabase.from("vehicles")', async () => {
    const c = useAdminMetricsActivity()
    await c.loadTopDealers()
    expect(mockFrom).toHaveBeenCalledWith('vehicles')
  })

  it('sets topDealers to empty array when no vehicles', async () => {
    const c = useAdminMetricsActivity()
    await c.loadTopDealers()
    expect(c.topDealers.value).toEqual([])
  })

  it('sets topDealers to empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }))
    const c = useAdminMetricsActivity()
    await c.loadTopDealers()
    expect(c.topDealers.value).toEqual([])
  })

  it('populates topDealers from vehicle data', async () => {
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'vehicles' && callCount === 1) {
        return makeChain({
          data: [{ dealer_id: 'd-1' }, { dealer_id: 'd-1' }, { dealer_id: 'd-2' }],
          error: null,
        })
      }
      if (table === 'leads') return makeChain({ data: [], error: null })
      if (table === 'dealers') return makeChain({ data: [{ id: 'd-1', company_name: { es: 'Dealer A' } }], error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminMetricsActivity()
    await c.loadTopDealers()
    expect(c.topDealers.value.length).toBeGreaterThan(0)
    expect(c.topDealers.value[0]).toHaveProperty('dealerId')
    expect(c.topDealers.value[0]).toHaveProperty('vehicleCount')
  })
})

// ─── loadTopVehicles ──────────────────────────────────────────────────────

describe('loadTopVehicles', () => {
  it('calls supabase.from("user_vehicle_views")', async () => {
    const c = useAdminMetricsActivity()
    await c.loadTopVehicles()
    expect(mockFrom).toHaveBeenCalledWith('user_vehicle_views')
  })

  it('sets topVehicles to empty array when no views', async () => {
    const c = useAdminMetricsActivity()
    await c.loadTopVehicles()
    expect(c.topVehicles.value).toEqual([])
  })

  it('sets topVehicles to empty on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('err') }))
    const c = useAdminMetricsActivity()
    await c.loadTopVehicles()
    expect(c.topVehicles.value).toEqual([])
  })

  it('populates topVehicles from view data', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_vehicle_views') {
        return makeChain({
          data: [{ vehicle_id: 'v-1', view_count: 100 }, { vehicle_id: 'v-2', view_count: 50 }],
          error: null,
        })
      }
      if (table === 'vehicles') {
        return makeChain({
          data: [{ id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020 }],
          error: null,
        })
      }
      return makeChain({ data: [], error: null })
    })
    const c = useAdminMetricsActivity()
    await c.loadTopVehicles()
    expect(c.topVehicles.value.length).toBeGreaterThan(0)
    expect(c.topVehicles.value[0]).toHaveProperty('vehicleId')
    expect(c.topVehicles.value[0]).toHaveProperty('views')
    expect(c.topVehicles.value[0]).toHaveProperty('title')
  })
})

// ─── loadConversionFunnel ─────────────────────────────────────────────────

describe('loadConversionFunnel', () => {
  it('calls supabase (multiple queries)', async () => {
    const c = useAdminMetricsActivity()
    await c.loadConversionFunnel()
    expect(mockFrom).toHaveBeenCalled()
  })

  it('populates conversionFunnel with all fields', async () => {
    const c = useAdminMetricsActivity()
    await c.loadConversionFunnel()
    const f = c.conversionFunnel.value
    expect(f).toHaveProperty('visits')
    expect(f).toHaveProperty('vehicleViews')
    expect(f).toHaveProperty('leads')
    expect(f).toHaveProperty('sales')
  })

  it('uses view_count for visits total', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_vehicle_views') {
        return makeChain({
          data: [{ view_count: 30 }, { view_count: 20 }],
          error: null,
        })
      }
      return makeChain({ data: [], error: null, count: 0 })
    })
    const c = useAdminMetricsActivity()
    await c.loadConversionFunnel()
    expect(c.conversionFunnel.value.visits).toBe(50)
  })

  it('handles errors gracefully (defaults to 0)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('err') }))
    const c = useAdminMetricsActivity()
    await c.loadConversionFunnel()
    expect(c.conversionFunnel.value.visits).toBe(0)
  })
})

// ─── loadChurnRate ────────────────────────────────────────────────────────

describe('loadChurnRate', () => {
  it('calls supabase.from("subscriptions")', async () => {
    const c = useAdminMetricsActivity()
    await c.loadChurnRate()
    expect(mockFrom).toHaveBeenCalledWith('subscriptions')
  })

  it('populates churnRate with totalDealers, cancelledDealers, churnRate', async () => {
    const c = useAdminMetricsActivity()
    await c.loadChurnRate()
    expect(c.churnRate.value).toHaveProperty('totalDealers')
    expect(c.churnRate.value).toHaveProperty('cancelledDealers')
    expect(c.churnRate.value).toHaveProperty('churnRate')
  })

  it('calculates churn rate correctly', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      // First call = total subscriptions
      if (callCount === 1) return makeChain({ count: 10, error: null })
      // Second call = cancelled subscriptions
      return makeChain({ count: 2, error: null })
    })
    const c = useAdminMetricsActivity()
    await c.loadChurnRate()
    expect(c.churnRate.value.totalDealers).toBe(10)
    expect(c.churnRate.value.cancelledDealers).toBe(2)
    expect(c.churnRate.value.churnRate).toBe(20)
  })

  it('handles errors gracefully (all zeros)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('err'), count: null }))
    const c = useAdminMetricsActivity()
    await c.loadChurnRate()
    expect(c.churnRate.value.totalDealers).toBe(0)
    expect(c.churnRate.value.churnRate).toBe(0)
  })

  it('churnRate is 0 when totalDealers is 0', async () => {
    mockFrom.mockReturnValue(makeChain({ count: 0, error: null }))
    const c = useAdminMetricsActivity()
    await c.loadChurnRate()
    expect(c.churnRate.value.churnRate).toBe(0)
  })
})
