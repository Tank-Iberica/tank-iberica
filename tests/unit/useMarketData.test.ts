import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MarketDataRow } from '../../app/composables/useMarketData'
import { useMarketData } from '../../app/composables/useMarketData'

// ─── Helpers ──────────────────────────────────────────────────

function makeMarketRow(overrides: Partial<MarketDataRow> = {}): MarketDataRow {
  return {
    vertical: 'tracciona',
    action: 'sell',
    subcategory: 'Camiones',
    brand: 'Volvo',
    location_province: 'Madrid',
    location_country: 'ES',
    month: '2026-02',
    listings: 50,
    avg_price: 45000,
    median_price: 42000,
    min_price: 30000,
    max_price: 60000,
    avg_days_to_sell: 25,
    sold_count: 10,
    ...overrides,
  }
}

// ─── Composable init ──────────────────────────────────────────

describe('useMarketData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const md = useMarketData()
    expect(md.loading.value).toBe(false)
    expect(md.error.value).toBe('')
    expect(md.marketData.value).toEqual([])
    expect(md.priceHistory.value).toEqual([])
    expect(md.demandData.value).toEqual([])
  })

  it('exposes all expected functions', () => {
    const md = useMarketData()
    expect(typeof md.fetchMarketData).toBe('function')
    expect(typeof md.fetchPriceHistory).toBe('function')
    expect(typeof md.fetchDemandData).toBe('function')
    expect(typeof md.getValuation).toBe('function')
    expect(typeof md.getCategoryStats).toBe('function')
    expect(typeof md.getTrend).toBe('function')
  })

  // fetchMarketData — uses the Supabase mock from setup.ts
  // The mock returns { data: [], error: null } by default

  it('fetchMarketData sets loading during fetch', async () => {
    const md = useMarketData()
    await md.fetchMarketData({})
    // After fetch, loading should be false
    expect(md.loading.value).toBe(false)
    expect(md.error.value).toBe('')
  })

  it('fetchMarketData accepts filters', async () => {
    const md = useMarketData()
    await md.fetchMarketData({
      subcategory: 'Camiones',
      brand: 'Volvo',
      province: 'Madrid',
      months: 6,
    })
    expect(md.loading.value).toBe(false)
  })

  it('fetchPriceHistory sets loading during fetch', async () => {
    const md = useMarketData()
    await md.fetchPriceHistory({})
    expect(md.loading.value).toBe(false)
    expect(md.error.value).toBe('')
  })

  it('fetchPriceHistory accepts filters', async () => {
    const md = useMarketData()
    await md.fetchPriceHistory({
      subcategory: 'Furgonetas',
      brand: 'Mercedes',
      weeks: 26,
    })
    expect(md.loading.value).toBe(false)
  })

  it('fetchDemandData sets loading during fetch', async () => {
    const md = useMarketData()
    await md.fetchDemandData({})
    expect(md.loading.value).toBe(false)
    expect(md.error.value).toBe('')
  })

  it('fetchDemandData accepts filters', async () => {
    const md = useMarketData()
    await md.fetchDemandData({
      subcategory: 'Camiones',
      brand: 'Scania',
      province: 'Barcelona',
    })
    expect(md.loading.value).toBe(false)
  })

  it('getValuation returns null for empty data', async () => {
    const md = useMarketData()
    const result = await md.getValuation({ brand: 'Volvo' })
    // Our mock returns empty data → 'No market data found'
    expect(result).toBeNull()
    expect(md.error.value).toBe('No market data found for the given parameters')
  })

  it('getValuation accepts optional params', async () => {
    const md = useMarketData()
    await md.getValuation({
      brand: 'Volvo',
      model: 'FH16',
      year: 2020,
      km: 250000,
      province: 'Madrid',
      subcategory: 'Camiones',
    })
    expect(md.loading.value).toBe(false)
  })

  it('getCategoryStats returns empty for no data', async () => {
    const md = useMarketData()
    const result = await md.getCategoryStats()
    expect(result).toEqual([])
    expect(md.loading.value).toBe(false)
  })

  it('getTrend returns 0 for empty data', async () => {
    const md = useMarketData()
    const result = await md.getTrend('Camiones')
    expect(result).toBe(0)
    expect(md.loading.value).toBe(false)
  })

  it('getTrend accepts optional brand', async () => {
    const md = useMarketData()
    const result = await md.getTrend('Camiones', 'Volvo')
    expect(result).toBe(0)
  })
})

// ─── Test pure logic via custom supabase mock ─────────────────

describe('useMarketData with data', () => {
  it('getValuation computes correct result with market data', async () => {
    // Override the global mock to return data
    const rows = [
      makeMarketRow({ avg_price: 40000, listings: 30, month: '2026-01', avg_days_to_sell: 20 }),
      makeMarketRow({ avg_price: 50000, listings: 25, month: '2026-02', avg_days_to_sell: 30 }),
      makeMarketRow({ avg_price: 45000, listings: 20, month: '2026-02', avg_days_to_sell: null }),
    ]

    // Create a custom mock that returns data for this test
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => {
      mockChain[m] = () => mockChain
    })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows, error: null })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => mockChain,
      }),
    }))

    const md = useMarketData()
    const result = await md.getValuation({ brand: 'Volvo', year: 2020 })

    expect(result).not.toBeNull()
    expect(result!.sample_size).toBe(75) // 30+25+20
    expect(result!.confidence).toBe('high') // >= 20
    expect(result!.estimated_min).toBeGreaterThan(0)
    expect(result!.estimated_median).toBeGreaterThan(0)
    expect(result!.estimated_max).toBeGreaterThan(0)
    // With year 2020, depreciation factor = 1 - 6*0.05 = 0.70
    expect(result!.estimated_min).toBeLessThan(40000) // 40000 * 0.7 = 28000
    expect(result!.avg_days_to_sell).toBe(25) // avg of 20 and 30

    // Restore
    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getCategoryStats computes per-subcategory stats', async () => {
    const rows = [
      makeMarketRow({ subcategory: 'Camiones', avg_price: 50000, listings: 30, month: '2026-02' }),
      makeMarketRow({ subcategory: 'Camiones', avg_price: 45000, listings: 20, month: '2026-01' }),
      makeMarketRow({ subcategory: 'Furgonetas', avg_price: 25000, listings: 15, month: '2026-02' }),
    ]

    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => {
      mockChain[m] = () => mockChain
    })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows, error: null })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => mockChain,
      }),
    }))

    const md = useMarketData()
    const stats = await md.getCategoryStats()

    expect(stats.length).toBe(2)
    // Camiones has more listings, should be first
    expect(stats[0]!.subcategory).toBe('Camiones')
    expect(stats[0]!.listings).toBe(30)
    expect(stats[0]!.avg_price).toBe(50000)
    expect(stats[1]!.subcategory).toBe('Furgonetas')

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getTrend computes weighted trend between months', async () => {
    const rows = [
      { month: '2026-02', avg_price: 55000, listings: 30 },
      { month: '2026-01', avg_price: 50000, listings: 25 },
    ]

    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => {
      mockChain[m] = () => mockChain
    })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows, error: null })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => mockChain,
      }),
    }))

    const md = useMarketData()
    const trend = await md.getTrend('Camiones')

    // 55000 vs 50000 = 10% increase
    expect(trend).toBe(10)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getValuation returns low confidence for small sample', async () => {
    const rows = [
      makeMarketRow({ avg_price: 40000, listings: 3, month: '2026-02' }),
    ]

    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => {
      mockChain[m] = () => mockChain
    })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows, error: null })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => mockChain,
      }),
    }))

    const md = useMarketData()
    const result = await md.getValuation({ brand: 'Volvo' })

    expect(result).not.toBeNull()
    expect(result!.confidence).toBe('low')
    expect(result!.sample_size).toBe(3)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getValuation detects stable trend', async () => {
    const rows = [
      makeMarketRow({ avg_price: 50000, listings: 20, month: '2026-02' }),
      makeMarketRow({ avg_price: 50500, listings: 20, month: '2026-01' }),
    ]

    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => {
      mockChain[m] = () => mockChain
    })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows, error: null })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => mockChain,
      }),
    }))

    const md = useMarketData()
    const result = await md.getValuation({ brand: 'Volvo' })

    expect(result!.market_trend).toBe('stable')

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('fetchMarketData sets error on query failure', async () => {
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => { mockChain[m] = () => mockChain })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: null, error: new Error('DB connection lost') })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => mockChain }),
    }))

    const md = useMarketData()
    await md.fetchMarketData({})
    expect(md.error.value).toBe('DB connection lost')
    expect(md.marketData.value).toEqual([])
    expect(md.loading.value).toBe(false)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('fetchPriceHistory sets error on query failure', async () => {
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => { mockChain[m] = () => mockChain })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: null, error: new Error('DB price error') })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => mockChain }),
    }))

    const md = useMarketData()
    await md.fetchPriceHistory({})
    expect(md.error.value).toBe('DB price error')
    expect(md.priceHistory.value).toEqual([])
    expect(md.loading.value).toBe(false)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('fetchDemandData sets error on query failure', async () => {
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => { mockChain[m] = () => mockChain })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: null, error: new Error('DB demand error') })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => mockChain }),
    }))

    const md = useMarketData()
    await md.fetchDemandData({})
    expect(md.error.value).toBe('DB demand error')
    expect(md.demandData.value).toEqual([])
    expect(md.loading.value).toBe(false)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getValuation sets error on query failure', async () => {
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => { mockChain[m] = () => mockChain })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: null, error: new Error('Valuation query failed') })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => mockChain }),
    }))

    const md = useMarketData()
    const result = await md.getValuation({ brand: 'Volvo' })
    expect(result).toBeNull()
    expect(md.error.value).toBe('Valuation query failed')
    expect(md.loading.value).toBe(false)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getCategoryStats sets error on query failure', async () => {
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => { mockChain[m] = () => mockChain })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: null, error: new Error('Stats query failed') })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => mockChain }),
    }))

    const md = useMarketData()
    const result = await md.getCategoryStats()
    expect(result).toEqual([])
    expect(md.error.value).toBe('Stats query failed')
    expect(md.loading.value).toBe(false)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getTrend sets error on query failure', async () => {
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => { mockChain[m] = () => mockChain })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: null, error: new Error('Trend query failed') })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => mockChain }),
    }))

    const md = useMarketData()
    const result = await md.getTrend('Camiones')
    expect(result).toBe(0)
    expect(md.error.value).toBe('Trend query failed')
    expect(md.loading.value).toBe(false)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('fetchMarketData handles non-Error exceptions', async () => {
    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => { mockChain[m] = () => mockChain })
    mockChain.then = (_resolve: unknown, reject: (v: unknown) => unknown) => {
      throw 'string error'
    }

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => mockChain }),
    }))

    const md = useMarketData()
    await md.fetchMarketData({})
    expect(md.error.value).toBe('Error fetching market data')
    expect(md.loading.value).toBe(false)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })

  it('getValuation detects falling trend', async () => {
    const rows = [
      makeMarketRow({ avg_price: 40000, listings: 20, month: '2026-02' }),
      makeMarketRow({ avg_price: 50000, listings: 20, month: '2026-01' }),
    ]

    const mockChain: Record<string, unknown> = {}
    const methods = ['eq', 'gte', 'order', 'select']
    methods.forEach((m) => {
      mockChain[m] = () => mockChain
    })
    mockChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows, error: null })

    const originalMock = globalThis.useSupabaseClient
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => mockChain,
      }),
    }))

    const md = useMarketData()
    const result = await md.getValuation({ brand: 'Volvo' })

    expect(result!.market_trend).toBe('falling')
    expect(result!.trend_pct).toBeLessThan(0)

    vi.stubGlobal('useSupabaseClient', originalMock)
  })
})
