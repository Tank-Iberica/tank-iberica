/**
 * Tests for:
 * - server/services/billing.ts
 * - server/services/vehicles.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock global fetch before imports ────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── Static imports ──────────────────────────────────────────────────────────

import {
  supabaseRestPatch,
  supabaseRestInsert,
  supabaseRestGet,
  getSubscriptionUserInfo,
  sendDunningEmail,
  createAutoInvoice,
} from '../../../server/services/billing'

import {
  getVehicleById,
  getVehicleBySlug,
  countDealerActiveVehicles,
} from '../../../server/services/vehicles'

// ── Supabase mock helpers ────────────────────────────────────────────────────

function makeChain(data: any = null, error: any = null, count: number | null = null) {
  const resolved: any = { data, error }
  if (count !== null) resolved.count = count
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve(resolved).then(onFulfilled as any, onRejected as any)
  return chain
}

function makeClient(data: any = null, error: any = null, count: number | null = null) {
  return { from: vi.fn().mockReturnValue(makeChain(data, error, count)) }
}

const restConfig = { url: 'https://api.supabase.co', serviceRoleKey: 'service-key' }

// ══ billing.ts ══════════════════════════════════════════════════════════════

describe('billing — supabaseRestPatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls fetch with PATCH method and correct URL', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    await supabaseRestPatch(restConfig, 'users', 'id=eq.123', { status: 'active' })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.supabase.co/rest/v1/users?id=eq.123',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('includes auth headers', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    await supabaseRestPatch(restConfig, 'users', 'id=eq.1', { name: 'test' })
    const [, opts] = mockFetch.mock.calls[0]!
    expect(opts.headers['apikey']).toBe('service-key')
    expect(opts.headers['Authorization']).toContain('Bearer service-key')
  })
})

describe('billing — supabaseRestInsert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls fetch with POST method', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    await supabaseRestInsert(restConfig, 'invoices', { amount: 100 })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.supabase.co/rest/v1/invoices',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('serializes body as JSON', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    await supabaseRestInsert(restConfig, 'invoices', { amount: 2900, currency: 'eur' })
    const [, opts] = mockFetch.mock.calls[0]!
    const body = JSON.parse(opts.body)
    expect(body.amount).toBe(2900)
    expect(body.currency).toBe('eur')
  })
})

describe('billing — supabaseRestGet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns parsed array on success', async () => {
    const items = [{ id: '1', plan: 'basic' }]
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue(items) })
    const result = await supabaseRestGet(restConfig, 'subscriptions', 'id=eq.1')
    expect(result).toEqual(items)
  })

  it('returns empty array when response is not an array', async () => {
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue({ error: 'not found' }) })
    const result = await supabaseRestGet(restConfig, 'subscriptions', 'id=eq.999')
    expect(result).toEqual([])
  })

  it('includes select parameter in URL', async () => {
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue([]) })
    await supabaseRestGet(restConfig, 'dealers', 'user_id=eq.u1', 'id,name')
    const [url] = mockFetch.mock.calls[0]!
    expect(url).toContain('select=id,name')
  })
})

describe('billing — getSubscriptionUserInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no subscription found', async () => {
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue([]) })
    const result = await getSubscriptionUserInfo(restConfig, 'sub_123')
    expect(result).toBeNull()
  })

  it('returns null when user data has no email', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      const data = callCount === 0 ? [{ user_id: 'user-1', plan: 'basic' }] : []
      callCount++
      return Promise.resolve({ json: vi.fn().mockResolvedValue(data) })
    })
    const result = await getSubscriptionUserInfo(restConfig, 'sub_123')
    expect(result).toBeNull()
  })

  it('returns full user info when both subscription and user found', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      const data =
        callCount === 0
          ? [{ user_id: 'user-1', plan: 'premium' }]
          : [{ email: 'test@example.com', raw_user_meta_data: { display_name: 'John Doe' } }]
      callCount++
      return Promise.resolve({ json: vi.fn().mockResolvedValue(data) })
    })
    const result = await getSubscriptionUserInfo(restConfig, 'sub_123')
    expect(result).toMatchObject({
      userId: 'user-1',
      email: 'test@example.com',
      name: 'John Doe',
      plan: 'premium',
    })
  })

  it('uses full_name fallback when display_name missing', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      const data =
        callCount === 0
          ? [{ user_id: 'user-1', plan: 'basic' }]
          : [{ email: 'user@x.com', raw_user_meta_data: { full_name: 'Jane Smith' } }]
      callCount++
      return Promise.resolve({ json: vi.fn().mockResolvedValue(data) })
    })
    const result = await getSubscriptionUserInfo(restConfig, 'sub_456')
    expect(result?.name).toBe('Jane Smith')
  })

  it('falls back to email prefix when no name metadata', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      const data =
        callCount === 0
          ? [{ user_id: 'user-1', plan: 'basic' }]
          : [{ email: 'hello@domain.com', raw_user_meta_data: null }]
      callCount++
      return Promise.resolve({ json: vi.fn().mockResolvedValue(data) })
    })
    const result = await getSubscriptionUserInfo(restConfig, 'sub_789')
    expect(result?.name).toBe('hello')
  })
})

describe('billing — sendDunningEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when internalSecret is undefined', async () => {
    await sendDunningEmail('http://app', undefined, 'tmpl', 'to@x.com', 'u1', {})
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls fetch with correct endpoint when secret provided', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    await sendDunningEmail('http://app', 'secret-key', 'payment_failed', 'to@x.com', 'u1', {
      plan: 'basic',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://app/api/email/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-internal-secret': 'secret-key' }),
      }),
    )
  })

  it('does not throw when fetch rejects (best-effort)', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))
    await expect(
      sendDunningEmail('http://app', 'secret', 'tmpl', 'to@x.com', 'u1', {}),
    ).resolves.toBeUndefined()
  })
})

describe('billing — createAutoInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches dealer and inserts invoice', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      callCount++
      // 1: idempotency check (no existing invoice), 2: dealer fetch, 3: insert, 4+: email etc.
      if (callCount === 1) return Promise.resolve({ json: vi.fn().mockResolvedValue([]) }) // no existing
      if (callCount === 2)
        return Promise.resolve({ json: vi.fn().mockResolvedValue([{ id: 'dealer-1' }]) }) // dealer
      return Promise.resolve({ json: vi.fn().mockResolvedValue([]), ok: true })
    })
    await createAutoInvoice(restConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'in_xxx',
      amountCents: 2900,
    })
    // At minimum: idempotency + dealer + insert (+ possible audit/analytics) >= 3
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('uses null dealer_id when no dealer found', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({ json: vi.fn().mockResolvedValue([]), ok: true })
    })
    await createAutoInvoice(restConfig, {
      userId: 'user-x',
      stripeInvoiceId: null,
      amountCents: 7900,
      serviceType: 'verification',
    })
    // stripeInvoiceId null => no idempotency check, so call[0] is dealer fetch, call[1] is insert
    const insertCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/invoices') && c[1]?.method === 'POST',
    )
    expect(insertCall).toBeTruthy()
    const body = JSON.parse(insertCall![1].body)
    expect(body.dealer_id).toBeNull()
    expect(body.service_type).toBe('verification')
  })

  it('computes tax_cents as 21% on top (IVA calculation)', async () => {
    mockFetch.mockResolvedValue({ json: vi.fn().mockResolvedValue([]), ok: true })
    await createAutoInvoice(restConfig, {
      userId: 'u1',
      stripeInvoiceId: null,
      amountCents: 1210,
    })
    const insertCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/invoices') && c[1]?.method === 'POST',
    )
    expect(insertCall).toBeTruthy()
    const body = JSON.parse(insertCall![1].body)
    // calculateTaxFromGross(1210, 0.21) = 1210 - 1210/1.21 = 1210 - 1000 = 210
    expect(body.tax_cents).toBe(210)
  })
})

// ══ vehicles.ts ══════════════════════════════════════════════════════════════

describe('vehicles — getVehicleById', () => {
  it('returns vehicle data on success', async () => {
    const vehicle = { id: 'v1', brand: 'Volvo', model: 'FH16', slug: 'volvo-fh16' }
    const supabase = makeClient(vehicle)
    const result = await getVehicleById(supabase as any, 'v1')
    expect(result).toMatchObject({ id: 'v1', brand: 'Volvo' })
  })

  it('returns null on Supabase error', async () => {
    const supabase = makeClient(null, { message: 'not found' })
    const result = await getVehicleById(supabase as any, 'unknown-id')
    expect(result).toBeNull()
  })

  it('accepts custom select string', async () => {
    const vehicle = { id: 'v1', price: 50000 }
    const supabase = makeClient(vehicle)
    const result = await getVehicleById(supabase as any, 'v1', 'id, price')
    expect(result).toMatchObject({ price: 50000 })
  })
})

describe('vehicles — getVehicleBySlug', () => {
  it('returns vehicle on success', async () => {
    const vehicle = { id: 'v2', slug: 'volvo-fh16-2022' }
    const supabase = makeClient(vehicle)
    const result = await getVehicleBySlug(supabase as any, 'volvo-fh16-2022')
    expect(result).toMatchObject({ slug: 'volvo-fh16-2022' })
  })

  it('returns null on error', async () => {
    const supabase = makeClient(null, { message: 'not found' })
    const result = await getVehicleBySlug(supabase as any, 'bad-slug')
    expect(result).toBeNull()
  })
})

describe('vehicles — countDealerActiveVehicles', () => {
  it('returns count on success', async () => {
    const supabase = makeClient(null, null, 42)
    const result = await countDealerActiveVehicles(supabase as any, 'dealer-1')
    expect(result).toBe(42)
  })

  it('returns 0 on Supabase error', async () => {
    const supabase = makeClient(null, { message: 'db error' }, null)
    const result = await countDealerActiveVehicles(supabase as any, 'dealer-1')
    expect(result).toBe(0)
  })

  it('returns 0 when count is null', async () => {
    const supabase = makeClient(null, null, null)
    const result = await countDealerActiveVehicles(supabase as any, 'dealer-1')
    expect(result).toBe(0)
  })
})
