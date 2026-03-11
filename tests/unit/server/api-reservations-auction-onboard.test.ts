/**
 * Tests for:
 * - POST /api/reservations/create
 * - POST /api/reservations/respond
 * - POST /api/auction-deposit
 * - POST /api/stripe-connect-onboard
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const {
  mockReadBody,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockVerifyCsrf,
  mockIsAllowedUrl,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockReadBody: vi.fn().mockResolvedValue({}),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockVerifyCsrf: vi.fn(),
    mockIsAllowedUrl: vi.fn().mockReturnValue(true),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getHeader: vi.fn(),
  getRequestIP: vi.fn().mockReturnValue('1.2.3.4'),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCsrf', () => ({ verifyCsrf: mockVerifyCsrf }))
vi.mock('../../../server/utils/isAllowedUrl', () => ({ isAllowedUrl: mockIsAllowedUrl }))
vi.mock('../../../server/utils/idempotency', () => ({
  getIdempotencyKey: vi.fn().mockReturnValue(null),
  checkIdempotency: vi.fn().mockResolvedValue(null),
  storeIdempotencyResponse: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('stripe', () => ({
  default: class MockStripe {
    paymentIntents = { create: vi.fn().mockResolvedValue({ client_secret: 'pi_test_secret' }) }
    accounts = { create: vi.fn().mockResolvedValue({ id: 'acct_test' }) }
    accountLinks = { create: vi.fn().mockResolvedValue({ url: 'https://stripe.com/connect' }) }
  },
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  stripeSecretKey: undefined,
  supabaseServiceRoleKey: undefined,
  cronSecret: undefined,
  public: {},
}))
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue([]),
}))

function makeChain(data: any = null, error: any = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    }),
  }
}

function makeMultiChain(steps: any[]) {
  let callCount = 0
  return {
    from: vi.fn().mockImplementation(() => {
      const step = steps[callCount++] ?? { data: null, error: null }
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(step),
        maybeSingle: vi.fn().mockResolvedValue(step),
      }
      // Make it thenable for direct await patterns
      chain.then = (onFulfilled: Function, onRejected?: Function) =>
        Promise.resolve(step).then(onFulfilled as any, onRejected as any)
      return chain
    }),
  }
}

const mockEvent = { node: { req: { headers: {} } } } as any

const validUUID = '550e8400-e29b-41d4-a716-446655440000'
const validUUID2 = '660e8400-e29b-41d4-a716-446655440000'

// ── POST /api/reservations/create ────────────────────────────────────────────

import createReservationHandler from '../../../server/api/reservations/create.post'

describe('POST /api/reservations/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ vehicleId: validUUID })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(createReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when vehicleId is missing', async () => {
    mockReadBody.mockResolvedValue({})
    await expect(createReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when vehicleId is invalid UUID', async () => {
    mockReadBody.mockResolvedValue({ vehicleId: 'not-a-uuid' })
    await expect(createReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockServiceRole.mockReturnValue(makeChain(null, { message: 'not found' }))
    await expect(createReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when vehicle is not active', async () => {
    const vehicleData = { id: validUUID, dealer_id: 'd1', status: 'sold', dealers: { user_id: 'seller-1' } }
    mockServiceRole.mockReturnValue(makeChain(vehicleData))
    await expect(createReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 409 })
  })
})

// ── POST /api/reservations/respond ───────────────────────────────────────────

import respondReservationHandler from '../../../server/api/reservations/respond.post'

const validResponse = 'A'.repeat(55) // at least 50 chars
const validRespondBody = {
  reservationId: validUUID,
  response: validResponse,
}

describe('POST /api/reservations/respond', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ ...validRespondBody })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(respondReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when reservationId is invalid UUID', async () => {
    mockReadBody.mockResolvedValue({ reservationId: 'bad', response: validResponse })
    await expect(respondReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when response is too short', async () => {
    mockReadBody.mockResolvedValue({ reservationId: validUUID, response: 'short' })
    await expect(respondReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when reservation not found', async () => {
    mockServiceRole.mockReturnValue(makeChain(null, { message: 'not found' }))
    await expect(respondReservationHandler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns success when reservation updated', async () => {
    const steps = [
      { data: { id: validUUID, seller_id: 'user-1', status: 'pending' }, error: null }, // reservations
      { data: { user_id: 'user-1' }, error: null },  // dealers check
      { data: null, error: null }, // update
    ]
    const supabase = makeMultiChain(steps)
    mockServiceRole.mockReturnValue(supabase)
    const result = await respondReservationHandler(mockEvent)
    expect(result.success).toBe(true)
  })
})

// ── POST /api/auction-deposit ─────────────────────────────────────────────────

import auctionDepositHandler from '../../../server/api/auction-deposit.post'

describe('POST /api/auction-deposit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ auctionId: validUUID, registrationId: validUUID2 })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('throws 400 when missing auctionId or registrationId', async () => {
    mockReadBody.mockResolvedValue({})
    await expect(auctionDepositHandler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(auctionDepositHandler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns mock clientSecret when stripeKey not configured', async () => {
    const result = await auctionDepositHandler(mockEvent)
    expect(result.clientSecret).toContain('pi_mock_')
    expect(result.message).toBe('Service not configured')
  })

  it('throws 500 when supabase not configured (but stripe key set)', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
    await expect(auctionDepositHandler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: undefined, supabaseServiceRoleKey: undefined, public: {} }))
  })

  it('throws 403 when registration not found', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([]), // empty = not found
    }))
    await expect(auctionDepositHandler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: undefined, supabaseServiceRoleKey: undefined, public: {} }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
  })

  it('throws 404 when auction not found', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    let fetchCall = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      fetchCall++
      if (fetchCall === 1) {
        // registration found
        return Promise.resolve({ json: () => Promise.resolve([{ id: 'reg-1' }]) })
      }
      // auction not found
      return Promise.resolve({ json: () => Promise.resolve([]) })
    }))
    await expect(auctionDepositHandler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: undefined, supabaseServiceRoleKey: undefined, public: {} }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
  })

  it('creates PaymentIntent and returns clientSecret on success', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    let fetchCall = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      fetchCall++
      if (fetchCall === 1) {
        // registration found
        return Promise.resolve({ json: () => Promise.resolve([{ id: 'reg-1' }]) })
      }
      if (fetchCall === 2) {
        // auction found with deposit_cents
        return Promise.resolve({ json: () => Promise.resolve([{ deposit_cents: 200000 }]) })
      }
      // PATCH update registration
      return Promise.resolve({ ok: true })
    }))
    const result = await auctionDepositHandler(mockEvent)
    expect(result.clientSecret).toBe('pi_test_secret')
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: undefined, supabaseServiceRoleKey: undefined, public: {} }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
  })

  it('uses default deposit of 100000 when deposit_cents is falsy', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    let fetchCall = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      fetchCall++
      if (fetchCall === 1) return Promise.resolve({ json: () => Promise.resolve([{ id: 'reg-1' }]) })
      if (fetchCall === 2) return Promise.resolve({ json: () => Promise.resolve([{ deposit_cents: 0 }]) })
      return Promise.resolve({ ok: true })
    }))
    const result = await auctionDepositHandler(mockEvent)
    expect(result.clientSecret).toBe('pi_test_secret')
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: undefined, supabaseServiceRoleKey: undefined, public: {} }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
  })

  it('returns cached response when idempotency key matches', async () => {
    const idempotency = await import('../../../server/utils/idempotency')
    vi.mocked(idempotency.getIdempotencyKey).mockReturnValueOnce('idem-key')
    vi.mocked(idempotency.checkIdempotency).mockResolvedValueOnce({ clientSecret: 'cached_secret' })
    mockServiceRole.mockReturnValue(makeChain())
    const result = await auctionDepositHandler(mockEvent)
    expect(result).toEqual({ clientSecret: 'cached_secret' })
  })

  it('stores idempotency response when key is provided', async () => {
    const idempotency = await import('../../../server/utils/idempotency')
    vi.mocked(idempotency.getIdempotencyKey).mockReturnValueOnce('idem-store-key')
    vi.mocked(idempotency.checkIdempotency).mockResolvedValueOnce(null)

    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    let fetchCall = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      fetchCall++
      if (fetchCall === 1) return Promise.resolve({ json: () => Promise.resolve([{ id: 'reg-1' }]) })
      if (fetchCall === 2) return Promise.resolve({ json: () => Promise.resolve([{ deposit_cents: 50000 }]) })
      return Promise.resolve({ ok: true })
    }))
    await auctionDepositHandler(mockEvent)
    expect(idempotency.storeIdempotencyResponse).toHaveBeenCalledWith(
      expect.anything(),
      'idem-store-key',
      'POST /api/auction-deposit',
      expect.objectContaining({ clientSecret: 'pi_test_secret' }),
    )
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: undefined, supabaseServiceRoleKey: undefined, public: {} }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
  })
})

// ── POST /api/stripe-connect-onboard ─────────────────────────────────────────

import stripeConnectHandler from '../../../server/api/stripe-connect-onboard.post'

const validConnectBody = {
  dealerId: validUUID,
  returnUrl: 'https://tracciona.com/return',
  refreshUrl: 'https://tracciona.com/refresh',
}

describe('POST /api/stripe-connect-onboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      cronSecret: undefined,
      public: {},
    }))
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockReadBody.mockResolvedValue({ ...validConnectBody })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.STRIPE_SECRET_KEY
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.STRIPE_SECRET_KEY
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(stripeConnectHandler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when missing required fields', async () => {
    mockReadBody.mockResolvedValue({ dealerId: validUUID })
    await expect(stripeConnectHandler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns mock URL when stripeKey not configured', async () => {
    const result = await stripeConnectHandler(mockEvent)
    expect(result.url).toContain('connect=mock')
    expect(result.message).toBe('Service not configured')
  })

  it('throws 500 when supabase not configured (but stripe key set)', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
    await expect(stripeConnectHandler(mockEvent)).rejects.toMatchObject({ statusCode: 500 })
    vi.stubGlobal('useRuntimeConfig', () => ({ stripeSecretKey: undefined, supabaseServiceRoleKey: undefined, public: {} }))
  })
})
