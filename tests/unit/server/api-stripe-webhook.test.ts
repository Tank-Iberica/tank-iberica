import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockReadRawBody, mockRestGet, mockRestPatch, mockRestInsert, mockGetUserInfo, mockSendDunning, mockCreateInvoice } = vi.hoisted(() => ({
  mockReadRawBody: vi.fn(),
  mockRestGet: vi.fn(),
  mockRestPatch: vi.fn(),
  mockRestInsert: vi.fn(),
  mockGetUserInfo: vi.fn(),
  mockSendDunning: vi.fn(),
  mockCreateInvoice: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readRawBody: (...a: unknown[]) => mockReadRawBody(...a),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('../../../server/services/billing', () => ({
  supabaseRestPatch: (...a: unknown[]) => mockRestPatch(...a),
  supabaseRestInsert: (...a: unknown[]) => mockRestInsert(...a),
  supabaseRestGet: (...a: unknown[]) => mockRestGet(...a),
  getSubscriptionUserInfo: (...a: unknown[]) => mockGetUserInfo(...a),
  sendDunningEmail: (...a: unknown[]) => mockSendDunning(...a),
  createAutoInvoice: (...a: unknown[]) => mockCreateInvoice(...a),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock Stripe
vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = {
      constructEvent: vi.fn().mockImplementation((_body: string, _sig: string, _secret: string) => {
        // In tests we just parse the raw body
        return JSON.parse(_body)
      }),
    }
  },
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  stripeSecretKey: 'sk_test_xxx',
  supabaseServiceRoleKey: 'sb-key',
  stripeWebhookSecret: 'whsec_test',
  cronSecret: 'cron-secret',
}))

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb-key'

import handler from '../../../server/api/stripe/webhook.post'

function makeEvent(type: string, object: Record<string, unknown>) {
  return { node: { req: { headers: { 'stripe-signature': 'sig_test' } } } }
}

function makeRawBody(type: string, obj: Record<string, unknown>) {
  return JSON.stringify({ type, data: { object: obj } })
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRestGet.mockResolvedValue([])
    mockRestPatch.mockResolvedValue(undefined)
    mockRestInsert.mockResolvedValue(undefined)
    mockGetUserInfo.mockResolvedValue(null)
    mockSendDunning.mockResolvedValue(undefined)
    mockCreateInvoice.mockResolvedValue(undefined)
  })

  it('throws 400 when body is missing', async () => {
    mockReadRawBody.mockResolvedValue(null)
    await expect((handler as Function)(makeEvent('', {}))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns idempotent when event already processed', async () => {
    const body = makeRawBody('checkout.session.completed', {
      id: 'cs_1', metadata: { user_id: 'u1', plan: 'basic' },
      customer: 'cus_1', subscription: 'sub_1', amount_total: 5000,
      payment_status: 'paid',
    })
    mockReadRawBody.mockResolvedValue(body)
    // idempotency check: existing record found
    mockRestGet.mockResolvedValue([{ id: 'existing' }])

    const result = await (handler as Function)(makeEvent('checkout.session.completed', {}))
    expect(result.idempotent).toBe(true)
  })

  it('handles checkout.session.completed for subscription', async () => {
    const body = makeRawBody('checkout.session.completed', {
      id: 'cs_1', metadata: { user_id: 'u1', plan: 'premium' },
      customer: 'cus_1', subscription: 'sub_1', amount_total: 9900,
      payment_status: 'paid',
    })
    mockReadRawBody.mockResolvedValue(body)
    // No idempotent record
    mockRestGet.mockResolvedValue([])

    const result = await (handler as Function)(makeEvent('checkout.session.completed', {}))
    expect(result.received).toBe(true)
    expect(mockRestPatch).toHaveBeenCalled()
  })

  it('handles checkout.session.completed for credits', async () => {
    const body = makeRawBody('checkout.session.completed', {
      id: 'cs_2', metadata: { user_id: 'u1', type: 'credits', credits: '10', pack_id: 'pack1', pack_slug: 'starter', vertical: 'tracciona' },
      amount_total: 4900,
    })
    mockReadRawBody.mockResolvedValue(body)
    mockRestGet.mockResolvedValue([])

    const result = await (handler as Function)(makeEvent('checkout.session.completed', {}))
    expect(result.received).toBe(true)
    expect(mockRestPatch).toHaveBeenCalled()
    expect(mockRestInsert).toHaveBeenCalled()
  })

  it('handles invoice.payment_succeeded', async () => {
    const body = makeRawBody('invoice.payment_succeeded', {
      id: 'inv_1', subscription: 'sub_1', amount_paid: 9900, customer: 'cus_1',
    })
    mockReadRawBody.mockResolvedValue(body)
    mockRestGet.mockResolvedValue([])

    const result = await (handler as Function)(makeEvent('invoice.payment_succeeded', {}))
    expect(result.received).toBe(true)
    expect(mockRestPatch).toHaveBeenCalled()
    expect(mockRestInsert).toHaveBeenCalled()
  })

  it('handles invoice.payment_failed with dunning email', async () => {
    const body = makeRawBody('invoice.payment_failed', {
      id: 'inv_2', subscription: 'sub_1', amount_due: 9900, customer: 'cus_1', attempt_count: 1,
    })
    mockReadRawBody.mockResolvedValue(body)
    mockRestGet.mockResolvedValue([])
    mockGetUserInfo.mockResolvedValue({ email: 'dealer@test.com', userId: 'u1', name: 'Dealer', plan: 'basic' })

    const result = await (handler as Function)(makeEvent('invoice.payment_failed', {}))
    expect(result.received).toBe(true)
    expect(mockSendDunning).toHaveBeenCalledWith(
      expect.any(String), expect.any(String),
      'dealer_payment_failed',
      'dealer@test.com', 'u1',
      expect.objectContaining({ gracePeriodDays: '14' }),
    )
  })

  it('handles customer.subscription.deleted', async () => {
    const body = makeRawBody('customer.subscription.deleted', {
      id: 'sub_1',
    })
    mockReadRawBody.mockResolvedValue(body)
    mockRestGet.mockResolvedValue([])
    mockGetUserInfo.mockResolvedValue({ email: 'dealer@test.com', userId: 'u1', name: 'Dealer', plan: 'premium' })

    const result = await (handler as Function)(makeEvent('customer.subscription.deleted', {}))
    expect(result.received).toBe(true)
    expect(mockRestPatch).toHaveBeenCalled()
    expect(mockSendDunning).toHaveBeenCalledWith(
      expect.any(String), expect.any(String),
      'dealer_subscription_cancelled',
      'dealer@test.com', 'u1',
      expect.any(Object),
    )
  })

  it('handles unknown event type gracefully', async () => {
    const body = makeRawBody('charge.succeeded', { id: 'ch_1' })
    mockReadRawBody.mockResolvedValue(body)
    mockRestGet.mockResolvedValue([])

    const result = await (handler as Function)(makeEvent('charge.succeeded', {}))
    expect(result.received).toBe(true)
  })

  it('applies grace period based on attempt count', async () => {
    // attempt_count=2 → 7 days grace
    const body = makeRawBody('invoice.payment_failed', {
      id: 'inv_3', subscription: 'sub_1', amount_due: 9900, customer: 'cus_1', attempt_count: 2,
    })
    mockReadRawBody.mockResolvedValue(body)
    mockRestGet.mockResolvedValue([])
    mockGetUserInfo.mockResolvedValue({ email: 'd@test.com', userId: 'u1', name: 'D', plan: 'basic' })

    await (handler as Function)(makeEvent('invoice.payment_failed', {}))
    expect(mockSendDunning).toHaveBeenCalledWith(
      expect.any(String), expect.any(String),
      'dealer_payment_failed',
      'd@test.com', 'u1',
      expect.objectContaining({ gracePeriodDays: '7' }),
    )
  })

  it('uses default 3 days grace for high attempt count', async () => {
    const body = makeRawBody('invoice.payment_failed', {
      id: 'inv_4', subscription: 'sub_1', amount_due: 9900, customer: 'cus_1', attempt_count: 5,
    })
    mockReadRawBody.mockResolvedValue(body)
    mockRestGet.mockResolvedValue([])
    mockGetUserInfo.mockResolvedValue({ email: 'd@test.com', userId: 'u1', name: 'D', plan: 'basic' })

    await (handler as Function)(makeEvent('invoice.payment_failed', {}))
    expect(mockSendDunning).toHaveBeenCalledWith(
      expect.any(String), expect.any(String),
      'dealer_payment_failed',
      'd@test.com', 'u1',
      expect.objectContaining({ gracePeriodDays: '3' }),
    )
  })
})
