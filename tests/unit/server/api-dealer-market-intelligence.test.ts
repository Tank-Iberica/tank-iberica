import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockGetQuery, mockGenIntel } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockGetQuery: vi.fn(),
  mockGenIntel: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: (...a: unknown[]) => mockGetQuery(...a),
  setResponseHeader: vi.fn(),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('~~/server/services/marketReport', () => ({
  generateDealerIntelligence: (...a: unknown[]) => mockGenIntel(...a),
}))

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = null) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'single', 'maybeSingle']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/dealer/market-intelligence.get'

describe('GET /api/dealer/market-intelligence', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when dealerId is missing', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetQuery.mockReturnValue({})
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 403 when non-admin non-owner', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetQuery.mockReturnValue({ dealerId: 'd1' })
    mockSupabase = {
      from: (table: string) => {
        if (table === 'users') return makeChain({ role: 'user' })
        if (table === 'dealers') return makeChain(null) // not the owner
        return makeChain(null)
      },
    }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('allows admin to access any dealer', async () => {
    mockServerUser.mockResolvedValue({ id: 'admin1' })
    mockGetQuery.mockReturnValue({ dealerId: 'd1' })
    const report = { insights: [], averagePrices: {} }
    mockGenIntel.mockResolvedValue(report)
    mockSupabase = {
      from: (table: string) => {
        if (table === 'users') return makeChain({ role: 'admin' })
        return makeChain(null)
      },
    }
    const result = await (handler as Function)({})
    expect(result).toEqual(report)
  })

  it('allows dealer owner to access own data', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetQuery.mockReturnValue({ dealerId: 'd1' })
    const report = { insights: ['good pricing'] }
    mockGenIntel.mockResolvedValue(report)
    mockSupabase = {
      from: (table: string) => {
        if (table === 'users') return makeChain({ role: 'dealer' })
        if (table === 'dealers') return makeChain({ id: 'd1' })
        return makeChain(null)
      },
    }
    const result = await (handler as Function)({})
    expect(result).toEqual(report)
  })
})
