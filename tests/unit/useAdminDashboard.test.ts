import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminDashboard } from '../../app/composables/admin/useAdminDashboard'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const { mockLoadKpiMetrics, kpiSummaryRef } = vi.hoisted(() => ({
  mockLoadKpiMetrics: vi.fn().mockResolvedValue(undefined),
  kpiSummaryRef: {
    value: {
      monthlyRevenue: { current: 0, previousMonth: 0, changePercent: 0 },
      activeVehicles: { current: 0, previousMonth: 0, changePercent: 0 },
      activeDealers: { current: 0, previousMonth: 0, changePercent: 0 },
      monthlyLeads: { current: 0, previousMonth: 0, changePercent: 0 },
    },
  },
}))

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminMetrics', () => ({
  useAdminMetrics: () => ({
    kpiSummary: kpiSummaryRef,
    loadMetrics: mockLoadKpiMetrics,
  }),
}))

// Supabase chain mock — silent (no errors by default)
function makeChain(result: unknown = { data: [], error: null, count: 0 }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'order', 'limit', 'single', 'match',
    'gte', 'lte', 'lt', 'gt', 'or', 'range', 'filter',
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

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('stats.anunciantes starts as 0', () => {
    const c = useAdminDashboard()
    expect(c.stats.value.anunciantes).toBe(0)
  })

  it('stats.solicitantes starts as 0', () => {
    const c = useAdminDashboard()
    expect(c.stats.value.solicitantes).toBe(0)
  })

  it('stats.comentarios starts as 0', () => {
    const c = useAdminDashboard()
    expect(c.stats.value.comentarios).toBe(0)
  })

  it('stats.chats starts as 0', () => {
    const c = useAdminDashboard()
    expect(c.stats.value.chats).toBe(0)
  })

  it('totalPending starts as 0 (all pending counts are 0)', () => {
    const c = useAdminDashboard()
    expect(c.totalPending.value).toBe(0)
  })

  it('bannerEnabled starts as false', () => {
    const c = useAdminDashboard()
    expect(c.bannerEnabled.value).toBe(false)
  })

  it('bannerText starts as empty string', () => {
    const c = useAdminDashboard()
    expect(c.bannerText.value).toBe('')
  })

  it('sectionsOpen.products starts as false', () => {
    const c = useAdminDashboard()
    expect(c.sectionsOpen.value.products).toBe(false)
  })

  it('sectionsOpen.users starts as false', () => {
    const c = useAdminDashboard()
    expect(c.sectionsOpen.value.users).toBe(false)
  })

  it('matches starts as empty array', () => {
    const c = useAdminDashboard()
    expect(c.matches.value).toEqual([])
  })

  it('productStats.total starts as 0', () => {
    const c = useAdminDashboard()
    expect(c.productStats.value.total).toBe(0)
  })

  it('userStats.registered starts as 0', () => {
    const c = useAdminDashboard()
    expect(c.userStats.value.registered).toBe(0)
  })

  it('kpiSummary is passed through from useAdminMetrics', () => {
    const c = useAdminDashboard()
    expect(c.kpiSummary).toBe(kpiSummaryRef)
  })
})

// ─── toggleSection ────────────────────────────────────────────────────────

describe('toggleSection', () => {
  it('toggles products section from false to true', () => {
    const c = useAdminDashboard()
    c.toggleSection('products')
    expect(c.sectionsOpen.value.products).toBe(true)
  })

  it('toggles products section back to false', () => {
    const c = useAdminDashboard()
    c.toggleSection('products')
    c.toggleSection('products')
    expect(c.sectionsOpen.value.products).toBe(false)
  })

  it('toggles users section independently', () => {
    const c = useAdminDashboard()
    c.toggleSection('users')
    expect(c.sectionsOpen.value.users).toBe(true)
    expect(c.sectionsOpen.value.products).toBe(false)
  })
})

// ─── formatKpiEuros ───────────────────────────────────────────────────────

describe('formatKpiEuros', () => {
  it('formats 0 cents as 0 euros', () => {
    const c = useAdminDashboard()
    const result = c.formatKpiEuros(0)
    expect(result).toContain('€')
  })

  it('formats 100000 cents as ~1000 euros', () => {
    const c = useAdminDashboard()
    const result = c.formatKpiEuros(100000)
    expect(result).toContain('1')
    expect(result).toContain('€')
  })

  it('returns a string', () => {
    const c = useAdminDashboard()
    expect(typeof c.formatKpiEuros(50000)).toBe('string')
  })
})

// ─── kpiChangeClass ───────────────────────────────────────────────────────

describe('kpiChangeClass', () => {
  it('returns "kpi-change-up" for positive pct', () => {
    const c = useAdminDashboard()
    expect(c.kpiChangeClass(5)).toBe('kpi-change-up')
  })

  it('returns "kpi-change-down" for negative pct', () => {
    const c = useAdminDashboard()
    expect(c.kpiChangeClass(-3)).toBe('kpi-change-down')
  })

  it('returns "kpi-change-flat" for zero', () => {
    const c = useAdminDashboard()
    expect(c.kpiChangeClass(0)).toBe('kpi-change-flat')
  })
})

// ─── loadBannerConfig ─────────────────────────────────────────────────────

describe('loadBannerConfig (via loadStats/init)', () => {
  it('sets bannerEnabled when config has enabled=true', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'config') {
        return makeChain({ data: { value: { enabled: true, text_es: 'Promo' } }, error: null })
      }
      return makeChain({ data: [], error: null, count: 0 })
    })
    const c = useAdminDashboard()
    // Call init to trigger all loaders
    await c.init()
    expect(c.bannerEnabled.value).toBe(true)
  })

  it('sets bannerText from text_es', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'config') {
        return makeChain({ data: { value: { enabled: true, text_es: 'Flash sale!' } }, error: null })
      }
      return makeChain({ data: [], error: null, count: 0 })
    })
    const c = useAdminDashboard()
    await c.init()
    expect(c.bannerText.value).toBe('Flash sale!')
  })

  it('keeps bannerEnabled=false when config has no data', async () => {
    const c = useAdminDashboard()
    await c.init()
    expect(c.bannerEnabled.value).toBe(false)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls loadKpiMetrics', async () => {
    const c = useAdminDashboard()
    await c.init()
    expect(mockLoadKpiMetrics).toHaveBeenCalled()
  })

  it('calls supabase to load stats from multiple tables', async () => {
    const c = useAdminDashboard()
    await c.init()
    expect(mockFrom).toHaveBeenCalled()
  })
})

// ─── loadProductStats ─────────────────────────────────────────────────────

describe('product stats loading', () => {
  it('counts total vehicles from data', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') {
        return makeChain({
          data: [
            { status: 'published', category: 'venta' },
            { status: 'draft', category: 'alquiler' },
            { status: 'published', category: 'venta' },
          ],
          error: null,
        })
      }
      return makeChain({ data: [], error: null, count: 0 })
    })
    const c = useAdminDashboard()
    await c.init()
    expect(c.productStats.value.total).toBe(3)
    expect(c.productStats.value.published).toBe(2)
    expect(c.productStats.value.unpublished).toBe(1)
  })
})
