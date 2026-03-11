/**
 * Additional tests for useFilters.ts — covers visibleFilters, tick logic,
 * fetchBySubcategory, and other uncovered branches.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFilters } from '~/composables/useFilters'
import type { AttributeDefinition } from '~/composables/useFilters'

vi.mock('vue', () => ({
  computed: (fn: () => unknown) => ({ value: fn() }),
  readonly: (obj: unknown) => obj,
  ref: (val: unknown) => ({ value: val }),
}))

// getVerticalSlug is a Nuxt auto-import
vi.stubGlobal('getVerticalSlug', () => 'tracciona')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAttr(overrides: Partial<AttributeDefinition>): AttributeDefinition {
  return {
    id: overrides.id ?? 'attr-1',
    subcategory_id: null,
    name: overrides.name ?? 'test_attr',
    type: overrides.type ?? 'desplegable',
    label_es: null,
    label_en: null,
    unit: null,
    options: overrides.options ?? {},
    is_extra: overrides.is_extra ?? false,
    is_hidden: false,
    status: 'published',
    sort_order: 1,
    ...overrides,
  }
}

function injectDefinitions(defs: AttributeDefinition[]) {
  // Initialize state via useFilters() so defaultState is in place
  useFilters()
  const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
    value: Record<string, unknown>
  }
  stateRef.value.definitions = defs
  stateRef.value.activeFilters = {}
}

function setActive(name: string, value: unknown) {
  const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
    value: Record<string, unknown>
  }
  ;(stateRef.value.activeFilters as Record<string, unknown>)[name] = value
}

// ─── visibleFilters — basic ───────────────────────────────────────────────────

describe('useFilters.visibleFilters — basic visibility', () => {
  beforeEach(() => {
    injectDefinitions([])
  })

  it('returns all non-extra, non-hidden filters when no ticks active', () => {
    const defs = [
      makeAttr({ id: '1', name: 'brand', type: 'desplegable' }),
      makeAttr({ id: '2', name: 'year', type: 'slider' }),
    ]
    injectDefinitions(defs)
    const { visibleFilters } = useFilters()
    expect(visibleFilters.value).toHaveLength(2)
  })

  it('hides a filter listed in tick.options.hides when tick is active', () => {
    const defs = [
      makeAttr({
        id: '1', name: 'cargadora', type: 'tick',
        options: { hides: ['brand'] },
      }),
      makeAttr({ id: '2', name: 'brand', type: 'desplegable' }),
    ]
    injectDefinitions(defs)
    setActive('cargadora', true)

    const { visibleFilters } = useFilters()
    const visible = visibleFilters.value.map((f) => f.name)
    expect(visible).toContain('cargadora')
    expect(visible).not.toContain('brand')
  })

  it('shows hidden filter again when tick is inactive', () => {
    const defs = [
      makeAttr({
        id: '1', name: 'cargadora', type: 'tick',
        options: { hides: ['brand'] },
      }),
      makeAttr({ id: '2', name: 'brand', type: 'desplegable' }),
    ]
    injectDefinitions(defs)
    // tick NOT active
    const { visibleFilters } = useFilters()
    const visible = visibleFilters.value.map((f) => f.name)
    expect(visible).toContain('brand')
  })
})

// ─── visibleFilters — extra filters ──────────────────────────────────────────

describe('useFilters.visibleFilters — extra filter visibility', () => {
  it('hides extra filter by default (no active tick)', () => {
    const defs = [
      makeAttr({
        id: '1', name: 'refrigeracion', type: 'tick',
        options: { extra_filters: ['temperatura'] },
      }),
      makeAttr({ id: '2', name: 'temperatura', type: 'slider', is_extra: true }),
    ]
    injectDefinitions(defs)
    const { visibleFilters } = useFilters()
    const visible = visibleFilters.value.map((f) => f.name)
    expect(visible).not.toContain('temperatura')
  })

  it('shows extra filter when its controlling tick is active', () => {
    const defs = [
      makeAttr({
        id: '1', name: 'refrigeracion', type: 'tick',
        options: { extra_filters: ['temperatura'] },
      }),
      makeAttr({ id: '2', name: 'temperatura', type: 'slider', is_extra: true }),
    ]
    injectDefinitions(defs)
    setActive('refrigeracion', true)

    const { visibleFilters } = useFilters()
    const visible = visibleFilters.value.map((f) => f.name)
    expect(visible).toContain('temperatura')
  })

  it('hides extra filter if it has no controlling tick in definitions', () => {
    const defs = [
      makeAttr({ id: '1', name: 'orphan', type: 'desplegable', is_extra: true }),
    ]
    injectDefinitions(defs)
    const { visibleFilters } = useFilters()
    expect(visibleFilters.value).toHaveLength(0)
  })
})

// ─── visibleFilters — multiple ticks ─────────────────────────────────────────

describe('useFilters.visibleFilters — multiple ticks', () => {
  it('handles multiple active ticks independently', () => {
    const defs = [
      makeAttr({ id: '1', name: 'tick_a', type: 'tick', options: { hides: ['filter_x'] } }),
      makeAttr({ id: '2', name: 'tick_b', type: 'tick', options: { extra_filters: ['filter_y'] } }),
      makeAttr({ id: '3', name: 'filter_x', type: 'desplegable' }),
      makeAttr({ id: '4', name: 'filter_y', type: 'desplegable', is_extra: true }),
    ]
    injectDefinitions(defs)
    setActive('tick_a', true)
    setActive('tick_b', true)

    const { visibleFilters } = useFilters()
    const visible = visibleFilters.value.map((f) => f.name)
    expect(visible).not.toContain('filter_x') // hidden by tick_a
    expect(visible).toContain('filter_y')     // shown by tick_b
  })
})

// ─── fetchBySubcategory ───────────────────────────────────────────────────────

describe('useFilters.fetchBySubcategory', () => {
  it('sets loading to false after fetch (success path)', async () => {
    const { fetchBySubcategory, loading } = useFilters()
    await fetchBySubcategory('sub-123')
    expect(loading.value).toBe(false)
  })

  it('sets error to null on success', async () => {
    const { fetchBySubcategory, error } = useFilters()
    await fetchBySubcategory('sub-123')
    expect(error.value).toBeNull()
  })

  it('sets definitions from returned data (mocked supabase returns [])', async () => {
    const { fetchBySubcategory, definitions } = useFilters()
    await fetchBySubcategory('sub-123')
    expect(Array.isArray(definitions.value)).toBe(true)
  })
})

// ─── fetchByCategoryAndSubcategory ────────────────────────────────────────────

describe('useFilters.fetchByCategoryAndSubcategory', () => {
  it('sets loading to false after fetch', async () => {
    const { fetchByCategoryAndSubcategory, loading } = useFilters()
    await fetchByCategoryAndSubcategory('cat-1', 'sub-1')
    expect(loading.value).toBe(false)
  })

  it('handles null categoryId and subcategoryId', async () => {
    const { fetchByCategoryAndSubcategory, loading, error } = useFilters()
    await fetchByCategoryAndSubcategory(null, null)
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('handles only categoryId (no subcategory)', async () => {
    const { fetchByCategoryAndSubcategory, definitions } = useFilters()
    await fetchByCategoryAndSubcategory('cat-1', null)
    expect(Array.isArray(definitions.value)).toBe(true)
  })

  it('handles only subcategoryId (no category)', async () => {
    const { fetchByCategoryAndSubcategory, definitions } = useFilters()
    await fetchByCategoryAndSubcategory(null, 'sub-1')
    expect(Array.isArray(definitions.value)).toBe(true)
  })
})

// ─── getFilterOptions — edge cases ───────────────────────────────────────────

describe('useFilters.getFilterOptions — additional branches', () => {
  it('returns empty array when source is "auto" and no vehicle values', () => {
    const { getFilterOptions } = useFilters()
    const filter = makeAttr({ name: 'sin_datos', options: { choices_source: 'auto' } })
    expect(getFilterOptions(filter)).toEqual([])
  })

  it('returns empty array when source is "manual" and no choices defined', () => {
    const { getFilterOptions } = useFilters()
    const filter = makeAttr({ options: { choices_source: 'manual' } })
    expect(getFilterOptions(filter)).toEqual([])
  })

  it('returns manual choices when choices_source is undefined (defaults to manual)', () => {
    const { getFilterOptions } = useFilters()
    const filter = makeAttr({ options: { choices: ['A', 'B'] } })
    expect(getFilterOptions(filter)).toEqual(['A', 'B'])
  })

  it('returns merged manual + auto for "both" source', () => {
    // Inject vehicleFilterValues
    useFilters()
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: Record<string, unknown>
    }
    stateRef.value.vehicleFilterValues = { test_attr: ['C', 'D'] }
    const { getFilterOptions } = useFilters()
    const filter = makeAttr({ options: { choices_source: 'both', choices: ['A', 'B'] } })
    expect(getFilterOptions(filter)).toEqual(['A', 'B', 'C', 'D'])
  })
})

// ─── setFilter / clearFilter / clearAll / reset ─────────────────────────────

describe('useFilters — state mutations', () => {
  beforeEach(() => {
    injectDefinitions([])
  })

  it('setFilter adds a filter value', () => {
    const { setFilter, activeFilters } = useFilters()
    setFilter('brand', 'Volvo')
    // activeFilters is computed one-shot, read fresh from state
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: { activeFilters: Record<string, unknown> }
    }
    expect(stateRef.value.activeFilters.brand).toBe('Volvo')
  })

  it('clearFilter removes a specific filter', () => {
    const { setFilter, clearFilter } = useFilters()
    setFilter('brand', 'Volvo')
    setFilter('year', 2020)
    clearFilter('brand')
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: { activeFilters: Record<string, unknown> }
    }
    expect(stateRef.value.activeFilters.brand).toBeUndefined()
    expect(stateRef.value.activeFilters.year).toBe(2020)
  })

  it('clearAll removes all active filters', () => {
    const { setFilter, clearAll } = useFilters()
    setFilter('brand', 'Volvo')
    setFilter('year', 2020)
    clearAll()
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: { activeFilters: Record<string, unknown> }
    }
    expect(Object.keys(stateRef.value.activeFilters)).toHaveLength(0)
  })

  it('reset clears definitions, categories, active filters, and error', () => {
    const { reset } = useFilters()
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: Record<string, unknown>
    }
    stateRef.value.definitions = [makeAttr({ id: '1' })]
    stateRef.value.categoryFilters = [makeAttr({ id: '2' })]
    stateRef.value.error = 'some error'
    reset()
    expect(stateRef.value.definitions).toEqual([])
    expect(stateRef.value.categoryFilters).toEqual([])
    expect(stateRef.value.subcategoryFilters).toEqual([])
    expect(stateRef.value.activeFilters).toEqual({})
    expect(stateRef.value.error).toBeNull()
  })

  it('getSliderRange returns default when no range exists', () => {
    const { getSliderRange } = useFilters()
    const filter = makeAttr({ name: 'no_range', type: 'slider' })
    expect(getSliderRange(filter)).toEqual({ min: 0, max: 100 })
  })

  it('getSliderRange returns stored range when available', () => {
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: { sliderRanges: Record<string, { min: number; max: number }> }
    }
    stateRef.value.sliderRanges = { my_slider: { min: 10, max: 500 } }
    const { getSliderRange } = useFilters()
    const filter = makeAttr({ name: 'my_slider', type: 'slider' })
    expect(getSliderRange(filter)).toEqual({ min: 10, max: 500 })
  })
})

// ─── extractFilterValues / computeSliderRanges — tested indirectly ──────────

describe('useFilters — vehicleFilterValues integration', () => {
  it('reflects extracted filter values after state injection', () => {
    useFilters()
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: { vehicleFilterValues: Record<string, string[]> }
    }
    stateRef.value.vehicleFilterValues = {
      brand: ['Volvo', 'Scania', 'DAF'],
      model: ['FH', 'R', 'XF'],
    }
    const { getFilterOptions } = useFilters()
    const filter = makeAttr({ name: 'brand', options: { choices_source: 'auto' } })
    expect(getFilterOptions(filter)).toEqual(['Volvo', 'Scania', 'DAF'])
  })

  it('merges both sources correctly with deduplication', () => {
    useFilters()
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: { vehicleFilterValues: Record<string, string[]> }
    }
    stateRef.value.vehicleFilterValues = { color: ['Rojo', 'Azul', 'Verde'] }
    const { getFilterOptions } = useFilters()
    const filter = makeAttr({
      name: 'color',
      options: { choices_source: 'both', choices: ['Azul', 'Blanco'] },
    })
    // Azul appears in both but only once in result
    const result = getFilterOptions(filter)
    expect(result.filter((v: string) => v === 'Azul')).toHaveLength(1)
    expect(result).toContain('Blanco')
    expect(result).toContain('Rojo')
    expect(result).toContain('Verde')
  })
})

// ─── sliderRanges integration ───────────────────────────────────────────────

describe('useFilters — sliderRanges integration', () => {
  it('getSliderRange returns injected range for matching filter', () => {
    useFilters()
    const stateRef = (globalThis as Record<string, unknown>).useState('filters') as {
      value: { sliderRanges: Record<string, { min: number; max: number }> }
    }
    stateRef.value.sliderRanges = { price: { min: 5000, max: 150000 } }
    const { getSliderRange } = useFilters()
    expect(getSliderRange(makeAttr({ name: 'price', type: 'slider' }))).toEqual({ min: 5000, max: 150000 })
  })
})

// ─── visibleFilters — combined hides + extra_filters ────────────────────────

describe('useFilters.visibleFilters — combined scenarios', () => {
  it('tick that both hides AND reveals extra filters works correctly', () => {
    const defs = [
      makeAttr({
        id: '1', name: 'grua', type: 'tick',
        options: { hides: ['peso'], extra_filters: ['alcance'] },
      }),
      makeAttr({ id: '2', name: 'peso', type: 'slider' }),
      makeAttr({ id: '3', name: 'alcance', type: 'slider', is_extra: true }),
    ]
    injectDefinitions(defs)
    setActive('grua', true)
    const { visibleFilters } = useFilters()
    const names = visibleFilters.value.map((f) => f.name)
    expect(names).not.toContain('peso') // hidden
    expect(names).toContain('alcance') // revealed
    expect(names).toContain('grua') // tick itself visible
  })

  it('extra filter stays hidden when controlling tick is not active', () => {
    const defs = [
      makeAttr({
        id: '1', name: 'grua', type: 'tick',
        options: { extra_filters: ['alcance'] },
      }),
      makeAttr({ id: '3', name: 'alcance', type: 'slider', is_extra: true }),
    ]
    injectDefinitions(defs)
    // grua NOT active
    const { visibleFilters } = useFilters()
    const names = visibleFilters.value.map((f) => f.name)
    expect(names).not.toContain('alcance')
  })
})

// NOTE: fetchBySubcategory/fetchByCategoryAndSubcategory error paths cannot be
// tested here because #imports captures useSupabaseClient at module load time.
// vi.stubGlobal after that doesn't affect the already-captured reference.
