import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardWidget } from '../../app/composables/dashboard/useDashboardWidget'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1', slug: 'mi-concesionario' } as unknown }

function makeChain(data: unknown = []) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'ascending'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error: null }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1', slug: 'mi-concesionario' }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSubscriptionPlan', () => ({
    canUseWidget: vi.fn().mockReturnValue(true),
    fetchSubscription: vi.fn().mockResolvedValue(undefined),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain([
      { id: 'cat-1', slug: 'trucks', name_es: 'Camiones', name_en: 'Trucks' },
    ]),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('categories starts as empty array', () => {
    const c = useDashboardWidget()
    expect(c.categories.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useDashboardWidget()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardWidget()
    expect(c.error.value).toBeNull()
  })

  it('vehicleCount starts as 6', () => {
    const c = useDashboardWidget()
    expect(c.vehicleCount.value).toBe(6)
  })

  it('theme starts as light', () => {
    const c = useDashboardWidget()
    expect(c.theme.value).toBe('light')
  })

  it('selectedCategory starts as empty string', () => {
    const c = useDashboardWidget()
    expect(c.selectedCategory.value).toBe('')
  })

  it('VEHICLE_COUNT_OPTIONS has 4 options', () => {
    const c = useDashboardWidget()
    expect(c.VEHICLE_COUNT_OPTIONS).toHaveLength(4)
    expect(c.VEHICLE_COUNT_OPTIONS).toContain(6)
  })
})

// ─── embedCode ────────────────────────────────────────────────────────────────

describe('embedCode', () => {
  it('returns empty string when no dealer slug', () => {
    mockDealerProfile.value = { id: 'dealer-1', slug: '' }
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
    }))
    const c = useDashboardWidget()
    expect(c.embedCode.value).toBe('')
  })

  it('generates iframe embed code with dealer slug', () => {
    const c = useDashboardWidget()
    expect(c.embedCode.value).toContain('<iframe')
    expect(c.embedCode.value).toContain('mi-concesionario')
    expect(c.embedCode.value).toContain('limit=6')
  })

  it('includes category param when selected', () => {
    const c = useDashboardWidget()
    c.selectedCategory.value = 'trucks'
    expect(c.embedCode.value).toContain('category=trucks')
  })

  it('reflects theme in embed URL', () => {
    const c = useDashboardWidget()
    c.theme.value = 'dark'
    expect(c.embedCode.value).toContain('theme=dark')
  })

  it('uses vehicleCount in limit param', () => {
    const c = useDashboardWidget()
    c.vehicleCount.value = 12
    expect(c.embedCode.value).toContain('limit=12')
  })
})

// ─── previewUrl ───────────────────────────────────────────────────────────────

describe('previewUrl', () => {
  it('returns empty string when no dealer slug', () => {
    mockDealerProfile.value = { id: 'dealer-1', slug: '' }
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
    }))
    const c = useDashboardWidget()
    expect(c.previewUrl.value).toBe('')
  })

  it('generates local preview URL', () => {
    const c = useDashboardWidget()
    expect(c.previewUrl.value).toContain('/embed/mi-concesionario')
  })
})

// ─── iframeWidth / iframeHeight ───────────────────────────────────────────────

describe('iframeWidth', () => {
  it('returns widgetWidth value', () => {
    const c = useDashboardWidget()
    expect(c.iframeWidth.value).toBe('100%')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('loads categories from DB', async () => {
    const c = useDashboardWidget()
    await c.init()
    expect(c.categories.value).toHaveLength(1)
    expect(c.categories.value[0].slug).toBe('trucks')
    expect(c.loading.value).toBe(false)
  })

  it('does not throw when DB fails', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => {
        const chain: Record<string, unknown> = {}
        ;['eq', 'order', 'select', 'ascending'].forEach((m) => { chain[m] = () => chain })
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'DB error' } }).then(resolve)
        chain.catch = (reject: (e: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(reject)
        return chain
      },
    }))
    const c = useDashboardWidget()
    await expect(c.init()).resolves.toBeUndefined()
    expect(c.categories.value).toHaveLength(0)
  })
})
