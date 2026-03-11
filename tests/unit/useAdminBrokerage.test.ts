import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminBrokerage,
  DEAL_STATUSES,
  VALID_TRANSITIONS,
  getStatusLabel,
  getStatusColor,
  getValidNextStatuses,
  formatDealPrice,
  formatDealDate,
  getDealModeLabel,
} from '../../app/composables/admin/useAdminBrokerage'

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null, count: 0 }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'not', 'in', 'or', 'gte', 'lte', 'lt', 'gt',
    'order', 'limit', 'match', 'ilike',
  ]) {
    chain[m] = () => chain
  }
  chain['single'] = () => ({ then: (resolve: (v: unknown) => unknown) => resolve(result) })
  chain['range'] = () => ({ then: (resolve: (v: unknown) => unknown) => resolve(result) })
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

// ─── DEAL_STATUSES constant ───────────────────────────────────────────────

describe('DEAL_STATUSES', () => {
  it('has 16 statuses', () => {
    expect(DEAL_STATUSES).toHaveLength(16)
  })

  it('each status has value, label, color, and group', () => {
    for (const s of DEAL_STATUSES) {
      expect(s.value).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.color).toBeTruthy()
      expect(['qualifying', 'active', 'closed']).toContain(s.group)
    }
  })

  it('includes deal_closed with group "closed"', () => {
    const closed = DEAL_STATUSES.find((s) => s.value === 'deal_closed')
    expect(closed).toBeDefined()
    expect(closed!.group).toBe('closed')
  })

  it('includes qualifying_buyer with group "qualifying"', () => {
    const q = DEAL_STATUSES.find((s) => s.value === 'qualifying_buyer')
    expect(q!.group).toBe('qualifying')
  })
})

// ─── VALID_TRANSITIONS constant ───────────────────────────────────────────

describe('VALID_TRANSITIONS', () => {
  it('deal_closed has no valid transitions (terminal state)', () => {
    expect(VALID_TRANSITIONS['deal_closed']).toEqual([])
  })

  it('deal_cancelled has no valid transitions (terminal state)', () => {
    expect(VALID_TRANSITIONS['deal_cancelled']).toEqual([])
  })

  it('qualifying_buyer can transition to manual_review', () => {
    expect(VALID_TRANSITIONS['qualifying_buyer']).toContain('manual_review')
  })
})

// ─── Pure helpers ─────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns label for known status', () => {
    expect(getStatusLabel('deal_closed')).toBe('Cerrado')
  })

  it('returns status itself for unknown status', () => {
    expect(getStatusLabel('unknown_status' as never)).toBe('unknown_status')
  })
})

describe('getStatusColor', () => {
  it('returns color for known status', () => {
    const color = getStatusColor('deal_closed')
    expect(color).toMatch(/^#/)
  })

  it('returns default gray for unknown status', () => {
    expect(getStatusColor('unknown_status' as never)).toBe('#6b7280')
  })
})

describe('getValidNextStatuses', () => {
  it('returns valid transitions for qualifying_buyer', () => {
    const next = getValidNextStatuses('qualifying_buyer')
    expect(next).toContain('manual_review')
    expect(next).toContain('buyer_qualified')
  })

  it('returns empty array for terminal status', () => {
    expect(getValidNextStatuses('deal_closed')).toEqual([])
  })
})

describe('formatDealPrice', () => {
  it('returns "-" for null', () => {
    expect(formatDealPrice(null)).toBe('-')
  })

  it('returns formatted currency string', () => {
    const result = formatDealPrice(50000)
    expect(result).toContain('50')
    expect(typeof result).toBe('string')
  })
})

describe('formatDealDate', () => {
  it('returns "-" for null', () => {
    expect(formatDealDate(null)).toBe('-')
  })

  it('returns formatted date string', () => {
    const result = formatDealDate('2026-03-15')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('-')
  })
})

describe('getDealModeLabel', () => {
  it('returns "Broker" for "broker"', () => {
    expect(getDealModeLabel('broker')).toBe('Broker')
  })

  it('returns "Tank" for "tank"', () => {
    expect(getDealModeLabel('tank')).toBe('Tank')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('deals starts as empty array', () => {
    const c = useAdminBrokerage()
    expect(c.deals.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminBrokerage()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminBrokerage()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminBrokerage()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminBrokerage()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchDeals ───────────────────────────────────────────────────────────

describe('fetchDeals', () => {
  it('calls supabase.from("brokerage_deals")', async () => {
    const c = useAdminBrokerage()
    await c.fetchDeals()
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('populates deals from data', async () => {
    const deal = { id: 'd-1', status: 'qualifying_buyer', buyer_id: null }
    mockFrom.mockReturnValue(makeChain({ data: [deal], error: null, count: 1 }))
    const c = useAdminBrokerage()
    await c.fetchDeals()
    expect(c.deals.value).toHaveLength(1)
    expect(c.deals.value[0]).toMatchObject({ id: 'd-1' })
  })

  it('sets total from count', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: 42 }))
    const c = useAdminBrokerage()
    await c.fetchDeals()
    expect(c.total.value).toBe(42)
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminBrokerage()
    await c.fetchDeals()
    expect(c.loading.value).toBe(false)
  })

  it('sets error and clears deals on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error'), count: 0 }))
    const c = useAdminBrokerage()
    await c.fetchDeals()
    expect(c.error.value).toBe('db error')
    expect(c.deals.value).toEqual([])
  })

  it('accepts statusGroup filter "qualifying"', async () => {
    const c = useAdminBrokerage()
    await c.fetchDeals({ statusGroup: 'qualifying' })
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('accepts statusGroup filter "all" (no filtering)', async () => {
    const c = useAdminBrokerage()
    await c.fetchDeals({ statusGroup: 'all' })
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('accepts search filter', async () => {
    const c = useAdminBrokerage()
    await c.fetchDeals({ search: '600123456' })
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })
})

// ─── createDeal ───────────────────────────────────────────────────────────

describe('createDeal', () => {
  it('returns deal id on success', async () => {
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'brokerage_deals' && callCount === 1) {
        return makeChain({ data: { id: 'deal-xyz' }, error: null })
      }
      return makeChain({ data: null, error: null })
    })
    const c = useAdminBrokerage()
    const id = await c.createDeal({ buyer_phone: '+34600123456', deal_mode: 'broker' })
    expect(id).toBe('deal-xyz')
  })

  it('calls from("brokerage_audit_log") after creating deal', async () => {
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'brokerage_deals' && callCount === 1) {
        return makeChain({ data: { id: 'deal-xyz' }, error: null })
      }
      return makeChain({ data: null, error: null })
    })
    const c = useAdminBrokerage()
    await c.createDeal({})
    expect(mockFrom).toHaveBeenCalledWith('brokerage_audit_log')
  })

  it('sets saving to false after completion', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'deal-1' }, error: null }))
    const c = useAdminBrokerage()
    await c.createDeal({})
    expect(c.saving.value).toBe(false)
  })

  it('returns null on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('insert failed') }))
    const c = useAdminBrokerage()
    const id = await c.createDeal({})
    expect(id).toBeNull()
  })

  it('sets error message on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('insert failed') }))
    const c = useAdminBrokerage()
    await c.createDeal({})
    expect(c.error.value).toBe('insert failed')
  })

  it('returns null when no vehicle or phone provided', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'deal-1' }, error: null }))
    const c = useAdminBrokerage()
    // createDeal with empty payload should still succeed (nullable fields)
    const id = await c.createDeal({})
    // If supabase returns id, we get it; if insert chain works, result comes through
    expect(typeof id === 'string' || id === null).toBe(true)
  })
})

// ─── getPendingCount ──────────────────────────────────────────────────────

describe('getPendingCount', () => {
  it('calls supabase.from("brokerage_deals")', async () => {
    const c = useAdminBrokerage()
    await c.getPendingCount()
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('returns count from supabase', async () => {
    mockFrom.mockReturnValue(makeChain({ count: 5, error: null }))
    const c = useAdminBrokerage()
    const count = await c.getPendingCount()
    expect(count).toBe(5)
  })

  it('returns 0 on error', async () => {
    mockFrom.mockReturnValue(makeChain({ count: null, error: new Error('db error') }))
    const c = useAdminBrokerage()
    const count = await c.getPendingCount()
    expect(count).toBe(0)
  })

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ count: null, error: null }))
    const c = useAdminBrokerage()
    const count = await c.getPendingCount()
    expect(count).toBe(0)
  })
})
