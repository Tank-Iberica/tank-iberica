import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminDemands, DEMAND_STATUSES } from '../../app/composables/admin/useAdminDemands'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'or', 'order', 'range', 'single', 'update', 'delete']

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

function makeDemand(overrides: Record<string, unknown> = {}) {
  return {
    id: 'd-1',
    user_id: null,
    vehicle_type: 'camión',
    category_id: 'cat-1',
    subcategory_id: null,
    attributes_json: {},
    brand_preference: 'Volvo',
    year_min: 2018,
    year_max: null,
    price_min: 30000,
    price_max: 80000,
    specs: null,
    location: 'Madrid',
    description: 'Busco camión rígido',
    contact_name: 'Pedro',
    contact_phone: '600123456',
    contact_email: null,
    contact_preference: 'phone',
    status: 'pending' as const,
    match_vehicle_id: null,
    admin_notes: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
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

// ─── DEMAND_STATUSES constant ──────────────────────────────────────────────

describe('DEMAND_STATUSES', () => {
  it('has 4 entries', () => {
    expect(DEMAND_STATUSES).toHaveLength(4)
  })

  it('contains pending, contacted, matched, archived values', () => {
    const values = DEMAND_STATUSES.map((s) => s.value)
    expect(values).toContain('pending')
    expect(values).toContain('contacted')
    expect(values).toContain('matched')
    expect(values).toContain('archived')
  })

  it('each entry has value, label, color', () => {
    for (const entry of DEMAND_STATUSES) {
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('color')
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('demands starts as empty array', () => {
    const c = useAdminDemands()
    expect(c.demands.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminDemands()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminDemands()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminDemands()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminDemands()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchDemands ─────────────────────────────────────────────────────────

describe('fetchDemands', () => {
  it('sets demands and total on success', async () => {
    const demand = makeDemand()
    mockFrom.mockReturnValue(makeChain({ data: [demand], error: null, count: 1 }))
    const c = useAdminDemands()
    await c.fetchDemands()
    expect(c.demands.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error and empties demands on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' }, count: null }))
    const c = useAdminDemands()
    await c.fetchDemands()
    expect(c.error.value).toBe('DB error')
    expect(c.demands.value).toEqual([])
  })

  it('applies status filter (eq)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminDemands()
    await c.fetchDemands({ status: 'pending' })
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
  })

  it('applies search filter (or)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminDemands()
    await c.fetchDemands({ search: 'Volvo' })
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('contact_name.ilike.%Volvo%'))
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns demand on success', async () => {
    const demand = makeDemand()
    mockFrom.mockReturnValue(makeChain({ data: demand, error: null }))
    const c = useAdminDemands()
    const result = await c.fetchById('d-1')
    expect(result).toEqual(demand)
  })

  it('returns null on error (Pattern B — fallback string)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'not found' } }))
    const c = useAdminDemands()
    const result = await c.fetchById('ghost')
    expect(result).toBeNull()
    expect(c.error.value).toBe('Error fetching demand')
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('returns true and updates local demand on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminDemands()
    c.demands.value.push(makeDemand({ id: 'd-1', status: 'pending' }) as never)
    const ok = await c.updateStatus('d-1', 'contacted')
    expect(ok).toBe(true)
    expect(c.demands.value[0]!.status).toBe('contacted')
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error (Pattern B — fallback string)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' } }))
    const c = useAdminDemands()
    const ok = await c.updateStatus('d-1', 'contacted')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error updating status')
  })

  it('does not update local list when demand id not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminDemands()
    c.demands.value.push(makeDemand({ id: 'd-1', status: 'pending' }) as never)
    await c.updateStatus('d-999', 'contacted')
    expect(c.demands.value[0]!.status).toBe('pending') // unchanged
  })
})

// ─── updateNotes ──────────────────────────────────────────────────────────

describe('updateNotes', () => {
  it('returns true and updates admin_notes locally', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminDemands()
    c.demands.value.push(makeDemand({ id: 'd-1', admin_notes: null }) as never)
    const ok = await c.updateNotes('d-1', 'Llamado 3 veces')
    expect(ok).toBe(true)
    expect(c.demands.value[0]!.admin_notes).toBe('Llamado 3 veces')
  })

  it('returns false on error (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' } }))
    const c = useAdminDemands()
    const ok = await c.updateNotes('d-1', 'Note')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error updating notes')
  })
})

// ─── matchVehicle ─────────────────────────────────────────────────────────

describe('matchVehicle', () => {
  it('returns true when matching with a vehicleId', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminDemands()
    const ok = await c.matchVehicle('d-1', 'v-42')
    expect(ok).toBe(true)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ match_vehicle_id: 'v-42', status: 'matched' }),
    )
  })

  it('does not set status when vehicleId is null', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminDemands()
    await c.matchVehicle('d-1', null)
    const payload = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(payload).not.toHaveProperty('status')
    expect(payload.match_vehicle_id).toBeNull()
  })

  it('returns false on error (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' } }))
    const c = useAdminDemands()
    const ok = await c.matchVehicle('d-1', 'v-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error matching vehicle')
  })
})

// ─── deleteDemand ─────────────────────────────────────────────────────────

describe('deleteDemand', () => {
  it('returns true and removes from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminDemands()
    c.demands.value.push(makeDemand({ id: 'd-1' }) as never)
    c.demands.value.push(makeDemand({ id: 'd-2' }) as never)
    c.total.value = 2
    const ok = await c.deleteDemand('d-1')
    expect(ok).toBe(true)
    expect(c.demands.value).toHaveLength(1)
    expect(c.demands.value[0]!.id).toBe('d-2')
    expect(c.total.value).toBe(1)
  })

  it('returns false on error (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' } }))
    const c = useAdminDemands()
    const ok = await c.deleteDemand('d-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error deleting demand')
  })
})

// ─── getPendingCount ──────────────────────────────────────────────────────

describe('getPendingCount', () => {
  it('returns count on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: 5 }))
    const c = useAdminDemands()
    const count = await c.getPendingCount()
    expect(count).toBe(5)
  })

  it('returns 0 on error (silent fail)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' }, count: null }))
    const c = useAdminDemands()
    const count = await c.getPendingCount()
    expect(count).toBe(0)
  })

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: null }))
    const c = useAdminDemands()
    const count = await c.getPendingCount()
    expect(count).toBe(0)
  })
})
