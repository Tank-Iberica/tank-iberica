import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

/* ------------------------------------------------------------------ */
/*  Mock safeError                                                     */
/* ------------------------------------------------------------------ */
const mockSafeError = vi.fn((status: number, msg: string) => {
  const err = new Error(msg)
  ;(err as any).statusCode = status
  return err
})

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))

/* ------------------------------------------------------------------ */
/*  Dynamic Supabase mock — controlled by per-test variables           */
/* ------------------------------------------------------------------ */

// Per-test control variables (set in beforeEach or individual tests)
let subscriptionResult: { data: any; error: any }
let usageCountResult: { count: number | null }
let marketDataResult: { data: any[] | null; error: any }
let insertCalls: any[]

function buildChain(terminal: any) {
  const chain: any = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') {
        // When the chain is awaited (e.g. market_data query)
        return (resolve: Function) => resolve(terminal)
      }
      if (prop === 'single') {
        return () => Promise.resolve(terminal)
      }
      if (prop === 'insert') {
        return (payload: any) => {
          insertCalls.push(payload)
          return Promise.resolve({ data: null, error: null })
        }
      }
      // All other methods (select, eq, ilike, gte, etc.) return chain
      return (..._args: any[]) => chain
    },
  })
  return chain
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'data_subscriptions') return buildChain(subscriptionResult)
      if (table === 'api_usage') return buildChain(usageCountResult)
      if (table === 'market_data') return buildChain(marketDataResult)
      return buildChain({ data: null, error: null })
    },
  })),
}))

/* ------------------------------------------------------------------ */
/*  Nuxt auto-import stubs                                             */
/* ------------------------------------------------------------------ */
let mockQuery: Record<string, unknown> = {}
let mockAuthHeader: string | undefined
const mockSetHeader = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: vi.fn((_ev: any) => mockQuery),
  getHeader: vi.fn((_ev: any, name: string) => {
    if (name === 'authorization') return mockAuthHeader
    return undefined
  }),
  setHeader: mockSetHeader,
}))
vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-service-key',
  public: {},
}))

/* ================================================================== */
/*  A. Pure-function tests (exported helpers)                          */
/* ================================================================== */

// These are imported once; the module is loaded with env = undefined
// which means VALUATION_API_ENABLED = false inside the handler, but
// the helper exports are always available.
let computeMedian: typeof import('../../../server/api/v1/valuation.get').computeMedian
let computePriceEstimate: typeof import('../../../server/api/v1/valuation.get').computePriceEstimate
let computeTrend: typeof import('../../../server/api/v1/valuation.get').computeTrend
let computeConfidence: typeof import('../../../server/api/v1/valuation.get').computeConfidence
let logUsage: typeof import('../../../server/api/v1/valuation.get').logUsage

describe('valuation helpers (pure functions)', () => {
  beforeAll(async () => {
    vi.resetModules()
    const mod = await import('../../../server/api/v1/valuation.get')
    computeMedian = mod.computeMedian
    computePriceEstimate = mod.computePriceEstimate
    computeTrend = mod.computeTrend
    computeConfidence = mod.computeConfidence
    logUsage = mod.logUsage
  })

  /* ---------- computeMedian ---------- */
  describe('computeMedian', () => {
    it('returns the middle value for odd-length arrays', () => {
      expect(computeMedian([10, 20, 30])).toBe(20)
    })

    it('returns the average of two middle values for even-length arrays', () => {
      expect(computeMedian([10, 20, 30, 40])).toBe(25)
    })

    it('returns the single value for a one-element array', () => {
      expect(computeMedian([42])).toBe(42)
    })

    it('rounds the result', () => {
      // (10 + 15) / 2 = 12.5 -> 13
      expect(computeMedian([10, 15])).toBe(13)
    })

    it('handles large arrays', () => {
      expect(computeMedian([1, 2, 3, 4, 5, 6, 7])).toBe(4)
    })
  })

  /* ---------- computeConfidence ---------- */
  describe('computeConfidence', () => {
    it('returns "high" for 20+ samples', () => {
      expect(computeConfidence(20)).toBe('high')
      expect(computeConfidence(50)).toBe('high')
    })

    it('returns "medium" for 10-19 samples', () => {
      expect(computeConfidence(10)).toBe('medium')
      expect(computeConfidence(19)).toBe('medium')
    })

    it('returns "low" for fewer than 10 samples', () => {
      expect(computeConfidence(0)).toBe('low')
      expect(computeConfidence(5)).toBe('low')
      expect(computeConfidence(9)).toBe('low')
    })
  })

  /* ---------- computePriceEstimate ---------- */
  describe('computePriceEstimate', () => {
    it('returns min/median/max without year adjustment', () => {
      const result = computePriceEstimate([10000, 20000, 30000], undefined)
      expect(result.min).toBe(Math.round(10000 * 0.9))
      expect(result.max).toBe(Math.round(30000 * 1.1))
      expect(result.median).toBe(20000)
    })

    it('applies year depreciation factor', () => {
      const currentYear = new Date().getFullYear()
      const vehicleYear = currentYear - 4 // factor = max(0.5, 1 - 0.2) = 0.8
      const result = computePriceEstimate([10000, 20000, 30000], String(vehicleYear))
      const factor = 0.8
      expect(result.min).toBe(Math.round(10000 * 0.9 * factor))
      expect(result.max).toBe(Math.round(30000 * 1.1 * factor))
      expect(result.median).toBe(Math.round(20000 * factor))
    })

    it('caps depreciation factor at 0.5', () => {
      const result = computePriceEstimate([10000, 20000, 30000], '2000')
      const factor = 0.5
      expect(result.min).toBe(Math.round(10000 * 0.9 * factor))
      expect(result.max).toBe(Math.round(30000 * 1.1 * factor))
      expect(result.median).toBe(Math.round(20000 * factor))
    })

    it('does not apply year factor if year is NaN', () => {
      const result = computePriceEstimate([10000, 20000, 30000], 'abc')
      expect(result.min).toBe(Math.round(10000 * 0.9))
      expect(result.max).toBe(Math.round(30000 * 1.1))
      expect(result.median).toBe(20000)
    })

    it('does not apply year factor if year is 0', () => {
      const result = computePriceEstimate([10000], '0')
      expect(result.min).toBe(Math.round(10000 * 0.9))
      expect(result.max).toBe(Math.round(10000 * 1.1))
    })

    it('does not apply year factor if year is negative', () => {
      const result = computePriceEstimate([10000], '-5')
      expect(result.min).toBe(Math.round(10000 * 0.9))
      expect(result.max).toBe(Math.round(10000 * 1.1))
    })

    it('handles even-length price arrays for median', () => {
      const result = computePriceEstimate([10000, 20000], undefined)
      expect(result.median).toBe(15000)
    })
  })

  /* ---------- computeTrend ---------- */
  describe('computeTrend', () => {
    const now = new Date()

    function recentDate(daysAgo = 15): string {
      const d = new Date(now)
      d.setDate(d.getDate() - daysAgo)
      return d.toISOString()
    }

    function olderDate(daysAgo = 90): string {
      const d = new Date(now)
      d.setDate(d.getDate() - daysAgo)
      return d.toISOString()
    }

    function row(avgPrice: number, createdAt: string | null, extra?: Partial<any>) {
      return {
        avg_price: avgPrice,
        brand: 'Volvo',
        subcategory: null,
        location_province: null,
        avg_days_to_sell: null,
        created_at: createdAt,
        ...extra,
      }
    }

    it('returns stable when no recent rows', () => {
      const r = computeTrend([row(10000, olderDate())])
      expect(r.marketTrend).toBe('stable')
      expect(r.trendPct).toBe(0)
    })

    it('returns stable when no older rows', () => {
      const r = computeTrend([row(10000, recentDate())])
      expect(r.marketTrend).toBe('stable')
      expect(r.trendPct).toBe(0)
    })

    it('returns "rising" when recent avg > older avg by >1%', () => {
      const r = computeTrend([row(10000, olderDate()), row(12000, recentDate())])
      expect(r.marketTrend).toBe('rising')
      expect(r.trendPct).toBeGreaterThan(1)
    })

    it('returns "falling" when recent avg < older avg by >1%', () => {
      const r = computeTrend([row(12000, olderDate()), row(10000, recentDate())])
      expect(r.marketTrend).toBe('falling')
      expect(r.trendPct).toBeLessThan(-1)
    })

    it('returns "stable" for small price change within 1%', () => {
      const r = computeTrend([row(10000, olderDate()), row(10050, recentDate())])
      expect(r.marketTrend).toBe('stable')
      expect(Math.abs(r.trendPct)).toBeLessThanOrEqual(1)
    })

    it('returns stable when olderAvg <= 0', () => {
      const r = computeTrend([row(-1 as any, olderDate()), row(10000, recentDate())])
      expect(r.marketTrend).toBe('stable')
      expect(r.trendPct).toBe(0)
    })

    it('skips rows without created_at', () => {
      const r = computeTrend([row(10000, null), row(20000, null)])
      expect(r.marketTrend).toBe('stable')
      expect(r.trendPct).toBe(0)
    })

    it('handles empty array', () => {
      const r = computeTrend([])
      expect(r.marketTrend).toBe('stable')
      expect(r.trendPct).toBe(0)
    })
  })

  /* ---------- logUsage ---------- */
  describe('logUsage', () => {
    it('inserts a usage record into api_usage', async () => {
      const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }))
      const fakeSupa = { from: vi.fn(() => ({ insert: mockInsert })) } as any
      await logUsage(fakeSupa, 'key-123', { brand: 'volvo' }, 42, 200)
      expect(fakeSupa.from).toHaveBeenCalledWith('api_usage')
      expect(mockInsert).toHaveBeenCalledWith({
        api_key: 'key-123',
        endpoint: '/api/v1/valuation',
        params: { brand: 'volvo' },
        response_time_ms: 42,
        status_code: 200,
      })
    })

    it('handles undefined apiKey', async () => {
      const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }))
      const fakeSupa = { from: vi.fn(() => ({ insert: mockInsert })) } as any
      await logUsage(fakeSupa, undefined, {}, 10, 401)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ api_key: undefined }),
      )
    })
  })
})

/* ================================================================== */
/*  B. Handler tests — API DISABLED (default)                          */
/* ================================================================== */
describe('GET /api/v1/valuation — API disabled', () => {
  let handler: Function

  beforeAll(async () => {
    delete process.env.VALUATION_API_ENABLED
    vi.resetModules()
    const mod = await import('../../../server/api/v1/valuation.get')
    handler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = {}
    mockAuthHeader = undefined
  })

  it('throws 503 when API is not enabled', async () => {
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 503 })
    expect(mockSafeError).toHaveBeenCalledWith(503, expect.stringContaining('coming soon'))
  })

  it('throws 503 regardless of query params or auth header', async () => {
    mockQuery = { brand: 'volvo' }
    mockAuthHeader = 'Bearer some-key'
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 503 })
  })
})

/* ================================================================== */
/*  C. Handler tests — API ENABLED (all branches)                      */
/* ================================================================== */
describe('GET /api/v1/valuation — API enabled', () => {
  let handler: Function

  beforeAll(async () => {
    process.env.VALUATION_API_ENABLED = 'true'
    vi.resetModules()
    const mod = await import('../../../server/api/v1/valuation.get')
    handler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = {}
    mockAuthHeader = undefined
    subscriptionResult = { data: null, error: null }
    usageCountResult = { count: 0 }
    marketDataResult = { data: [], error: null }
    insertCalls = []
  })

  /* ---- Helper to set up a valid request that reaches success path ---- */
  function setupValid(overrides: {
    query?: Record<string, unknown>
    marketData?: any[]
    rateCount?: number
    rateLimit?: number
  } = {}) {
    mockAuthHeader = 'Bearer valid-key'
    mockQuery = { brand: 'Volvo', ...overrides.query }
    subscriptionResult = {
      data: {
        id: 'sub-1',
        api_key: 'valid-key',
        active: true,
        rate_limit_daily: overrides.rateLimit ?? 1000,
      },
      error: null,
    }
    usageCountResult = { count: overrides.rateCount ?? 0 }

    const defaultData = [
      { avg_price: 10000, brand: 'volvo', subcategory: 'camion', location_province: 'Madrid', avg_days_to_sell: 30, created_at: new Date().toISOString() },
      { avg_price: 20000, brand: 'volvo', subcategory: 'camion', location_province: 'Madrid', avg_days_to_sell: 45, created_at: new Date().toISOString() },
      { avg_price: 30000, brand: 'volvo', subcategory: 'camion', location_province: 'Madrid', avg_days_to_sell: 60, created_at: new Date().toISOString() },
    ]
    marketDataResult = { data: overrides.marketData ?? defaultData, error: null }
  }

  /* =================== Auth errors =================== */

  it('throws 401 when no authorization header', async () => {
    mockAuthHeader = undefined
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
    expect(mockSafeError).toHaveBeenCalledWith(401, 'API key required')
  })

  it('throws 401 when authorization header is empty string', async () => {
    mockAuthHeader = ''
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
    expect(mockSafeError).toHaveBeenCalledWith(401, 'API key required')
  })

  it('throws 401 when authorization header is just "Bearer "', async () => {
    mockAuthHeader = 'Bearer '
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
    expect(mockSafeError).toHaveBeenCalledWith(401, 'API key required')
  })

  it('throws 401 when subscription is not found', async () => {
    mockAuthHeader = 'Bearer invalid-key'
    subscriptionResult = { data: null, error: null }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
    expect(mockSafeError).toHaveBeenCalledWith(401, 'Invalid or inactive API key')
  })

  it('logs usage with 401 when subscription not found', async () => {
    mockAuthHeader = 'Bearer bad-key'
    subscriptionResult = { data: null, error: null }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
    expect(insertCalls.length).toBeGreaterThanOrEqual(1)
    expect(insertCalls[0]).toMatchObject({ status_code: 401 })
  })

  /* =================== Rate limiting =================== */

  it('throws 429 when usage count equals rate limit', async () => {
    mockAuthHeader = 'Bearer valid-key'
    subscriptionResult = {
      data: { id: 's', api_key: 'valid-key', active: true, rate_limit_daily: 100 },
      error: null,
    }
    usageCountResult = { count: 100 }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 429 })
    expect(mockSafeError).toHaveBeenCalledWith(429, 'Daily rate limit exceeded')
  })

  it('throws 429 when usage count exceeds rate limit', async () => {
    mockAuthHeader = 'Bearer valid-key'
    subscriptionResult = {
      data: { id: 's', api_key: 'valid-key', active: true, rate_limit_daily: 50 },
      error: null,
    }
    usageCountResult = { count: 51 }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('logs usage with 429 when rate limited', async () => {
    mockAuthHeader = 'Bearer valid-key'
    subscriptionResult = {
      data: { id: 's', api_key: 'valid-key', active: true, rate_limit_daily: 5 },
      error: null,
    }
    usageCountResult = { count: 5 }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 429 })
    expect(insertCalls.length).toBeGreaterThanOrEqual(1)
    expect(insertCalls[0]).toMatchObject({ status_code: 429 })
  })

  it('does NOT rate-limit when count is null (treated as 0)', async () => {
    setupValid()
    usageCountResult = { count: null }
    const result = await handler({} as any)
    expect(result).toBeDefined()
    expect(result.sample_size).toBe(3)
  })

  /* =================== Brand validation =================== */

  it('throws 400 when brand param is missing', async () => {
    mockAuthHeader = 'Bearer valid-key'
    mockQuery = {}
    subscriptionResult = {
      data: { id: 's', api_key: 'valid-key', active: true, rate_limit_daily: 100 },
      error: null,
    }
    usageCountResult = { count: 0 }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
    expect(mockSafeError).toHaveBeenCalledWith(400, 'brand parameter is required')
  })

  it('logs usage with 400 when brand missing', async () => {
    mockAuthHeader = 'Bearer valid-key'
    mockQuery = {}
    subscriptionResult = {
      data: { id: 's', api_key: 'valid-key', active: true, rate_limit_daily: 100 },
      error: null,
    }
    usageCountResult = { count: 0 }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
    expect(insertCalls.length).toBeGreaterThanOrEqual(1)
    expect(insertCalls[0]).toMatchObject({ status_code: 400 })
  })

  /* =================== Market query error =================== */

  it('throws 500 when market data query returns an error', async () => {
    setupValid()
    marketDataResult = { data: null, error: { message: 'DB down' } }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSafeError).toHaveBeenCalledWith(500, 'Error querying market data')
  })

  it('logs usage with 500 when market query fails', async () => {
    setupValid()
    marketDataResult = { data: null, error: { message: 'err' } }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(insertCalls[0]).toMatchObject({ status_code: 500 })
  })

  /* =================== Insufficient data =================== */

  it('throws 404 when no rows returned', async () => {
    setupValid({ marketData: [] })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
    expect(mockSafeError).toHaveBeenCalledWith(404, 'Insufficient data')
  })

  it('throws 404 when all rows have null avg_price', async () => {
    setupValid({
      marketData: [
        { avg_price: null, brand: 'volvo', subcategory: null, location_province: null, avg_days_to_sell: null, created_at: null },
        { avg_price: 0, brand: 'volvo', subcategory: null, location_province: null, avg_days_to_sell: null, created_at: null },
      ],
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when rows is null (coalesced to [])', async () => {
    setupValid()
    marketDataResult = { data: null, error: null }
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('logs usage with 404 on insufficient data', async () => {
    setupValid({ marketData: [] })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
    expect(insertCalls[0]).toMatchObject({ status_code: 404 })
  })

  /* =================== Success responses =================== */

  it('returns a complete valuation response object', async () => {
    setupValid()
    const result = await handler({} as any)
    expect(result).toHaveProperty('estimated_price')
    expect(result.estimated_price).toHaveProperty('min')
    expect(result.estimated_price).toHaveProperty('median')
    expect(result.estimated_price).toHaveProperty('max')
    expect(result).toHaveProperty('market_trend')
    expect(result).toHaveProperty('trend_pct')
    expect(result).toHaveProperty('avg_days_to_sell')
    expect(result).toHaveProperty('sample_size')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('data_date')
  })

  it('computes correct estimated_price without year', async () => {
    setupValid()
    const result = await handler({} as any)
    expect(result.estimated_price.min).toBe(Math.round(10000 * 0.9))
    expect(result.estimated_price.median).toBe(20000)
    expect(result.estimated_price.max).toBe(Math.round(30000 * 1.1))
  })

  it('applies year adjustment to estimated_price', async () => {
    const yr = new Date().getFullYear() - 2 // factor = 0.9
    setupValid({ query: { year: String(yr) } })
    const result = await handler({} as any)
    expect(result.estimated_price.min).toBe(Math.round(10000 * 0.9 * 0.9))
    expect(result.estimated_price.median).toBe(Math.round(20000 * 0.9))
    expect(result.estimated_price.max).toBe(Math.round(30000 * 1.1 * 0.9))
  })

  it('returns correct sample_size', async () => {
    setupValid()
    const result = await handler({} as any)
    expect(result.sample_size).toBe(3)
  })

  it('returns "low" confidence for < 10 samples', async () => {
    setupValid()
    const result = await handler({} as any)
    expect(result.confidence).toBe('low')
  })

  it('returns "medium" confidence for 10-19 samples', async () => {
    const data = Array.from({ length: 15 }, (_, i) => ({
      avg_price: 10000 + i * 1000,
      brand: 'volvo',
      subcategory: null,
      location_province: null,
      avg_days_to_sell: 30,
      created_at: new Date().toISOString(),
    }))
    setupValid({ marketData: data })
    const result = await handler({} as any)
    expect(result.confidence).toBe('medium')
    expect(result.sample_size).toBe(15)
  })

  it('returns "high" confidence for 20+ samples', async () => {
    const data = Array.from({ length: 25 }, (_, i) => ({
      avg_price: 10000 + i * 500,
      brand: 'volvo',
      subcategory: null,
      location_province: null,
      avg_days_to_sell: 20,
      created_at: new Date().toISOString(),
    }))
    setupValid({ marketData: data })
    const result = await handler({} as any)
    expect(result.confidence).toBe('high')
    expect(result.sample_size).toBe(25)
  })

  /* =================== avg_days_to_sell =================== */

  it('computes avg_days_to_sell from rows that have the field', async () => {
    setupValid({
      marketData: [
        { avg_price: 10000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: 30, created_at: new Date().toISOString() },
        { avg_price: 20000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: 60, created_at: new Date().toISOString() },
      ],
    })
    const result = await handler({} as any)
    expect(result.avg_days_to_sell).toBe(45)
  })

  it('returns null avg_days_to_sell when no rows have it', async () => {
    setupValid({
      marketData: [
        { avg_price: 10000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: null, created_at: new Date().toISOString() },
        { avg_price: 20000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: 0, created_at: new Date().toISOString() },
      ],
    })
    const result = await handler({} as any)
    expect(result.avg_days_to_sell).toBeNull()
  })

  it('excludes rows with avg_days_to_sell = 0', async () => {
    setupValid({
      marketData: [
        { avg_price: 10000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: 0, created_at: new Date().toISOString() },
        { avg_price: 20000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: 40, created_at: new Date().toISOString() },
      ],
    })
    const result = await handler({} as any)
    expect(result.avg_days_to_sell).toBe(40)
  })

  it('rounds avg_days_to_sell to nearest integer', async () => {
    setupValid({
      marketData: [
        { avg_price: 10000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: 31, created_at: new Date().toISOString() },
        { avg_price: 20000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: 44, created_at: new Date().toISOString() },
      ],
    })
    const result = await handler({} as any)
    // (31 + 44) / 2 = 37.5 -> 38
    expect(result.avg_days_to_sell).toBe(38)
  })

  /* =================== data_date =================== */

  it('returns data_date in YYYY-MM-DD format', async () => {
    setupValid()
    const result = await handler({} as any)
    const today = new Date().toISOString().split('T')[0]
    expect(result.data_date).toBe(today)
  })

  /* =================== Headers =================== */

  it('sets Cache-Control header on success', async () => {
    setupValid()
    await handler({} as any)
    expect(mockSetHeader).toHaveBeenCalledWith(
      expect.anything(),
      'Cache-Control',
      'private, max-age=300',
    )
  })

  /* =================== Usage logging on success =================== */

  it('logs usage with status 200 on success', async () => {
    setupValid()
    await handler({} as any)
    const log200 = insertCalls.find((c: any) => c.status_code === 200)
    expect(log200).toBeDefined()
    expect(log200.endpoint).toBe('/api/v1/valuation')
  })

  /* =================== Query filters =================== */

  it('proceeds with subcategory filter', async () => {
    setupValid({ query: { subcategory: 'camion' } })
    const result = await handler({} as any)
    expect(result).toBeDefined()
    expect(result.sample_size).toBeGreaterThan(0)
  })

  it('proceeds with province filter', async () => {
    setupValid({ query: { province: 'Madrid' } })
    const result = await handler({} as any)
    expect(result).toBeDefined()
  })

  it('proceeds with both subcategory and province filters', async () => {
    setupValid({ query: { subcategory: 'camion', province: 'Barcelona' } })
    const result = await handler({} as any)
    expect(result).toBeDefined()
  })

  /* =================== market_trend =================== */

  it('includes market_trend and trend_pct in response', async () => {
    setupValid()
    const result = await handler({} as any)
    expect(['rising', 'falling', 'stable']).toContain(result.market_trend)
    expect(typeof result.trend_pct).toBe('number')
  })

  /* =================== Brand is lowercased =================== */

  it('lowercases the brand parameter for query', async () => {
    setupValid()
    mockQuery = { brand: 'VOLVO' }
    const result = await handler({} as any)
    expect(result).toBeDefined()
  })

  /* =================== Filters out invalid rows =================== */

  it('filters out rows with null or 0 avg_price', async () => {
    setupValid({
      marketData: [
        { avg_price: null, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: null, created_at: new Date().toISOString() },
        { avg_price: 0, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: null, created_at: new Date().toISOString() },
        { avg_price: 15000, brand: 'v', subcategory: null, location_province: null, avg_days_to_sell: null, created_at: new Date().toISOString() },
      ],
    })
    const result = await handler({} as any)
    expect(result.sample_size).toBe(1)
  })

  /* =================== Rate limit boundary =================== */

  it('allows request when usage count is just below rate limit', async () => {
    setupValid({ rateCount: 99, rateLimit: 100 })
    const result = await handler({} as any)
    expect(result).toBeDefined()
  })
})
