import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  ;(globalThis as any).defineEventHandler = (fn: Function) => fn
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: vi.fn(() => ({})),
}))

// Build chainable Supabase mock
function createChainableMock(resolvedValue: any = { data: [], count: 0, error: null }) {
  const chain: any = {}
  const methods = ['select', 'from', 'eq', 'gte', 'not', 'or', 'order', 'limit', 'range']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (resolve: Function) => resolve(resolvedValue)
  return chain
}

const dealerData = [
  {
    id: '1',
    business_name: 'Dealer A',
    subscription_tier: 'premium',
    subscription_status: 'active',
    stripe_customer_id: 'cus_1',
  },
  {
    id: '2',
    business_name: 'Dealer B',
    subscription_tier: 'basic',
    subscription_status: 'cancelled',
    stripe_customer_id: 'cus_2',
  },
]
const summaryData = [
  { subscription_status: 'active' },
  { subscription_status: 'active' },
  { subscription_status: 'cancelled' },
]

const mockDealerChain = createChainableMock({ data: dealerData, count: 2, error: null })
const mockSummaryChain = createChainableMock({ data: summaryData, count: 3, error: null })

let callIndex = 0
const mockFrom = vi.fn(() => {
  callIndex++
  // First from('dealers') is the main query, second is summary
  return callIndex % 2 === 1 ? mockDealerChain : mockSummaryChain
})
const mockSupabase = { from: mockFrom }

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/rbac', () => ({
  requireRole: vi.fn(),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as any
    err.statusCode = _code
    return err
  },
}))

import handler from '../../../server/api/admin/subscriptions.get'
import { getQuery } from 'h3'
import { requireRole } from '../../../server/utils/rbac'

const mockEvent = { context: {} } as any

describe('Admin Subscriptions Endpoint (#274)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callIndex = 0
    vi.mocked(getQuery).mockReturnValue({})
  })

  it('requires admin role', async () => {
    await handler(mockEvent)
    expect(requireRole).toHaveBeenCalledWith(mockEvent, 'admin')
  })

  it('queries dealers table', async () => {
    await handler(mockEvent)
    expect(mockFrom).toHaveBeenCalledWith('dealers')
  })

  it('returns subscriptions array', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result).toHaveProperty('subscriptions')
    expect(Array.isArray(result.subscriptions)).toBe(true)
  })

  it('returns pagination metadata', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.pagination).toHaveProperty('page')
    expect(result.pagination).toHaveProperty('limit')
    expect(result.pagination).toHaveProperty('total')
    expect(result.pagination).toHaveProperty('totalPages')
  })

  it('returns summary counts', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result).toHaveProperty('summary')
    expect(typeof result.summary).toBe('object')
  })

  it('defaults to page 1, limit 20, status "all"', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.limit).toBe(20)
    expect(result.filter).toBe('all')
  })

  it('clamps limit to max 100', async () => {
    vi.mocked(getQuery).mockReturnValue({ limit: '500' })
    const result = (await handler(mockEvent)) as any
    expect(result.pagination.limit).toBe(100)
  })

  it('supports status filter', async () => {
    vi.mocked(getQuery).mockReturnValue({ status: 'active' })
    const result = (await handler(mockEvent)) as any
    expect(result.filter).toBe('active')
  })

  it('ignores invalid status values', async () => {
    vi.mocked(getQuery).mockReturnValue({ status: 'invalid_status' })
    const result = (await handler(mockEvent)) as any
    expect(result.filter).toBe('all')
  })
})
