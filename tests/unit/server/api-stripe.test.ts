/**
 * Tests for Stripe endpoints:
 * - POST /api/stripe/checkout
 * - POST /api/stripe/portal
 * - POST /api/stripe/checkout-credits
 * - POST /api/stripe/webhook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const {
  mockReadBody,
  mockReadRawBody,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockVerifyCsrf,
  mockIsAllowedUrl,
  mockSupabaseRestPatch,
  mockSupabaseRestInsert,
  mockSupabaseRestGet,
  mockGetSubscriptionUserInfo,
  mockSendDunningEmail,
  mockCreateAutoInvoice,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockReadBody: vi.fn().mockResolvedValue({}),
    mockReadRawBody: vi.fn().mockResolvedValue(null),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockVerifyCsrf: vi.fn(),
    mockIsAllowedUrl: vi.fn().mockReturnValue(true),
    mockSupabaseRestPatch: vi.fn().mockResolvedValue([]),
    mockSupabaseRestInsert: vi.fn().mockResolvedValue([]),
    mockSupabaseRestGet: vi.fn().mockResolvedValue([]),
    mockGetSubscriptionUserInfo: vi.fn().mockResolvedValue(null),
    mockSendDunningEmail: vi.fn().mockResolvedValue(undefined),
    mockCreateAutoInvoice: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  readRawBody: mockReadRawBody,
  createError: (opts: { statusCode?: number; statusMessage?: string }) => {
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
vi.mock('../../../server/services/billing', () => ({
  supabaseRestPatch: mockSupabaseRestPatch,
  supabaseRestInsert: mockSupabaseRestInsert,
  supabaseRestGet: mockSupabaseRestGet,
  getSubscriptionUserInfo: mockGetSubscriptionUserInfo,
  sendDunningEmail: mockSendDunningEmail,
  createAutoInvoice: mockCreateAutoInvoice,
}))

vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = {
      sessions: {
        create: vi.fn().mockResolvedValue({ id: 'cs_test', url: 'https://stripe.com/pay' }),
      },
    }
    billingPortal = {
      sessions: { create: vi.fn().mockResolvedValue({ url: 'https://stripe.com/portal' }) },
    }
    webhooks = { constructEvent: vi.fn() }
    accounts = { create: vi.fn().mockResolvedValue({ id: 'acct_new_123' }) }
    accountLinks = {
      create: vi.fn().mockResolvedValue({ url: 'https://connect.stripe.com/onboard' }),
    }
  },
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  stripeSecretKey: undefined,
  stripeWebhookSecret: undefined,
  supabaseServiceRoleKey: undefined,
  cronSecret: 'test-cron',
  public: {},
}))

function makeSubabaseChain(data: any = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    }),
  }
}

// ── POST /api/stripe/checkout ──────────────────────────────────────────────

import checkoutHandler from '../../../server/api/stripe/checkout.post'

const validCheckoutBody = {
  plan: 'classic',
  interval: 'month',
  successUrl: 'https://tracciona.com/success',
  cancelUrl: 'https://tracciona.com/cancel',
}

// Mock tier returned by subscription_tiers fetch
const mockClassicTier = {
  id: 'tier-classic',
  slug: 'classic',
  name_en: 'Classic',
  price_cents_monthly: 1900,
  price_cents_yearly: 14900,
  stripe_price_id_monthly: null,
  stripe_price_id_yearly: null,
}

// Helper: mocks 2 sequential fetch calls (tiers, then subscriptions)
function mockFetchForCheckout(tierResult: unknown[], subResult: unknown[]) {
  let call = 0
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      call++
      return Promise.resolve({
        json: vi.fn().mockResolvedValue(call === 1 ? tierResult : subResult),
      })
    }),
  )
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockIsAllowedUrl.mockReturnValue(true)
    mockReadBody.mockResolvedValue({ ...validCheckoutBody })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when missing required fields', async () => {
    mockReadBody.mockResolvedValue({ plan: 'classic' })
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when successUrl is not allowed', async () => {
    mockIsAllowedUrl.mockReturnValueOnce(false)
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when cancelUrl is not allowed', async () => {
    mockIsAllowedUrl.mockReturnValueOnce(true).mockReturnValueOnce(false)
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when plan is invalid', async () => {
    mockReadBody.mockResolvedValue({ ...validCheckoutBody, plan: 'enterprise' })
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when interval is invalid', async () => {
    mockReadBody.mockResolvedValue({ ...validCheckoutBody, interval: 'week' })
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns mock URL when stripeKey not configured', async () => {
    const result = await checkoutHandler({} as any)
    expect(result.message).toBe('Service not configured')
    expect(result.url).toContain('mock')
    expect(result.sessionId).toContain('mock_session')
  })

  it('throws 500 when supabase not configured but stripe is', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: '',
      public: {},
    }))
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
  })

  it('creates checkout session and returns URL on success (new subscriber with trial)', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    // 1st fetch: tier lookup → classic tier; 2nd fetch: subscriptions → none (first sub)
    mockFetchForCheckout([mockClassicTier], [])
    const result = await checkoutHandler({} as any)
    expect(result.url).toBe('https://stripe.com/pay')
    expect(result.sessionId).toBe('cs_test')
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('attaches existing customer ID when subscription exists', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    // 1st fetch: tier lookup; 2nd fetch: subscriptions with existing customer
    mockFetchForCheckout(
      [mockClassicTier],
      [{ stripe_customer_id: 'cus_existing', has_had_trial: true }],
    )
    const result = await checkoutHandler({} as any)
    expect(result.url).toBe('https://stripe.com/pay')
    expect(result.sessionId).toBe('cs_test')
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('throws 400 when tier slug not found in DB', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    // Tier not found in DB
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
    await expect(checkoutHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('uses stripe_price_id when available (no inline price_data)', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    const tierWithStripeId = {
      ...mockClassicTier,
      stripe_price_id_monthly: 'price_test_classic_monthly',
    }
    mockFetchForCheckout([tierWithStripeId], [])
    // Should succeed (returns URL) — Stripe is called with price ID not price_data
    const result = await checkoutHandler({} as any)
    expect(result.url).toBe('https://stripe.com/pay')
    expect(result.sessionId).toBe('cs_test')
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })
})

// ── POST /api/stripe/portal ────────────────────────────────────────────────

import portalHandler from '../../../server/api/stripe/portal.post'

const validPortalBody = {
  customerId: 'cus_123',
  returnUrl: 'https://tracciona.com/dashboard',
}

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockIsAllowedUrl.mockReturnValue(true)
    mockReadBody.mockResolvedValue({ ...validPortalBody })
    mockServiceRole.mockReturnValue(makeSubabaseChain({ stripe_customer_id: 'cus_123' }))
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(portalHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when missing required fields', async () => {
    mockReadBody.mockResolvedValue({})
    await expect(portalHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 403 when customerId does not belong to user', async () => {
    mockServiceRole.mockReturnValue(makeSubabaseChain(null))
    await expect(portalHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when returnUrl is not allowed', async () => {
    mockIsAllowedUrl.mockReturnValueOnce(false)
    await expect(portalHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns mock URL when stripeKey not configured', async () => {
    const result = await portalHandler({} as any)
    expect(result.message).toBe('Service not configured')
    expect(result.url).toContain('portal=mock')
  })
})

// ── POST /api/stripe/checkout-credits ─────────────────────────────────────

import checkoutCreditsHandler from '../../../server/api/stripe/checkout-credits.post'

const validCreditsBody = {
  packSlug: 'starter',
  successUrl: 'https://tracciona.com/success',
  cancelUrl: 'https://tracciona.com/cancel',
}

describe('POST /api/stripe/checkout-credits', () => {
  const savedUrl = process.env.SUPABASE_URL
  const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockIsAllowedUrl.mockReturnValue(true)
    mockReadBody.mockResolvedValue({ ...validCreditsBody })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
  })

  afterEach(() => {
    if (savedUrl) process.env.SUPABASE_URL = savedUrl
    if (savedKey) process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(checkoutCreditsHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when missing required fields', async () => {
    mockReadBody.mockResolvedValue({ packSlug: 'starter' })
    await expect(checkoutCreditsHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when successUrl is not allowed', async () => {
    mockIsAllowedUrl.mockReturnValueOnce(false)
    await expect(checkoutCreditsHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when supabase not configured', async () => {
    await expect(checkoutCreditsHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 404 when pack not found', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) }))
    await expect(checkoutCreditsHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns mock URL when pack found but stripeKey not configured', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi
          .fn()
          .mockResolvedValue([
            { id: 'pack-1', name_es: 'Starter', name_en: 'Starter', credits: 10, price_cents: 999 },
          ]),
      }),
    )
    const result = await checkoutCreditsHandler({} as any)
    expect(result.message).toBe('Service not configured')
    expect(result.url).toContain('mock')
  })

  it('throws 400 when cancelUrl is not allowed', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockIsAllowedUrl.mockReturnValueOnce(true).mockReturnValueOnce(false)
    await expect(checkoutCreditsHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('creates checkout session with existing customer and returns URL', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    let fetchCall = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        fetchCall++
        if (fetchCall === 1) {
          // credit_packs lookup
          return Promise.resolve({
            json: () =>
              Promise.resolve([
                {
                  id: 'pack-1',
                  name_es: 'Starter',
                  name_en: 'Starter',
                  credits: 10,
                  price_cents: 999,
                },
              ]),
          })
        }
        if (fetchCall === 2) {
          // subscriptions lookup with existing customer
          return Promise.resolve({
            json: () => Promise.resolve([{ stripe_customer_id: 'cus_existing' }]),
          })
        }
        // payments insert
        return Promise.resolve({ ok: true })
      }),
    )
    const result = await checkoutCreditsHandler({} as any)
    expect(result.url).toBe('https://stripe.com/pay')
    expect(result.sessionId).toBe('cs_test')
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
  })

  it('creates checkout session without customer when no subscription exists', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: 'sk_test_123',
      supabaseServiceRoleKey: 'test-key',
      public: {},
    }))
    let fetchCall = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        fetchCall++
        if (fetchCall === 1) {
          // credit_packs with single credit (singular description)
          return Promise.resolve({
            json: () =>
              Promise.resolve([
                {
                  id: 'pack-single',
                  name_es: 'Single',
                  name_en: 'Single',
                  credits: 1,
                  price_cents: 500,
                },
              ]),
          })
        }
        if (fetchCall === 2) {
          // no existing subscription
          return Promise.resolve({ json: () => Promise.resolve([]) })
        }
        return Promise.resolve({ ok: true })
      }),
    )
    const result = await checkoutCreditsHandler({} as any)
    expect(result.url).toBe('https://stripe.com/pay')
    expect(result.sessionId).toBe('cs_test')
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      supabaseServiceRoleKey: undefined,
      cronSecret: 'test-cron',
      public: {},
    }))
  })
})

// ── POST /api/stripe/webhook ───────────────────────────────────────────────

import webhookHandler from '../../../server/api/stripe/webhook.post'

describe('POST /api/stripe/webhook', () => {
  const eventWithHeaders = { node: { req: { headers: {} } } } as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', () => ({
      stripeSecretKey: undefined,
      stripeWebhookSecret: undefined,
      supabaseServiceRoleKey: undefined,
      cronSecret: 'test-cron',
      public: {},
    }))
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockSupabaseRestGet.mockResolvedValue([])
    mockSupabaseRestPatch.mockResolvedValue([])
    mockSupabaseRestInsert.mockResolvedValue([])
  })

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  // ── Basic validation ──────────────────────────────────────────────────

  it('throws 400 when no body', async () => {
    mockReadRawBody.mockResolvedValue(null)
    await expect(webhookHandler(eventWithHeaders)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when stripeKey not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY
    mockReadRawBody.mockResolvedValue('{}')
    await expect(webhookHandler(eventWithHeaders)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when supabaseUrl not configured', async () => {
    delete process.env.SUPABASE_URL
    mockReadRawBody.mockResolvedValue(JSON.stringify({ type: 'x', data: { object: {} } }))
    await expect(webhookHandler(eventWithHeaders)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when supabaseKey not configured', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    mockReadRawBody.mockResolvedValue(JSON.stringify({ type: 'x', data: { object: {} } }))
    await expect(webhookHandler(eventWithHeaders)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns received:true for unknown event type', async () => {
    const body = JSON.stringify({ type: 'unknown.event', data: { object: {} } })
    mockReadRawBody.mockResolvedValue(body)
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
  })

  // ── Idempotency ───────────────────────────────────────────────────────

  it('returns idempotent:true when event already processed', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', metadata: { user_id: 'u1', plan: 'basic' } } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValue([{ id: 'existing' }])
    const result = await webhookHandler(eventWithHeaders)
    expect(result.idempotent).toBe(true)
  })

  it('returns idempotent:true for invoice.payment_succeeded already processed', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_succeeded',
      data: { object: { id: 'inv_dup', subscription: 'sub_1', amount_paid: 100, customer: 'c1' } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValue([{ id: 'existing' }])
    const result = await webhookHandler(eventWithHeaders)
    expect(result.idempotent).toBe(true)
  })

  it('returns idempotent:true for invoice.payment_failed already processed', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_failed',
      data: {
        object: { id: 'inv_dup_fail', subscription: 'sub_1', amount_due: 100, customer: 'c1' },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValue([{ id: 'existing' }])
    const result = await webhookHandler(eventWithHeaders)
    expect(result.idempotent).toBe(true)
  })

  it('returns idempotent:true for customer.subscription.deleted already processed', async () => {
    const body = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_dup', metadata: {} } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValue([{ id: 'existing' }])
    const result = await webhookHandler(eventWithHeaders)
    expect(result.idempotent).toBe(true)
  })

  it('does not flag idempotent for event types without rules', async () => {
    const body = JSON.stringify({ type: 'charge.updated', data: { object: { id: 'ch_1' } } })
    mockReadRawBody.mockResolvedValue(body)
    const result = await webhookHandler(eventWithHeaders)
    expect(result.idempotent).toBeUndefined()
    expect(result.received).toBe(true)
  })

  // ── checkout.session.completed — subscription ─────────────────────────

  it('handles checkout.session.completed for subscription — new subscription (insert)', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_1',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    // No existing subscription
    mockSupabaseRestGet.mockResolvedValue([])
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should insert new subscription (not patch)
    expect(mockSupabaseRestInsert).toHaveBeenCalledWith(
      expect.anything(),
      'subscriptions',
      expect.objectContaining({ user_id: 'u1', plan: 'basic', status: 'active' }),
    )
    // Should create auto-invoice for amount_total
    expect(mockCreateAutoInvoice).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'u1', amountCents: 2900 }),
    )
  })

  it('handles checkout.session.completed for subscription — existing subscription (patch)', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_1',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'premium' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    // First call: idempotency check returns [] (not processed)
    // Second call: existing subscription found
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([{ id: 'sub-existing' }]) // existing subscription check
      .mockResolvedValueOnce([]) // reactivateVehicles: dealers lookup
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should patch existing subscription
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'subscriptions',
      'user_id=eq.u1',
      expect.objectContaining({ plan: 'premium', status: 'active' }),
    )
  })

  it('handles subscription checkout with no_payment_required (trial)', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_trial',
          payment_status: 'no_payment_required',
          customer: 'cus_1',
          subscription: 'sub_trial',
          amount_total: 0,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValue([])
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should set has_had_trial = true
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'subscriptions',
      'user_id=eq.u1',
      { has_had_trial: true },
    )
  })

  it('handles subscription checkout with amount_total = 0 (no auto-invoice)', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_free',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_free',
          amount_total: 0,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValue([])
    await webhookHandler(eventWithHeaders)
    expect(mockCreateAutoInvoice).not.toHaveBeenCalled()
  })

  it('reactivates paused vehicles on subscription upgrade', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_upgrade',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_upgrade',
          amount_total: 5900,
          metadata: { user_id: 'u1', plan: 'premium' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([]) // existing subscription check
      .mockResolvedValueOnce([{ id: 'dealer-1' }]) // dealer lookup
      .mockResolvedValueOnce([{ id: 'v1' }, { id: 'v2' }]) // published vehicles
      .mockResolvedValueOnce([{ id: 'v3' }, { id: 'v4' }, { id: 'v5' }]) // paused vehicles
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesReactivated).toBe(3)
    // Should unpause vehicles
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'vehicles',
      expect.stringContaining('id=in.'),
      { status: 'published' },
    )
  })

  it('reactivates limited vehicles on basic plan upgrade', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_basic',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_basic',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    // basic plan limit = 20; 15 published = 5 slots
    // 10 paused vehicles = only 5 should be reactivated
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([]) // existing subscription
      .mockResolvedValueOnce([{ id: 'dealer-1' }]) // dealer lookup
      .mockResolvedValueOnce(Array.from({ length: 15 }, (_, i) => ({ id: `pub-${i}` }))) // 15 published
      .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ id: `paused-${i}` }))) // 10 paused
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesReactivated).toBe(5)
  })

  it('does not reactivate when slots are full', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_full',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_full',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // existing subscription
      .mockResolvedValueOnce([{ id: 'dealer-1' }]) // dealer
      .mockResolvedValueOnce(Array.from({ length: 20 }, (_, i) => ({ id: `pub-${i}` }))) // 20 published = full
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesReactivated).toBe(0)
  })

  it('returns 0 reactivated when no dealer found', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_nod',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_nod',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // existing subscription
      .mockResolvedValueOnce([]) // no dealer
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesReactivated).toBe(0)
  })

  it('returns 0 reactivated when no paused vehicles', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_nop',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_nop',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'premium' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // existing subscription
      .mockResolvedValueOnce([{ id: 'dealer-1' }]) // dealer
      .mockResolvedValueOnce([{ id: 'v1' }]) // published vehicles
      .mockResolvedValueOnce([]) // no paused vehicles
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesReactivated).toBe(0)
  })

  it('returns 0 reactivated when reactivateVehicles throws', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_err',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_err',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // existing subscription
      .mockRejectedValueOnce(new Error('DB error')) // dealer lookup fails
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesReactivated).toBe(0)
  })

  it('uses default plan limit (3) for unknown plan', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unk',
          payment_status: 'paid',
          customer: 'cus_1',
          subscription: 'sub_unk',
          amount_total: 2900,
          metadata: { user_id: 'u1', plan: 'unknown_plan' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    // Unknown plan defaults to 3 limit; 3 published = 0 available slots
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // existing subscription
      .mockResolvedValueOnce([{ id: 'dealer-1' }])
      .mockResolvedValueOnce([{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }]) // 3 published = full for default
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesReactivated).toBe(0)
  })

  // ── checkout.session.completed — credits ──────────────────────────────

  it('handles credit purchase — new user credits (insert)', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_cr1',
          amount_total: 999,
          metadata: {
            user_id: 'u1',
            type: 'credits',
            credits: '10',
            pack_id: 'p1',
            pack_slug: 'starter',
            vertical: 'tracciona',
          },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([]) // no existing credits
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should insert new user_credits
    expect(mockSupabaseRestInsert).toHaveBeenCalledWith(
      expect.anything(),
      'user_credits',
      expect.objectContaining({ user_id: 'u1', balance: 10, total_purchased: 10 }),
    )
    // Should insert credit_transactions
    expect(mockSupabaseRestInsert).toHaveBeenCalledWith(
      expect.anything(),
      'credit_transactions',
      expect.objectContaining({ user_id: 'u1', type: 'purchase', credits: 10, balance_after: 10 }),
    )
    // Should create auto-invoice
    expect(mockCreateAutoInvoice).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'u1', amountCents: 999 }),
    )
  })

  it('handles credit purchase — existing user credits (update balance)', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_cr2',
          amount_total: 1999,
          metadata: {
            user_id: 'u1',
            type: 'credits',
            credits: '20',
            pack_id: 'p2',
            pack_slug: 'pro',
            vertical: 'tracciona',
          },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ balance: 5, total_purchased: 30 }]) // existing credits
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should patch user_credits (5 + 20 = 25, total = 30 + 20 = 50)
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'user_credits',
      'user_id=eq.u1',
      { balance: 25, total_purchased: 50 },
    )
  })

  it('handles credit purchase — zero credits skips balance update', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_cr0',
          amount_total: 0,
          metadata: {
            user_id: 'u1',
            type: 'credits',
            credits: '0',
            pack_id: 'p0',
            pack_slug: 'free',
            vertical: 'tracciona',
          },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should still patch payments but NOT insert user_credits or credit_transactions
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'payments',
      expect.stringContaining('cs_cr0'),
      { status: 'succeeded' },
    )
    // Balance-related calls should NOT happen
    expect(mockSupabaseRestInsert).not.toHaveBeenCalledWith(
      expect.anything(),
      'user_credits',
      expect.anything(),
    )
    expect(mockSupabaseRestInsert).not.toHaveBeenCalledWith(
      expect.anything(),
      'credit_transactions',
      expect.anything(),
    )
  })

  it('handles credit purchase — no amount_total skips auto-invoice', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_cr_noamt',
          amount_total: 0,
          metadata: {
            user_id: 'u1',
            type: 'credits',
            credits: '5',
            pack_id: 'p1',
            pack_slug: 's',
            vertical: 'tracciona',
          },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // no existing credits
    await webhookHandler(eventWithHeaders)
    expect(mockCreateAutoInvoice).not.toHaveBeenCalled()
  })

  it('handles credit purchase — missing pack_id defaults to null', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_cr_nopack',
          amount_total: 500,
          metadata: {
            user_id: 'u1',
            type: 'credits',
            credits: '3',
            pack_slug: 'x',
            vertical: 'tracciona',
          },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // no existing credits
    await webhookHandler(eventWithHeaders)
    expect(mockSupabaseRestInsert).toHaveBeenCalledWith(
      expect.anything(),
      'credit_transactions',
      expect.objectContaining({ pack_id: null }),
    )
  })

  // ── checkout.session.completed — no action ────────────────────────────

  it('does nothing for checkout.session.completed without userId', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_no_user', metadata: { plan: 'basic' } } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // No subscription or credit handling should trigger
    expect(mockSupabaseRestInsert).not.toHaveBeenCalled()
  })

  it('does nothing for checkout.session.completed without plan or credits type', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_no_type', metadata: { user_id: 'u1' } } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    expect(mockSupabaseRestInsert).not.toHaveBeenCalled()
  })

  // ── invoice.payment_succeeded ─────────────────────────────────────────

  it('handles invoice.payment_succeeded — renews subscription', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_succeeded',
      data: {
        object: { id: 'inv_1', subscription: 'sub_1', amount_paid: 2900, customer: 'cus_1' },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ user_id: 'u1' }]) // subscription user lookup
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should patch subscription as active
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'subscriptions',
      'stripe_subscription_id=eq.sub_1',
      expect.objectContaining({ status: 'active' }),
    )
    // Should insert payment record
    expect(mockSupabaseRestInsert).toHaveBeenCalledWith(
      expect.anything(),
      'payments',
      expect.objectContaining({ type: 'subscription', status: 'succeeded', amount_cents: 2900 }),
    )
    // Should create auto-invoice
    expect(mockCreateAutoInvoice).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'u1', amountCents: 2900 }),
    )
  })

  it('invoice.payment_succeeded — no subscriptionId skips processing', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_succeeded',
      data: {
        object: { id: 'inv_no_sub', subscription: null, amount_paid: 100, customer: 'cus_1' },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    expect(mockSupabaseRestPatch).not.toHaveBeenCalled()
    expect(mockSupabaseRestInsert).not.toHaveBeenCalled()
  })

  it('invoice.payment_succeeded — amount_paid = 0 skips auto-invoice', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_succeeded',
      data: {
        object: { id: 'inv_free', subscription: 'sub_free', amount_paid: 0, customer: 'cus_1' },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    expect(mockSupabaseRestPatch).toHaveBeenCalled()
    expect(mockCreateAutoInvoice).not.toHaveBeenCalled()
  })

  it('invoice.payment_succeeded — no user found for subscription skips auto-invoice', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'inv_nouser',
          subscription: 'sub_orphan',
          amount_paid: 1000,
          customer: 'cus_x',
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // no subscription user found
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    expect(mockCreateAutoInvoice).not.toHaveBeenCalled()
  })

  // ── invoice.payment_failed ────────────────────────────────────────────

  it('handles invoice.payment_failed — marks past_due and sends dunning email', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'inv_fail',
          subscription: 'sub_fail',
          amount_due: 2900,
          customer: 'cus_fail',
          attempt_count: 1,
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'dealer@test.com',
      userId: 'u_fail',
      name: 'Test Dealer',
      plan: 'basic',
    })
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    // Should mark subscription as past_due
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'subscriptions',
      'stripe_subscription_id=eq.sub_fail',
      { status: 'past_due' },
    )
    // Should insert failed payment
    expect(mockSupabaseRestInsert).toHaveBeenCalledWith(
      expect.anything(),
      'payments',
      expect.objectContaining({ status: 'failed', amount_cents: 2900 }),
    )
    // Should send dunning email with grace days = 14 (attempt 1)
    expect(mockSendDunningEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      'dealer_payment_failed',
      'dealer@test.com',
      'u_fail',
      expect.objectContaining({ gracePeriodDays: '14' }),
    )
  })

  it('invoice.payment_failed — attempt_count 2 gives 7 grace days', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'inv_fail2',
          subscription: 'sub_fail2',
          amount_due: 2900,
          customer: 'cus_fail2',
          attempt_count: 2,
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'dealer@test.com',
      userId: 'u2',
      name: 'Dealer',
      plan: 'basic',
    })
    await webhookHandler(eventWithHeaders)
    expect(mockSendDunningEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      'dealer_payment_failed',
      'dealer@test.com',
      'u2',
      expect.objectContaining({ gracePeriodDays: '7' }),
    )
  })

  it('invoice.payment_failed — attempt_count >= 3 gives default 3 grace days', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'inv_fail3',
          subscription: 'sub_fail3',
          amount_due: 2900,
          customer: 'cus_fail3',
          attempt_count: 5,
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'dealer@test.com',
      userId: 'u3',
      name: 'Dealer',
      plan: 'premium',
    })
    await webhookHandler(eventWithHeaders)
    expect(mockSendDunningEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      'dealer_payment_failed',
      'dealer@test.com',
      'u3',
      expect.objectContaining({ gracePeriodDays: '3' }),
    )
  })

  it('invoice.payment_failed — no subscriptionId skips processing', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_failed',
      data: {
        object: { id: 'inv_fail_nosub', subscription: null, amount_due: 100, customer: 'cus_x' },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    expect(mockSupabaseRestPatch).not.toHaveBeenCalled()
    expect(mockSendDunningEmail).not.toHaveBeenCalled()
  })

  it('invoice.payment_failed — no userInfo skips dunning email', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'inv_fail_nouser',
          subscription: 'sub_fail_nouser',
          amount_due: 2900,
          customer: 'cus_nouser',
          attempt_count: 1,
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    mockGetSubscriptionUserInfo.mockResolvedValue(null)
    await webhookHandler(eventWithHeaders)
    // Should still patch subscription and insert payment
    expect(mockSupabaseRestPatch).toHaveBeenCalled()
    expect(mockSupabaseRestInsert).toHaveBeenCalled()
    // But should NOT send dunning email
    expect(mockSendDunningEmail).not.toHaveBeenCalled()
  })

  it('invoice.payment_failed — missing attempt_count defaults to 1 (14 grace days)', async () => {
    const body = JSON.stringify({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'inv_fail_nocount',
          subscription: 'sub_fail_nocount',
          amount_due: 2900,
          customer: 'cus_x',
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([])
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'a@b.com',
      userId: 'ux',
      name: 'X',
      plan: 'basic',
    })
    await webhookHandler(eventWithHeaders)
    expect(mockSendDunningEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      'dealer_payment_failed',
      'a@b.com',
      'ux',
      expect.objectContaining({ gracePeriodDays: '14' }),
    )
  })

  // ── customer.subscription.deleted ─────────────────────────────────────

  it('handles customer.subscription.deleted — with user info, pauses excess vehicles', async () => {
    const body = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_del', metadata: {} } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ id: 'dealer-1' }]) // dealer lookup for pauseExcess
      .mockResolvedValueOnce(Array.from({ length: 6 }, (_, i) => ({ id: `v-${i}` }))) // 6 published vehicles (free limit = 3, so 3 excess)
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'cancel@test.com',
      userId: 'u_cancel',
      name: 'Cancel Dealer',
      plan: 'basic',
    })
    const result = await webhookHandler(eventWithHeaders)
    expect(result.received).toBe(true)
    expect(result.vehiclesPaused).toBe(3)
    // Should cancel subscription
    expect(mockSupabaseRestPatch).toHaveBeenCalledWith(
      expect.anything(),
      'subscriptions',
      'stripe_subscription_id=eq.sub_del',
      { status: 'canceled', plan: 'free' },
    )
    // Should send cancellation email
    expect(mockSendDunningEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      'dealer_subscription_cancelled',
      'cancel@test.com',
      'u_cancel',
      expect.objectContaining({ resubscribeUrl: 'https://tracciona.com/precios' }),
    )
  })

  it('customer.subscription.deleted — no subscriptionId returns 0', async () => {
    const body = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { id: '', metadata: {} } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesPaused).toBe(0)
  })

  it('customer.subscription.deleted — no user info skips email and pause', async () => {
    const body = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_no_info', metadata: {} } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValueOnce([]) // idempotency
    mockGetSubscriptionUserInfo.mockResolvedValue(null)
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesPaused).toBe(0)
    expect(mockSendDunningEmail).not.toHaveBeenCalled()
  })

  it('customer.subscription.deleted — published vehicles within free limit, no pause', async () => {
    const body = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_under', metadata: {} } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ id: 'dealer-1' }]) // dealer lookup for pauseExcess
      .mockResolvedValueOnce([{ id: 'v1' }, { id: 'v2' }]) // 2 published (under free limit of 3)
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'x@y.com',
      userId: 'ux',
      name: 'X',
      plan: 'basic',
    })
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesPaused).toBe(0)
  })

  it('customer.subscription.deleted — no dealer found returns 0 paused', async () => {
    const body = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_nodealer', metadata: {} } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // no dealer
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'x@y.com',
      userId: 'ux',
      name: 'X',
      plan: 'basic',
    })
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesPaused).toBe(0)
  })

  it('customer.subscription.deleted — pauseExcessVehicles error returns 0', async () => {
    const body = JSON.stringify({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_pause_err', metadata: {} } },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet
      .mockResolvedValueOnce([]) // idempotency
      .mockRejectedValueOnce(new Error('DB error')) // pauseExcess throws
    mockGetSubscriptionUserInfo.mockResolvedValue({
      email: 'x@y.com',
      userId: 'ux',
      name: 'X',
      plan: 'basic',
    })
    const result = await webhookHandler(eventWithHeaders)
    expect(result.vehiclesPaused).toBe(0)
  })

  // ── checkout.session.completed — trial with patch error ───────────────

  it('subscription checkout trial — patch for has_had_trial error is caught', async () => {
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_trial_err',
          payment_status: 'no_payment_required',
          customer: 'cus_1',
          subscription: 'sub_trial_err',
          amount_total: 0,
          metadata: { user_id: 'u1', plan: 'basic' },
        },
      },
    })
    mockReadRawBody.mockResolvedValue(body)
    mockSupabaseRestGet.mockResolvedValue([])
    // Make the has_had_trial patch fail — it should be caught
    mockSupabaseRestPatch
      .mockResolvedValueOnce([]) // payments patch
      .mockResolvedValueOnce([]) // subscriptions insert/patch
      .mockRejectedValueOnce(new Error('patch trial error')) // has_had_trial patch
    const result = await webhookHandler(eventWithHeaders)
    // Should not throw — error is caught by .catch(() => null)
    expect(result.received).toBe(true)
  })
})

// ── POST /api/stripe-connect-onboard ────────────────────────────────────────

import connectOnboardHandler from '../../../server/api/stripe-connect-onboard.post'

describe('POST /api/stripe-connect-onboard', () => {
  const savedUrl = process.env.SUPABASE_URL
  const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const savedVertical = process.env.NUXT_PUBLIC_VERTICAL
  const savedStripeKey = process.env.STRIPE_SECRET_KEY

  const validBody = {
    dealerId: '00000000-0000-0000-0000-000000000001',
    returnUrl: 'https://tracciona.com/dashboard',
    refreshUrl: 'https://tracciona.com/dashboard/refresh',
  }

  const mockFetch = vi.fn()

  const runtimeWithStripe = () => ({
    stripeSecretKey: 'sk_test_real',
    stripeWebhookSecret: undefined,
    supabaseServiceRoleKey: undefined,
    cronSecret: 'test-cron',
    public: {},
  })

  const runtimeWithoutStripe = () => ({
    stripeSecretKey: undefined,
    stripeWebhookSecret: undefined,
    supabaseServiceRoleKey: undefined,
    cronSecret: 'test-cron',
    public: {},
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({ ...validBody })
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockIsAllowedUrl.mockReturnValue(true)
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    delete process.env.STRIPE_SECRET_KEY
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('useRuntimeConfig', runtimeWithoutStripe)
  })

  afterEach(() => {
    if (savedUrl) process.env.SUPABASE_URL = savedUrl
    else delete process.env.SUPABASE_URL
    if (savedKey) process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY
    if (savedVertical) process.env.NUXT_PUBLIC_VERTICAL = savedVertical
    else delete process.env.NUXT_PUBLIC_VERTICAL
    if (savedStripeKey) process.env.STRIPE_SECRET_KEY = savedStripeKey
    else delete process.env.STRIPE_SECRET_KEY
    // Restore default runtime config
    vi.stubGlobal('useRuntimeConfig', runtimeWithoutStripe)
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when dealerId is missing', async () => {
    mockReadBody.mockResolvedValue({
      returnUrl: validBody.returnUrl,
      refreshUrl: validBody.refreshUrl,
    })
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when returnUrl is missing', async () => {
    mockReadBody.mockResolvedValue({
      dealerId: '00000000-0000-0000-0000-000000000001',
      refreshUrl: validBody.refreshUrl,
    })
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when refreshUrl is missing', async () => {
    mockReadBody.mockResolvedValue({
      dealerId: '00000000-0000-0000-0000-000000000001',
      returnUrl: validBody.returnUrl,
    })
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns mock URL when stripeKey not configured', async () => {
    const result = await connectOnboardHandler({} as any)
    expect(result.message).toBe('Service not configured')
    expect(result.url).toContain('mock')
    expect(result.accountId).toContain('acct_mock_')
  })

  it('throws 500 when supabaseUrl not configured', async () => {
    delete process.env.SUPABASE_URL
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when supabaseKey not configured', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 403 when dealer does not belong to user', async () => {
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue([]) })
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when dealer check returns non-array', async () => {
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue({ error: 'not found' }) })
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when returnUrl is not allowed', async () => {
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue([{ id: 'dealer-1' }]) })
    mockIsAllowedUrl.mockReturnValueOnce(false)
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when refreshUrl is not allowed', async () => {
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue([{ id: 'dealer-1' }]) })
    mockIsAllowedUrl.mockReturnValueOnce(true).mockReturnValueOnce(false)
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('creates new Stripe Connect account when none exists', async () => {
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    mockFetch
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([{ id: 'dealer-1' }]) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({}) })
    const result = await connectOnboardHandler({} as any)
    expect(result.url).toBe('https://connect.stripe.com/onboard')
    expect(result.accountId).toBe('acct_new_123')
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('dealer_stripe_accounts'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('uses existing Stripe Connect account when one exists', async () => {
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    mockFetch
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([{ id: 'dealer-1' }]) })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue([{ stripe_account_id: 'acct_existing' }]),
      })
    const result = await connectOnboardHandler({} as any)
    expect(result.url).toBe('https://connect.stripe.com/onboard')
    expect(result.accountId).toBe('acct_existing')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('verifies CSRF check is called', async () => {
    await connectOnboardHandler({} as any)
    expect(mockVerifyCsrf).toHaveBeenCalled()
  })

  it('verifies auth check is called before other validations', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(connectOnboardHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
    // Should not attempt fetch for dealer check
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('passes correct headers in dealer ownership check', async () => {
    vi.stubGlobal('useRuntimeConfig', runtimeWithStripe)
    mockFetch
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([{ id: 'dealer-1' }]) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({}) })
    await connectOnboardHandler({} as any)
    // First fetch call should include apikey and Authorization headers
    const firstCallArgs = mockFetch.mock.calls[0]
    expect(firstCallArgs[0]).toContain(
      'dealers?id=eq.00000000-0000-0000-0000-000000000001&user_id=eq.user-1',
    )
    expect(firstCallArgs[1].headers).toHaveProperty('apikey')
    expect(firstCallArgs[1].headers).toHaveProperty('Authorization')
  })
})
