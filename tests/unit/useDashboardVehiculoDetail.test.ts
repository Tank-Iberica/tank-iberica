import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardVehiculoDetail } from '../../app/composables/dashboard/useDashboardVehiculoDetail'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1' } as unknown }

function makeChain(data: unknown = null, error: unknown = null, count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'update', 'single'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const mockVehicle = {
  brand: 'Volvo', model: 'FH', year: 2020, km: 100000, price: 50000,
  category_id: 'cat-1', subcategory_id: 'sub-1',
  description_es: 'Desc ES', description_en: 'Desc EN',
  location: 'Madrid', status: 'published',
}

const mockVerification = {
  documents: { value: [] },
  error: { value: null },
  currentLevel: { value: 'none' },
  fetchDocuments: vi.fn().mockResolvedValue(undefined),
  uploadDocument: vi.fn().mockResolvedValue('doc-id'),
  getMissingDocs: vi.fn().mockReturnValue([]),
  getLevelDefinition: vi.fn().mockReturnValue({ label: 'None' }),
  VERIFICATION_LEVELS: [
    { level: 'none', order: 0 },
    { level: 'verified', order: 1 },
    { level: 'extended', order: 2 },
    { level: 'audited', order: 3 },
    { level: 'certified', order: 4 },
  ],
  LEVEL_ORDER: { none: 0, verified: 1, extended: 2, audited: 3, certified: 4 },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useRouter', () => ({ push: vi.fn() }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSubscriptionPlan', () => ({
    maxPhotos: { value: 20 },
    fetchSubscription: vi.fn().mockResolvedValue(undefined),
  }))
  vi.stubGlobal('useVehicleVerification', () => mockVerification)
  vi.stubGlobal('useCloudinaryUpload', () => ({
    upload: vi.fn().mockResolvedValue({ secure_url: 'https://cdn/img.jpg' }),
    uploading: { value: false },
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => {
      if (table === 'vehicles') return makeChain(mockVehicle)
      if (table === 'categories') return makeChain([{ id: 'cat-1', name: { es: 'Camiones' }, slug: 'camiones' }])
      if (table === 'subcategories') return makeChain([{ id: 'sub-1', name: { es: 'Sub' }, slug: 's', category_id: 'cat-1' }])
      if (table === 'favorites') return makeChain(null, null, 5)
      return makeChain()
    },
  }))
  vi.stubGlobal('useFetch', vi.fn().mockResolvedValue({
    data: { value: { description: 'AI desc' } },
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.loading.value).toBe(true)
  })

  it('saving starts as false', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.error.value).toBeNull()
  })

  it('success starts as false', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.success.value).toBe(false)
  })

  it('favoritesCount starts as 0', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.favoritesCount.value).toBe(0)
  })

  it('form.brand starts as empty string', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.form.value.brand).toBe('')
  })

  it('categories starts as empty array', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.categories.value).toHaveLength(0)
  })
})

// ─── getLevelColor ─────────────────────────────────────────────────────────────

describe('getLevelColor', () => {
  it('returns color for verified', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.getLevelColor('verified')).toBe('#10b981')
  })

  it('returns fallback for unknown level', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.getLevelColor('unknown-level')).toBe('#64748b')
  })

  it('returns color for none', () => {
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.getLevelColor('none')).toBe('#94a3b8')
  })
})

// ─── filteredSubcategories ────────────────────────────────────────────────────

describe('filteredSubcategories', () => {
  it('returns all subcategories when no category selected', () => {
    const c = useDashboardVehiculoDetail('v-1')
    c.subcategories.value = [
      { id: 's1', name: { es: 'S1' }, slug: 's1', category_id: 'cat-1' },
      { id: 's2', name: { es: 'S2' }, slug: 's2', category_id: 'cat-2' },
    ]
    expect(c.filteredSubcategories.value).toHaveLength(2)
  })

  it('filters by selected category', () => {
    const c = useDashboardVehiculoDetail('v-1')
    c.subcategories.value = [
      { id: 's1', name: { es: 'S1' }, slug: 's1', category_id: 'cat-1' },
      { id: 's2', name: { es: 'S2' }, slug: 's2', category_id: 'cat-2' },
    ]
    c.form.value.category_id = 'cat-1'
    expect(c.filteredSubcategories.value).toHaveLength(1)
    expect(c.filteredSubcategories.value[0].id).toBe('s1')
  })
})

// ─── nextLevel ────────────────────────────────────────────────────────────────

describe('nextLevel', () => {
  it('returns next verification level from none', () => {
    const c = useDashboardVehiculoDetail('v-1')
    // currentLevel = 'none' (order 0), next = 'verified' (order 1)
    expect(c.nextLevel.value).toBe('verified')
  })
})

// ─── progressPercentage ───────────────────────────────────────────────────────

describe('progressPercentage', () => {
  it('returns 0 when at none level', () => {
    const c = useDashboardVehiculoDetail('v-1')
    // none=0, max=4, 0/4*100=0
    expect(c.progressPercentage.value).toBe(0)
  })
})

// ─── init (loadData) ──────────────────────────────────────────────────────────

describe('init', () => {
  it('loads vehicle data and sets form fields', async () => {
    const c = useDashboardVehiculoDetail('v-1')
    await c.init()
    expect(c.form.value.brand).toBe('Volvo')
    expect(c.form.value.model).toBe('FH')
    expect(c.loading.value).toBe(false)
  })

  it('sets error when vehicle not found', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, { message: 'not found' }),
    }))
    const c = useDashboardVehiculoDetail('v-1')
    await c.init()
    expect(c.error.value).toBeTruthy()
  })

  it('sets error when no dealer profile', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardVehiculoDetail('v-1')
    await c.init()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── generateDescription ─────────────────────────────────────────────────────

describe('generateDescription', () => {
  it('sets error when brand or model is empty', async () => {
    const c = useDashboardVehiculoDetail('v-1')
    c.form.value.brand = ''
    c.form.value.model = ''
    await c.generateDescription()
    expect(c.error.value).toBeTruthy()
  })

  it('sets description_es from API response', async () => {
    const c = useDashboardVehiculoDetail('v-1')
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH'
    await c.generateDescription()
    expect(c.form.value.description_es).toBe('AI desc')
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates a field in the form', () => {
    const c = useDashboardVehiculoDetail('v-1')
    c.updateFormField('brand', 'Mercedes')
    expect(c.form.value.brand).toBe('Mercedes')
  })

  it('updates numeric field', () => {
    const c = useDashboardVehiculoDetail('v-1')
    c.updateFormField('price', 99000)
    expect(c.form.value.price).toBe(99000)
  })
})

// ─── saveVehicle ────────────────────────────────────────────────────────────────

describe('saveVehicle', () => {
  it('sets error when brand is empty', async () => {
    const c = useDashboardVehiculoDetail('v-1')
    c.form.value.brand = ''
    c.form.value.model = ''
    await c.saveVehicle()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('calls supabase update when form is valid', async () => {
    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve),
        catch: (reject: (e: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(reject),
      }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'vehicles') return { ...makeChain(mockVehicle), update: updateFn }
        return makeChain()
      },
    }))
    const c = useDashboardVehiculoDetail('v-1')
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH'
    await c.saveVehicle()
    expect(updateFn).toHaveBeenCalled()
  })

  it('sets success on successful save', async () => {
    const eqFn = vi.fn().mockReturnValue({
      then: (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve),
      catch: () => Promise.resolve(),
    })
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'vehicles') {
          const c = makeChain(mockVehicle)
          return { ...c, update: updateFn }
        }
        return makeChain()
      },
    }))
    const c = useDashboardVehiculoDetail('v-1')
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH'
    await c.saveVehicle()
    expect(c.success.value).toBe(true)
  })
})

// ─── missingDocuments ───────────────────────────────────────────────────────────

describe('missingDocuments', () => {
  it('returns missing docs for next level', () => {
    mockVerification.getMissingDocs.mockReturnValue(['ficha_tecnica', 'itv'])
    const c = useDashboardVehiculoDetail('v-1')
    expect(c.missingDocuments.value).toEqual(['ficha_tecnica', 'itv'])
  })
})

// ─── init with catch error ──────────────────────────────────────────────────────

describe('init error handling', () => {
  it('handles thrown error in loadData', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => { throw new Error('Connection failed') },
    }))
    const c = useDashboardVehiculoDetail('v-1')
    await c.init()
    expect(c.error.value).toBe('Connection failed')
    expect(c.loading.value).toBe(false)
  })

  it('handles non-Error thrown values', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => { throw 'string error' },
    }))
    const c = useDashboardVehiculoDetail('v-1')
    await c.init()
    expect(c.error.value).toBe('Error loading vehicle')
    expect(c.loading.value).toBe(false)
  })
})

// ─── generateDescription error handling ─────────────────────────────────────────

describe('generateDescription error handling', () => {
  it('sets generatingDesc to false after error', async () => {
    vi.stubGlobal('useFetch', vi.fn().mockRejectedValue(new Error('API error')))
    const c = useDashboardVehiculoDetail('v-1')
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH'
    await c.generateDescription()
    expect(c.generatingDesc.value).toBe(false)
    expect(c.error.value).toBe('API error')
  })
})
