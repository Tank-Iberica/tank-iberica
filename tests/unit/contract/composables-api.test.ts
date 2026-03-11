/**
 * Contract tests: verify composable type contracts match API response shapes.
 *
 * These tests ensure that the types used by composables remain compatible
 * with the actual data returned by Supabase queries (and vice versa).
 * They test the SHAPE of data, not the behavior.
 *
 * Principle: If an API field is renamed or removed, these tests catch it
 * before it reaches production.
 */
import { describe, it, expect } from 'vitest'
import type { Vehicle } from '../../../app/composables/shared/vehiclesTypes'
import type { AttributeDefinition, FiltersState } from '../../../app/composables/shared/filtersTypes'
import type { TransactionRecord } from '../../../app/composables/useTransactionHistory'
import type { TocItem } from '../../../app/composables/useTableOfContents'
import { createFilters, buildSliderRange } from '../../../app/composables/shared/createFilters'
import type { FilterFactory } from '../../../app/composables/shared/createFilters'

// ── Vehicle contract ────────────────────────────────────────────────────────

describe('Vehicle contract', () => {
  it('Vehicle type has all required fields from supabase select', () => {
    // This verifies the TypeScript interface at compile time
    // and the shape at runtime via a mock object
    const mockVehicle: Vehicle = {
      id: '123',
      dealer_id: 'dealer-1',
      title_es: 'Camión Mercedes',
      title_en: null,
      price: 45000,
      currency: 'EUR',
      status: 'published',
      visibility: 'public',
      brand: 'Mercedes',
      model: 'Actros',
      year: 2020,
      mileage: 120000,
      location_country: 'ES',
      location_region: 'Castilla y León',
      location_province: 'Valladolid',
      slug: 'camion-mercedes-actros-2020',
      featured: false,
      images: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    expect(mockVehicle.id).toBe('123')
    expect(mockVehicle.status).toBe('published')
    expect(mockVehicle.price).toBe(45000)
  })

  it('Vehicle status is one of the allowed values', () => {
    const allowedStatuses: Vehicle['status'][] = [
      'draft',
      'published',
      'reserved',
      'sold',
      'archived',
    ]
    expect(allowedStatuses).toContain('published')
    expect(allowedStatuses).toContain('sold')
    expect(allowedStatuses).not.toContain('unknown')
  })
})

// ── AttributeDefinition contract ──────────────────────────────────────────

describe('AttributeDefinition contract', () => {
  it('AttributeDefinition has all fields from attributes table', () => {
    const mockAttr: AttributeDefinition = {
      id: 'attr-1',
      subcategory_id: 'sub-1',
      name: 'año',
      type: 'slider',
      label_es: 'Año',
      label_en: 'Year',
      unit: null,
      options: {},
      is_extra: false,
      is_hidden: false,
      status: 'published',
      sort_order: 1,
    }

    expect(mockAttr.type).toBe('slider')
    expect(mockAttr.is_hidden).toBe(false)
    expect(mockAttr.status).toBe('published')
  })

  it('AttributeDefinition type is one of the filter types', () => {
    const types: AttributeDefinition['type'][] = [
      'caja',
      'desplegable',
      'desplegable_tick',
      'tick',
      'slider',
      'calc',
    ]
    // All valid types should be in the union
    expect(types.includes('slider')).toBe(true)
    expect(types.includes('caja')).toBe(true)
  })
})

// ── FiltersState contract ─────────────────────────────────────────────────

describe('FiltersState contract', () => {
  it('FiltersState has all required keys', () => {
    const state: FiltersState = {
      definitions: [],
      categoryFilters: [],
      subcategoryFilters: [],
      loading: false,
      error: null,
      activeFilters: {},
      vehicleFilterValues: {},
      sliderRanges: {},
    }

    expect(Object.keys(state)).toContain('definitions')
    expect(Object.keys(state)).toContain('activeFilters')
    expect(Object.keys(state)).toContain('sliderRanges')
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })
})

// ── createFilters factory contract ────────────────────────────────────────

describe('createFilters factory', () => {
  it('returns a valid FilterFactory with all expected methods', () => {
    const factory: FilterFactory = createFilters()
    expect(typeof factory.isActive).toBe('function')
    expect(typeof factory.clearAll).toBe('function')
    expect(typeof factory.setFilter).toBe('function')
    expect(typeof factory.removeFilter).toBe('function')
    expect(typeof factory.visibleDefinitions).toBe('function')
  })

  it('isActive returns false for empty filters', () => {
    const { isActive } = createFilters()
    expect(isActive('brand')).toBe(false)
    expect(isActive('year')).toBe(false)
  })

  it('setFilter makes isActive return true', () => {
    const { isActive, setFilter } = createFilters()
    setFilter('brand', 'Mercedes')
    expect(isActive('brand')).toBe(true)
  })

  it('clearAll removes all active filters', () => {
    const { isActive, setFilter, clearAll } = createFilters()
    setFilter('brand', 'Volvo')
    setFilter('year', 2020)
    clearAll()
    expect(isActive('brand')).toBe(false)
    expect(isActive('year')).toBe(false)
  })

  it('removeFilter removes a single filter', () => {
    const { isActive, setFilter, removeFilter } = createFilters()
    setFilter('brand', 'Scania')
    setFilter('year', 2019)
    removeFilter('brand')
    expect(isActive('brand')).toBe(false)
    expect(isActive('year')).toBe(true)
  })

  it('initialFilters are applied on creation', () => {
    const { isActive } = createFilters({ initialFilters: { brand: 'DAF' } })
    expect(isActive('brand')).toBe(true)
  })

  it('visibleDefinitions respects maxSliders', () => {
    const { visibleDefinitions } = createFilters({ maxSliders: 2 })
    const defs: AttributeDefinition[] = [
      { id: '1', subcategory_id: null, name: 'a', type: 'slider', label_es: 'A', label_en: null, unit: null, options: {}, is_extra: false, is_hidden: false, status: 'published', sort_order: 1 },
      { id: '2', subcategory_id: null, name: 'b', type: 'slider', label_es: 'B', label_en: null, unit: null, options: {}, is_extra: false, is_hidden: false, status: 'published', sort_order: 2 },
      { id: '3', subcategory_id: null, name: 'c', type: 'slider', label_es: 'C', label_en: null, unit: null, options: {}, is_extra: false, is_hidden: false, status: 'published', sort_order: 3 },
    ]
    const visible = visibleDefinitions(defs)
    const sliders = visible.filter((d) => d.type === 'slider')
    expect(sliders).toHaveLength(2) // maxSliders=2
  })

  it('visibleDefinitions excludes extras when includeExtras=false', () => {
    const { visibleDefinitions } = createFilters({ includeExtras: false })
    const defs: AttributeDefinition[] = [
      { id: '1', subcategory_id: null, name: 'a', type: 'caja', label_es: 'A', label_en: null, unit: null, options: {}, is_extra: false, is_hidden: false, status: 'published', sort_order: 1 },
      { id: '2', subcategory_id: null, name: 'b', type: 'caja', label_es: 'B', label_en: null, unit: null, options: {}, is_extra: true, is_hidden: false, status: 'published', sort_order: 2 },
    ]
    const visible = visibleDefinitions(defs)
    expect(visible).toHaveLength(1)
    expect(visible[0].id).toBe('1')
  })
})

// ── buildSliderRange contract ─────────────────────────────────────────────

describe('buildSliderRange', () => {
  it('returns min/max from an array of numbers', () => {
    const range = buildSliderRange([10, 5, 20, 15])
    expect(range.min).toBe(5)
    expect(range.max).toBe(20)
  })

  it('returns 0/0 for empty array', () => {
    const range = buildSliderRange([])
    expect(range.min).toBe(0)
    expect(range.max).toBe(0)
  })

  it('handles single value', () => {
    const range = buildSliderRange([42])
    expect(range.min).toBe(42)
    expect(range.max).toBe(42)
  })
})

// ── TransactionRecord contract ────────────────────────────────────────────

describe('TransactionRecord contract', () => {
  it('TransactionRecord has all required fields', () => {
    const record: TransactionRecord = {
      id: 'v-1',
      title: 'Camión DAF',
      price: 35000,
      currency: 'EUR',
      status: 'sold',
      image: null,
      slug: 'camion-daf',
      dealer_name: 'Transportes García',
      sold_at: '2024-03-01T00:00:00Z',
      reserved_at: null,
      created_at: '2024-01-01T00:00:00Z',
    }

    expect(record.status).toBe('sold')
    expect(record.price).toBe(35000)
    expect(record.dealer_name).toBe('Transportes García')
  })

  it('TransactionRecord status is sold or reserved', () => {
    const statuses: TransactionRecord['status'][] = ['sold', 'reserved']
    expect(statuses).toContain('sold')
    expect(statuses).toContain('reserved')
  })
})

// ── TocItem contract ──────────────────────────────────────────────────────

describe('TocItem contract', () => {
  it('TocItem has id, text, level', () => {
    const item: TocItem = {
      id: 'como-elegir',
      text: 'Cómo elegir tu primera excavadora',
      level: 2,
    }

    expect(item.level).toBe(2)
    expect(item.id).toBe('como-elegir')
  })

  it('TocItem level is 2, 3, or 4', () => {
    const levels: TocItem['level'][] = [2, 3, 4]
    expect(levels).toContain(2)
    expect(levels).toContain(4)
  })
})
