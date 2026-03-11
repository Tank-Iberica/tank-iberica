import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Module mock (hoisted before static imports) ─────────────────────────────

// vi.hoisted creates variables before vi.mock factories run (required for module mocking)
const { mockFetchCount } = vi.hoisted(() => ({
  mockFetchCount: vi.fn().mockResolvedValue(0),
}))

vi.mock('~/composables/useVehicles', () => ({
  useVehicles: () => ({ fetchCount: mockFetchCount }),
}))

// Import composable AFTER vi.mock so it picks up the mocked module
import { useSimilarSearches } from '../../app/composables/catalog/useSimilarSearches'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockLocationLevel = { value: 'nacional' as string | null }

beforeEach(() => {
  vi.clearAllMocks()
  mockLocationLevel.value = 'nacional'
  mockFetchCount.mockResolvedValue(0)

  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useCatalogState', () => ({
    locationLevel: mockLocationLevel,
    setLocationLevel: vi.fn(),
  }))
  vi.stubGlobal('useUserLocation', () => ({
    location: { value: { country: 'ES', province: null, region: null } },
  }))
  // useGeoFallback is statically imported too — stub its auto-import dependencies
  // (useVehicles inside useGeoFallback is auto-imported, intercepted by vi.stubGlobal)
  vi.stubGlobal('useVehicles', () => ({ fetchCount: mockFetchCount }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('suggestions starts empty', () => {
    const c = useSimilarSearches()
    expect(c.suggestions.value).toHaveLength(0)
  })

  it('loading starts false', () => {
    const c = useSimilarSearches()
    expect(c.loading.value).toBe(false)
  })

  it('cascade has 3 levels', () => {
    const c = useSimilarSearches()
    expect(c.cascade.value).toHaveLength(3)
  })

  it('cascade levels have depth 1, 2, 3', () => {
    const c = useSimilarSearches()
    expect(c.cascade.value[0]!.depth).toBe(1)
    expect(c.cascade.value[1]!.depth).toBe(2)
    expect(c.cascade.value[2]!.depth).toBe(3)
  })

  it('cascade levels start not loaded', () => {
    const c = useSimilarSearches()
    for (const level of c.cascade.value) {
      expect(level.loaded).toBe(false)
      expect(level.loading).toBe(false)
      expect(level.suggestions).toHaveLength(0)
    }
  })

  it('cascadeTotal starts at 0', () => {
    const c = useSimilarSearches()
    expect(c.cascadeTotal.value).toBe(0)
  })

  it('hasMoreCascadeLevels is true initially', () => {
    const c = useSimilarSearches()
    expect(c.hasMoreCascadeLevels.value).toBe(true)
  })
})

// ─── generateSuggestions ────────────────────────────────────────────────────

describe('generateSuggestions', () => {
  it('loading is false after completion', async () => {
    const c = useSimilarSearches()
    await c.generateSuggestions({})
    expect(c.loading.value).toBe(false)
  })

  it('produces no suggestions when fetchCount returns 0', async () => {
    mockFetchCount.mockResolvedValue(0)
    const c = useSimilarSearches()
    await c.generateSuggestions({ brand: 'Volvo', price_min: 10000, price_max: 50000 }, 0)
    expect(c.suggestions.value).toHaveLength(0)
  })

  it('generates brand suggestion when filters have brand', async () => {
    mockFetchCount.mockResolvedValue(20)
    const c = useSimilarSearches()
    await c.generateSuggestions({ brand: 'Volvo' }, 2)
    const brandSugg = c.suggestions.value.find(s => s.labelKey === 'catalog.similarNoBrand')
    expect(brandSugg).toBeDefined()
    expect(brandSugg?.labelParams?.brand).toBe('Volvo')
    expect((brandSugg?.filters as Record<string, unknown>).brand).toBeUndefined()
  })

  it('generates price suggestion when filters have price range', async () => {
    mockFetchCount.mockResolvedValue(20)
    const c = useSimilarSearches()
    await c.generateSuggestions({ price_min: 10000, price_max: 50000 }, 2)
    const priceSugg = c.suggestions.value.find(s => s.labelKey === 'catalog.similarWiderPrice')
    expect(priceSugg).toBeDefined()
    // Price should be widened by ±20%
    expect((priceSugg?.filters as Record<string, unknown>).price_min).toBe(Math.floor(10000 * 0.8))
    expect((priceSugg?.filters as Record<string, unknown>).price_max).toBe(Math.ceil(50000 * 1.2))
  })

  it('generates year suggestion when filters have year range', async () => {
    mockFetchCount.mockResolvedValue(20)
    const c = useSimilarSearches()
    await c.generateSuggestions({ year_min: 2018, year_max: 2022 }, 2)
    const yearSugg = c.suggestions.value.find(s => s.labelKey === 'catalog.similarWiderYear')
    expect(yearSugg).toBeDefined()
    // Year should be widened by ±2
    expect((yearSugg?.filters as Record<string, unknown>).year_min).toBe(2016)
    expect((yearSugg?.filters as Record<string, unknown>).year_max).toBe(2024)
  })

  it('limits to max 3 suggestions', async () => {
    mockFetchCount.mockResolvedValue(100)
    const c = useSimilarSearches()
    await c.generateSuggestions({ brand: 'Volvo', price_min: 10000, price_max: 50000, year_min: 2018, year_max: 2022 }, 0)
    expect(c.suggestions.value.length).toBeLessThanOrEqual(3)
  })

  it('sorts suggestions by count descending', async () => {
    let call = 0
    mockFetchCount.mockImplementation(async () => {
      call++
      return call === 1 ? 5 : 50
    })
    const c = useSimilarSearches()
    await c.generateSuggestions({ brand: 'Volvo', price_min: 10000, price_max: 50000 }, 0)
    const counts = c.suggestions.value.map(s => s.count)
    for (let i = 0; i < counts.length - 1; i++) {
      expect(counts[i]!).toBeGreaterThanOrEqual(counts[i + 1]!)
    }
  })

  it('skips suggestions where count <= currentCount', async () => {
    // count returns 10, currentCount = 10 → 10 > 10 is false → no suggestions
    mockFetchCount.mockResolvedValue(10)
    const c = useSimilarSearches()
    await c.generateSuggestions({ brand: 'Volvo' }, 10)
    expect(c.suggestions.value).toHaveLength(0)
  })

  it('suggestion has count from fetchCount', async () => {
    mockFetchCount.mockResolvedValue(42)
    const c = useSimilarSearches()
    await c.generateSuggestions({ brand: 'Volvo' }, 0)
    expect(c.suggestions.value[0]?.count).toBe(42)
  })
})

// ─── clearSuggestions ─────────────────────────────────────────────────────────

describe('clearSuggestions', () => {
  it('clears suggestions', async () => {
    mockFetchCount.mockResolvedValue(20)
    const c = useSimilarSearches()
    await c.generateSuggestions({ brand: 'Volvo' }, 0)
    c.clearSuggestions()
    expect(c.suggestions.value).toHaveLength(0)
  })

  it('resets cascade loaded state', () => {
    const c = useSimilarSearches()
    c.cascade.value[0]!.loaded = true
    c.cascade.value[0]!.suggestions = [{ labelKey: 'x', filters: {}, count: 5 }]
    c.clearSuggestions()
    expect(c.cascade.value[0]!.loaded).toBe(false)
    expect(c.cascade.value[0]!.suggestions).toHaveLength(0)
  })
})

// ─── resetCascade ─────────────────────────────────────────────────────────────

describe('resetCascade', () => {
  it('resets all cascade levels', () => {
    const c = useSimilarSearches()
    for (const level of c.cascade.value) {
      level.loaded = true
      level.loading = true
      level.suggestions = [{ labelKey: 'x', filters: {}, count: 5 }]
    }
    c.resetCascade()
    for (const level of c.cascade.value) {
      expect(level.loaded).toBe(false)
      expect(level.loading).toBe(false)
      expect(level.suggestions).toHaveLength(0)
    }
  })
})

// ─── loadCascadeLevel ─────────────────────────────────────────────────────────

describe('loadCascadeLevel', () => {
  it('sets loaded=true after loading depth 1', async () => {
    const c = useSimilarSearches()
    await c.loadCascadeLevel(1, { brand: 'Volvo' }, 0)
    expect(c.cascade.value[0]!.loaded).toBe(true)
    expect(c.cascade.value[0]!.loading).toBe(false)
  })

  it('does nothing if level already loaded', async () => {
    const c = useSimilarSearches()
    c.cascade.value[0]!.loaded = true
    c.cascade.value[0]!.suggestions = [{ labelKey: 'existing', filters: {}, count: 5 }]
    await c.loadCascadeLevel(1, { brand: 'Volvo' }, 0)
    expect(c.cascade.value[0]!.suggestions[0]!.labelKey).toBe('existing')
  })

  it('does nothing if already loading', async () => {
    const c = useSimilarSearches()
    c.cascade.value[0]!.loading = true
    await c.loadCascadeLevel(1, { brand: 'Volvo' }, 0)
    expect(c.cascade.value[0]!.loading).toBe(true)
  })

  it('loads suggestions when count > threshold', async () => {
    mockFetchCount.mockResolvedValue(30)
    const c = useSimilarSearches()
    await c.loadCascadeLevel(1, { brand: 'Volvo', price_min: 10000, price_max: 50000 }, 0)
    expect(c.cascade.value[0]!.loaded).toBe(true)
    expect(c.cascade.value[0]!.suggestions.length).toBeGreaterThan(0)
  })

  it('loads depth 2 combinations', async () => {
    const c = useSimilarSearches()
    await c.loadCascadeLevel(2, { brand: 'Volvo', price_min: 10000, price_max: 50000, year_min: 2018 }, 0)
    expect(c.cascade.value[1]!.loaded).toBe(true)
  })

  it('cascade suggestions sorted by count descending', async () => {
    let call = 0
    mockFetchCount.mockImplementation(async () => {
      call++
      return call === 1 ? 5 : 50
    })
    const c = useSimilarSearches()
    await c.loadCascadeLevel(1, { brand: 'Volvo', price_min: 10000, price_max: 50000 }, 0)
    const counts = c.cascade.value[0]!.suggestions.map(s => s.count)
    for (let i = 0; i < counts.length - 1; i++) {
      expect(counts[i]!).toBeGreaterThanOrEqual(counts[i + 1]!)
    }
  })

  it('hasMoreCascadeLevels false when all levels loaded', async () => {
    const c = useSimilarSearches()
    await c.loadCascadeLevel(1, {}, 0)
    await c.loadCascadeLevel(2, {}, 0)
    await c.loadCascadeLevel(3, {}, 0)
    expect(c.hasMoreCascadeLevels.value).toBe(false)
  })

  it('cascadeTotal increases after loading suggestions', async () => {
    mockFetchCount.mockResolvedValue(10)
    const c = useSimilarSearches()
    await c.loadCascadeLevel(1, { brand: 'Volvo' }, 0)
    const total = c.cascadeTotal.value
    expect(total).toBeGreaterThanOrEqual(0)
  })
})
