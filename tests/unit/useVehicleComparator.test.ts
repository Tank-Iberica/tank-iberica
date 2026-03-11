import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────

// localStorage mock
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  }),
}
vi.stubGlobal('localStorage', localStorageMock)

// crypto.randomUUID
let uuidCounter = 0
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
})

// Supabase chainable mock — anonymous user by default (avoids sync)
const mockUser = { value: null as { id: string; email: string } | null }
vi.stubGlobal('useSupabaseUser', () => mockUser)

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({
  from: mockFrom,
}))

import { useVehicleComparator } from '../../app/composables/useVehicleComparator'

// ─── Chain builder ─────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'upsert', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Setup ────────────────────────────────────────────────────

// Reset module-level state between tests using the returned refs
let globalComp: ReturnType<typeof useVehicleComparator>

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.store = {}
  uuidCounter = 0
  mockUser.value = null
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))

  // Reset module-level shared state
  globalComp = useVehicleComparator()
  globalComp.comparisons.value = []
  globalComp.activeComparison.value = null
  globalComp.notes.value = new Map()
})

// ─── createComparison ─────────────────────────────────────────

describe('createComparison', () => {
  it('creates a new comparison and sets it as active', () => {
    const c = useVehicleComparator()
    c.createComparison('Mi Comparativa')
    expect(c.comparisons.value.length).toBe(1)
    expect(c.comparisons.value[0]!.name).toBe('Mi Comparativa')
    expect(c.activeComparison.value).not.toBeNull()
    expect(c.activeComparison.value!.name).toBe('Mi Comparativa')
    expect(c.activeComparison.value!.vehicle_ids).toEqual([])
  })

  it('prepends new comparison to list', () => {
    const c = useVehicleComparator()
    c.createComparison('Primero')
    c.createComparison('Segundo')
    expect(c.comparisons.value[0]!.name).toBe('Segundo')
    expect(c.comparisons.value[1]!.name).toBe('Primero')
  })

  it('calls supabase insert when user is logged in', () => {
    mockUser.value = { id: 'user-1', email: 'a@b.com' }
    const c = useVehicleComparator()
    c.createComparison('Test')
    expect(mockFrom).toHaveBeenCalledWith('vehicle_comparisons')
  })
})

// ─── isInComparison ───────────────────────────────────────────

describe('isInComparison', () => {
  it('returns false when no active comparison', () => {
    const c = useVehicleComparator()
    expect(c.isInComparison('v1')).toBe(false)
  })

  it('returns true when vehicle is in active comparison', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.activeComparison.value!.vehicle_ids = ['v1', 'v2']
    expect(c.isInComparison('v1')).toBe(true)
    expect(c.isInComparison('v3')).toBe(false)
  })
})

// ─── addToComparison ──────────────────────────────────────────

describe('addToComparison', () => {
  it('does nothing when no active comparison', () => {
    const c = useVehicleComparator()
    c.addToComparison('v1')
    expect(c.comparisons.value).toEqual([])
  })

  it('adds vehicle to active comparison', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.addToComparison('v1')
    expect(c.activeComparison.value!.vehicle_ids).toContain('v1')
  })

  it('does not add duplicate vehicle', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.addToComparison('v1')
    c.addToComparison('v1')
    expect(c.activeComparison.value!.vehicle_ids.filter((id) => id === 'v1').length).toBe(1)
  })

  it('does not add when MAX_VEHICLES (4) reached', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.addToComparison('v1')
    c.addToComparison('v2')
    c.addToComparison('v3')
    c.addToComparison('v4')
    c.addToComparison('v5') // should be rejected
    expect(c.activeComparison.value!.vehicle_ids.length).toBe(4)
    expect(c.activeComparison.value!.vehicle_ids).not.toContain('v5')
  })

  it('updates comparisons list after adding vehicle', () => {
    // saveToStorage skips when import.meta.client is false — localStorage not tested here
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.addToComparison('v1')
    // The comparison in the list should also be updated
    const listComp = c.comparisons.value.find((comp) => comp.id === c.activeComparison.value!.id)
    expect(listComp!.vehicle_ids).toContain('v1')
  })
})

// ─── removeFromComparison ─────────────────────────────────────

describe('removeFromComparison', () => {
  it('does nothing when no active comparison', () => {
    const c = useVehicleComparator()
    expect(() => c.removeFromComparison('v1')).not.toThrow()
  })

  it('does nothing when vehicle not in comparison', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.addToComparison('v1')
    c.removeFromComparison('v99') // not in list
    expect(c.activeComparison.value!.vehicle_ids).toContain('v1')
  })

  it('removes vehicle from active comparison', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.addToComparison('v1')
    c.addToComparison('v2')
    c.removeFromComparison('v1')
    expect(c.activeComparison.value!.vehicle_ids).not.toContain('v1')
    expect(c.activeComparison.value!.vehicle_ids).toContain('v2')
  })
})

// ─── deleteComparison ─────────────────────────────────────────

describe('deleteComparison', () => {
  it('removes comparison from list', () => {
    const c = useVehicleComparator()
    c.createComparison('A')
    c.createComparison('B')
    const idA = c.comparisons.value[1]!.id
    c.deleteComparison(idA)
    expect(c.comparisons.value.find((comp) => comp.id === idA)).toBeUndefined()
  })

  it('updates active comparison to first remaining', () => {
    const c = useVehicleComparator()
    c.createComparison('A') // id: uuid-1
    c.createComparison('B') // id: uuid-2, active
    const idB = c.activeComparison.value!.id
    c.deleteComparison(idB)
    // After deleting active, should set to first remaining
    expect(c.activeComparison.value?.name).toBe('A')
  })

  it('removes notes for deleted comparison vehicles', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    c.addToComparison('v1')
    c.addNote('v1', 'good truck')
    const compId = c.activeComparison.value!.id
    c.deleteComparison(compId)
    expect(c.notes.value.has('v1')).toBe(false)
  })

  it('does nothing for non-existent comparison', () => {
    const c = useVehicleComparator()
    c.createComparison('Test')
    const originalLength = c.comparisons.value.length
    c.deleteComparison('non-existent-id')
    expect(c.comparisons.value.length).toBe(originalLength)
  })
})

// ─── addNote / updateNote / deleteNote ───────────────────────

describe('notes management', () => {
  it('addNote adds a note for a vehicle', () => {
    const c = useVehicleComparator()
    c.addNote('v1', 'Great condition', 4)
    expect(c.notes.value.has('v1')).toBe(true)
    expect(c.notes.value.get('v1')!.note).toBe('Great condition')
    expect(c.notes.value.get('v1')!.rating).toBe(4)
  })

  it('addNote without rating sets rating to null', () => {
    const c = useVehicleComparator()
    c.addNote('v1', 'Some note')
    expect(c.notes.value.get('v1')!.rating).toBeNull()
  })

  it('addNote overwrites existing note', () => {
    const c = useVehicleComparator()
    c.addNote('v1', 'First note')
    c.addNote('v1', 'Second note')
    expect(c.notes.value.get('v1')!.note).toBe('Second note')
  })

  it('updateNote updates existing note', () => {
    const c = useVehicleComparator()
    c.addNote('v1', 'Original', 3)
    c.updateNote('v1', 'Updated', 5)
    expect(c.notes.value.get('v1')!.note).toBe('Updated')
    expect(c.notes.value.get('v1')!.rating).toBe(5)
  })

  it('updateNote is no-op when note not found', () => {
    const c = useVehicleComparator()
    expect(() => c.updateNote('v99', 'note')).not.toThrow()
  })

  it('updateNote preserves rating when not provided', () => {
    const c = useVehicleComparator()
    c.addNote('v1', 'Note', 3)
    c.updateNote('v1', 'New text')
    expect(c.notes.value.get('v1')!.rating).toBe(3)
  })

  it('deleteNote removes note from map', () => {
    const c = useVehicleComparator()
    c.addNote('v1', 'Some note')
    c.deleteNote('v1')
    expect(c.notes.value.has('v1')).toBe(false)
  })

  it('deleteNote is no-op when note not found', () => {
    const c = useVehicleComparator()
    expect(() => c.deleteNote('nonexistent')).not.toThrow()
  })
})

// ─── fetchComparisons ─────────────────────────────────────────

describe('fetchComparisons', () => {
  it('loads from localStorage when user is anonymous', async () => {
    mockUser.value = null
    const c = useVehicleComparator()
    await c.fetchComparisons()
    // No user = localStorage path, doesn't throw
    expect(c.comparisons.value).toBeDefined()
  })

  it('loads from supabase when user is logged in', async () => {
    mockUser.value = { id: 'user-1', email: 'a@b.com' }
    const rows = [
      { id: 'comp-1', name: 'My List', vehicle_ids: ['v1', 'v2'], created_at: '2026-01-01' },
    ]
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain({ data: rows, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useVehicleComparator()
    await c.fetchComparisons()
    expect(c.comparisons.value.length).toBe(1)
    expect(c.comparisons.value[0]!.name).toBe('My List')
  })

  it('sets activeComparison to first when none selected', async () => {
    mockUser.value = { id: 'user-1', email: 'a@b.com' }
    const rows = [
      { id: 'comp-1', name: 'First', vehicle_ids: [], created_at: '2026-01-01' },
    ]
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      return makeChain({ data: callCount === 1 ? rows : [], error: null })
    })
    const c = useVehicleComparator()
    c.activeComparison.value = null
    await c.fetchComparisons()
    expect(c.activeComparison.value?.id).toBe('comp-1')
  })

  it('ignores supabase errors gracefully', async () => {
    mockUser.value = { id: 'user-1', email: 'a@b.com' }
    mockFrom.mockImplementation(() => makeChain({ data: null, error: { message: 'err' } }))
    const c = useVehicleComparator()
    await expect(c.fetchComparisons()).resolves.not.toThrow()
  })
})

// ─── comparisonCount (computed) ───────────────────────────────

describe('comparisonCount', () => {
  it('returns 0 when no active comparison', () => {
    const c = useVehicleComparator()
    expect(c.comparisonCount.value).toBe(0)
  })
})
