import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealerDashboard, mapLeads } from '../../app/composables/useDealerDashboard'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

/** Build a chainable query mock that can also be awaited */
function makeChain({
  data = null as unknown,
  error = null as unknown,
  count = 0,
} = {}) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'neq', 'gte', 'lte', 'in', 'or', 'order', 'select', 'contains', 'filter']
  methods.forEach((m) => { chain[m] = () => chain })
  const resolved = { data: data ?? [], error, count }
  chain.single = () => Promise.resolve({ data, error })
  chain.maybeSingle = () => Promise.resolve({ data, error })
  chain.limit = () => Promise.resolve(resolved)
  chain.range = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const defaultStatsRow = {
  active_listings: 0,
  total_leads: 0,
  total_views: 0,
  leads_this_month: 0,
  response_rate: 0,
  contacts_this_month: 0,
  ficha_views_this_month: 0,
  conversion_rate: 0,
}

const sampleDealer = {
  id: 'dealer-1',
  user_id: 'user-1',
  company_name: 'Trucks SA',
  slug: 'trucks-sa',
  bio: null,
  logo_url: null,
  phone: null,
  email: null,
  website: null,
  location: 'Madrid',
  theme_primary: null,
  theme_accent: null,
  social_links: null,
  certifications: null,
  auto_reply_message: null,
  onboarding_completed: true,
  created_at: '2026-01-01T00:00:00Z',
}

function stubClient({
  dealerData = sampleDealer as unknown,
  dealerError = null as unknown,
  leadsData = [] as unknown[],
  rpcStatsData = [defaultStatsRow] as unknown[],
  rpcStatsError = null as unknown,
  rpcVehiclesData = [] as unknown[],
} = {}) {
  const mockRpc = vi.fn((fnName: string) => {
    if (fnName === 'get_dealer_dashboard_stats') {
      return Promise.resolve({ data: rpcStatsData, error: rpcStatsError })
    }
    if (fnName === 'get_dealer_top_vehicles') {
      return Promise.resolve({ data: rpcVehiclesData, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })

  vi.stubGlobal('useSupabaseClient', () => ({
    rpc: mockRpc,
    from: (table: string) => ({
      select: () => {
        if (table === 'dealers') return makeChain({ data: dealerData, error: dealerError })
        if (table === 'leads') return makeChain({ data: leadsData })
        return makeChain()
      },
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
  }))

  return mockRpc
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { vertical: 'tracciona' } }))
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
  stubClient()
})

// ─── mapLeads (pure function — exported for direct testing) ───────────────────

describe('mapLeads', () => {
  it('maps vehicle brand/model from nested vehicles join', () => {
    const raw = [{
      id: 'l1', buyer_name: 'Alice', buyer_email: 'alice@test.com',
      vehicle_id: 'v1', status: 'new', message: null,
      created_at: '2026-01-01T00:00:00Z', vehicles: { brand: 'VOLVO', model: 'FH' },
    }]
    const result = mapLeads(raw)
    expect(result[0].vehicle_brand).toBe('VOLVO')
    expect(result[0].vehicle_model).toBe('FH')
  })

  it('returns null brand/model when vehicles is null', () => {
    const raw = [{
      id: 'l2', buyer_name: null, buyer_email: null, vehicle_id: null,
      status: 'new', message: null, created_at: null, vehicles: null,
    }]
    const result = mapLeads(raw)
    expect(result[0].vehicle_brand).toBeNull()
    expect(result[0].vehicle_model).toBeNull()
  })

  it('returns empty array for empty input', () => {
    expect(mapLeads([])).toEqual([])
  })

  it('preserves all lead fields', () => {
    const raw = [{
      id: 'l3', buyer_name: 'Bob', buyer_email: 'bob@ex.com',
      vehicle_id: 'v-5', status: 'contacted', message: 'Interested',
      created_at: '2026-03-10T08:00:00Z', vehicles: { brand: 'DAF', model: 'XF' },
    }]
    const result = mapLeads(raw)
    expect(result[0]).toMatchObject({
      id: 'l3',
      buyer_name: 'Bob',
      buyer_email: 'bob@ex.com',
      vehicle_id: 'v-5',
      status: 'contacted',
      message: 'Interested',
    })
  })

  it('maps multiple leads preserving order', () => {
    const raw = [
      { id: 'a', buyer_name: null, buyer_email: null, vehicle_id: null, status: 'new', message: null, created_at: null, vehicles: null },
      { id: 'b', buyer_name: null, buyer_email: null, vehicle_id: null, status: 'new', message: null, created_at: null, vehicles: null },
    ]
    const result = mapLeads(raw)
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('b')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('dealerProfile starts as null', () => {
    const c = useDealerDashboard()
    expect(c.dealerProfile.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useDealerDashboard()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDealerDashboard()
    expect(c.error.value).toBeNull()
  })

  it('recentLeads starts as empty array', () => {
    const c = useDealerDashboard()
    expect(c.recentLeads.value).toHaveLength(0)
  })

  it('topVehicles starts as empty array', () => {
    const c = useDealerDashboard()
    expect(c.topVehicles.value).toHaveLength(0)
  })

  it('stats starts with zeros', () => {
    const c = useDealerDashboard()
    expect(c.stats.value.activeListings).toBe(0)
    expect(c.stats.value.totalLeads).toBe(0)
    expect(c.stats.value.conversionRate).toBe(0)
  })
})

// ─── loadDealer ───────────────────────────────────────────────────────────────

describe('loadDealer', () => {
  it('returns null when no userId', async () => {
    vi.stubGlobal('useAuth', () => ({ userId: { value: null } }))
    const c = useDealerDashboard()
    const result = await c.loadDealer()
    expect(result).toBeNull()
  })

  it('sets dealerProfile on success', async () => {
    const c = useDealerDashboard()
    await c.loadDealer()
    expect(c.dealerProfile.value).not.toBeNull()
    expect((c.dealerProfile.value as typeof sampleDealer)?.company_name).toBe('Trucks SA')
  })

  it('returns dealer profile on success', async () => {
    const c = useDealerDashboard()
    const result = await c.loadDealer()
    expect(result).not.toBeNull()
  })

  it('returns null on DB error', async () => {
    stubClient({ dealerError: new Error('DB error'), dealerData: null })
    const c = useDealerDashboard()
    const result = await c.loadDealer()
    expect(result).toBeNull()
  })

  it('sets error on DB failure', async () => {
    stubClient({ dealerError: new Error('DB error'), dealerData: null })
    const c = useDealerDashboard()
    await c.loadDealer()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── loadDashboardData — happy path ───────────────────────────────────────────

describe('loadDashboardData', () => {
  it('sets loading to false when no dealer found', async () => {
    vi.stubGlobal('useAuth', () => ({ userId: { value: null } }))
    const c = useDealerDashboard()
    await c.loadDashboardData()
    expect(c.loading.value).toBe(false)
  })

  it('sets error when no dealer found', async () => {
    stubClient({ dealerData: null, dealerError: null })
    const c = useDealerDashboard()
    await c.loadDashboardData()
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after success', async () => {
    const c = useDealerDashboard()
    await c.loadDashboardData()
    expect(c.loading.value).toBe(false)
  })

  it('calls get_dealer_dashboard_stats RPC with dealer_id and vertical', async () => {
    const mockRpc = stubClient()
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(mockRpc).toHaveBeenCalledWith('get_dealer_dashboard_stats', expect.objectContaining({
      p_dealer_id: 'dealer-1',
      p_vertical: 'tracciona',
    }))
  })

  it('calls get_dealer_top_vehicles RPC with dealer_id, vertical, and limit=5', async () => {
    const mockRpc = stubClient()
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(mockRpc).toHaveBeenCalledWith('get_dealer_top_vehicles', {
      p_dealer_id: 'dealer-1',
      p_vertical: 'tracciona',
      p_limit: 5,
    })
  })

  it('maps snake_case RPC stats to camelCase DashboardStats', async () => {
    stubClient({
      rpcStatsData: [{
        active_listings: 12,
        total_leads: 45,
        total_views: 3200,
        leads_this_month: 8,
        response_rate: 80,
        contacts_this_month: 15,
        ficha_views_this_month: 200,
        conversion_rate: 7.5,
      }],
    })
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(c.stats.value).toEqual({
      activeListings: 12,
      totalLeads: 45,
      totalViews: 3200,
      leadsThisMonth: 8,
      responseRate: 80,
      contactsThisMonth: 15,
      fichaViewsThisMonth: 200,
      conversionRate: 7.5,
    })
  })

  it('maps top vehicles including leads and favorites from RPC', async () => {
    stubClient({
      rpcVehiclesData: [
        { id: 'v-1', brand: 'Volvo', model: 'FH16', year: 2021, price: 45000, views: 320, leads: 5, favorites: 12, status: 'published' },
        { id: 'v-2', brand: 'DAF', model: 'XF', year: 2020, price: 38000, views: 210, leads: 3, favorites: 7, status: 'published' },
      ],
    })
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(c.topVehicles.value).toHaveLength(2)
    expect(c.topVehicles.value[0]).toMatchObject({ id: 'v-1', leads: 5, favorites: 12, brand: 'Volvo' })
    expect(c.topVehicles.value[1]).toMatchObject({ id: 'v-2', leads: 3, favorites: 7 })
  })

  it('maps recent leads from PostgREST response', async () => {
    stubClient({
      leadsData: [{
        id: 'l1', buyer_name: 'John', buyer_email: 'john@example.com',
        vehicle_id: 'v1', status: 'new', message: 'Interested',
        created_at: '2026-01-01T00:00:00Z', vehicles: { brand: 'MAN', model: 'TGX' },
      }],
    })
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(c.recentLeads.value).toHaveLength(1)
    expect(c.recentLeads.value[0]).toMatchObject({
      id: 'l1', buyer_name: 'John', vehicle_brand: 'MAN', vehicle_model: 'TGX',
    })
  })

  it('defaults null numeric RPC values to 0', async () => {
    stubClient({
      rpcStatsData: [{
        active_listings: null, total_leads: null, total_views: null,
        leads_this_month: null, response_rate: null, contacts_this_month: null,
        ficha_views_this_month: null, conversion_rate: null,
      }],
    })
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(c.stats.value.activeListings).toBe(0)
    expect(c.stats.value.conversionRate).toBe(0)
  })

  it('sets error and loading=false when stats RPC returns error', async () => {
    stubClient({ rpcStatsError: new Error('RPC failed'), rpcStatsData: null as unknown as unknown[] })
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('sets error when stats RPC returns empty array', async () => {
    stubClient({ rpcStatsData: [] })
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(c.error.value).toBeTruthy()
  })

  it('keeps topVehicles empty when RPC returns null', async () => {
    stubClient({ rpcVehiclesData: null as unknown as unknown[] })
    const c = useDealerDashboard()
    await c.loadDashboardData()

    expect(c.topVehicles.value).toEqual([])
  })

  it('sets loading to false after error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      rpc: () => { throw new Error('Network error') },
      from: (table: string) => ({
        select: () => {
          if (table === 'dealers') return makeChain({ data: sampleDealer })
          return makeChain()
        },
      }),
    }))
    const c = useDealerDashboard()
    await c.loadDashboardData()
    expect(c.loading.value).toBe(false)
  })

  it('p_month_start is a date string starting on the 1st of the month', async () => {
    const mockRpc = stubClient()
    const c = useDealerDashboard()
    await c.loadDashboardData()

    const statsCall = mockRpc.mock.calls.find(([name]) => name === 'get_dealer_dashboard_stats')
    const monthStart: string = statsCall?.[1]?.p_month_start ?? ''
    // Should look like "2026-03-01T00:00:00.000Z" (day = 01)
    expect(monthStart).toMatch(/^\d{4}-\d{2}-01T/)
  })
})
