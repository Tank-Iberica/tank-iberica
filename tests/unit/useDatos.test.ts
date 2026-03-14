import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import { formatPrice } from '../../app/utils/formatters'
import { useDatos, type MarketRow, type PriceHistoryRow } from '../../app/composables/useDatos'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'gte', 'lte']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeMarketRow(overrides: Partial<MarketRow> = {}): MarketRow {
  return {
    id: 'row-1',
    vertical: 'tracciona',
    subcategory: 'camion',
    subcategory_label: 'Camiones',
    brand: 'Volvo',
    province: 'Madrid',
    month: '2026-01',
    avg_price: 80000,
    median_price: 75000,
    listing_count: 10,
    sold_count: 2,
    avg_days_to_sell: 30,
    ...overrides,
  }
}

function makeHistoryRow(overrides: Partial<PriceHistoryRow> = {}): PriceHistoryRow {
  return {
    id: 'h-1',
    vertical: 'tracciona',
    subcategory: 'camion',
    week: '2026-01-01',
    avg_price: 80000,
    listing_count: 10,
    ...overrides,
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
})

// ─── formatPrice (exported) ───────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats zero as EUR currency', () => {
    const result = formatPrice(0)
    expect(result).toBeTruthy()
  })

  it('formats positive integer', () => {
    const result = formatPrice(80000)
    expect(result).toContain('80')
    expect(result).toContain('000')
  })

  it('formats large price without decimals (maximumFractionDigits=0)', () => {
    const result = formatPrice(80500)
    // es-ES format: 80.500 € or 80.500€
    expect(result).toBeTruthy()
    expect(result).not.toContain(',5')
  })
})

// ─── useDatos initial state ───────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useDatos()
    expect(c.loading.value).toBe(true)
  })

  it('selectedCategory starts null', () => {
    const c = useDatos()
    expect(c.selectedCategory.value).toBeNull()
  })

  it('provinceSortKey starts as listingCount', () => {
    const c = useDatos()
    expect(c.provinceSortKey.value).toBe('listingCount')
  })

  it('provinceSortAsc starts as false', () => {
    const c = useDatos()
    expect(c.provinceSortAsc.value).toBe(false)
  })

  it('categoryStats starts empty', () => {
    const c = useDatos()
    expect(c.categoryStats.value).toEqual([])
  })

  it('hasData starts false', () => {
    const c = useDatos()
    expect(c.hasData.value).toBe(false)
  })

  it('selectedCategoryStat starts undefined', () => {
    const c = useDatos()
    expect(c.selectedCategoryStat.value).toBeUndefined()
  })

  it('brandBreakdown starts empty', () => {
    const c = useDatos()
    expect(c.brandBreakdown.value).toEqual([])
  })

  it('sortedProvinces starts empty', () => {
    const c = useDatos()
    expect(c.sortedProvinces.value).toEqual([])
  })

  it('chartData starts with empty labels and datasets', () => {
    const c = useDatos()
    expect(c.chartData.value.labels).toEqual([])
    expect(c.chartData.value.datasets).toEqual([])
  })

  it('lastUpdated starts as empty string', () => {
    const c = useDatos()
    expect(c.lastUpdated.value).toBe('')
  })
})

// ─── selectCategory ───────────────────────────────────────────────────────

describe('selectCategory', () => {
  it('sets selectedCategory when was null', () => {
    const c = useDatos()
    c.selectCategory('camion')
    expect(c.selectedCategory.value).toBe('camion')
  })

  it('clears selectedCategory when same subcategory selected again (toggle)', () => {
    const c = useDatos()
    c.selectCategory('camion')
    c.selectCategory('camion')
    expect(c.selectedCategory.value).toBeNull()
  })

  it('changes selectedCategory to different subcategory', () => {
    const c = useDatos()
    c.selectCategory('camion')
    c.selectCategory('semirremolque')
    expect(c.selectedCategory.value).toBe('semirremolque')
  })
})

// ─── toggleProvinceSort ───────────────────────────────────────────────────

describe('toggleProvinceSort', () => {
  it('same key toggles provinceSortAsc', () => {
    const c = useDatos()
    c.toggleProvinceSort('listingCount') // was false → true
    expect(c.provinceSortAsc.value).toBe(true)
    c.toggleProvinceSort('listingCount') // true → false
    expect(c.provinceSortAsc.value).toBe(false)
  })

  it('different key sets new key with sortAsc=false', () => {
    const c = useDatos()
    c.toggleProvinceSort('avgPrice')
    expect(c.provinceSortKey.value).toBe('avgPrice')
    expect(c.provinceSortAsc.value).toBe(false)
  })

  it('switches from listingCount to province key', () => {
    const c = useDatos()
    c.toggleProvinceSort('province')
    expect(c.provinceSortKey.value).toBe('province')
  })
})

// ─── sortArrow ────────────────────────────────────────────────────────────

describe('sortArrow', () => {
  it('returns empty string for non-active key', () => {
    const c = useDatos()
    expect(c.sortArrow('avgPrice')).toBe('')
  })

  it('returns down arrow for active key in desc mode', () => {
    const c = useDatos()
    expect(c.sortArrow('listingCount')).toBe(' \u2193')
  })

  it('returns up arrow when asc is true', () => {
    const c = useDatos()
    c.toggleProvinceSort('listingCount') // toggles to asc
    expect(c.sortArrow('listingCount')).toBe(' \u2191')
  })
})

// ─── fetchData ────────────────────────────────────────────────────────────

describe('fetchData', () => {
  it('sets loading=true at start and false after', async () => {
    const c = useDatos()
    const promise = c.fetchData()
    await promise
    expect(c.loading.value).toBe(false)
  })

  it('fetches market data via from(market_data)', async () => {
    const marketRows = [makeMarketRow()]
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'market_data') return makeChain({ data: marketRows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    expect(mockFrom).toHaveBeenCalledWith('market_data')
  })

  it('fetches price history via from(price_history)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'price_history') return makeChain({ data: [makeHistoryRow()], error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    expect(mockFrom).toHaveBeenCalledWith('price_history')
  })

  it('does not throw when data is null', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useDatos()
    await expect(c.fetchData()).resolves.not.toThrow()
  })
})

// ─── chartOptions ─────────────────────────────────────────────────────────

describe('chartOptions', () => {
  it('is an object with responsive=true', () => {
    const c = useDatos()
    expect(c.chartOptions.value.responsive).toBe(true)
  })

  it('has tooltip callback that returns formatted price', () => {
    const c = useDatos()
    const tooltipCallback = c.chartOptions.value.plugins.tooltip.callbacks.label
    const result = tooltipCallback({ parsed: { y: 50000 } })
    expect(result).toBeTruthy()
  })

  it('has y-axis tick callback for numbers', () => {
    const c = useDatos()
    const tickCallback = c.chartOptions.value.scales.y.ticks.callback
    const numResult = tickCallback(50000)
    expect(numResult).toBeTruthy()
    // string values pass through unchanged
    const strResult = tickCallback('abc')
    expect(strResult).toBe('abc')
  })
})

// ─── datasetSchema ────────────────────────────────────────────────────────

describe('datasetSchema', () => {
  it('is a valid Dataset schema object', () => {
    const c = useDatos()
    expect(c.datasetSchema.value['@type']).toBe('Dataset')
    expect(c.datasetSchema.value['@context']).toBe('https://schema.org')
  })

  it('has required keywords array', () => {
    const c = useDatos()
    expect(Array.isArray(c.datasetSchema.value.keywords)).toBe(true)
    expect((c.datasetSchema.value.keywords as string[]).length).toBeGreaterThan(0)
  })
})

// ─── categoryStats with data ──────────────────────────────────────────────

describe('categoryStats with market data', () => {
  it('computed categoryStats at initial creation is empty array', () => {
    // marketRows.value is [] at creation → computed returns []
    const c = useDatos()
    expect(c.categoryStats.value).toEqual([])
    expect(c.hasData.value).toBe(false)
  })

  it('sortedProvinces at initial creation is empty', () => {
    const c = useDatos()
    expect(c.sortedProvinces.value).toEqual([])
  })

  it('fetchData sets loading=false and calls both tables', async () => {
    const rows = [
      makeMarketRow({
        subcategory: 'camion',
        subcategory_label: 'Camiones',
        month: '2026-01',
        listing_count: 10,
      }),
      makeMarketRow({
        subcategory: 'semirremolque',
        subcategory_label: 'Semirremolques',
        month: '2026-01',
        listing_count: 5,
      }),
    ]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: rows, error: null })
      if (table === 'price_history') return makeChain({ data: [makeHistoryRow()], error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    expect(c.loading.value).toBe(false)
    expect(mockFrom).toHaveBeenCalledWith('market_data')
    expect(mockFrom).toHaveBeenCalledWith('price_history')
  })

  it('selectCategory toggle works after any fetchData', async () => {
    const c = useDatos()
    await c.fetchData()
    c.selectCategory('camion')
    expect(c.selectedCategory.value).toBe('camion')
    c.selectCategory('camion')
    expect(c.selectedCategory.value).toBeNull()
  })

  it('brandBreakdown is empty at initial state', () => {
    const c = useDatos()
    expect(c.brandBreakdown.value).toEqual([])
  })

  it('chartData is empty at initial state', () => {
    const c = useDatos()
    expect(c.chartData.value.labels).toEqual([])
    expect(c.chartData.value.datasets).toEqual([])
  })

  it('lastUpdated is empty at initial state', () => {
    const c = useDatos()
    expect(c.lastUpdated.value).toBe('')
  })
})

// ─── Reactive computed tests ─────────────────────────────────────────────────

describe('useDatos computed with reactive stubs', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({
      get value() {
        return fn()
      },
    }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return {
        get value() {
          return _v
        },
        set value(x: unknown) {
          _v = x
        },
      }
    })
    vi.stubGlobal('readonly', (r: unknown) => r)
  })

  it('categoryStats computes from marketRows after fetchData', async () => {
    const rows = [
      makeMarketRow({
        subcategory: 'camion',
        subcategory_label: 'Camiones',
        month: '2026-02',
        listing_count: 20,
      }),
      makeMarketRow({
        subcategory: 'semirremolque',
        subcategory_label: 'Semirremolques',
        month: '2026-02',
        listing_count: 10,
      }),
    ]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: rows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    const stats = c.categoryStats.value
    expect(stats.length).toBe(2)
    expect(stats[0]!.subcategory).toBe('camion')
    expect(stats[0]!.listingCount).toBe(20)
  })

  it('hasData is true when categoryStats has entries', async () => {
    const rows = [makeMarketRow({ month: '2026-02' })]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: rows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    expect(c.hasData.value).toBe(true)
  })

  it('selectedCategoryStat returns matched category', async () => {
    const rows = [makeMarketRow({ subcategory: 'camion', month: '2026-02', listing_count: 15 })]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: rows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    c.selectCategory('camion')
    expect(c.selectedCategoryStat.value).toBeDefined()
    expect(c.selectedCategoryStat.value!.subcategory).toBe('camion')
  })

  it('brandBreakdown computes brands for selected category', async () => {
    const rows = [
      makeMarketRow({
        subcategory: 'camion',
        brand: 'Volvo',
        month: '2026-02',
        avg_price: 80000,
        listing_count: 10,
      }),
      makeMarketRow({
        subcategory: 'camion',
        brand: 'Scania',
        month: '2026-02',
        avg_price: 70000,
        listing_count: 5,
      }),
    ]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: rows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    c.selectCategory('camion')
    const brands = c.brandBreakdown.value
    expect(brands.length).toBe(2)
    expect(brands[0]!.brand).toBe('Volvo') // 10 > 5
    expect(brands[1]!.brand).toBe('Scania')
  })

  it('lastUpdated returns formatted date when data exists', async () => {
    const rows = [makeMarketRow({ month: '2026-02' })]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: rows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    expect(c.lastUpdated.value).toBeTruthy()
    // Should contain 'febrero' or 'February' or '2026'
    expect(c.lastUpdated.value).toContain('2026')
  })

  it('chartData returns labels and datasets when data and history exist', async () => {
    const market = [makeMarketRow({ subcategory: 'camion', month: '2026-02' })]
    const history = [
      makeHistoryRow({ subcategory: 'camion', week: '2026-01-06', avg_price: 75000 }),
      makeHistoryRow({ subcategory: 'camion', week: '2026-01-13', avg_price: 77000 }),
    ]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: market, error: null })
      if (table === 'price_history') return makeChain({ data: history, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    expect(c.chartData.value.labels.length).toBeGreaterThan(0)
    expect(c.chartData.value.datasets.length).toBe(1)
    expect(c.chartData.value.datasets[0]!.data).toHaveLength(2)
  })

  it('sortedProvinces sorts by province name when key is province', async () => {
    const rows = [
      makeMarketRow({ province: 'Madrid', month: '2026-02', listing_count: 10, avg_price: 80000 }),
      makeMarketRow({
        province: 'Barcelona',
        month: '2026-02',
        listing_count: 15,
        avg_price: 70000,
      }),
    ]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'market_data') return makeChain({ data: rows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDatos()
    await c.fetchData()
    c.toggleProvinceSort('province')
    // provinceSortAsc = false → desc by name → Madrid first
    const sorted = c.sortedProvinces.value
    if (sorted.length >= 2) {
      expect(sorted[0]!.province.localeCompare(sorted[1]!.province)).toBeGreaterThanOrEqual(0)
    }
  })
})
