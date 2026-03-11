import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePriceHistory } from '../../app/composables/usePriceHistory'
import type { PricePoint } from '../../app/composables/usePriceHistory'

// ─── Stub helpers ─────────────────────────────────────────────────────────────

function makePoint(overrides: Partial<PricePoint> = {}): PricePoint {
  return {
    price_cents: 10000,
    previous_price_cents: null,
    change_type: 'initial',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function stubSupabaseHistory(
  historyRows: PricePoint[] = [],
  historyError: unknown = null,
  vehicleRow: Record<string, unknown> | null = null,
  vehicleError: unknown = null,
) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => {
      if (table === 'price_history') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: historyRows, error: historyError }),
              }),
            }),
          }),
        }
      }
      if (table === 'vehicles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve(
                  vehicleError
                    ? { data: null, error: vehicleError }
                    : { data: vehicleRow, error: null },
                ),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        }
      }
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      }
    },
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  // Override setup.ts stub with getter-based computed for reactivity
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
  stubSupabaseHistory() // default: empty history
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('history starts as empty array', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.history.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.loading.value).toBe(false)
  })

  it('fairPriceCents starts as null', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.fairPriceCents.value).toBeNull()
  })

  it('currentPrice starts as null', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.currentPrice.value).toBeNull()
  })

  it('priceTrend starts as stable (no history)', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.priceTrend.value).toBe('stable')
  })

  it('highestPrice starts as null', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.highestPrice.value).toBeNull()
  })

  it('lowestPrice starts as null', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.lowestPrice.value).toBeNull()
  })

  it('priceDropPercentage starts as 0', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.priceDropPercentage.value).toBe(0)
  })

  it('chartData starts as empty array', () => {
    const c = usePriceHistory('vehicle-1')
    expect(c.chartData.value).toHaveLength(0)
  })
})

// ─── fetchHistory ─────────────────────────────────────────────────────────────

describe('fetchHistory', () => {
  it('sets history from returned rows', async () => {
    const rows = [makePoint({ price_cents: 50000 }), makePoint({ price_cents: 45000 })]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.history.value).toHaveLength(2)
    expect(c.history.value[0]!.price_cents).toBe(50000)
  })

  it('sets currentPrice to first row price_cents', async () => {
    const rows = [makePoint({ price_cents: 80000 })]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.currentPrice.value).toBe(80000)
  })

  it('sets currentPrice to null when no rows', async () => {
    stubSupabaseHistory([])
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.currentPrice.value).toBeNull()
  })

  it('sets loading to false after success', async () => {
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.loading.value).toBe(false)
  })

  it('throws and sets loading to false on DB error', async () => {
    stubSupabaseHistory([], { message: 'DB error' })
    const c = usePriceHistory('vehicle-1')
    await expect(c.fetchHistory()).rejects.toThrow('Failed to fetch price history')
    expect(c.loading.value).toBe(false)
  })

  it('sets history to empty on success with no data', async () => {
    stubSupabaseHistory([])
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.history.value).toHaveLength(0)
  })
})

// ─── calculateFairPrice — fallback paths ──────────────────────────────────────

describe('calculateFairPrice — no vehicle data', () => {
  it('sets fairPriceCents to null when no history and vehicle not found', async () => {
    // Default stub: no history, no vehicle row
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    await c.calculateFairPrice()
    expect(c.fairPriceCents.value).toBeNull()
  })

  it('sets fairPriceCents to vehicle average when vehicle not found but history exists', async () => {
    // 3 price points, avg = (30000+40000+50000)/3 = 40000
    const rows = [
      makePoint({ price_cents: 50000, change_type: 'listed' }),
      makePoint({ price_cents: 40000, change_type: 'reduced' }),
      makePoint({ price_cents: 30000, change_type: 'reduced' }),
    ]
    stubSupabaseHistory(rows, null, null, null)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    await c.calculateFairPrice()
    // vehicleAvg = 40000, categoryAvg = null → fairPrice = round(40000) = 40000
    expect(c.fairPriceCents.value).toBe(40000)
  })

  it('uses only FAIR_PRICE_SAMPLE_SIZE (3) recent prices for vehicle avg', async () => {
    // 5 price points — only first 3 used
    const rows = [
      makePoint({ price_cents: 60000 }),
      makePoint({ price_cents: 60000 }),
      makePoint({ price_cents: 60000 }),
      makePoint({ price_cents: 10000 }), // ignored
      makePoint({ price_cents: 10000 }), // ignored
    ]
    stubSupabaseHistory(rows, null, null, null)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    await c.calculateFairPrice()
    // vehicleAvg = (60000*3)/3 = 60000
    expect(c.fairPriceCents.value).toBe(60000)
  })

  it('sets fairPriceCents to null when vehicleError and no history', async () => {
    stubSupabaseHistory([], null, null, { message: 'Error' })
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    await c.calculateFairPrice()
    expect(c.fairPriceCents.value).toBeNull()
  })
})

// ─── calculateFairPrice — vehicle with no category ───────────────────────────

describe('calculateFairPrice — vehicle found, no category_id', () => {
  it('uses vehicle avg when vehicle has no category_id', async () => {
    const rows = [
      makePoint({ price_cents: 60000 }),
      makePoint({ price_cents: 60000 }),
      makePoint({ price_cents: 60000 }),
    ]
    const vehicleRow = { id: 'vehicle-1', category_id: null, year: 2020 }
    stubSupabaseHistory(rows, null, vehicleRow)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    await c.calculateFairPrice()
    // vehicleAvg = 60000, categoryAvg = null → round(60000) = 60000
    expect(c.fairPriceCents.value).toBe(60000)
  })
})

// ─── calculateFairPrice — vehicle with category_id + similar vehicles ───────

describe('calculateFairPrice — weighted (vehicle + category)', () => {
  function stubFullFairPrice(
    historyRows: PricePoint[],
    vehicleRow: Record<string, unknown>,
    similarVehicles: { price: number }[],
  ) {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'price_history') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: historyRows, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'vehicles') {
          return {
            select: (...args: unknown[]) => {
              // First select call is for fair price vehicle lookup (single)
              // Subsequent calls are for similar vehicles query
              const selectArg = args[0] as string | undefined
              if (selectArg === 'price') {
                // Similar vehicles query
                const chain: Record<string, unknown> = {}
                ;['eq', 'neq', 'not', 'gte', 'lte'].forEach((m) => { chain[m] = () => chain })
                chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: similarVehicles, error: null }).then(r)
                chain.catch = (r: (e: unknown) => void) => Promise.resolve({ data: similarVehicles, error: null }).catch(r)
                return chain
              }
              // Vehicle details query
              return {
                eq: () => ({
                  single: () => Promise.resolve({ data: vehicleRow, error: null }),
                }),
              }
            },
            update: () => ({ eq: () => ({ then: () => {} }) }),
          }
        }
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }
      },
    }))
  }

  it('calculates weighted fair price with 0.4 vehicle + 0.6 category', async () => {
    const rows = [
      makePoint({ price_cents: 50000 }),
      makePoint({ price_cents: 50000 }),
      makePoint({ price_cents: 50000 }),
    ]
    // vehicleAvg = 50000 cents
    // Similar vehicles avg price = 400 euros → 40000 cents
    // Weighted = 50000*0.4 + 40000*0.6 = 20000 + 24000 = 44000
    stubFullFairPrice(rows, { id: 'v1', category_id: 'cat-1', year: 2020 }, [{ price: 400 }, { price: 400 }])
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    await c.calculateFairPrice()
    expect(c.fairPriceCents.value).toBe(44000)
  })

  it('returns only categoryAvg when no history', async () => {
    // No history → vehicleAvg = null. Similar vehicles avg = 500 euros → 50000 cents
    stubFullFairPrice([], { id: 'v1', category_id: 'cat-1', year: 2020 }, [{ price: 500 }])
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    await c.calculateFairPrice()
    // vehicleAvg=null, categoryAvg=50000 → returns 50000
    expect(c.fairPriceCents.value).toBe(50000)
  })
})

// ─── computed: priceTrend ────────────────────────────────────────────────────

describe('priceTrend', () => {
  it('returns rising when rises > falls', async () => {
    const rows = [
      makePoint({ price_cents: 50000, previous_price_cents: 40000 }),
      makePoint({ price_cents: 40000, previous_price_cents: 30000 }),
      makePoint({ price_cents: 30000, previous_price_cents: null }),
    ]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.priceTrend.value).toBe('rising')
  })

  it('returns falling when falls > rises', async () => {
    const rows = [
      makePoint({ price_cents: 30000, previous_price_cents: 40000 }),
      makePoint({ price_cents: 40000, previous_price_cents: 50000 }),
      makePoint({ price_cents: 50000, previous_price_cents: null }),
    ]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.priceTrend.value).toBe('falling')
  })
})

// ─── computed: highestPrice / lowestPrice / priceDropPercentage ──────────────

describe('price computed properties', () => {
  it('highestPrice returns max price_cents', async () => {
    const rows = [
      makePoint({ price_cents: 30000 }),
      makePoint({ price_cents: 80000 }),
      makePoint({ price_cents: 50000 }),
    ]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.highestPrice.value).toBe(80000)
  })

  it('lowestPrice returns min price_cents', async () => {
    const rows = [
      makePoint({ price_cents: 30000 }),
      makePoint({ price_cents: 80000 }),
      makePoint({ price_cents: 50000 }),
    ]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.lowestPrice.value).toBe(30000)
  })

  it('priceDropPercentage calculates drop from highest to current', async () => {
    // currentPrice = first row = 50000, highestPrice = 100000
    // drop = (100000 - 50000) / 100000 * 100 = 50%
    const rows = [
      makePoint({ price_cents: 50000 }),
      makePoint({ price_cents: 100000 }),
    ]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.priceDropPercentage.value).toBe(50)
  })

  it('priceDropPercentage returns 0 when current >= highest', async () => {
    const rows = [
      makePoint({ price_cents: 100000 }),
      makePoint({ price_cents: 50000 }),
    ]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.priceDropPercentage.value).toBe(0)
  })
})

// ─── computed: chartData ─────────────────────────────────────────────────────

describe('chartData', () => {
  it('filters to last 90 days and sorts ascending', async () => {
    const now = new Date()
    const recent = new Date(now)
    recent.setDate(recent.getDate() - 10)
    const old = new Date(now)
    old.setDate(old.getDate() - 100) // outside 90 day window

    const rows = [
      makePoint({ price_cents: 50000, created_at: recent.toISOString() }),
      makePoint({ price_cents: 30000, created_at: old.toISOString() }),
    ]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.chartData.value).toHaveLength(1) // only recent
    expect(c.chartData.value[0].price).toBe(50000)
  })

  it('returns date as YYYY-MM-DD format', async () => {
    const now = new Date()
    const rows = [makePoint({ price_cents: 10000, created_at: now.toISOString() })]
    stubSupabaseHistory(rows)
    const c = usePriceHistory('vehicle-1')
    await c.fetchHistory()
    expect(c.chartData.value[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
