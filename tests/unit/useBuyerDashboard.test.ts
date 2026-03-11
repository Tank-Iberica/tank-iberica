import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBuyerDashboard } from '../../app/composables/useBuyerDashboard'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null, count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'limit'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubClient(countOverride = 0) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain([], null, countOverride),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('favorites starts as empty array', () => {
    const c = useBuyerDashboard()
    expect(c.favorites.value).toHaveLength(0)
  })

  it('searchAlerts starts as empty array', () => {
    const c = useBuyerDashboard()
    expect(c.searchAlerts.value).toHaveLength(0)
  })

  it('contactHistory starts as empty array', () => {
    const c = useBuyerDashboard()
    expect(c.contactHistory.value).toHaveLength(0)
  })

  it('recentViews starts as empty array', () => {
    const c = useBuyerDashboard()
    expect(c.recentViews.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useBuyerDashboard()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useBuyerDashboard()
    expect(c.error.value).toBeNull()
  })

  it('summary starts with zero counts', () => {
    const c = useBuyerDashboard()
    expect(c.summary.value.favoritesCount).toBe(0)
    expect(c.summary.value.activeAlertsCount).toBe(0)
    expect(c.summary.value.leadsSentCount).toBe(0)
    expect(c.summary.value.recentViewsCount).toBe(0)
  })
})

// ─── loadFavorites ────────────────────────────────────────────────────────────

describe('loadFavorites', () => {
  it('sets error when no user', async () => {
    vi.stubGlobal('useAuth', () => ({ userId: { value: null } }))
    const c = useBuyerDashboard()
    await c.loadFavorites()
    expect(c.error.value).toBeTruthy()
  })

  it('maps vehicles nested field to vehicle', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([{
          id: 'fav-1',
          vehicle_id: 'v-1',
          created_at: '2026-01-01',
          vehicles: { id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020, price: 50000, main_image_url: null, slug: 'volvo-fh', status: 'active' },
        }]),
      }),
    }))
    const c = useBuyerDashboard()
    await c.loadFavorites()
    expect(c.favorites.value).toHaveLength(1)
    expect(c.favorites.value[0].vehicle?.brand).toBe('Volvo')
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
      }),
    }))
    const c = useBuyerDashboard()
    await c.loadFavorites()
    expect(c.error.value).toBeTruthy()
    expect(c.favorites.value).toHaveLength(0)
  })
})

// ─── loadAlerts ───────────────────────────────────────────────────────────────

describe('loadAlerts', () => {
  it('sets error when no user', async () => {
    vi.stubGlobal('useAuth', () => ({ userId: { value: null } }))
    const c = useBuyerDashboard()
    await c.loadAlerts()
    expect(c.error.value).toBeTruthy()
  })

  it('sets searchAlerts from DB', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([{
          id: 'alert-1',
          filters: { brand: 'Volvo' },
          frequency: 'daily',
          active: true,
          last_sent_at: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        }]),
      }),
    }))
    const c = useBuyerDashboard()
    await c.loadAlerts()
    expect(c.searchAlerts.value).toHaveLength(1)
    expect(c.searchAlerts.value[0].id).toBe('alert-1')
  })
})

// ─── loadContactHistory ───────────────────────────────────────────────────────

describe('loadContactHistory', () => {
  it('sets error when no user', async () => {
    vi.stubGlobal('useAuth', () => ({ userId: { value: null } }))
    const c = useBuyerDashboard()
    await c.loadContactHistory()
    expect(c.error.value).toBeTruthy()
  })

  it('maps JSONB company_name string', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([{
          id: 'lead-1',
          dealer_id: 'd-1',
          vehicle_id: 'v-1',
          message: 'Hello',
          status: 'new',
          created_at: '2026-01-01',
          first_responded_at: null,
          vehicles: { brand: 'Volvo', model: 'FH' },
          dealers: { company_name: 'Dealer SL' },
        }]),
      }),
    }))
    const c = useBuyerDashboard()
    await c.loadContactHistory()
    expect(c.contactHistory.value).toHaveLength(1)
    expect(c.contactHistory.value[0].dealer_name).toBe('Dealer SL')
  })

  it('maps JSONB company_name object with es key', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([{
          id: 'lead-2',
          dealer_id: 'd-2',
          vehicle_id: null,
          message: null,
          status: null,
          created_at: null,
          first_responded_at: null,
          vehicles: null,
          dealers: { company_name: { es: 'Concesionario ES', en: 'Dealer EN' } },
        }]),
      }),
    }))
    const c = useBuyerDashboard()
    await c.loadContactHistory()
    expect(c.contactHistory.value[0].dealer_name).toBe('Concesionario ES')
  })
})

// ─── loadRecentViews ──────────────────────────────────────────────────────────

describe('loadRecentViews', () => {
  it('sets error when no user', async () => {
    vi.stubGlobal('useAuth', () => ({ userId: { value: null } }))
    const c = useBuyerDashboard()
    await c.loadRecentViews()
    expect(c.error.value).toBeTruthy()
  })

  it('maps vehicles nested field to vehicle', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([{
          vehicle_id: 'v-1',
          viewed_at: '2026-01-01',
          view_count: 3,
          vehicles: { id: 'v-1', brand: 'MAN', model: 'TGX', year: 2021, price: 60000, main_image_url: null, slug: 'man-tgx', status: 'active' },
        }]),
      }),
    }))
    const c = useBuyerDashboard()
    await c.loadRecentViews()
    expect(c.recentViews.value).toHaveLength(1)
    expect(c.recentViews.value[0].vehicle?.brand).toBe('MAN')
  })
})

// ─── loadDashboardSummary ────────────────────────────────────────────────────

describe('loadDashboardSummary', () => {
  it('returns zero counts when no user', async () => {
    vi.stubGlobal('useAuth', () => ({ userId: { value: null } }))
    const c = useBuyerDashboard()
    const result = await c.loadDashboardSummary()
    expect(result.favoritesCount).toBe(0)
    expect(c.error.value).toBeTruthy()
  })

  it('sets summary counts from DB count', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null, 3),
      }),
    }))
    const c = useBuyerDashboard()
    const result = await c.loadDashboardSummary()
    expect(result.favoritesCount).toBe(3)
    expect(result.activeAlertsCount).toBe(3)
  })
})

// ─── loadAllDashboardData ─────────────────────────────────────────────────────

describe('loadAllDashboardData', () => {
  it('sets loading to false after completion', async () => {
    const c = useBuyerDashboard()
    await c.loadAllDashboardData()
    expect(c.loading.value).toBe(false)
  })

  it('clears error before loading', async () => {
    const c = useBuyerDashboard()
    c.error.value = 'old error'
    await c.loadAllDashboardData()
    expect(c.error.value).toBeNull()
  })
})
