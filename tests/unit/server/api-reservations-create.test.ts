import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockReadBody, mockCheckIdempotency, mockGetIdempotencyKey, mockStoreIdempotency } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockReadBody: vi.fn(),
  mockCheckIdempotency: vi.fn(),
  mockGetIdempotencyKey: vi.fn(),
  mockStoreIdempotency: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('../../../server/utils/idempotency', () => ({
  getIdempotencyKey: (...a: unknown[]) => mockGetIdempotencyKey(...a),
  checkIdempotency: (...a: unknown[]) => mockCheckIdempotency(...a),
  storeIdempotencyResponse: (...a: unknown[]) => mockStoreIdempotency(...a),
}))

vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: '' }))

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = null, extra: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'gte', 'in', 'single', 'maybeSingle', 'insert', 'update']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/reservations/create.post'

const VALID_UUID = '12345678-1234-1234-1234-123456789abc'

describe('POST /api/reservations/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdempotencyKey.mockReturnValue(null)
    mockCheckIdempotency.mockResolvedValue(null)
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: '' }))
  })

  it('returns cached response when idempotency key matches', async () => {
    const cached = { clientSecret: 'cached', reservationId: 'r1', depositCents: 5000 }
    mockGetIdempotencyKey.mockReturnValue('idem-1')
    mockCheckIdempotency.mockResolvedValue(cached)
    mockSupabase = { from: () => makeChain() }
    const result = await (handler as Function)({ node: { req: { headers: {} } } })
    expect(result).toEqual(cached)
  })

  it('throws 401 when not authenticated', async () => {
    mockGetIdempotencyKey.mockReturnValue(null)
    mockServerUser.mockResolvedValue(null)
    mockSupabase = { from: () => makeChain() }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 for missing vehicleId', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({})
    mockSupabase = { from: () => makeChain() }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid vehicleId format', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: 'not-a-uuid' })
    mockSupabase = { from: () => makeChain() }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    const chain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'single']
    for (const m of ms) chain[m] = () => chain
    chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'not found' } }).then(r)
    chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(r)

    mockSupabase = { from: () => chain }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when vehicle is not published', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    mockSupabase = {
      from: () => makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'draft', dealers: { user_id: 's1' } }),
    }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 422 when vehicle has no seller', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    mockSupabase = {
      from: () => makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: null }),
    }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 422 })
  })

  it('throws 409 when buyer tries to reserve own vehicle', async () => {
    mockServerUser.mockResolvedValue({ id: 'seller1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    mockSupabase = {
      from: () => makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } }),
    }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when active reservation already exists', async () => {
    mockServerUser.mockResolvedValue({ id: 'buyer1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    let fromCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') {
          return makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } })
        }
        if (table === 'reservations') {
          fromCall++
          if (fromCall === 1) {
            // maybeSingle returns existing reservation
            return makeChain({ id: 'existing-res' })
          }
        }
        return makeChain(null)
      },
    }
    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates mock reservation when stripe key is missing (free plan = 5000 cents)', async () => {
    mockServerUser.mockResolvedValue({ id: 'buyer1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    let fromCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') {
          return makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } })
        }
        if (table === 'reservations') {
          fromCall++
          if (fromCall === 1) return makeChain(null) // no existing reservation
          return makeChain(null) // insert
        }
        if (table === 'subscriptions') {
          return makeChain(null) // no sub = free plan
        }
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({ node: { req: { headers: {} } } })
    expect(result.depositCents).toBe(5000)
    expect(result.clientSecret).toContain('mock')
  })

  it('applies premium discount (1000 cents)', async () => {
    mockServerUser.mockResolvedValue({ id: 'buyer1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    let fromCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') {
          return makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } })
        }
        if (table === 'reservations') {
          fromCall++
          if (fromCall === 1) return makeChain(null)
          return makeChain(null)
        }
        if (table === 'subscriptions') {
          return makeChain({ plan: 'premium' })
        }
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({ node: { req: { headers: {} } } })
    expect(result.depositCents).toBe(1000)
  })

  it('applies basic discount (2500 cents)', async () => {
    mockServerUser.mockResolvedValue({ id: 'buyer1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    let fromCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') {
          return makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } })
        }
        if (table === 'reservations') {
          fromCall++
          if (fromCall === 1) return makeChain(null)
          return makeChain(null)
        }
        if (table === 'subscriptions') {
          return makeChain({ plan: 'basic' })
        }
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({ node: { req: { headers: {} } } })
    expect(result.depositCents).toBe(2500)
  })

  it('creates real Stripe PaymentIntent and reservation when stripe key is set', async () => {
    mockServerUser.mockResolvedValue({ id: 'buyer1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: 'sk_test_123' }))

    // Mock Stripe
    vi.doMock('stripe', () => ({
      default: class MockStripe {
        paymentIntents = {
          create: vi.fn().mockResolvedValue({ id: 'pi_real', client_secret: 'pi_real_secret' }),
        }
      },
    }))

    let reservationsCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') {
          return makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } })
        }
        if (table === 'reservations') {
          reservationsCall++
          if (reservationsCall === 1) return makeChain(null) // no existing
          // Insert - needs to return { id: 'res-1' }
          const insertChain: Record<string, unknown> = {}
          const ms = ['select', 'eq', 'in', 'single', 'maybeSingle', 'insert', 'update']
          for (const m of ms) insertChain[m] = () => insertChain
          insertChain.then = (r: (v: unknown) => void) =>
            Promise.resolve({ data: { id: 'res-1' }, error: null }).then(r)
          insertChain.catch = (r: (v: unknown) => void) =>
            Promise.resolve({ data: { id: 'res-1' }, error: null }).catch(r)
          return insertChain
        }
        if (table === 'subscriptions') return makeChain(null) // free plan
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({ node: { req: { headers: {} } } })
    expect(result.clientSecret).toBe('pi_real_secret')
    expect(result.reservationId).toBe('res-1')
    expect(result.depositCents).toBe(5000)

    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: '' }))
  })

  it('throws 500 when reservation insert fails', async () => {
    mockServerUser.mockResolvedValue({ id: 'buyer1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: 'sk_test_123' }))

    let reservationsCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') {
          return makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } })
        }
        if (table === 'reservations') {
          reservationsCall++
          if (reservationsCall === 1) return makeChain(null) // no existing
          // Insert failure
          const failChain: Record<string, unknown> = {}
          const ms = ['select', 'eq', 'in', 'single', 'maybeSingle', 'insert', 'update']
          for (const m of ms) failChain[m] = () => failChain
          failChain.then = (r: (v: unknown) => void) =>
            Promise.resolve({ data: null, error: { message: 'insert failed' } }).then(r)
          failChain.catch = (r: (v: unknown) => void) =>
            Promise.resolve({ data: null, error: null }).catch(r)
          return failChain
        }
        if (table === 'subscriptions') return makeChain(null)
        return makeChain(null)
      },
    }

    await expect((handler as Function)({ node: { req: { headers: {} } } })).rejects.toMatchObject({ statusCode: 500 })
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: '' }))
  })

  it('stores idempotency response when key is provided and stripe path succeeds', async () => {
    mockServerUser.mockResolvedValue({ id: 'buyer1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })
    mockGetIdempotencyKey.mockReturnValue('idem-res-key')
    mockCheckIdempotency.mockResolvedValue(null)
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: 'sk_test_123' }))

    let reservationsCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') {
          return makeChain({ id: VALID_UUID, dealer_id: 'd1', status: 'published', dealers: { user_id: 'seller1' } })
        }
        if (table === 'reservations') {
          reservationsCall++
          if (reservationsCall === 1) return makeChain(null)
          const insertChain: Record<string, unknown> = {}
          const ms = ['select', 'eq', 'in', 'single', 'maybeSingle', 'insert', 'update']
          for (const m of ms) insertChain[m] = () => insertChain
          insertChain.then = (r: (v: unknown) => void) =>
            Promise.resolve({ data: { id: 'res-idem' }, error: null }).then(r)
          insertChain.catch = (r: (v: unknown) => void) =>
            Promise.resolve({ data: null, error: null }).catch(r)
          return insertChain
        }
        if (table === 'subscriptions') return makeChain(null)
        return makeChain(null)
      },
    }

    await (handler as Function)({ node: { req: { headers: {} } } })
    expect(mockStoreIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      'idem-res-key',
      'POST /api/reservations/create',
      expect.objectContaining({ reservationId: 'res-idem' }),
    )

    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: '' }))
    mockGetIdempotencyKey.mockReturnValue(null)
  })
})
