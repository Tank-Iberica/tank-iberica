import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminTypes } from '../../app/composables/admin/useAdminTypes'

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

function makeType(overrides: Record<string, unknown> = {}) {
  return {
    id: 'type-1',
    name_es: 'Semirremolques',
    name_en: 'Semitrailers',
    slug: 'semirremolques',
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

// Helper: mock 2-call fetchTypes
function mockFetchTypes(typesData: unknown[], vehicleData: unknown[]) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'subcategories') return makeChain({ data: typesData, error: null })
    if (table === 'vehicles') return makeChain({ data: vehicleData, error: null })
    return makeChain()
  })
}

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('types starts as empty array', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminTypes()
    expect(c.types.value).toEqual([])
  })

  it('loading starts as false', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminTypes()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminTypes()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminTypes()
    expect(c.error.value).toBeNull()
  })
})

// ─── fetchTypes ───────────────────────────────────────────────────────────

describe('fetchTypes', () => {
  it('sets types on success', async () => {
    mockFetchTypes([makeType()], [])
    const c = useAdminTypes()
    await c.fetchTypes()
    expect(c.types.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('calculates stock_count from vehicle subcategory_id (direct mapping)', async () => {
    const type = makeType({ id: 'type-1' })
    const vehicles = [
      { subcategory_id: 'type-1' },
      { subcategory_id: 'type-1' },
      { subcategory_id: 'other' },
    ]
    mockFetchTypes([type], vehicles)
    const c = useAdminTypes()
    await c.fetchTypes()
    expect(c.types.value[0]!.stock_count).toBe(2)
  })

  it('stock_count is 0 when no vehicles match', async () => {
    mockFetchTypes([makeType({ id: 'type-x' })], [])
    const c = useAdminTypes()
    await c.fetchTypes()
    expect(c.types.value[0]!.stock_count).toBe(0)
  })

  it('sets error and empties types on subcategories query error', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subcategories')
        return makeChain({ data: null, error: { message: 'DB error' } })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminTypes()
    await c.fetchTypes()
    // Pattern B: plain Supabase error → fallback string
    expect(c.error.value).toBe('Error fetching types')
    expect(c.types.value).toEqual([])
  })

  it('handles null vehicleCounts gracefully (stock_count=0)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subcategories') return makeChain({ data: [makeType()], error: null })
      return makeChain({ data: null, error: null })
    })
    const c = useAdminTypes()
    await c.fetchTypes()
    expect(c.types.value[0]!.stock_count).toBe(0)
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns type on success', async () => {
    const type = makeType()
    mockFrom.mockReturnValue(makeChain({ data: type, error: null }))
    const c = useAdminTypes()
    const result = await c.fetchById('type-1')
    expect(result).toEqual(type)
  })

  it('returns null on error and sets fallback error message', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminTypes()
    const result = await c.fetchById('type-999')
    expect(result).toBeNull()
    // Pattern B: plain Supabase error → fallback string
    expect(c.error.value).toBe('Error fetching type')
  })
})

// ─── createType ───────────────────────────────────────────────────────────

describe('createType', () => {
  const formData = {
    name_es: 'Semirremolques',
    name_en: 'Semitrailers',
    slug: 'semirremolques',
    applicable_categories: [],
    applicable_filters: [],
    status: 'active',
    sort_order: 1,
  }

  it('returns new id on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'new-type' }, error: null }))
    const c = useAdminTypes()
    const id = await c.createType(formData)
    expect(id).toBe('new-type')
    expect(c.saving.value).toBe(false)
  })

  it('uses slugify when slug is empty', async () => {
    const chain = makeChain({ data: { id: 'x' }, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminTypes()
    await c.createType({ ...formData, slug: '' })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'test-slug' }),
    )
  })

  it('returns null on error with pattern B (instanceof → fallback)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Duplicate' } }))
    const c = useAdminTypes()
    const id = await c.createType(formData)
    expect(id).toBeNull()
    expect(c.error.value).toBe('Error creating type')
  })
})

// ─── updateType ───────────────────────────────────────────────────────────

describe('updateType', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminTypes()
    const ok = await c.updateType('type-1', { status: 'inactive' })
    expect(ok).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error with pattern B (instanceof → fallback)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update error' } }))
    const c = useAdminTypes()
    const ok = await c.updateType('type-1', { name_es: '' })
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error updating type')
  })
})

// ─── deleteType ───────────────────────────────────────────────────────────

describe('deleteType', () => {
  it('returns true and removes type from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminTypes()
    c.types.value.push(makeType({ id: 'type-1' }) as never)
    c.types.value.push(makeType({ id: 'type-2' }) as never)
    const ok = await c.deleteType('type-1')
    expect(ok).toBe(true)
    expect(c.types.value).toHaveLength(1)
    expect(c.types.value[0]!.id).toBe('type-2')
  })

  it('returns false on error with pattern B (instanceof → fallback)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'FK error' } }))
    const c = useAdminTypes()
    const ok = await c.deleteType('type-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error deleting type')
  })
})

// ─── toggleStatus ─────────────────────────────────────────────────────────

describe('toggleStatus', () => {
  it('delegates to updateType and returns true', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminTypes()
    const ok = await c.toggleStatus('type-1', 'inactive')
    expect(ok).toBe(true)
  })
})

// ─── moveUp ───────────────────────────────────────────────────────────────

describe('moveUp', () => {
  it('returns false when already at first position', async () => {
    const c = useAdminTypes()
    c.types.value.push(makeType({ id: 'type-1', sort_order: 1 }) as never)
    const ok = await c.moveUp('type-1')
    expect(ok).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns true and calls reorder + fetchTypes on success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return makeChain({ data: [], error: null })
      return makeChain({ data: [], error: null }) // subcategories: reorder + fetchTypes
    })
    const c = useAdminTypes()
    c.types.value.push(makeType({ id: 'type-1', sort_order: 1 }) as never)
    c.types.value.push(makeType({ id: 'type-2', sort_order: 2 }) as never)
    const ok = await c.moveUp('type-2')
    expect(ok).toBe(true)
  })

  it('returns false when reorder fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subcategories')
        return makeChain({ data: null, error: { message: 'reorder error' } })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminTypes()
    c.types.value.push(makeType({ id: 'type-1', sort_order: 1 }) as never)
    c.types.value.push(makeType({ id: 'type-2', sort_order: 2 }) as never)
    const ok = await c.moveUp('type-2')
    expect(ok).toBe(false)
  })
})

// ─── moveDown ─────────────────────────────────────────────────────────────

describe('moveDown', () => {
  it('returns false when already at last position', async () => {
    const c = useAdminTypes()
    c.types.value.push(makeType({ id: 'type-1', sort_order: 1 }) as never)
    c.types.value.push(makeType({ id: 'type-2', sort_order: 2 }) as never)
    const ok = await c.moveDown('type-2')
    expect(ok).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns true and calls reorder + fetchTypes on success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return makeChain({ data: [], error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminTypes()
    c.types.value.push(makeType({ id: 'type-1', sort_order: 1 }) as never)
    c.types.value.push(makeType({ id: 'type-2', sort_order: 2 }) as never)
    const ok = await c.moveDown('type-1')
    expect(ok).toBe(true)
  })

  it('returns false when id not found', async () => {
    const c = useAdminTypes()
    c.types.value.push(makeType({ id: 'type-1', sort_order: 1 }) as never)
    const ok = await c.moveDown('nonexistent')
    expect(ok).toBe(false)
  })
})
