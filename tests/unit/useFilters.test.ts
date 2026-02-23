import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useFilters } from '../../app/composables/useFilters'
import type { AttributeDefinition } from '../../app/composables/useFilters'

// Mock 'vue' for the composable's `import { computed } from 'vue'`
vi.mock('vue', () => ({
  computed: (fn: () => unknown) => ({ value: fn() }),
  readonly: (obj: unknown) => obj,
  ref: (val: unknown) => ({ value: val }),
}))

describe('useFilters', () => {
  beforeEach(() => {
    // setup.ts clears stateStore in beforeEach, so filters state resets
  })

  it('should have empty initial state', () => {
    const { definitions, activeFilters, loading, error } = useFilters()

    expect(definitions.value).toEqual([])
    expect(activeFilters.value).toEqual({})
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('setFilter(name, value) correctly stores the value', () => {
    const filters = useFilters()

    filters.setFilter('brand', 'Volvo')

    const fresh = useFilters()
    expect(fresh.activeFilters.value).toEqual({ brand: 'Volvo' })
  })

  it('setFilter stores multiple filters without overwriting', () => {
    const filters = useFilters()

    filters.setFilter('brand', 'Volvo')
    filters.setFilter('year', 2020)
    filters.setFilter('ejes', '3')

    const fresh = useFilters()
    expect(fresh.activeFilters.value).toEqual({
      brand: 'Volvo',
      year: 2020,
      ejes: '3',
    })
  })

  it('setFilter overwrites the same key', () => {
    const filters = useFilters()

    filters.setFilter('brand', 'Volvo')
    filters.setFilter('brand', 'Scania')

    const fresh = useFilters()
    expect(fresh.activeFilters.value).toEqual({ brand: 'Scania' })
  })

  it('clearFilter(name) removes the filter', () => {
    const filters = useFilters()

    filters.setFilter('brand', 'Volvo')
    filters.setFilter('year', 2020)
    filters.clearFilter('brand')

    const fresh = useFilters()
    expect(fresh.activeFilters.value).toEqual({ year: 2020 })
    expect(fresh.activeFilters.value).not.toHaveProperty('brand')
  })

  it('clearFilter on nonexistent key does not throw', () => {
    const filters = useFilters()
    filters.setFilter('brand', 'Volvo')

    expect(() => filters.clearFilter('nonexistent')).not.toThrow()

    const fresh = useFilters()
    expect(fresh.activeFilters.value).toEqual({ brand: 'Volvo' })
  })

  it('clearAll() removes all active filters', () => {
    const filters = useFilters()

    filters.setFilter('brand', 'Volvo')
    filters.setFilter('year', 2020)
    filters.setFilter('ejes', '3')
    filters.clearAll()

    const fresh = useFilters()
    expect(fresh.activeFilters.value).toEqual({})
  })

  it('reset() restores initial state (definitions, filters, error)', () => {
    const filters = useFilters()

    filters.setFilter('brand', 'Volvo')
    filters.reset()

    const fresh = useFilters()
    expect(fresh.definitions.value).toEqual([])
    expect(fresh.categoryFilters.value).toEqual([])
    expect(fresh.subcategoryFilters.value).toEqual([])
    expect(fresh.activeFilters.value).toEqual({})
    expect(fresh.error.value).toBeNull()
  })

  it('getFilterOptions returns manual choices when source is "manual"', () => {
    const filters = useFilters()

    const filter: AttributeDefinition = {
      id: 'attr-1',
      subcategory_id: 'sub-1',
      name: 'marca',
      type: 'desplegable',
      label_es: 'Marca',
      label_en: 'Brand',
      unit: null,
      options: {
        choices_source: 'manual',
        choices: ['Volvo', 'Scania', 'DAF'],
      },
      is_extra: false,
      is_hidden: false,
      status: 'published',
      sort_order: 1,
    }

    const options = filters.getFilterOptions(filter)
    expect(options).toEqual(['Volvo', 'Scania', 'DAF'])
  })

  it('getFilterOptions returns auto values when source is "auto"', () => {
    const filters = useFilters()

    // Manually inject vehicleFilterValues into state via the underlying useState
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: Record<string, unknown>
    }
    stateRef.value.vehicleFilterValues = { marca: ['DAF', 'MAN', 'Volvo'] }

    const filter: AttributeDefinition = {
      id: 'attr-1',
      subcategory_id: 'sub-1',
      name: 'marca',
      type: 'desplegable',
      label_es: 'Marca',
      label_en: 'Brand',
      unit: null,
      options: {
        choices_source: 'auto',
      },
      is_extra: false,
      is_hidden: false,
      status: 'published',
      sort_order: 1,
    }

    const options = filters.getFilterOptions(filter)
    expect(options).toEqual(['DAF', 'MAN', 'Volvo'])
  })

  it('getFilterOptions merges manual and auto when source is "both"', () => {
    const filters = useFilters()

    // Inject auto values
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: Record<string, unknown>
    }
    stateRef.value.vehicleFilterValues = { marca: ['DAF', 'MAN', 'Volvo'] }

    const filter: AttributeDefinition = {
      id: 'attr-1',
      subcategory_id: 'sub-1',
      name: 'marca',
      type: 'desplegable',
      label_es: 'Marca',
      label_en: 'Brand',
      unit: null,
      options: {
        choices_source: 'both',
        choices: ['Scania', 'Volvo', 'Renault'],
      },
      is_extra: false,
      is_hidden: false,
      status: 'published',
      sort_order: 1,
    }

    const options = filters.getFilterOptions(filter)
    // Should merge and deduplicate, sorted
    expect(options).toEqual(['DAF', 'MAN', 'Renault', 'Scania', 'Volvo'])
  })

  it('getSliderRange returns proper min/max from state', () => {
    const filters = useFilters()

    // Inject slider ranges
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: Record<string, unknown>
    }
    stateRef.value.sliderRanges = { peso: { min: 1000, max: 44000 } }

    const filter: AttributeDefinition = {
      id: 'attr-2',
      subcategory_id: 'sub-1',
      name: 'peso',
      type: 'slider',
      label_es: 'Peso',
      label_en: 'Weight',
      unit: 'kg',
      options: {},
      is_extra: false,
      is_hidden: false,
      status: 'published',
      sort_order: 2,
    }

    const range = filters.getSliderRange(filter)
    expect(range).toEqual({ min: 1000, max: 44000 })
  })

  it('getSliderRange returns {min:0, max:100} as default when no range data exists', () => {
    const filters = useFilters()

    const filter: AttributeDefinition = {
      id: 'attr-3',
      subcategory_id: 'sub-1',
      name: 'altura',
      type: 'slider',
      label_es: 'Altura',
      label_en: 'Height',
      unit: 'm',
      options: {},
      is_extra: false,
      is_hidden: false,
      status: 'published',
      sort_order: 3,
    }

    const range = filters.getSliderRange(filter)
    expect(range).toEqual({ min: 0, max: 100 })
  })
})
