import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardNuevoVehiculo } from '../../app/composables/dashboard/useDashboardNuevoVehiculo'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1' } as unknown }

function makeChain(data: unknown = [], count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error: null, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useRouter', () => ({ push: vi.fn() }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSubscriptionPlan', () => ({
    planLimits: { value: { max_listings: 10 } },
    canPublish: vi.fn().mockReturnValue(true),
    maxPhotos: { value: 20 },
    fetchSubscription: vi.fn().mockResolvedValue(undefined),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({ select: () => makeChain([]) }),
  }))
  vi.stubGlobal('useFetch', vi.fn().mockResolvedValue({
    data: { value: { description: 'AI generated description' } },
  }))
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
  vi.stubGlobal('navigateTo', vi.fn())
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('categories starts as empty array', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.categories.value).toHaveLength(0)
  })

  it('subcategories starts as empty array', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.subcategories.value).toHaveLength(0)
  })

  it('saving starts as false', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.saving.value).toBe(false)
  })

  it('generatingDesc starts as false', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.generatingDesc.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.error.value).toBeNull()
  })

  it('success starts as false', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.success.value).toBe(false)
  })

  it('form.brand starts as empty string', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.form.value.brand).toBe('')
  })

  it('form.year starts as current year', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.form.value.year).toBe(new Date().getFullYear())
  })
})

// ─── filteredSubcategories ────────────────────────────────────────────────────

describe('filteredSubcategories', () => {
  it('returns all subcategories when no category selected', () => {
    const c = useDashboardNuevoVehiculo()
    c.subcategories.value = [
      { id: 's1', name: { es: 'Sub 1' }, slug: 's1', category_id: 'cat-1' },
      { id: 's2', name: { es: 'Sub 2' }, slug: 's2', category_id: 'cat-2' },
    ]
    expect(c.filteredSubcategories.value).toHaveLength(2)
  })

  it('filters by selected category_id', () => {
    const c = useDashboardNuevoVehiculo()
    c.subcategories.value = [
      { id: 's1', name: { es: 'Sub 1' }, slug: 's1', category_id: 'cat-1' },
      { id: 's2', name: { es: 'Sub 2' }, slug: 's2', category_id: 'cat-2' },
    ]
    c.form.value.category_id = 'cat-1'
    expect(c.filteredSubcategories.value).toHaveLength(1)
    expect(c.filteredSubcategories.value[0].id).toBe('s1')
  })
})

// ─── canPublishVehicle ────────────────────────────────────────────────────────

describe('canPublishVehicle', () => {
  it('returns true when canPublish returns true', () => {
    const c = useDashboardNuevoVehiculo()
    expect(c.canPublishVehicle.value).toBe(true)
  })

  it('returns false when canPublish returns false', () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({
      planLimits: { value: {} },
      canPublish: vi.fn().mockReturnValue(false),
      maxPhotos: { value: 10 },
      fetchSubscription: vi.fn(),
    }))
    const c = useDashboardNuevoVehiculo()
    expect(c.canPublishVehicle.value).toBe(false)
  })
})

// ─── generateDescription ─────────────────────────────────────────────────────

describe('generateDescription', () => {
  it('sets error when brand or model is empty', async () => {
    const c = useDashboardNuevoVehiculo()
    c.form.value.brand = ''
    c.form.value.model = ''
    await c.generateDescription()
    expect(c.error.value).toBeTruthy()
  })

  it('sets description_es from API response', async () => {
    const c = useDashboardNuevoVehiculo()
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH'
    await c.generateDescription()
    expect(c.form.value.description_es).toBe('AI generated description')
    expect(c.generatingDesc.value).toBe(false)
  })
})

// ─── loadFormData ─────────────────────────────────────────────────────────────

describe('loadFormData', () => {
  it('loads categories and subcategories from DB', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => makeChain(
          table === 'categories' ? [{ id: 'cat-1', name: { es: 'Camiones' }, slug: 'camiones' }]
          : table === 'subcategories' ? [{ id: 's1', name: { es: 'Sub' }, slug: 's', category_id: 'cat-1' }]
          : [],
        ),
      }),
    }))
    const c = useDashboardNuevoVehiculo()
    await c.loadFormData()
    expect(c.categories.value).toHaveLength(1)
  })

  it('does nothing when no dealer profile and loadDealer returns null', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardNuevoVehiculo()
    await c.loadFormData()
    expect(c.categories.value).toHaveLength(0)
  })
})
