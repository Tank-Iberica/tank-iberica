import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFilterBar } from '../../app/composables/catalog/useFilterBar'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockFilters = { value: {} as Record<string, unknown> }
const mockActiveFilters = { value: {} as Record<string, unknown> }
const mockLocationLevel = { value: null as string | null }
const mockUserLocation = { value: { country: '', province: '', region: '' } }
const mockSetFilter = vi.fn()
const mockClearFilter = vi.fn()
const mockClearAll = vi.fn()
const mockUpdateFilters = vi.fn()
const mockSetLocationLevel = vi.fn()
const mockSetCategory = vi.fn()
const mockSetSubcategory = vi.fn()
const mockDetect = vi.fn().mockResolvedValue(undefined)
const mockSetManualLocation = vi.fn()
const mockEmit = vi.fn()

function makeVehicles() {
  return [
    { brand: 'Volvo', category: 'camion', price: 50000, year: 2020, location: 'Madrid', vehicle_images: [] },
    { brand: 'Mercedes', category: 'furgon', price: 30000, year: 2018, location: 'Barcelona', vehicle_images: [] },
    { brand: 'Volvo', category: 'camion', price: 60000, year: 2021, location: 'Madrid', vehicle_images: [] },
  ]
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFilters.value = {}
  mockActiveFilters.value = {}
  mockLocationLevel.value = null
  mockUserLocation.value = { country: '', province: '', region: '' }
  mockDetect.mockResolvedValue(undefined)

  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('watch', (_source: unknown, _cb: unknown, _opts?: unknown) => {})
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())

  vi.stubGlobal('useI18n', () => ({
    t: (k: string) => k,
    locale: { value: 'es' },
  }))
  vi.stubGlobal('useFilters', () => ({
    visibleFilters: { value: [] },
    activeFilters: mockActiveFilters,
    setFilter: mockSetFilter,
    clearFilter: mockClearFilter,
    clearAll: mockClearAll,
  }))
  vi.stubGlobal('useCatalogState', () => ({
    updateFilters: mockUpdateFilters,
    filters: mockFilters,
    locationLevel: mockLocationLevel,
    setLocationLevel: mockSetLocationLevel,
    setCategory: mockSetCategory,
    setSubcategory: mockSetSubcategory,
  }))
  vi.stubGlobal('useUserLocation', () => ({
    location: mockUserLocation,
    detect: mockDetect,
    setManualLocation: mockSetManualLocation,
  }))
  vi.stubGlobal('useAuth', () => ({
    profile: { value: null },
  }))
  vi.stubGlobal('getSortedEuropeanCountries', (_locale: string) => ({
    priority: [{ code: 'ES', name: 'España', flag: '🇪🇸' }],
    rest: [{ code: 'DE', name: 'Alemania', flag: '🇩🇪' }],
  }))
  vi.stubGlobal('getSortedProvinces', () => [
    { code: 'M', name: 'Madrid' },
    { code: 'B', name: 'Barcelona' },
  ])
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('open starts false', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.open.value).toBe(false)
  })

  it('advancedOpen starts false', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.advancedOpen.value).toBe(false)
  })

  it('editCountry starts empty when no user location', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.editCountry.value).toBe('')
  })

  it('editProvince starts empty', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.editProvince.value).toBe('')
  })

  it('currentYear is the current year', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.currentYear).toBe(new Date().getFullYear())
  })

  it('hasFilters is true', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.hasFilters.value).toBe(true)
  })
})

// ─── brands computed ──────────────────────────────────────────────────────────

describe('brands computed', () => {
  it('extracts unique brands from vehicles sorted alphabetically', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.brands.value).toEqual(['Mercedes', 'Volvo'])
  })

  it('returns empty when no vehicles', () => {
    const c = useFilterBar(() => [] as never, mockEmit)
    expect(c.brands.value).toHaveLength(0)
  })

  it('deduplicates brands', () => {
    const vehicles = [
      { brand: 'Volvo' }, { brand: 'Volvo' }, { brand: 'Mercedes' }
    ]
    const c = useFilterBar(() => vehicles as never, mockEmit)
    expect(c.brands.value).toHaveLength(2)
  })
})

// ─── priceMin / priceMax / yearMin / yearMax / selectedBrand ─────────────────

describe('filter state computeds', () => {
  it('priceMin reflects filters.price_min', () => {
    mockFilters.value = { price_min: 10000 }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.priceMin.value).toBe(10000)
  })

  it('priceMax reflects filters.price_max', () => {
    mockFilters.value = { price_max: 50000 }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.priceMax.value).toBe(50000)
  })

  it('yearMin reflects filters.year_min', () => {
    mockFilters.value = { year_min: 2018 }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.yearMin.value).toBe(2018)
  })

  it('yearMax reflects filters.year_max', () => {
    mockFilters.value = { year_max: 2022 }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.yearMax.value).toBe(2022)
  })

  it('selectedBrand reflects filters.brand', () => {
    mockFilters.value = { brand: 'Volvo' }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.selectedBrand.value).toBe('Volvo')
  })

  it('priceMin is null when not set', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.priceMin.value).toBeNull()
  })

  it('selectedBrand is empty string when not set', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.selectedBrand.value).toBe('')
  })
})

// ─── locationTriggerText ──────────────────────────────────────────────────────

describe('locationTriggerText', () => {
  it('returns province when editProvince is set', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.editProvince.value = 'Madrid'
    expect(c.locationTriggerText.value).toBe('Madrid')
  })

  it('returns country name + flag when editCountry is set (no province)', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.editCountry.value = 'ES'
    expect(c.locationTriggerText.value).toContain('España')
  })

  it('returns t(catalog.locationAll) when no country or province', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.locationTriggerText.value).toBe('catalog.locationAll')
  })

  it('returns country code when code not found in list', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.editCountry.value = 'JP'
    expect(c.locationTriggerText.value).toBe('JP')
  })
})

// ─── totalActiveCount ─────────────────────────────────────────────────────────

describe('totalActiveCount', () => {
  it('is 0 when no filters active', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.totalActiveCount.value).toBe(0)
  })

  it('counts active filters from activeFilters', () => {
    mockActiveFilters.value = { transmission: 'auto', fuel: 'diesel' }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.totalActiveCount.value).toBeGreaterThanOrEqual(2)
  })

  it('counts price_min as extra filter', () => {
    mockFilters.value = { price_min: 10000 }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.totalActiveCount.value).toBeGreaterThanOrEqual(1)
  })

  it('counts brand as extra filter', () => {
    mockFilters.value = { brand: 'Volvo' }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.totalActiveCount.value).toBeGreaterThanOrEqual(1)
  })
})

// ─── formatPriceLabel ─────────────────────────────────────────────────────────

describe('formatPriceLabel', () => {
  it('formats values >= 1000 as Nk', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.formatPriceLabel(50000)).toBe('50k')
  })

  it('formats values < 1000 as string', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.formatPriceLabel(500)).toBe('500')
  })

  it('rounds to nearest k', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    expect(c.formatPriceLabel(1500)).toBe('2k')
  })
})

// ─── Event handlers ───────────────────────────────────────────────────────────

describe('onCountrySelect', () => {
  it('updates editCountry and calls setManualLocation', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    const fakeEvent = { target: { value: 'DE' } } as unknown as Event
    c.onCountrySelect(fakeEvent)
    expect(c.editCountry.value).toBe('DE')
    expect(c.editProvince.value).toBe('')
    expect(mockSetManualLocation).toHaveBeenCalledWith('', 'DE')
    expect(mockEmit).toHaveBeenCalled()
  })

  it('clears location level when country is empty', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    const fakeEvent = { target: { value: '' } } as unknown as Event
    c.onCountrySelect(fakeEvent)
    expect(mockSetLocationLevel).toHaveBeenCalledWith(null, '', null, null)
  })
})

describe('onProvinceSelect', () => {
  it('updates editProvince and calls setManualLocation', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    const fakeEvent = { target: { value: 'Madrid' } } as unknown as Event
    c.onProvinceSelect(fakeEvent)
    expect(c.editProvince.value).toBe('Madrid')
    expect(mockSetManualLocation).toHaveBeenCalledWith('Madrid', 'ES', 'Madrid')
    expect(mockEmit).toHaveBeenCalled()
  })

  it('falls back to nacional level when province is empty', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    const fakeEvent = { target: { value: '' } } as unknown as Event
    c.onProvinceSelect(fakeEvent)
    expect(mockSetLocationLevel).toHaveBeenCalledWith('nacional', 'ES', null, null)
  })
})

describe('onPriceSliderMin', () => {
  it('calls updateFilters with price_min', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onPriceSliderMin(10000)
    expect(mockUpdateFilters).toHaveBeenCalledWith({ price_min: 10000 })
    expect(mockEmit).toHaveBeenCalled()
  })

  it('passes undefined when null', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onPriceSliderMin(null)
    expect(mockUpdateFilters).toHaveBeenCalledWith({ price_min: undefined })
  })
})

describe('onPriceSliderMax', () => {
  it('calls updateFilters with price_max', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onPriceSliderMax(50000)
    expect(mockUpdateFilters).toHaveBeenCalledWith({ price_max: 50000 })
  })
})

describe('onYearSliderMin', () => {
  it('calls updateFilters with year_min', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onYearSliderMin(2018)
    expect(mockUpdateFilters).toHaveBeenCalledWith({ year_min: 2018 })
  })
})

describe('onYearSliderMax', () => {
  it('calls updateFilters with year_max', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onYearSliderMax(2022)
    expect(mockUpdateFilters).toHaveBeenCalledWith({ year_max: 2022 })
  })
})

describe('onBrandChange', () => {
  it('calls updateFilters with brand', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    const fakeEvent = { target: { value: 'Volvo' } } as unknown as Event
    c.onBrandChange(fakeEvent)
    expect(mockUpdateFilters).toHaveBeenCalledWith({ brand: 'Volvo' })
  })

  it('passes undefined for empty brand', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    const fakeEvent = { target: { value: '' } } as unknown as Event
    c.onBrandChange(fakeEvent)
    expect(mockUpdateFilters).toHaveBeenCalledWith({ brand: undefined })
  })
})

// ─── Dynamic filter handlers ───────────────────────────────────────────────────

describe('onDynamicSelect', () => {
  it('calls setFilter with name and value', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicSelect('transmission', 'auto')
    expect(mockSetFilter).toHaveBeenCalledWith('transmission', 'auto')
    expect(mockEmit).toHaveBeenCalled()
  })

  it('calls clearFilter when value is empty', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicSelect('transmission', '')
    expect(mockClearFilter).toHaveBeenCalledWith('transmission')
  })
})

describe('onDynamicTick', () => {
  it('sets filter to true when not active', () => {
    mockActiveFilters.value = {}
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicTick('has_ac')
    expect(mockSetFilter).toHaveBeenCalledWith('has_ac', true)
  })

  it('clears filter when already active', () => {
    mockActiveFilters.value = { has_ac: true }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicTick('has_ac')
    expect(mockClearFilter).toHaveBeenCalledWith('has_ac')
  })
})

describe('onDynamicRange', () => {
  it('sets filter with numeric value', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicRange('km', 50000)
    expect(mockSetFilter).toHaveBeenCalledWith('km', 50000)
  })

  it('clears filter when value is null', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicRange('km', null)
    expect(mockClearFilter).toHaveBeenCalledWith('km')
  })
})

describe('onDynamicCheck', () => {
  it('adds option when not already in active filter', () => {
    mockActiveFilters.value = { colors: ['rojo'] }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicCheck('colors', 'azul')
    expect(mockSetFilter).toHaveBeenCalledWith('colors', ['rojo', 'azul'])
  })

  it('removes option when already present (and others remain)', () => {
    mockActiveFilters.value = { colors: ['rojo', 'azul'] }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicCheck('colors', 'rojo')
    expect(mockSetFilter).toHaveBeenCalledWith('colors', ['azul'])
  })

  it('clears filter when last option removed', () => {
    mockActiveFilters.value = { colors: ['rojo'] }
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.onDynamicCheck('colors', 'rojo')
    expect(mockClearFilter).toHaveBeenCalledWith('colors')
  })
})

// ─── handleClearAll ───────────────────────────────────────────────────────────

describe('handleClearAll', () => {
  it('calls clearAll and updateFilters with all fields undefined', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.handleClearAll()
    expect(mockClearAll).toHaveBeenCalled()
    expect(mockUpdateFilters).toHaveBeenCalledWith(
      expect.objectContaining({ price_min: undefined, price_max: undefined })
    )
  })

  it('closes the panel', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.open.value = true
    c.handleClearAll()
    expect(c.open.value).toBe(false)
  })

  it('resets editCountry to ES', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.editCountry.value = 'DE'
    c.handleClearAll()
    expect(c.editCountry.value).toBe('ES')
  })

  it('calls emit', () => {
    const c = useFilterBar(() => makeVehicles() as never, mockEmit)
    c.handleClearAll()
    expect(mockEmit).toHaveBeenCalled()
  })
})
