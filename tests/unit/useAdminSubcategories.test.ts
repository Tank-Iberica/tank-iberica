import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminSubcategories } from '../../app/composables/admin/useAdminSubcategories'

// ─── Mock slugify ─────────────────────────────────────────────────────────

vi.mock('~/utils/fileNaming', () => ({
  slugify: vi.fn().mockReturnValue('test-slug'),
}))

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'order', 'limit', 'single', 'insert', 'update', 'delete']

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

function makeSubcat(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    name_es: 'Tractores',
    name_en: 'Tractors',
    slug: 'tractores',
    applicable_categories: [],
    applicable_filters: [],
    stock_count: 0,
    status: 'active',
    sort_order: 1,
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// Helper: mock 3-call fetchSubcategories
function mockFetch(subcatsData: unknown[], linksData: unknown[], vehicleData: unknown[]) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'categories') return makeChain({ data: subcatsData, error: null })
    if (table === 'subcategory_categories') return makeChain({ data: linksData, error: null })
    if (table === 'vehicles') return makeChain({ data: vehicleData, error: null })
    return makeChain()
  })
}

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('subcategories starts as empty array', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminSubcategories()
    expect(c.subcategories.value).toEqual([])
  })

  it('loading starts as false', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminSubcategories()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminSubcategories()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminSubcategories()
    expect(c.error.value).toBeNull()
  })
})

// ─── fetchSubcategories ───────────────────────────────────────────────────

describe('fetchSubcategories', () => {
  it('sets subcategories on success', async () => {
    mockFetch([makeSubcat()], [], [])
    const c = useAdminSubcategories()
    await c.fetchSubcategories()
    expect(c.subcategories.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('calculates stock_count via subcategory_categories junction', async () => {
    const subcat = makeSubcat({ id: 'cat-1' })
    const links = [
      { subcategory_id: 'sub-1', category_id: 'cat-1' },
      { subcategory_id: 'sub-2', category_id: 'cat-1' },
    ]
    const vehicles = [
      { subcategory_id: 'sub-1' },
      { subcategory_id: 'sub-1' },
      { subcategory_id: 'sub-2' },
    ]
    mockFetch([subcat], links, vehicles)
    const c = useAdminSubcategories()
    await c.fetchSubcategories()
    expect(c.subcategories.value[0]!.stock_count).toBe(3)
  })

  it('stock_count is 0 when no matching vehicles', async () => {
    mockFetch([makeSubcat({ id: 'cat-x' })], [], [])
    const c = useAdminSubcategories()
    await c.fetchSubcategories()
    expect(c.subcategories.value[0]!.stock_count).toBe(0)
  })

  it('sets error and empties subcategories on categories query error', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'categories')
        return makeChain({ data: null, error: { message: 'DB error' } })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminSubcategories()
    await c.fetchSubcategories()
    // Pattern B: plain object is not instanceof Error → fallback string
    expect(c.error.value).toBe('Error fetching subcategories')
    expect(c.subcategories.value).toEqual([])
  })

  it('handles null subcatLinks and vehicleCounts gracefully (stock_count=0)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'categories') return makeChain({ data: [makeSubcat()], error: null })
      return makeChain({ data: null, error: null }) // null for subcategory_categories and vehicles
    })
    const c = useAdminSubcategories()
    await c.fetchSubcategories()
    expect(c.subcategories.value[0]!.stock_count).toBe(0)
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns subcategory on success', async () => {
    const subcat = makeSubcat()
    mockFrom.mockReturnValue(makeChain({ data: subcat, error: null }))
    const c = useAdminSubcategories()
    const result = await c.fetchById('cat-1')
    expect(result).toEqual(subcat)
  })

  it('returns null on error and sets fallback error message', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminSubcategories()
    const result = await c.fetchById('cat-999')
    expect(result).toBeNull()
    // Pattern B: plain Supabase error → fallback string
    expect(c.error.value).toBe('Error fetching subcategory')
  })
})

// ─── createSubcategory ────────────────────────────────────────────────────

describe('createSubcategory', () => {
  const formData = {
    name_es: 'Tractores',
    name_en: 'Tractors',
    slug: 'tractores',
    applicable_categories: [],
    applicable_filters: [],
    status: 'active',
    sort_order: 1,
  }

  it('returns new id on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'new-cat' }, error: null }))
    const c = useAdminSubcategories()
    const id = await c.createSubcategory(formData)
    expect(id).toBe('new-cat')
    expect(c.saving.value).toBe(false)
  })

  it('uses slugify when slug is empty', async () => {
    const chain = makeChain({ data: { id: 'x' }, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminSubcategories()
    await c.createSubcategory({ ...formData, slug: '' })
    // slug from slugify mock ('test-slug') is passed to insert
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'test-slug' }),
    )
  })

  it('returns null on error with pattern A (supabaseError.message)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Duplicate slug' } }))
    const c = useAdminSubcategories()
    const id = await c.createSubcategory(formData)
    expect(id).toBeNull()
    expect(c.error.value).toBe('Duplicate slug')
  })
})

// ─── updateSubcategory ────────────────────────────────────────────────────

describe('updateSubcategory', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminSubcategories()
    const ok = await c.updateSubcategory('cat-1', { status: 'inactive' })
    expect(ok).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error with pattern A (supabaseError.message)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update error' } }))
    const c = useAdminSubcategories()
    const ok = await c.updateSubcategory('cat-1', { name_es: '' })
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Update error')
  })
})

// ─── deleteSubcategory ────────────────────────────────────────────────────

describe('deleteSubcategory', () => {
  it('returns true and removes item from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminSubcategories()
    c.subcategories.value.push(makeSubcat({ id: 'cat-1' }) as never)
    c.subcategories.value.push(makeSubcat({ id: 'cat-2' }) as never)
    const ok = await c.deleteSubcategory('cat-1')
    expect(ok).toBe(true)
    expect(c.subcategories.value).toHaveLength(1)
    expect(c.subcategories.value[0]!.id).toBe('cat-2')
  })

  it('returns false on error with pattern B (instanceof → fallback)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'FK constraint' } }))
    const c = useAdminSubcategories()
    const ok = await c.deleteSubcategory('cat-1')
    expect(ok).toBe(false)
    // Plain Supabase object is not instanceof Error → fallback
    expect(c.error.value).toBe('Error deleting subcategory')
  })
})

// ─── toggleStatus ─────────────────────────────────────────────────────────

describe('toggleStatus', () => {
  it('delegates to updateSubcategory and returns true', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminSubcategories()
    const ok = await c.toggleStatus('cat-1', 'inactive')
    expect(ok).toBe(true)
  })
})

// ─── moveUp ───────────────────────────────────────────────────────────────

describe('moveUp', () => {
  it('returns false when item is already first (index 0)', async () => {
    const c = useAdminSubcategories()
    c.subcategories.value.push(makeSubcat({ id: 'cat-1', sort_order: 1 }) as never)
    const ok = await c.moveUp('cat-1')
    expect(ok).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns true and calls reorder + fetchSubcategories on success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subcategory_categories') return makeChain({ data: [], error: null })
      if (table === 'vehicles') return makeChain({ data: [], error: null })
      return makeChain({ data: [], error: null }) // categories: reorder updates + fetchSubcategories
    })
    const c = useAdminSubcategories()
    c.subcategories.value.push(makeSubcat({ id: 'cat-1', sort_order: 1 }) as never)
    c.subcategories.value.push(makeSubcat({ id: 'cat-2', sort_order: 2 }) as never)
    const ok = await c.moveUp('cat-2')
    expect(ok).toBe(true)
  })

  it('returns false when reorder fails', async () => {
    // All categories calls fail → reorder throws → returns false
    mockFrom.mockImplementation((table: string) => {
      if (table === 'categories')
        return makeChain({ data: null, error: { message: 'reorder error' } })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminSubcategories()
    c.subcategories.value.push(makeSubcat({ id: 'cat-1', sort_order: 1 }) as never)
    c.subcategories.value.push(makeSubcat({ id: 'cat-2', sort_order: 2 }) as never)
    const ok = await c.moveUp('cat-2')
    expect(ok).toBe(false)
  })
})

// ─── moveDown ─────────────────────────────────────────────────────────────

describe('moveDown', () => {
  it('returns false when item is already last', async () => {
    const c = useAdminSubcategories()
    c.subcategories.value.push(makeSubcat({ id: 'cat-1', sort_order: 1 }) as never)
    c.subcategories.value.push(makeSubcat({ id: 'cat-2', sort_order: 2 }) as never)
    const ok = await c.moveDown('cat-2')
    expect(ok).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns true and calls reorder + fetchSubcategories on success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subcategory_categories') return makeChain({ data: [], error: null })
      if (table === 'vehicles') return makeChain({ data: [], error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminSubcategories()
    c.subcategories.value.push(makeSubcat({ id: 'cat-1', sort_order: 1 }) as never)
    c.subcategories.value.push(makeSubcat({ id: 'cat-2', sort_order: 2 }) as never)
    const ok = await c.moveDown('cat-1')
    expect(ok).toBe(true)
  })

  it('returns false when id not found in list', async () => {
    const c = useAdminSubcategories()
    c.subcategories.value.push(makeSubcat({ id: 'cat-1', sort_order: 1 }) as never)
    const ok = await c.moveDown('nonexistent')
    expect(ok).toBe(false)
  })
})

// ─── getLinkedSubcategories ───────────────────────────────────────────────

describe('getLinkedSubcategories', () => {
  it('returns array of subcategory_ids on success', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: [{ subcategory_id: 'sub-1' }, { subcategory_id: 'sub-2' }],
        error: null,
      }),
    )
    const c = useAdminSubcategories()
    const result = await c.getLinkedSubcategories('cat-1')
    expect(result).toEqual(['sub-1', 'sub-2'])
  })

  it('returns empty array when error occurs (catch swallows)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))
    const c = useAdminSubcategories()
    const result = await c.getLinkedSubcategories('cat-1')
    expect(result).toEqual([])
  })

  it('returns empty array when data is empty', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    const c = useAdminSubcategories()
    const result = await c.getLinkedSubcategories('cat-1')
    expect(result).toEqual([])
  })
})

// ─── clearError ───────────────────────────────────────────────────────────

describe('clearError', () => {
  it('resets error.value to null', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminSubcategories()
    c.error.value = 'some previous error' as never
    c.clearError()
    expect(c.error.value).toBeNull()
  })
})
