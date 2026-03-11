import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGeoFallback } from '../../app/composables/catalog/useGeoFallback'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockLocationLevel = { value: 'nacional' as string | null }
const mockUserLocation = { value: { country: 'ES', province: 'Madrid', region: 'Comunidad de Madrid' } }

beforeEach(() => {
  vi.clearAllMocks()
  mockLocationLevel.value = 'nacional'
  mockUserLocation.value = { country: 'ES', province: 'Madrid', region: 'Comunidad de Madrid' }
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useVehicles', () => ({
    fetchCount: vi.fn().mockResolvedValue(10),
  }))
  vi.stubGlobal('useCatalogState', () => ({
    locationLevel: mockLocationLevel,
    setLocationLevel: vi.fn(),
  }))
  vi.stubGlobal('useUserLocation', () => ({
    location: mockUserLocation,
  }))
  vi.stubGlobal('getCountriesForLevel', (_level: string, country: string) => [country])
  vi.stubGlobal('getRegionsForLevel', (_level: string, region: string | null) => region ? [region] : null)
})

// ─── LEVEL_ORDER constant ──────────────────────────────────────────────────────

describe('LEVEL_ORDER', () => {
  it('has 8 levels', () => {
    const c = useGeoFallback()
    expect(c.LEVEL_ORDER).toHaveLength(8)
  })

  it('starts with provincia', () => {
    const c = useGeoFallback()
    expect(c.LEVEL_ORDER[0]).toBe('provincia')
  })

  it('ends with mundo', () => {
    const c = useGeoFallback()
    expect(c.LEVEL_ORDER[c.LEVEL_ORDER.length - 1]).toBe('mundo')
  })
})

// ─── FEW_RESULTS_THRESHOLDS ────────────────────────────────────────────────────

describe('FEW_RESULTS_THRESHOLDS', () => {
  it('has threshold for each level', () => {
    const c = useGeoFallback()
    expect(c.FEW_RESULTS_THRESHOLDS).toHaveProperty('nacional')
    expect(c.FEW_RESULTS_THRESHOLDS).toHaveProperty('provincia')
    expect(c.FEW_RESULTS_THRESHOLDS).toHaveProperty('mundo')
  })

  it('mundo threshold is 0 (never show few results)', () => {
    const c = useGeoFallback()
    expect(c.FEW_RESULTS_THRESHOLDS['mundo']).toBe(0)
  })
})

// ─── getNextLevel ──────────────────────────────────────────────────────────────

describe('getNextLevel', () => {
  it('returns null when current is null', () => {
    const c = useGeoFallback()
    expect(c.getNextLevel(null)).toBeNull()
  })

  it('returns next level from provincia', () => {
    const c = useGeoFallback()
    expect(c.getNextLevel('provincia')).toBe('comunidad')
  })

  it('returns next level from nacional', () => {
    const c = useGeoFallback()
    expect(c.getNextLevel('nacional')).toBe('suroeste_europeo')
  })

  it('returns null from mundo (last level)', () => {
    const c = useGeoFallback()
    expect(c.getNextLevel('mundo')).toBeNull()
  })

  it('returns null for unknown level', () => {
    const c = useGeoFallback()
    expect(c.getNextLevel('unknown' as never)).toBeNull()
  })
})

// ─── isFewResults ─────────────────────────────────────────────────────────────

describe('isFewResults', () => {
  it('returns false when level is null', () => {
    const c = useGeoFallback()
    expect(c.isFewResults(null, 2)).toBe(false)
  })

  it('returns false when count is 0', () => {
    const c = useGeoFallback()
    expect(c.isFewResults('nacional', 0)).toBe(false)
  })

  it('returns true when count < threshold', () => {
    const c = useGeoFallback()
    // nacional threshold = 10, count = 5 → few results
    expect(c.isFewResults('nacional', 5)).toBe(true)
  })

  it('returns false when count >= threshold', () => {
    const c = useGeoFallback()
    // nacional threshold = 10, count = 15 → not few
    expect(c.isFewResults('nacional', 15)).toBe(false)
  })

  it('never shows few results for mundo', () => {
    const c = useGeoFallback()
    expect(c.isFewResults('mundo', 1)).toBe(false)
  })
})

// ─── getLevelLabel ────────────────────────────────────────────────────────────

describe('getLevelLabel', () => {
  it('returns province for provincia level', () => {
    const c = useGeoFallback()
    expect(c.getLevelLabel('provincia', 'Madrid')).toBe('Madrid')
  })

  it('returns fallback for provincia with no province', () => {
    const c = useGeoFallback()
    expect(c.getLevelLabel('provincia', null)).toBe('Mi provincia')
  })

  it('returns España for nacional ES', () => {
    const c = useGeoFallback()
    expect(c.getLevelLabel('nacional', null, null, 'ES')).toBe('España')
  })

  it('returns country name for nacional non-ES', () => {
    const c = useGeoFallback()
    expect(c.getLevelLabel('nacional', null, null, 'DE')).toBe('DE')
  })

  it('returns Todo el mundo for mundo', () => {
    const c = useGeoFallback()
    expect(c.getLevelLabel('mundo')).toBe('Todo el mundo')
  })

  it('returns Europa for europa', () => {
    const c = useGeoFallback()
    expect(c.getLevelLabel('europa')).toBe('Europa')
  })
})

// ─── getNextLevelFilters ──────────────────────────────────────────────────────

describe('getNextLevelFilters', () => {
  it('returns null when at mundo (no next level)', () => {
    mockLocationLevel.value = 'mundo'
    const c = useGeoFallback()
    const result = c.getNextLevelFilters({}, 'mundo')
    expect(result).toBeNull()
  })

  it('returns filters with countries for nacional level transition', () => {
    mockLocationLevel.value = 'nacional'
    const c = useGeoFallback()
    const result = c.getNextLevelFilters({ category_id: 'cat-1' }, 'nacional')
    expect(result).not.toBeNull()
    expect(result?.category_id).toBe('cat-1')
  })

  it('strips old location filters', () => {
    mockLocationLevel.value = 'nacional'
    const c = useGeoFallback()
    const result = c.getNextLevelFilters({
      location_province_eq: 'Madrid',
      location_regions: ['Cataluña'],
      location_countries: ['ES'],
    }, 'nacional')
    expect(result?.location_province_eq).toBeUndefined()
  })
})

// ─── fetchNextLevelCount ──────────────────────────────────────────────────────

describe('fetchNextLevelCount', () => {
  it('loading returns to false after fetch', async () => {
    mockLocationLevel.value = 'nacional'
    const c = useGeoFallback()
    await c.fetchNextLevelCount({})
    expect(c.nextLevelCountLoading.value).toBe(false)
  })

  it('sets nextLevelCount to 0 when at mundo (no next level)', async () => {
    mockLocationLevel.value = 'mundo'
    const c = useGeoFallback()
    await c.fetchNextLevelCount({})
    expect(c.nextLevelCount.value).toBe(0)
  })

  it('starts with nextLevelCount = 0', () => {
    const c = useGeoFallback()
    expect(c.nextLevelCount.value).toBe(0)
  })
})
