import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn().mockResolvedValue({}),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: '' }))

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = [], extra: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'gte', 'lte', 'lt', 'in', 'order', 'limit', 'single', 'update']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.insert = (..._a: unknown[]) => Promise.resolve({ data: null, error: null })
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/cron/reservation-expiry.post'

describe('reservation-expiry cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: '' }))
  })

  it('returns zero when no expired reservations', async () => {
    mockSupabase = { from: () => makeChain([]) }
    const result = await (handler as Function)({})
    expect(result.processed).toBe(0)
    expect(result.refunded).toBe(0)
    expect(result.errors).toBe(0)
  })

  it('throws 500 on fetch error', async () => {
    const errChain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'in', 'lt', 'limit']
    for (const m of ms) errChain[m] = () => errChain
    errChain.then = (r: (v: unknown) => void) =>
      Promise.resolve({ data: null, error: { message: 'DB fail' } }).then(r)
    errChain.catch = (r: (v: unknown) => void) =>
      Promise.resolve({ data: null, error: null }).catch(r)
    mockSupabase = { from: () => errChain }
    await expect((handler as Function)({})).rejects.toThrow()
  })

  it('expires reservation without stripe (no refund)', async () => {
    const reservations = [
      {
        id: 'r1',
        stripe_payment_intent_id: null,
        status: 'pending',
        deposit_cents: 5000,
        buyer_id: 'b1',
        vehicle_id: 'v1',
      },
    ]

    let fromCallCount = 0
    mockSupabase = {
      from: () => {
        fromCallCount++
        if (fromCallCount === 1) return makeChain(reservations) // fetch
        return makeChain(null) // update
      },
    }

    const result = await (handler as Function)({})
    expect(result.processed).toBe(1)
    expect(result.refunded).toBe(0)
    expect(result.errors).toBe(0)
  })

  it('expires reservation and refunds via Stripe', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: 'sk_test_xxx' }))
    // Mock stripe import
    vi.mock('stripe', () => ({
      default: class StripeMock {
        refunds = { create: vi.fn().mockResolvedValue({ id: 'ref_1' }) }
      },
    }))

    const reservations = [
      {
        id: 'r1',
        stripe_payment_intent_id: 'pi_123',
        status: 'active',
        deposit_cents: 5000,
        buyer_id: 'b1',
        vehicle_id: 'v1',
      },
    ]

    let fromCallCount = 0
    mockSupabase = {
      from: () => {
        fromCallCount++
        if (fromCallCount === 1) return makeChain(reservations)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.processed).toBe(1)
    // Stripe refund succeeds → refunded count increments
    expect(result.refunded).toBe(1)
  })

  it('handles update error gracefully', async () => {
    const reservations = [
      {
        id: 'r1',
        stripe_payment_intent_id: null,
        status: 'pending',
        deposit_cents: 5000,
        buyer_id: 'b1',
        vehicle_id: 'v1',
      },
    ]

    let fromCallCount = 0
    mockSupabase = {
      from: () => {
        fromCallCount++
        if (fromCallCount === 1) return makeChain(reservations)
        // Update returns error
        const errChain: Record<string, unknown> = {}
        const ms = ['select', 'update', 'eq', 'single', 'limit', 'in', 'lt']
        for (const m of ms) errChain[m] = () => errChain
        errChain.insert = () => Promise.resolve({ data: null, error: null })
        errChain.then = (r: (v: unknown) => void) =>
          Promise.resolve({ data: null, error: { message: 'Update failed' } }).then(r)
        errChain.catch = (r: (v: unknown) => void) =>
          Promise.resolve({ data: null, error: null }).catch(r)
        return errChain
      },
    }

    const result = await (handler as Function)({})
    expect(result.processed).toBe(1)
    expect(result.errors).toBe(1)
  })

  it('processes multiple reservations', async () => {
    const reservations = [
      {
        id: 'r1',
        stripe_payment_intent_id: null,
        status: 'pending',
        deposit_cents: 5000,
        buyer_id: 'b1',
        vehicle_id: 'v1',
      },
      {
        id: 'r2',
        stripe_payment_intent_id: null,
        status: 'active',
        deposit_cents: 2500,
        buyer_id: 'b2',
        vehicle_id: 'v2',
      },
    ]

    let fromCallCount = 0
    mockSupabase = {
      from: () => {
        fromCallCount++
        if (fromCallCount === 1) return makeChain(reservations)
        return makeChain(null) // update calls
      },
    }

    const result = await (handler as Function)({})
    expect(result.processed).toBe(2)
  })
})
