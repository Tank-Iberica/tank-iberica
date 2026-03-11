import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminHistorico, SALE_CATEGORIES } from '../../app/composables/admin/useAdminHistorico'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = [
  'select', 'eq', 'gte', 'lte', 'ilike', 'or', 'order', 'single', 'insert', 'delete',
]

function makeChain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'h-1',
    original_vehicle_id: 'v-1',
    brand: 'Volvo',
    model: 'FH16',
    year: 2020,
    category_id: 'cat-1',
    original_price: 80000,
    sale_price: 75000,
    sale_date: '2024-01-15',
    sale_category: 'venta' as const,
    buyer_name: 'Juan',
    buyer_contact: '600000000',
    acquisition_cost: 60000,
    total_maintenance: 5000,
    total_rental_income: 0,
    total_cost: 65000,
    benefit: 10000,
    benefit_percent: 15,
    vehicle_data: null,
    maintenance_history: [],
    rental_history: [],
    archived_at: '2024-01-15',
    created_at: '2024-01-15',
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

// ─── SALE_CATEGORIES ──────────────────────────────────────────────────────

describe('SALE_CATEGORIES', () => {
  it('has exactly 3 keys', () => {
    expect(Object.keys(SALE_CATEGORIES)).toHaveLength(3)
  })

  it('contains venta, terceros, exportacion keys', () => {
    expect(SALE_CATEGORIES).toHaveProperty('venta')
    expect(SALE_CATEGORIES).toHaveProperty('terceros')
    expect(SALE_CATEGORIES).toHaveProperty('exportacion')
  })

  it('maps keys to display labels', () => {
    expect(SALE_CATEGORIES.venta).toBe('Venta')
    expect(SALE_CATEGORIES.terceros).toBe('Terceros')
    expect(SALE_CATEGORIES.exportacion).toBe('Exportación')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('entries starts as empty array', () => {
    const c = useAdminHistorico()
    expect(c.entries.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminHistorico()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminHistorico()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminHistorico()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminHistorico()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchEntries ─────────────────────────────────────────────────────────

describe('fetchEntries', () => {
  it('sets entries and total on success', async () => {
    const entry = makeEntry()
    mockFrom.mockReturnValue(makeChain({ data: [entry], error: null, count: 1 }))
    const c = useAdminHistorico()
    await c.fetchEntries()
    expect(c.entries.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('defaults total to 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: null }))
    const c = useAdminHistorico()
    await c.fetchEntries()
    expect(c.total.value).toBe(0)
  })

  it('populates availableBrands from returned data', async () => {
    const entry = makeEntry({ brand: 'Volvo', sale_date: '2024-01-15' })
    mockFrom.mockReturnValue(makeChain({ data: [entry], error: null, count: 1 }))
    const c = useAdminHistorico()
    await c.fetchEntries()
    expect(c.availableBrands.value).toContain('Volvo')
  })

  it('sets error and empties entries on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' }, count: null }))
    const c = useAdminHistorico()
    await c.fetchEntries()
    expect(c.error.value).toBe('DB error')
    expect(c.entries.value).toEqual([])
    expect(c.loading.value).toBe(false)
  })

  it('applies year filter (gte + lte)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminHistorico()
    await c.fetchEntries({ year: 2024 })
    expect(chain.gte).toHaveBeenCalledWith('sale_date', '2024-01-01')
    expect(chain.lte).toHaveBeenCalledWith('sale_date', '2024-12-31')
  })

  it('applies sale_category filter (eq)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminHistorico()
    await c.fetchEntries({ sale_category: 'venta' })
    expect(chain.eq).toHaveBeenCalledWith('sale_category', 'venta')
  })

  it('applies brand filter (ilike)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminHistorico()
    await c.fetchEntries({ brand: 'Volvo' })
    expect(chain.ilike).toHaveBeenCalledWith('brand', '%Volvo%')
  })

  it('applies search filter (or with brand/model/buyer_name)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminHistorico()
    await c.fetchEntries({ search: 'truck' })
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('brand.ilike.%truck%'))
  })

  it('skips filters when values are null or undefined', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminHistorico()
    await c.fetchEntries({ year: null, sale_category: null, brand: null })
    expect(chain.gte).not.toHaveBeenCalled()
    expect(chain.ilike).not.toHaveBeenCalled()
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns entry on success', async () => {
    const entry = makeEntry()
    mockFrom.mockReturnValue(makeChain({ data: entry, error: null }))
    const c = useAdminHistorico()
    const result = await c.fetchById('h-1')
    expect(result).toEqual(entry)
  })

  it('returns null and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminHistorico()
    const result = await c.fetchById('nonexistent')
    expect(result).toBeNull()
    expect(c.error.value).toBe('Not found')
  })

  it('loading is false after completion', async () => {
    mockFrom.mockReturnValue(makeChain({ data: makeEntry(), error: null }))
    const c = useAdminHistorico()
    await c.fetchById('h-1')
    expect(c.loading.value).toBe(false)
  })
})

// ─── deleteEntry ──────────────────────────────────────────────────────────

describe('deleteEntry', () => {
  it('returns true and removes entry from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminHistorico()
    c.entries.value.push(makeEntry({ id: 'h-1' }) as never)
    c.entries.value.push(makeEntry({ id: 'h-2' }) as never)
    c.total.value = 2
    const ok = await c.deleteEntry('h-1')
    expect(ok).toBe(true)
    expect(c.entries.value).toHaveLength(1)
    expect(c.entries.value[0]!.id).toBe('h-2')
  })

  it('decrements total on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminHistorico()
    c.entries.value.push(makeEntry({ id: 'h-1' }) as never)
    c.total.value = 1
    await c.deleteEntry('h-1')
    expect(c.total.value).toBe(0)
  })

  it('returns false and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'FK constraint' } }))
    const c = useAdminHistorico()
    const ok = await c.deleteEntry('h-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('FK constraint')
  })

  it('saving is false after completion', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminHistorico()
    await c.deleteEntry('h-1')
    expect(c.saving.value).toBe(false)
  })
})

// ─── restoreVehicle ───────────────────────────────────────────────────────

describe('restoreVehicle', () => {
  it('returns true on success (null vehicle_data, no original_vehicle_id)', async () => {
    const entry = makeEntry({ vehicle_data: null, original_vehicle_id: null })
    let historicoCalls = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'historico') {
        historicoCalls++
        return historicoCalls === 1
          ? makeChain({ data: entry, error: null }) // fetchById
          : makeChain({ data: null, error: null }) // final delete
      }
      return makeChain({ data: null, error: null }) // vehicles insert
    })
    const c = useAdminHistorico()
    const ok = await c.restoreVehicle('h-1')
    expect(ok).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('removes entry from local list and decrements total on success', async () => {
    const entry = makeEntry({ vehicle_data: null, original_vehicle_id: null })
    let historicoCalls = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'historico') {
        historicoCalls++
        return historicoCalls === 1
          ? makeChain({ data: entry, error: null })
          : makeChain({ data: null, error: null })
      }
      return makeChain({ data: null, error: null })
    })
    const c = useAdminHistorico()
    c.entries.value.push(makeEntry({ id: 'h-1' }) as never)
    c.total.value = 1
    await c.restoreVehicle('h-1')
    expect(c.entries.value).toHaveLength(0)
    expect(c.total.value).toBe(0)
  })

  it('inserts vehicle with brand/model/status when vehicle_data is null', async () => {
    const entry = makeEntry({ vehicle_data: null, original_vehicle_id: null })
    let historicoCalls = 0
    const vehiclesChain = makeChain({ data: null, error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'historico') {
        historicoCalls++
        return historicoCalls === 1
          ? makeChain({ data: entry, error: null })
          : makeChain({ data: null, error: null })
      }
      return vehiclesChain
    })
    const c = useAdminHistorico()
    await c.restoreVehicle('h-1')
    expect(vehiclesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ brand: 'Volvo', model: 'FH16', status: 'draft' }),
    )
  })

  it('returns false and sets error when fetchById returns null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminHistorico()
    const ok = await c.restoreVehicle('ghost')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Entry not found')
  })

  it('returns false when vehicles insert fails', async () => {
    const entry = makeEntry({ vehicle_data: null, original_vehicle_id: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'historico') return makeChain({ data: entry, error: null })
      if (table === 'vehicles') return makeChain({ data: null, error: { message: 'Insert failed' } })
      return makeChain()
    })
    const c = useAdminHistorico()
    const ok = await c.restoreVehicle('h-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Insert failed')
  })

  it('returns false when historico delete fails', async () => {
    const entry = makeEntry({ vehicle_data: null, original_vehicle_id: null })
    let historicoCalls = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'historico') {
        historicoCalls++
        return historicoCalls === 1
          ? makeChain({ data: entry, error: null })
          : makeChain({ data: null, error: { message: 'Delete failed' } })
      }
      return makeChain({ data: null, error: null }) // vehicles
    })
    const c = useAdminHistorico()
    const ok = await c.restoreVehicle('h-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Delete failed')
  })
})

// ─── summary structure ────────────────────────────────────────────────────

describe('summary', () => {
  it('has all required properties', () => {
    const c = useAdminHistorico()
    const s = c.summary.value
    expect(s).toHaveProperty('totalVentas')
    expect(s).toHaveProperty('totalIngresos')
    expect(s).toHaveProperty('totalBeneficio')
    expect(s).toHaveProperty('avgBeneficioPercent')
    expect(s).toHaveProperty('byCategory')
    expect(s).toHaveProperty('byType')
  })

  it('starts with all zeros and empty aggregates', () => {
    const c = useAdminHistorico()
    const s = c.summary.value
    expect(s.totalVentas).toBe(0)
    expect(s.totalIngresos).toBe(0)
    expect(s.totalBeneficio).toBe(0)
    expect(s.avgBeneficioPercent).toBe(0)
    expect(s.byCategory).toEqual({})
    expect(s.byType).toEqual({})
  })
})
