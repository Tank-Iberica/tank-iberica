import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminVehicles } from '../../app/composables/admin/useAdminVehicles'

// ─── Mock slugify ─────────────────────────────────────────────────────────

vi.mock('~/utils/fileNaming', () => ({
  slugify: vi.fn().mockReturnValue('test-slug'),
}))

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = [
  'select', 'eq', 'order', 'limit', 'range', 'in', 'or',
  'insert', 'update', 'delete', 'single',
]

function makeChain(result: { data?: unknown; error?: unknown; count?: number } = {}) {
  const resolved = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? 0,
  }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v-1',
    brand: 'Volvo',
    model: 'FH',
    year: 2020,
    price: 80000,
    status: 'published',
    category: 'venta',
    is_online: true,
    category_id: 'cat-1',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('vehicles starts as empty array', () => {
    const c = useAdminVehicles()
    expect(c.vehicles.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminVehicles()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminVehicles()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminVehicles()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminVehicles()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchVehicles ────────────────────────────────────────────────────────

describe('fetchVehicles', () => {
  it('sets vehicles and total on success', async () => {
    const vehicle = makeVehicle()
    mockFrom.mockReturnValue(makeChain({ data: [vehicle], error: null, count: 1 }))
    const c = useAdminVehicles()
    await c.fetchVehicles()
    expect(c.vehicles.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error and empties vehicles on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))
    const c = useAdminVehicles()
    await c.fetchVehicles()
    expect(c.error.value).toBe('DB error')
    expect(c.vehicles.value).toEqual([])
    expect(c.loading.value).toBe(false)
  })

  it('applies status filter via eq()', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminVehicles()
    await c.fetchVehicles({ status: 'published' })
    expect(chain.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('applies category filter via eq()', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminVehicles()
    await c.fetchVehicles({ category: 'venta' })
    expect(chain.eq).toHaveBeenCalledWith('category', 'venta')
  })

  it('applies search filter via or()', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminVehicles()
    await c.fetchVehicles({ search: 'volvo' })
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('volvo'))
  })

  it('applies is_online filter (true)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminVehicles()
    await c.fetchVehicles({ is_online: true })
    expect(chain.eq).toHaveBeenCalledWith('is_online', true)
  })

  it('applies is_online filter (false — falsy but not null)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminVehicles()
    await c.fetchVehicles({ is_online: false })
    expect(chain.eq).toHaveBeenCalledWith('is_online', false)
  })

  it('category_id filter (links found) calls in() with subcategory ids', async () => {
    const linksChain = makeChain({ data: [{ subcategory_id: 'sub-1' }], error: null })
    const vehiclesChain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subcategory_categories') return linksChain
      return vehiclesChain
    })
    const c = useAdminVehicles()
    await c.fetchVehicles({ category_id: 'cat-1' })
    expect(vehiclesChain.in).toHaveBeenCalledWith('subcategory_id', ['sub-1'])
  })

  it('category_id filter (no links) sets vehicles=[] and total=0 early', async () => {
    const linksChain = makeChain({ data: [], error: null })
    const vehiclesChain = makeChain({ data: [makeVehicle()], error: null, count: 1 })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subcategory_categories') return linksChain
      return vehiclesChain
    })
    const c = useAdminVehicles()
    await c.fetchVehicles({ category_id: 'cat-1' })
    expect(c.vehicles.value).toEqual([])
    expect(c.total.value).toBe(0)
    expect(c.loading.value).toBe(false)
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns vehicle on success', async () => {
    const vehicle = makeVehicle()
    mockFrom.mockReturnValue(makeChain({ data: vehicle, error: null }))
    const c = useAdminVehicles()
    const result = await c.fetchById('v-1')
    expect(result).toEqual(vehicle)
  })

  it('returns null on error and sets error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminVehicles()
    const result = await c.fetchById('v-999')
    expect(result).toBeNull()
    expect(c.error.value).toBe('Not found')
  })
})

// ─── createVehicle ────────────────────────────────────────────────────────

describe('createVehicle', () => {
  const baseForm = {
    brand: 'Volvo', model: 'FH', year: 2022, price: 90000,
    rental_price: null, category: 'venta' as const, subcategory_id: null,
    location: null, location_en: null, location_country: null,
    location_province: null, location_region: null,
    description_es: null, description_en: null,
    attributes_json: {}, status: 'draft', featured: false, is_online: true,
  }

  it('returns new id on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'new-id' }, error: null }))
    const c = useAdminVehicles()
    const id = await c.createVehicle(baseForm)
    expect(id).toBe('new-id')
    expect(c.saving.value).toBe(false)
  })

  it('inserts with slug from slugify', async () => {
    const vehiclesChain = makeChain({ data: { id: 'x' }, error: null })
    mockFrom.mockReturnValue(vehiclesChain)
    const c = useAdminVehicles()
    await c.createVehicle(baseForm)
    expect(vehiclesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'test-slug' }),
    )
  })

  it('returns null on error and sets error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Insert failed' } }))
    const c = useAdminVehicles()
    const id = await c.createVehicle({ ...baseForm, brand: 'DAF', model: 'CF', year: null, price: null })
    expect(id).toBeNull()
    expect(c.error.value).toBe('Insert failed')
  })
})

// ─── updateVehicle ────────────────────────────────────────────────────────

describe('updateVehicle', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminVehicles()
    const ok = await c.updateVehicle('v-1', { status: 'published' })
    expect(ok).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error and sets error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update error' } }))
    const c = useAdminVehicles()
    const ok = await c.updateVehicle('v-1', { price: -1 })
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Update error')
  })
})

// ─── deleteVehicle ────────────────────────────────────────────────────────

describe('deleteVehicle', () => {
  it('returns true and removes vehicle from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminVehicles()
    c.vehicles.value.push(makeVehicle({ id: 'v-1' }) as never)
    c.vehicles.value.push(makeVehicle({ id: 'v-2' }) as never)
    const ok = await c.deleteVehicle('v-1')
    expect(ok).toBe(true)
    expect(c.vehicles.value).toHaveLength(1)
    expect(c.vehicles.value[0]!.id).toBe('v-2')
  })

  it('returns false and keeps vehicles list on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Delete error' } }))
    const c = useAdminVehicles()
    c.vehicles.value.push(makeVehicle({ id: 'v-1' }) as never)
    const ok = await c.deleteVehicle('v-1')
    expect(ok).toBe(false)
    expect(c.vehicles.value).toHaveLength(1)
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('delegates to updateVehicle and returns true', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminVehicles()
    const ok = await c.updateStatus('v-1', 'paused')
    expect(ok).toBe(true)
  })
})

// ─── toggleFeatured ───────────────────────────────────────────────────────

describe('toggleFeatured', () => {
  it('delegates to updateVehicle and returns true', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminVehicles()
    const ok = await c.toggleFeatured('v-1', true)
    expect(ok).toBe(true)
  })
})

// ─── archiveVehicle ───────────────────────────────────────────────────────

describe('archiveVehicle', () => {
  const saleData = { sale_price: 50000, sale_category: 'venta' }

  it('returns true when all calls succeed', async () => {
    const vehicle = makeVehicle()
    let vehiclesCall = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') {
        vehiclesCall++
        // 1st call = fetchById (select+single), 2nd call = update
        return vehiclesCall === 1
          ? makeChain({ data: vehicle, error: null })
          : makeChain({ data: null, error: null })
      }
      return makeChain({ data: null, error: null }) // historico insert
    })
    const c = useAdminVehicles()
    const ok = await c.archiveVehicle('v-1', saleData)
    expect(ok).toBe(true)
  })

  it('returns false when fetchById returns null (vehicle not found)', async () => {
    // Chain returns data: null → fetchById returns null → throws Error
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminVehicles()
    const ok = await c.archiveVehicle('v-999', saleData)
    expect(ok).toBe(false)
  })

  it('returns false when historico insert fails', async () => {
    const vehicle = makeVehicle()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return makeChain({ data: vehicle, error: null })
      return makeChain({ data: null, error: { message: 'historico insert error' } })
    })
    const c = useAdminVehicles()
    const ok = await c.archiveVehicle('v-1', saleData)
    expect(ok).toBe(false)
  })

  it('returns false when vehicles update fails', async () => {
    const vehicle = makeVehicle()
    let vehiclesCall = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') {
        vehiclesCall++
        return vehiclesCall === 1
          ? makeChain({ data: vehicle, error: null })
          : makeChain({ data: null, error: { message: 'update failed' } })
      }
      return makeChain({ data: null, error: null }) // historico succeeds
    })
    const c = useAdminVehicles()
    const ok = await c.archiveVehicle('v-1', saleData)
    expect(ok).toBe(false)
  })
})

// ─── addImage ─────────────────────────────────────────────────────────────

describe('addImage', () => {
  const imageData = {
    cloudinary_public_id: 'tracciona/vehicles/test',
    url: 'https://example.com/img.jpg',
  }

  it('returns true on success with no existing images (position=0)', async () => {
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      if (callIndex === 1) return makeChain({ data: [], error: null }) // select max position
      return makeChain({ data: null, error: null }) // insert
    })
    const c = useAdminVehicles()
    const ok = await c.addImage('v-1', imageData)
    expect(ok).toBe(true)
  })

  it('inserts at maxPosition + 1 when existing images present', async () => {
    let callIndex = 0
    const insertChain = makeChain({ data: null, error: null })
    mockFrom.mockImplementation(() => {
      callIndex++
      if (callIndex === 1) return makeChain({ data: [{ position: 3 }], error: null })
      return insertChain
    })
    const c = useAdminVehicles()
    await c.addImage('v-1', imageData)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ position: 4 }),
    )
  })

  it('returns false on insert error', async () => {
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      if (callIndex === 1) return makeChain({ data: [], error: null })
      return makeChain({ data: null, error: { message: 'Insert failed' } })
    })
    const c = useAdminVehicles()
    const ok = await c.addImage('v-1', imageData)
    expect(ok).toBe(false)
  })
})

// ─── deleteImage ──────────────────────────────────────────────────────────

describe('deleteImage', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminVehicles()
    const ok = await c.deleteImage('img-1')
    expect(ok).toBe(true)
  })

  it('returns false on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Delete error' } }))
    const c = useAdminVehicles()
    const ok = await c.deleteImage('img-1')
    expect(ok).toBe(false)
  })
})

// ─── reorderImages ────────────────────────────────────────────────────────

describe('reorderImages', () => {
  it('returns true when all updates succeed', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminVehicles()
    const ok = await c.reorderImages([
      { id: 'img-1', position: 0 },
      { id: 'img-2', position: 1 },
    ])
    expect(ok).toBe(true)
  })

  it('returns false when an update fails', async () => {
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      if (callIndex === 2) return makeChain({ data: null, error: { message: 'Update error' } })
      return makeChain({ data: null, error: null })
    })
    const c = useAdminVehicles()
    const ok = await c.reorderImages([
      { id: 'img-1', position: 0 },
      { id: 'img-2', position: 1 },
    ])
    expect(ok).toBe(false)
  })

  it('returns true for empty array (zero iterations)', async () => {
    const c = useAdminVehicles()
    const ok = await c.reorderImages([])
    expect(ok).toBe(true)
  })
})
