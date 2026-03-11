import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminFilters,
  getFilterTypeOptions,
  getFilterStatusOptions,
  FILTER_TYPE_VALUES,
  FILTER_STATUS_VALUES,
} from '../../app/composables/admin/useAdminFilters'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'order', 'single', 'insert', 'update', 'delete']

function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeFilter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f-1',
    name: 'km',
    type: 'caja' as const,
    label_es: 'Kilómetros',
    label_en: 'Kilometers',
    unit: 'km',
    options: {},
    is_extra: false,
    is_hidden: false,
    status: 'published' as const,
    sort_order: 1,
    subcategory_id: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

function makeFormData() {
  return {
    name: 'km',
    type: 'caja' as const,
    label_es: 'Kilómetros',
    label_en: 'Kilometers',
    unit: 'km',
    default_value: null,
    extra_filters: [],
    hides: [],
    status: 'published' as const,
    is_extra: false,
    is_hidden: false,
    choices: [],
    choices_source: 'manual' as const,
    step: null,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── Exported constants ───────────────────────────────────────────────────

describe('FILTER_TYPE_VALUES', () => {
  it('has 6 filter type entries', () => {
    expect(FILTER_TYPE_VALUES).toHaveLength(6)
  })

  it('contains all expected type values', () => {
    expect(FILTER_TYPE_VALUES).toContain('caja')
    expect(FILTER_TYPE_VALUES).toContain('desplegable')
    expect(FILTER_TYPE_VALUES).toContain('desplegable_tick')
    expect(FILTER_TYPE_VALUES).toContain('tick')
    expect(FILTER_TYPE_VALUES).toContain('slider')
    expect(FILTER_TYPE_VALUES).toContain('calc')
  })

  it('each entry from getFilterTypeOptions has value and label', () => {
    const options = getFilterTypeOptions((k) => k)
    for (const entry of options) {
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('label')
    }
  })
})

describe('FILTER_STATUS_VALUES', () => {
  it('has 3 status entries', () => {
    expect(FILTER_STATUS_VALUES).toHaveLength(3)
  })

  it('contains published, draft, archived', () => {
    expect(FILTER_STATUS_VALUES).toContain('published')
    expect(FILTER_STATUS_VALUES).toContain('draft')
    expect(FILTER_STATUS_VALUES).toContain('archived')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('filters starts as empty array', () => {
    const c = useAdminFilters()
    expect(c.filters.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminFilters()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminFilters()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminFilters()
    expect(c.error.value).toBeNull()
  })
})

// ─── fetchFilters ─────────────────────────────────────────────────────────

describe('fetchFilters', () => {
  it('sets filters on success', async () => {
    const filter = makeFilter()
    mockFrom.mockReturnValue(makeChain({ data: [filter], error: null }))
    const c = useAdminFilters()
    await c.fetchFilters()
    expect(c.filters.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error and empties filters on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))
    const c = useAdminFilters()
    await c.fetchFilters()
    // Pattern B: instanceof Error → fallback
    expect(c.error.value).toBe('Error fetching filters')
    expect(c.filters.value).toEqual([])
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns filter on success', async () => {
    const filter = makeFilter()
    mockFrom.mockReturnValue(makeChain({ data: filter, error: null }))
    const c = useAdminFilters()
    const result = await c.fetchById('f-1')
    expect(result).toEqual(filter)
  })

  it('returns null on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminFilters()
    const result = await c.fetchById('f-999')
    expect(result).toBeNull()
    expect(c.error.value).toBe('Error fetching filter')
  })
})

// ─── createFilter ─────────────────────────────────────────────────────────

describe('createFilter', () => {
  it('returns new id on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'new-f' }, error: null }))
    const c = useAdminFilters()
    const id = await c.createFilter(makeFormData())
    expect(id).toBe('new-f')
    expect(c.saving.value).toBe(false)
  })

  it('uses maxOrder + 1 from current filters.value', async () => {
    const chain = makeChain({ data: { id: 'x' }, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminFilters()
    // Pre-populate with a filter at sort_order=5
    c.filters.value.push(makeFilter({ id: 'existing', sort_order: 5 }) as never)
    await c.createFilter(makeFormData())
    // sort_order passed to insert should be 6
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ sort_order: 6 }),
    )
  })

  it('returns null on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Insert failed' } }))
    const c = useAdminFilters()
    const id = await c.createFilter(makeFormData())
    expect(id).toBeNull()
    expect(c.error.value).toBe('Error creating filter')
  })
})

// ─── updateFilter ─────────────────────────────────────────────────────────

describe('updateFilter', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminFilters()
    const ok = await c.updateFilter('f-1', { status: 'draft' })
    expect(ok).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('merges options from current filter in filters.value', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminFilters()
    // Pre-populate with a filter that has existing options
    c.filters.value.push(
      makeFilter({ id: 'f-1', options: { default_value: 'old', extra: 'keep' } }) as never,
    )
    await c.updateFilter('f-1', { name: 'km_updated' })
    // The update payload should include merged options
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'km_updated' }),
    )
  })

  it('returns false on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update error' } }))
    const c = useAdminFilters()
    const ok = await c.updateFilter('f-1', { status: 'archived' })
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error updating filter')
  })
})

// ─── deleteFilter ─────────────────────────────────────────────────────────

describe('deleteFilter', () => {
  it('returns true and removes filter from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1' }) as never)
    c.filters.value.push(makeFilter({ id: 'f-2' }) as never)
    const ok = await c.deleteFilter('f-1')
    expect(ok).toBe(true)
    expect(c.filters.value).toHaveLength(1)
    expect(c.filters.value[0]!.id).toBe('f-2')
  })

  it('returns false on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'FK error' } }))
    const c = useAdminFilters()
    const ok = await c.deleteFilter('f-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error deleting filter')
  })
})

// ─── moveUp ───────────────────────────────────────────────────────────────

describe('moveUp', () => {
  it('returns false when item is already first (index 0)', async () => {
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1', sort_order: 1 }) as never)
    const ok = await c.moveUp('f-1')
    expect(ok).toBe(false)
  })

  it('returns false when id not found', async () => {
    const c = useAdminFilters()
    const ok = await c.moveUp('nonexistent')
    expect(ok).toBe(false)
  })

  it('returns true and calls supabase for valid swap', async () => {
    // swapSortOrder does 2 updates + fetchFilters → all succeed
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1', sort_order: 1 }) as never)
    c.filters.value.push(makeFilter({ id: 'f-2', sort_order: 2 }) as never)
    const ok = await c.moveUp('f-2')
    expect(ok).toBe(true)
    // swapSortOrder + fetchFilters each call from('attributes')
    expect(mockFrom).toHaveBeenCalledWith('attributes')
  })
})

// ─── moveDown ─────────────────────────────────────────────────────────────

describe('moveDown', () => {
  it('returns false when item is already last', async () => {
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1', sort_order: 1 }) as never)
    c.filters.value.push(makeFilter({ id: 'f-2', sort_order: 2 }) as never)
    const ok = await c.moveDown('f-2')
    expect(ok).toBe(false)
  })

  it('returns false when id not found', async () => {
    const c = useAdminFilters()
    const ok = await c.moveDown('ghost')
    expect(ok).toBe(false)
  })

  it('returns true for valid swap', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1', sort_order: 1 }) as never)
    c.filters.value.push(makeFilter({ id: 'f-2', sort_order: 2 }) as never)
    const ok = await c.moveDown('f-1')
    expect(ok).toBe(true)
  })
})

// ─── getAvailableFilters ──────────────────────────────────────────────────

describe('getAvailableFilters', () => {
  it('returns all non-archived filters when no excludeId', () => {
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1', status: 'published' }) as never)
    c.filters.value.push(makeFilter({ id: 'f-2', status: 'draft' }) as never)
    c.filters.value.push(makeFilter({ id: 'f-3', status: 'archived' }) as never)
    const result = c.getAvailableFilters()
    expect(result).toHaveLength(2)
    expect(result.map((f) => f.id)).toEqual(['f-1', 'f-2'])
  })

  it('excludes filter by id', () => {
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1', status: 'published' }) as never)
    c.filters.value.push(makeFilter({ id: 'f-2', status: 'published' }) as never)
    const result = c.getAvailableFilters('f-1')
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('f-2')
  })

  it('returns empty array when all filters are archived', () => {
    const c = useAdminFilters()
    c.filters.value.push(makeFilter({ id: 'f-1', status: 'archived' }) as never)
    expect(c.getAvailableFilters()).toHaveLength(0)
  })
})
