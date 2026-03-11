import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVehicleTypeSelector } from '../../app/composables/useVehicleTypeSelector'
import type { SelectorAttribute } from '../../app/composables/useVehicleTypeSelector'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('categories starts as empty array', () => {
    const c = useVehicleTypeSelector()
    expect(c.categories.value).toHaveLength(0)
  })

  it('subcategories starts as empty array', () => {
    const c = useVehicleTypeSelector()
    expect(c.subcategories.value).toHaveLength(0)
  })

  it('attributes starts as empty array', () => {
    const c = useVehicleTypeSelector()
    expect(c.attributes.value).toHaveLength(0)
  })

  it('selectedCategoryId starts as null', () => {
    const c = useVehicleTypeSelector()
    expect(c.selectedCategoryId.value).toBeNull()
  })

  it('selectedSubcategoryId starts as null', () => {
    const c = useVehicleTypeSelector()
    expect(c.selectedSubcategoryId.value).toBeNull()
  })

  it('filterValues starts as empty object', () => {
    const c = useVehicleTypeSelector()
    expect(c.filterValues.value).toEqual({})
  })

  it('loading starts as false', () => {
    const c = useVehicleTypeSelector()
    expect(c.loading.value).toBe(false)
  })

  it('filtersLoading starts as false', () => {
    const c = useVehicleTypeSelector()
    expect(c.filtersLoading.value).toBe(false)
  })

  it('linkedSubcategories starts as empty array (no category selected)', () => {
    const c = useVehicleTypeSelector()
    expect(c.linkedSubcategories.value).toHaveLength(0)
  })
})

// ─── selectCategory ───────────────────────────────────────────────────────────

describe('selectCategory', () => {
  it('sets selectedCategoryId', () => {
    const c = useVehicleTypeSelector()
    c.selectCategory('cat-1')
    expect(c.selectedCategoryId.value).toBe('cat-1')
  })

  it('clears selectedSubcategoryId', () => {
    const c = useVehicleTypeSelector()
    c.selectedSubcategoryId.value = 'sub-1' // set via internal access
    c.selectCategory('cat-1')
    expect(c.selectedSubcategoryId.value).toBeNull()
  })

  it('clears attributes', () => {
    const c = useVehicleTypeSelector()
    c.selectCategory('cat-1')
    expect(c.attributes.value).toHaveLength(0)
  })

  it('clears filterValues', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('km', 50000)
    c.selectCategory('cat-1')
    expect(c.filterValues.value).toEqual({})
  })

  it('accepts null to deselect', () => {
    const c = useVehicleTypeSelector()
    c.selectCategory('cat-1')
    c.selectCategory(null)
    expect(c.selectedCategoryId.value).toBeNull()
  })
})

// ─── selectSubcategory ────────────────────────────────────────────────────────

describe('selectSubcategory', () => {
  it('sets selectedSubcategoryId', async () => {
    const c = useVehicleTypeSelector()
    await c.selectSubcategory('sub-1')
    expect(c.selectedSubcategoryId.value).toBe('sub-1')
  })

  it('accepts null to deselect', async () => {
    const c = useVehicleTypeSelector()
    await c.selectSubcategory('sub-1')
    await c.selectSubcategory(null)
    expect(c.selectedSubcategoryId.value).toBeNull()
  })

  it('clears attributes when null is passed', async () => {
    const c = useVehicleTypeSelector()
    await c.selectSubcategory(null)
    expect(c.attributes.value).toHaveLength(0)
  })

  it('sets filtersLoading to false after completion', async () => {
    const c = useVehicleTypeSelector()
    // Subcategory with applicable_filters in subcategories list
    c.subcategories.value = [
      { id: 'sub-1', applicable_filters: ['attr-1'], name: null, name_es: 'Sub', name_en: null, name_singular: null, slug: 'sub', applicable_actions: [], sort_order: 0 },
    ]
    await c.selectSubcategory('sub-1')
    expect(c.filtersLoading.value).toBe(false)
  })

  it('returns early without fetching when subcategory has no applicable_filters', async () => {
    const mockSelect = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: mockSelect,
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useVehicleTypeSelector()
    c.subcategories.value = [
      { id: 'sub-empty', applicable_filters: [], name: null, name_es: 'Empty', name_en: null, name_singular: null, slug: 'empty', applicable_actions: [], sort_order: 0 },
    ]
    await c.selectSubcategory('sub-empty')
    expect(mockSelect).not.toHaveBeenCalled()
  })
})

// ─── setFilterValue / getFiltersJson ──────────────────────────────────────────

describe('setFilterValue', () => {
  it('adds a filter value', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('km', 50000)
    expect(c.filterValues.value).toHaveProperty('km', 50000)
  })

  it('adds multiple filter values', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('km', 50000)
    c.setFilterValue('year', 2020)
    expect(c.filterValues.value).toHaveProperty('km', 50000)
    expect(c.filterValues.value).toHaveProperty('year', 2020)
  })

  it('overwrites existing value', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('km', 50000)
    c.setFilterValue('km', 100000)
    expect(c.filterValues.value.km).toBe(100000)
  })
})

describe('getFiltersJson', () => {
  it('returns empty object when no filters set', () => {
    const c = useVehicleTypeSelector()
    expect(c.getFiltersJson()).toEqual({})
  })

  it('includes non-empty values', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('brand', 'Volvo')
    expect(c.getFiltersJson()).toHaveProperty('brand', 'Volvo')
  })

  it('excludes null values', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('brand', null)
    expect(c.getFiltersJson()).not.toHaveProperty('brand')
  })

  it('excludes undefined values', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('model', undefined)
    expect(c.getFiltersJson()).not.toHaveProperty('model')
  })

  it('excludes empty string values', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('plate', '')
    expect(c.getFiltersJson()).not.toHaveProperty('plate')
  })

  it('includes 0 as a valid value', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('km_min', 0)
    // 0 is falsy but not null/undefined/'' — check composable logic
    // filterValues: value !== null && value !== undefined && value !== '' → 0 passes
    expect(c.getFiltersJson()).toHaveProperty('km_min', 0)
  })
})

// ─── getFilterLabel ───────────────────────────────────────────────────────────

describe('getFilterLabel', () => {
  function makeFilter(overrides: Partial<SelectorAttribute> = {}): SelectorAttribute {
    return {
      id: 'attr-1',
      name: 'brand',
      type: 'caja',
      label: null,
      label_es: 'Marca',
      label_en: 'Brand',
      unit: null,
      options: {},
      is_extra: false,
      sort_order: 0,
      ...overrides,
    }
  }

  it('returns localized label from label object for "es"', () => {
    const c = useVehicleTypeSelector()
    const filter = makeFilter({ label: { es: 'Marca', en: 'Brand' } })
    expect(c.getFilterLabel(filter, 'es')).toBe('Marca')
  })

  it('returns localized label from label object for "en"', () => {
    const c = useVehicleTypeSelector()
    const filter = makeFilter({ label: { es: 'Marca', en: 'Brand' } })
    expect(c.getFilterLabel(filter, 'en')).toBe('Brand')
  })

  it('falls back to label_es when label is null', () => {
    const c = useVehicleTypeSelector()
    const filter = makeFilter({ label: null, label_es: 'Marca' })
    expect(c.getFilterLabel(filter, 'es')).toBe('Marca')
  })

  it('falls back to name when label and label_es are both empty', () => {
    const c = useVehicleTypeSelector()
    const filter = makeFilter({ label: null, label_es: null, name: 'brand_name' })
    expect(c.getFilterLabel(filter, 'es')).toBe('brand_name')
  })
})

// ─── getFilterOptions ─────────────────────────────────────────────────────────

describe('getFilterOptions', () => {
  function makeFilter(choices?: string[]): SelectorAttribute {
    return {
      id: 'attr-1',
      name: 'color',
      type: 'desplegable',
      label: null,
      label_es: 'Color',
      label_en: null,
      unit: null,
      options: choices ? { choices } : {},
      is_extra: false,
      sort_order: 0,
    }
  }

  it('returns choices array from options', () => {
    const c = useVehicleTypeSelector()
    const filter = makeFilter(['Rojo', 'Azul', 'Verde'])
    expect(c.getFilterOptions(filter)).toEqual(['Rojo', 'Azul', 'Verde'])
  })

  it('returns empty array when no choices', () => {
    const c = useVehicleTypeSelector()
    const filter = makeFilter()
    expect(c.getFilterOptions(filter)).toEqual([])
  })
})

// ─── getVehicleSubcategoryLabel ────────────────────────────────────────────────

describe('getVehicleSubcategoryLabel', () => {
  it('returns empty string when no category selected', () => {
    const c = useVehicleTypeSelector()
    expect(c.getVehicleSubcategoryLabel('es')).toBe('')
  })

  it('returns category name when only category is selected', () => {
    const c = useVehicleTypeSelector()
    c.categories.value = [{ id: 'cat-1', name_es: 'Camiones', name_en: 'Trucks', name: null, name_singular: null, slug: 'camiones', applicable_actions: [], applicable_filters: [], sort_order: 0 }]
    c.selectCategory('cat-1')
    expect(c.getVehicleSubcategoryLabel('es')).toBe('Camiones')
  })

  it('returns "Category > Subcategory" when both selected', async () => {
    const c = useVehicleTypeSelector()
    c.categories.value = [{ id: 'cat-1', name_es: 'Camiones', name_en: 'Trucks', name: null, name_singular: null, slug: 'camiones', applicable_actions: [], applicable_filters: [], sort_order: 0 }]
    c.subcategories.value = [{ id: 'sub-1', name_es: 'Cisterna', name_en: 'Tanker', name: null, name_singular: null, slug: 'cisterna', applicable_actions: [], applicable_filters: [], sort_order: 0 }]
    c.selectCategory('cat-1')
    await c.selectSubcategory('sub-1')
    expect(c.getVehicleSubcategoryLabel('es')).toBe('Camiones > Cisterna')
  })
})

// ─── getCategoryName / getSubcategoryName ─────────────────────────────────────

describe('getCategoryName', () => {
  it('returns empty string when no category selected', () => {
    const c = useVehicleTypeSelector()
    expect(c.getCategoryName('es')).toBe('')
  })

  it('returns localized category name', () => {
    const c = useVehicleTypeSelector()
    c.categories.value = [{ id: 'cat-1', name_es: 'Camiones', name_en: 'Trucks', name: null, name_singular: null, slug: 'camiones', applicable_actions: [], applicable_filters: [], sort_order: 0 }]
    c.selectCategory('cat-1')
    expect(c.getCategoryName('es')).toBe('Camiones')
  })

  it('returns English name when locale is "en"', () => {
    const c = useVehicleTypeSelector()
    c.categories.value = [{ id: 'cat-1', name_es: 'Camiones', name_en: 'Trucks', name: null, name_singular: null, slug: 'camiones', applicable_actions: [], applicable_filters: [], sort_order: 0 }]
    c.selectCategory('cat-1')
    expect(c.getCategoryName('en')).toBe('Trucks')
  })
})

describe('getSubcategoryName', () => {
  it('returns empty string when no subcategory selected', () => {
    const c = useVehicleTypeSelector()
    expect(c.getSubcategoryName('es')).toBe('')
  })

  it('returns localized subcategory name', async () => {
    const c = useVehicleTypeSelector()
    c.subcategories.value = [{ id: 'sub-1', name_es: 'Cisterna', name_en: 'Tanker', name: null, name_singular: null, slug: 'cisterna', applicable_actions: [], applicable_filters: [], sort_order: 0 }]
    await c.selectSubcategory('sub-1')
    expect(c.getSubcategoryName('es')).toBe('Cisterna')
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('reset', () => {
  it('clears selectedCategoryId', () => {
    const c = useVehicleTypeSelector()
    c.selectCategory('cat-1')
    c.reset()
    expect(c.selectedCategoryId.value).toBeNull()
  })

  it('clears selectedSubcategoryId', async () => {
    const c = useVehicleTypeSelector()
    await c.selectSubcategory('sub-1')
    c.reset()
    expect(c.selectedSubcategoryId.value).toBeNull()
  })

  it('clears filterValues', () => {
    const c = useVehicleTypeSelector()
    c.setFilterValue('brand', 'Volvo')
    c.reset()
    expect(c.filterValues.value).toEqual({})
  })

  it('clears attributes', () => {
    const c = useVehicleTypeSelector()
    c.attributes.value = [{ id: 'attr-1', name: 'brand', type: 'caja', label: null, label_es: 'Marca', label_en: null, unit: null, options: {}, is_extra: false, sort_order: 0 }]
    c.reset()
    expect(c.attributes.value).toHaveLength(0)
  })
})
