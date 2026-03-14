/**
 * Tests for POST /api/cron/auto-renew-feature
 * Task #14 — auto-renew and auto-feature cron job
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── hoisted mocks ───────────────────────────────────────────────────────────

const { mockVerifyCronSecret, mockSafeError, mockLogger } = vi.hoisted(() => ({
  mockVerifyCronSecret: vi.fn(),
  mockSafeError: vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  }),
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))
vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))

// -- Supabase mock factory ---------------------------------------------------

type Chain = {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
}

function makeChain(data: unknown = [], error: unknown = null): Chain {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data, error }), // terminal in dealers query
    limit: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return chain
}

function makeSupabase(opts: {
  vehicles?: unknown[]
  vehiclesError?: unknown
  dealers?: unknown[]
  credits?: unknown[] // balance data per READ call — consumed in order
}) {
  const { vehicles = [], vehiclesError = null, dealers = [], credits = [] } = opts

  let creditReadIndex = 0
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'vehicles') {
        const chain = makeChain(vehicles, vehiclesError)
        // update returns a chain with eq
        chain.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
        return chain
      }
      if (table === 'dealers') return makeChain(dealers)
      if (table === 'user_credits') {
        // Returns a chain that handles BOTH reads (select→eq→limit) and writes (update→eq)
        const creditData = credits[creditReadIndex] ?? [{ balance: 5 }]
        const chain: any = {
          select: vi.fn().mockImplementation(() => {
            // This is a READ — consume the next credit entry
            creditReadIndex++
            return chain
          }),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: creditData, error: null }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }
        return chain
      }
      if (table === 'credit_transactions') return makeChain()
      return makeChain()
    }),
  }
  return supabase
}

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: vi.fn((event: unknown) => (event as any).__supabase),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn().mockResolvedValue({}),
}))

vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'test-secret', public: {} }))

// ── import handler + deductOneCredit ───────────────────────────────────────

import handler, { deductOneCredit } from '../../../server/api/cron/auto-renew-feature.post'

// ── unit tests for deductOneCredit ─────────────────────────────────────────

describe('deductOneCredit()', () => {
  it('returns null when balance is 0', async () => {
    const sb = {
      from: vi.fn().mockReturnValue(makeChain([{ balance: 0 }])),
    }
    const result = await deductOneCredit(sb as any, 'user-1', new Date())
    expect(result).toBeNull()
  })

  it('returns null when no credits row', async () => {
    const sb = {
      from: vi.fn().mockReturnValue(makeChain([])),
    }
    const result = await deductOneCredit(sb as any, 'user-1', new Date())
    expect(result).toBeNull()
  })

  it('returns newBalance when sufficient credits', async () => {
    const chain = makeChain([{ balance: 4 }])
    chain.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const sb = { from: vi.fn().mockReturnValue(chain) }
    const result = await deductOneCredit(sb as any, 'user-1', new Date())
    expect(result).toBe(3)
  })
})

// ── integration-style handler tests ────────────────────────────────────────

describe('POST /api/cron/auto-renew-feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
  })

  it('returns zero counts when no vehicles match', async () => {
    const supabase = makeSupabase({ vehicles: [] })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.processed).toBe(0)
    expect(result.renewed).toBe(0)
    expect(result.featured).toBe(0)
    expect(result.skipped).toBe(0)
  })

  it('skips vehicle with no dealer_id', async () => {
    const supabase = makeSupabase({
      vehicles: [{ id: 'v1', dealer_id: null, auto_renew: true, auto_feature: false }],
      dealers: [],
    })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.skipped).toBe(1)
    expect(result.renewed).toBe(0)
  })

  it('skips auto_renew when dealer has insufficient credits', async () => {
    const supabase = makeSupabase({
      vehicles: [{ id: 'v1', dealer_id: 'd1', auto_renew: true, auto_feature: false }],
      dealers: [{ id: 'd1', user_id: 'u1' }],
      credits: [[{ balance: 0 }]],
    })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.skipped).toBe(1)
    expect(result.renewed).toBe(0)
  })

  it('counts renewed when auto_renew succeeds', async () => {
    const supabase = makeSupabase({
      vehicles: [{ id: 'v1', dealer_id: 'd1', auto_renew: true, auto_feature: false }],
      dealers: [{ id: 'd1', user_id: 'u1' }],
      credits: [[{ balance: 3 }]],
    })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.renewed).toBe(1)
    expect(result.featured).toBe(0)
    expect(result.processed).toBe(1)
  })

  it('counts featured when auto_feature succeeds', async () => {
    const supabase = makeSupabase({
      vehicles: [{ id: 'v2', dealer_id: 'd1', auto_renew: false, auto_feature: true }],
      dealers: [{ id: 'd1', user_id: 'u1' }],
      credits: [[{ balance: 2 }]],
    })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.featured).toBe(1)
    expect(result.renewed).toBe(0)
  })

  it('deducts 2 credits when both toggles are enabled on same vehicle', async () => {
    const supabase = makeSupabase({
      vehicles: [{ id: 'v3', dealer_id: 'd1', auto_renew: true, auto_feature: true }],
      dealers: [{ id: 'd1', user_id: 'u1' }],
      credits: [[{ balance: 5 }], [{ balance: 4 }]], // 2 deductions
    })
    const result = await handler({ __supabase: supabase } as any)
    expect(result.renewed).toBe(1)
    expect(result.featured).toBe(1)
  })

  it('throws 500 when vehicles query fails', async () => {
    const supabase = makeSupabase({
      vehicles: [],
      vehiclesError: { message: 'DB error' },
    })
    await expect(handler({ __supabase: supabase } as any)).rejects.toMatchObject({
      statusCode: 500,
    })
  })
})
