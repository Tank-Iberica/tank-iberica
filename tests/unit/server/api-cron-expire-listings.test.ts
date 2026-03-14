/**
 * Tests for POST /api/cron/expire-listings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVerifyCronSecret, mockReadBody } = vi.hoisted(() => ({
  mockVerifyCronSecret: vi.fn(),
  mockReadBody: vi.fn(),
}))

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/utils/verifyCronSecret', () => ({
  verifyCronSecret: (...a: unknown[]) => mockVerifyCronSecret(...a),
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockSupabase: Record<string, unknown>

function makeSupabase(
  opts: {
    expired?: unknown[]
    expiredError?: unknown
    updateError?: unknown
    dealer?: unknown
  } = {},
) {
  const {
    expired = [
      {
        id: 'v1',
        dealer_id: 'd1',
        make: 'Volvo',
        model: 'FH',
        year: 2018,
        published_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'v2',
        dealer_id: 'd1',
        make: 'MAN',
        model: 'TGX',
        year: 2019,
        published_at: '2025-01-02T00:00:00Z',
      },
    ],
    expiredError = null,
    updateError = null,
    dealer = { email: 'dealer@test.com', company_name: 'Test Dealer' },
  } = opts

  const fromImpl = (table: string) => {
    const chain: Record<string, unknown> = {}
    chain.select = () => chain
    chain.eq = () => chain
    chain.in = () => Promise.resolve({ error: updateError })
    chain.update = () => chain
    chain.lt = () => chain
    chain.limit = () => Promise.resolve({ data: expired, error: expiredError })
    chain.insert = () => Promise.resolve({ error: null })
    chain.maybeSingle = () => Promise.resolve({ data: dealer, error: null })
    chain.gte = () => chain
    chain.order = () => chain

    if (table === 'vehicles') {
      chain.select = () => chain
      chain.eq = () => chain
      chain.lt = () => chain
      chain.limit = () => Promise.resolve({ data: expired, error: expiredError })
      chain.update = () => chain
      chain.in = () => Promise.resolve({ error: updateError })
    }
    if (table === 'dealers') {
      chain.select = () => chain
      chain.eq = () => chain
      chain.maybeSingle = () => Promise.resolve({ data: dealer, error: null })
    }
    if (table === 'email_queue' || table === 'analytics_events') {
      chain.insert = () => Promise.resolve({ error: null })
    }
    return chain
  }

  return { from: vi.fn().mockImplementation(fromImpl) }
}

import handler from '../../../server/api/cron/expire-listings.post'

describe('POST /api/cron/expire-listings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({})
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockSupabase = makeSupabase()
  })

  it('returns ok=true when vehicles are expired', async () => {
    const result = await (handler as Function)({})
    expect((result as any).ok).toBe(true)
  })

  it('returns expired count', async () => {
    const result = await (handler as Function)({})
    expect(typeof (result as any).expired).toBe('number')
    expect((result as any).expired).toBeGreaterThanOrEqual(0)
  })

  it('returns ok=true and expired=0 when no expired vehicles', async () => {
    mockSupabase = makeSupabase({ expired: [] })
    const result = await (handler as Function)({})
    expect((result as any).ok).toBe(true)
    expect((result as any).expired).toBe(0)
  })

  it('returns ok=false when fetch fails', async () => {
    mockSupabase = makeSupabase({ expiredError: { message: 'DB error' }, expired: [] })
    const result = await (handler as Function)({})
    expect((result as any).ok).toBe(false)
  })

  it('throws 401 when cron secret fails', async () => {
    mockVerifyCronSecret.mockImplementation(() => {
      const err = new Error('Unauthorized') as any
      err.statusCode = 401
      throw err
    })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('notified count is a number', async () => {
    const result = await (handler as Function)({})
    expect(typeof (result as any).notified).toBe('number')
  })
})
