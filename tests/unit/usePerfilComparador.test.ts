import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePerfilComparador, specKeys } from '../../app/composables/usePerfilComparador'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function stubComparator({
  comparisons = [] as unknown[],
  activeComparison = null as unknown,
  notes = new Map() as Map<string, { note: string; rating: number }>,
} = {}) {
  vi.stubGlobal('useVehicleComparator', () => ({
    comparisons: { value: comparisons },
    activeComparison: { value: activeComparison },
    notes: { value: notes },
    removeFromComparison: vi.fn(),
    createComparison: vi.fn(),
    deleteComparison: vi.fn(),
    addNote: vi.fn(),
    updateNote: vi.fn(),
    fetchComparisons: vi.fn().mockResolvedValue(undefined),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubComparator()
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  }))
})

const sampleVehicle = {
  id: 'v1',
  slug: 'man-tgx-2020',
  brand: 'MAN',
  model: 'TGX',
  year: 2020,
  price: 45000,
  category: 'tractoras',
  location: 'Madrid',
  main_image_url: null,
}

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('vehicles starts as empty array', () => {
    const c = usePerfilComparador()
    expect(c.vehicles.value).toHaveLength(0)
  })

  it('loading starts as true', () => {
    const c = usePerfilComparador()
    expect(c.loading.value).toBe(true)
  })

  it('newCompName starts as empty string', () => {
    const c = usePerfilComparador()
    expect(c.newCompName.value).toBe('')
  })

  it('showNewForm starts as false', () => {
    const c = usePerfilComparador()
    expect(c.showNewForm.value).toBe(false)
  })

  it('exposes specKeys constant', () => {
    const c = usePerfilComparador()
    expect(c.specKeys).toBe(specKeys)
    expect(c.specKeys).toContain('brand')
  })
})

// ─── getSpec ──────────────────────────────────────────────────────────────────

describe('getSpec', () => {
  it('returns dash for null value', () => {
    const c = usePerfilComparador()
    const v = { ...sampleVehicle, year: null }
    expect(c.getSpec(v, 'year')).toBe('-')
  })

  it('formats price with euro sign', () => {
    const c = usePerfilComparador()
    const result = c.getSpec(sampleVehicle, 'price')
    expect(result).toContain('€')
    expect(result).toContain('45')
  })

  it('returns string for brand', () => {
    const c = usePerfilComparador()
    expect(c.getSpec(sampleVehicle, 'brand')).toBe('MAN')
  })

  it('returns string for year', () => {
    const c = usePerfilComparador()
    expect(c.getSpec(sampleVehicle, 'year')).toBe('2020')
  })

  it('returns string for location', () => {
    const c = usePerfilComparador()
    expect(c.getSpec(sampleVehicle, 'location')).toBe('Madrid')
  })

  it('returns dash for null location', () => {
    const c = usePerfilComparador()
    const v = { ...sampleVehicle, location: null }
    expect(c.getSpec(v, 'location')).toBe('-')
  })
})

// ─── updateDraftNote ──────────────────────────────────────────────────────────

describe('updateDraftNote', () => {
  it('updates draft note for vehicle', () => {
    const c = usePerfilComparador()
    c.updateDraftNote('v1', 'Good condition')
    expect(c.draftNotes.value['v1']).toBe('Good condition')
  })

  it('updates multiple vehicles independently', () => {
    const c = usePerfilComparador()
    c.updateDraftNote('v1', 'Note 1')
    c.updateDraftNote('v2', 'Note 2')
    expect(c.draftNotes.value['v1']).toBe('Note 1')
    expect(c.draftNotes.value['v2']).toBe('Note 2')
  })
})

// ─── updateNewCompName ────────────────────────────────────────────────────────

describe('updateNewCompName', () => {
  it('updates newCompName', () => {
    const c = usePerfilComparador()
    c.updateNewCompName('My Comparison')
    expect(c.newCompName.value).toBe('My Comparison')
  })
})

// ─── toggleNewForm ────────────────────────────────────────────────────────────

describe('toggleNewForm', () => {
  it('toggles showNewForm from false to true', () => {
    const c = usePerfilComparador()
    c.toggleNewForm()
    expect(c.showNewForm.value).toBe(true)
  })

  it('toggles showNewForm from true to false', () => {
    const c = usePerfilComparador()
    c.showNewForm.value = true
    c.toggleNewForm()
    expect(c.showNewForm.value).toBe(false)
  })
})

// ─── handleCreate ─────────────────────────────────────────────────────────────

describe('handleCreate', () => {
  it('calls createComparison with trimmed name', () => {
    const mockCreate = vi.fn()
    vi.stubGlobal('useVehicleComparator', () => ({
      comparisons: { value: [] },
      activeComparison: { value: null },
      notes: { value: new Map() },
      removeFromComparison: vi.fn(),
      createComparison: mockCreate,
      deleteComparison: vi.fn(),
      addNote: vi.fn(),
      updateNote: vi.fn(),
      fetchComparisons: vi.fn().mockResolvedValue(undefined),
    }))
    const c = usePerfilComparador()
    c.newCompName.value = '  Comparison 1  '
    c.handleCreate()
    expect(mockCreate).toHaveBeenCalledWith('Comparison 1')
  })

  it('does not call createComparison when name is empty', () => {
    const mockCreate = vi.fn()
    vi.stubGlobal('useVehicleComparator', () => ({
      comparisons: { value: [] },
      activeComparison: { value: null },
      notes: { value: new Map() },
      removeFromComparison: vi.fn(),
      createComparison: mockCreate,
      deleteComparison: vi.fn(),
      addNote: vi.fn(),
      updateNote: vi.fn(),
      fetchComparisons: vi.fn().mockResolvedValue(undefined),
    }))
    const c = usePerfilComparador()
    c.newCompName.value = '   '
    c.handleCreate()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('resets newCompName after creation', () => {
    const c = usePerfilComparador()
    c.newCompName.value = 'Test'
    c.handleCreate()
    expect(c.newCompName.value).toBe('')
  })

  it('hides new form after creation', () => {
    const c = usePerfilComparador()
    c.newCompName.value = 'Test'
    c.showNewForm.value = true
    c.handleCreate()
    expect(c.showNewForm.value).toBe(false)
  })
})

// ─── handleRemove ─────────────────────────────────────────────────────────────

describe('handleRemove', () => {
  it('removes vehicle from vehicles list', () => {
    const c = usePerfilComparador()
    ;(c.vehicles as { value: unknown[] }).value = [sampleVehicle, { ...sampleVehicle, id: 'v2' }]
    c.handleRemove('v1')
    expect(c.vehicles.value).toHaveLength(1)
    expect((c.vehicles.value[0] as typeof sampleVehicle).id).toBe('v2')
  })
})

// ─── selectComparison ─────────────────────────────────────────────────────────

describe('selectComparison', () => {
  it('sets activeComparison to found comparison', () => {
    const comp = { id: 'c1', name: 'Test', vehicle_ids: [] }
    const mockActive = { value: null as unknown }
    vi.stubGlobal('useVehicleComparator', () => ({
      comparisons: { value: [comp] },
      activeComparison: mockActive,
      notes: { value: new Map() },
      removeFromComparison: vi.fn(),
      createComparison: vi.fn(),
      deleteComparison: vi.fn(),
      addNote: vi.fn(),
      updateNote: vi.fn(),
      fetchComparisons: vi.fn().mockResolvedValue(undefined),
    }))
    const c = usePerfilComparador()
    c.selectComparison('c1')
    expect(c.activeComparison.value).toBe(comp)
  })

  it('does not change activeComparison when id not found', () => {
    const mockActive = { value: null as unknown }
    vi.stubGlobal('useVehicleComparator', () => ({
      comparisons: { value: [] },
      activeComparison: mockActive,
      notes: { value: new Map() },
      removeFromComparison: vi.fn(),
      createComparison: vi.fn(),
      deleteComparison: vi.fn(),
      addNote: vi.fn(),
      updateNote: vi.fn(),
      fetchComparisons: vi.fn().mockResolvedValue(undefined),
    }))
    const c = usePerfilComparador()
    c.selectComparison('non-existent')
    expect(c.activeComparison.value).toBeNull()
  })
})
