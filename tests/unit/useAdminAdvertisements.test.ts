import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminAdvertisements, ADVERTISEMENT_STATUSES } from '../../app/composables/admin/useAdminAdvertisements'

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null, count: 0 }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'or', 'order', 'limit', 'single', 'match', 'range',
  ]) {
    chain[m] = () => chain
  }
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null, count: 0 }))
})

// ─── ADVERTISEMENT_STATUSES ───────────────────────────────────────────────

describe('ADVERTISEMENT_STATUSES', () => {
  it('has 4 statuses', () => {
    expect(ADVERTISEMENT_STATUSES).toHaveLength(4)
  })

  it('includes pending, contacted, matched, archived', () => {
    const values = ADVERTISEMENT_STATUSES.map(s => s.value)
    expect(values).toContain('pending')
    expect(values).toContain('contacted')
    expect(values).toContain('matched')
    expect(values).toContain('archived')
  })

  it('each status has value, label, and color', () => {
    for (const s of ADVERTISEMENT_STATUSES) {
      expect(s.value).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.color).toBeTruthy()
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('advertisements starts as empty array', () => {
    const c = useAdminAdvertisements()
    expect(c.advertisements.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminAdvertisements()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminAdvertisements()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminAdvertisements()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminAdvertisements()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchAdvertisements ──────────────────────────────────────────────────

describe('fetchAdvertisements', () => {
  it('calls supabase.from("advertisements")', async () => {
    const c = useAdminAdvertisements()
    await c.fetchAdvertisements()
    expect(mockFrom).toHaveBeenCalledWith('advertisements')
  })

  it('populates advertisements from data', async () => {
    const data = [{ id: 'a-1', status: 'pending', contact_name: 'John' }]
    mockFrom.mockReturnValue(makeChain({ data, error: null, count: 1 }))
    const c = useAdminAdvertisements()
    await c.fetchAdvertisements()
    expect(c.advertisements.value).toHaveLength(1)
    expect(c.advertisements.value[0]).toMatchObject({ id: 'a-1' })
  })

  it('sets total from count', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: 42 }))
    const c = useAdminAdvertisements()
    await c.fetchAdvertisements()
    expect(c.total.value).toBe(42)
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminAdvertisements()
    await c.fetchAdvertisements()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on fetch failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('Network error'), count: 0 }))
    const c = useAdminAdvertisements()
    await c.fetchAdvertisements()
    expect(c.error.value).toBe('Network error')
  })

  it('clears advertisements on error', async () => {
    const c = useAdminAdvertisements()
    c.advertisements.value = [{ id: 'a-1' }] as never
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail'), count: 0 }))
    await c.fetchAdvertisements()
    expect(c.advertisements.value).toEqual([])
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('calls supabase.from("advertisements")', async () => {
    const c = useAdminAdvertisements()
    await c.fetchById('a-1')
    expect(mockFrom).toHaveBeenCalledWith('advertisements')
  })

  it('returns data on success', async () => {
    const ad = { id: 'a-1', status: 'pending', contact_name: 'Jane' }
    mockFrom.mockReturnValue(makeChain({ data: ad, error: null }))
    const c = useAdminAdvertisements()
    const result = await c.fetchById('a-1')
    expect(result).toMatchObject({ id: 'a-1' })
  })

  it('returns null on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('not found') }))
    const c = useAdminAdvertisements()
    const result = await c.fetchById('missing')
    expect(result).toBeNull()
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminAdvertisements()
    await c.fetchById('a-1')
    expect(c.loading.value).toBe(false)
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('calls supabase.from("advertisements")', async () => {
    const c = useAdminAdvertisements()
    await c.updateStatus('a-1', 'contacted')
    expect(mockFrom).toHaveBeenCalledWith('advertisements')
  })

  it('returns true on success', async () => {
    const c = useAdminAdvertisements()
    const result = await c.updateStatus('a-1', 'contacted')
    expect(result).toBe(true)
  })

  it('updates status in local advertisements list', async () => {
    const c = useAdminAdvertisements()
    c.advertisements.value = [{ id: 'a-1', status: 'pending' } as never]
    await c.updateStatus('a-1', 'contacted')
    expect(c.advertisements.value[0]!.status).toBe('contacted')
  })

  it('sets saving to false after completion', async () => {
    const c = useAdminAdvertisements()
    await c.updateStatus('a-1', 'contacted')
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('update failed') }))
    const c = useAdminAdvertisements()
    const result = await c.updateStatus('a-1', 'contacted')
    expect(result).toBe(false)
  })

  it('sets error message on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('update failed') }))
    const c = useAdminAdvertisements()
    await c.updateStatus('a-1', 'contacted')
    expect(c.error.value).toBe('update failed')
  })
})

// ─── updateNotes ──────────────────────────────────────────────────────────

describe('updateNotes', () => {
  it('calls supabase.from("advertisements")', async () => {
    const c = useAdminAdvertisements()
    await c.updateNotes('a-1', 'Some notes')
    expect(mockFrom).toHaveBeenCalledWith('advertisements')
  })

  it('returns true on success', async () => {
    const c = useAdminAdvertisements()
    const result = await c.updateNotes('a-1', 'My note')
    expect(result).toBe(true)
  })

  it('updates admin_notes in local advertisements list', async () => {
    const c = useAdminAdvertisements()
    c.advertisements.value = [{ id: 'a-1', admin_notes: null } as never]
    await c.updateNotes('a-1', 'New note')
    expect(c.advertisements.value[0]!.admin_notes).toBe('New note')
  })

  it('sets saving to false after completion', async () => {
    const c = useAdminAdvertisements()
    await c.updateNotes('a-1', 'Note')
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('notes error') }))
    const c = useAdminAdvertisements()
    const result = await c.updateNotes('a-1', 'Note')
    expect(result).toBe(false)
  })
})

// ─── matchVehicle ─────────────────────────────────────────────────────────

describe('matchVehicle', () => {
  it('calls supabase.from("advertisements")', async () => {
    const c = useAdminAdvertisements()
    await c.matchVehicle('a-1', 'v-1')
    expect(mockFrom).toHaveBeenCalledWith('advertisements')
  })

  it('returns true on success with vehicleId', async () => {
    const c = useAdminAdvertisements()
    const result = await c.matchVehicle('a-1', 'v-1')
    expect(result).toBe(true)
  })

  it('returns true when vehicleId is null (unmatch)', async () => {
    const c = useAdminAdvertisements()
    const result = await c.matchVehicle('a-1', null)
    expect(result).toBe(true)
  })

  it('sets saving to false after completion', async () => {
    const c = useAdminAdvertisements()
    await c.matchVehicle('a-1', 'v-1')
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('match error') }))
    const c = useAdminAdvertisements()
    const result = await c.matchVehicle('a-1', 'v-1')
    expect(result).toBe(false)
  })
})

// ─── deleteAdvertisement ──────────────────────────────────────────────────

describe('deleteAdvertisement', () => {
  it('calls supabase.from("advertisements")', async () => {
    const c = useAdminAdvertisements()
    await c.deleteAdvertisement('a-1')
    expect(mockFrom).toHaveBeenCalledWith('advertisements')
  })

  it('returns true on success', async () => {
    const c = useAdminAdvertisements()
    const result = await c.deleteAdvertisement('a-1')
    expect(result).toBe(true)
  })

  it('removes advertisement from local list', async () => {
    const c = useAdminAdvertisements()
    c.advertisements.value = [
      { id: 'a-1', status: 'pending' } as never,
      { id: 'a-2', status: 'contacted' } as never,
    ]
    await c.deleteAdvertisement('a-1')
    expect(c.advertisements.value).toHaveLength(1)
    expect(c.advertisements.value[0]!.id).toBe('a-2')
  })

  it('decrements total', async () => {
    const c = useAdminAdvertisements()
    c.total.value = 5
    await c.deleteAdvertisement('a-1')
    expect(c.total.value).toBe(4)
  })

  it('sets saving to false after completion', async () => {
    const c = useAdminAdvertisements()
    await c.deleteAdvertisement('a-1')
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('delete error') }))
    const c = useAdminAdvertisements()
    const result = await c.deleteAdvertisement('a-1')
    expect(result).toBe(false)
  })
})

// ─── getPendingCount ──────────────────────────────────────────────────────

describe('getPendingCount', () => {
  it('calls supabase.from("advertisements")', async () => {
    const c = useAdminAdvertisements()
    await c.getPendingCount()
    expect(mockFrom).toHaveBeenCalledWith('advertisements')
  })

  it('returns count from supabase', async () => {
    mockFrom.mockReturnValue(makeChain({ count: 7, error: null }))
    const c = useAdminAdvertisements()
    const result = await c.getPendingCount()
    expect(result).toBe(7)
  })

  it('returns 0 on error', async () => {
    mockFrom.mockReturnValue(makeChain({ count: null, error: new Error('count error') }))
    const c = useAdminAdvertisements()
    const result = await c.getPendingCount()
    expect(result).toBe(0)
  })

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ count: null, error: null }))
    const c = useAdminAdvertisements()
    const result = await c.getPendingCount()
    expect(result).toBe(0)
  })
})
