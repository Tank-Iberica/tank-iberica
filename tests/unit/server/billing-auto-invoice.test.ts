import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock env
const ORIGINAL_ENV = { ...process.env }

describe('createAutoInvoice (billing service)', () => {
  let createAutoInvoice: typeof import('../../../server/services/billing').createAutoInvoice

  const sbConfig = {
    url: 'https://test.supabase.co',
    serviceRoleKey: 'test-key',
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env = { ...ORIGINAL_ENV }
    process.env.CRON_SECRET = 'test-secret'
    process.env.NUXT_PUBLIC_SITE_URL = 'https://tracciona.com'

    vi.resetModules()
    const mod = await import('../../../server/services/billing')
    createAutoInvoice = mod.createAutoInvoice
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  function mockFetchResponses(responses: Array<{ json: unknown; ok?: boolean }>) {
    for (const resp of responses) {
      mockFetch.mockResolvedValueOnce({
        ok: resp.ok ?? true,
        json: async () => resp.json,
      })
    }
  }

  it('creates invoice with dynamic VAT from dealer fiscal data', async () => {
    mockFetchResponses([
      { json: [] }, // idempotency check
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [{ tax_country: 'PT' }] }, // fiscal data (Portugal = 23%)
      { json: [{ id: 'inv-1' }] }, // insert
      { json: [{ email: 'dealer@test.com', raw_user_meta_data: { display_name: 'Dealer' } }] }, // email user
      { json: { success: true } }, // email send
    ])

    const result = await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_123',
      amountCents: 3900,
      serviceType: 'subscription',
    })

    expect(result.vatRate).toBe(0.23) // Portugal rate (decimal)
    expect(result.taxCountry).toBe('PT')
    expect(result.id).toBe('inv-1')
    expect(result.dealerId).toBe('dealer-1')

    const insertCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/invoices') && c[1]?.method === 'POST',
    )
    expect(insertCall).toBeTruthy()
    const body = JSON.parse(insertCall![1].body)
    // 3900 * 23 / 123 = 729.27 → 729
    expect(body.tax_cents).toBe(729)
    expect(body.status).toBe('paid')
  })

  it('uses default 21% VAT when no fiscal data exists', async () => {
    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [] }, // no fiscal data
      { json: [{ id: 'inv-2' }] }, // insert
      { json: [{ email: 'a@b.com', raw_user_meta_data: null }] }, // user for email
      { json: { success: true } }, // email send
    ])

    const result = await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_456',
      amountCents: 2100,
    })

    expect(result.vatRate).toBe(0.21)
    expect(result.taxCountry).toBe('ES')
  })

  it('skips if stripe_invoice_id already exists (idempotency)', async () => {
    mockFetchResponses([
      { json: [{ id: 'existing-inv' }] }, // existing invoice found
    ])

    const result = await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_existing',
      amountCents: 5000,
    })

    expect(result.id).toBe('existing-inv')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not skip idempotency when stripeInvoiceId is null', async () => {
    mockFetchResponses([
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [] }, // fiscal data
      { json: [{ id: 'inv-new' }] }, // insert
      { json: [{ email: 'a@b.com', raw_user_meta_data: null }] }, // user email
      { json: { success: true } }, // email
    ])

    const result = await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: null,
      amountCents: 1000,
    })

    expect(result.id).toBe('inv-new')
    const firstUrl = mockFetch.mock.calls[0]![0] as string
    expect(firstUrl).toContain('dealers')
  })

  it('integrates with Quaderno when API key is set', async () => {
    process.env.QUADERNO_API_KEY = 'test-quaderno-key'

    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [{ tax_country: 'ES' }] }, // fiscal
      { json: { permalink: 'https://quadernoapp.com/inv/pdf-123' }, ok: true }, // Quaderno
      { json: [{ id: 'inv-q' }] }, // insert
      { json: [{ email: 'a@b.com', raw_user_meta_data: null }] }, // email user
      { json: { success: true } }, // email send
    ])

    const result = await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_q',
      amountCents: 7900,
      serviceType: 'subscription',
      description: 'Premium mensual',
    })

    expect(result.pdfUrl).toBe('https://quadernoapp.com/inv/pdf-123')
    expect(result.quadernoConfigured).toBe(true)

    const quadernoCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('quadernoapp.com'),
    )
    expect(quadernoCall).toBeTruthy()
    const qBody = JSON.parse(quadernoCall![1].body)
    expect(qBody.items[0].description).toBe('Premium mensual')
    expect(qBody.items[0].unit_price).toBe('79.00')
  })

  it('continues without Quaderno when API call fails', async () => {
    process.env.QUADERNO_API_KEY = 'test-quaderno-key'

    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [] }, // fiscal
    ])
    mockFetch.mockRejectedValueOnce(new Error('Quaderno down'))
    mockFetchResponses([
      { json: [{ id: 'inv-noq' }] }, // insert
      { json: [{ email: 'a@b.com', raw_user_meta_data: null }] }, // user
      { json: { success: true } }, // email
    ])

    const result = await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_noq',
      amountCents: 3900,
    })

    expect(result.pdfUrl).toBeNull()
    expect(result.id).toBe('inv-noq')
  })

  it('does not send email when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET

    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [] }, // fiscal
      { json: [{ id: 'inv-noemail' }] }, // insert
    ])

    await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_ne',
      amountCents: 2900,
    })

    // Wait for fire-and-forget to settle
    await new Promise((r) => setTimeout(r, 50))
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('handles null dealer gracefully', async () => {
    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [] }, // no dealer found
      { json: [{ id: 'inv-nd' }] }, // insert
      { json: [{ email: 'a@b.com', raw_user_meta_data: null }] }, // user
      { json: { success: true } }, // email
    ])

    const result = await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_nd',
      amountCents: 1900,
    })

    expect(result.dealerId).toBeNull()
    expect(result.vatRate).toBe(0.21) // default, no fiscal data looked up (decimal)
    const insertCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/invoices') && c[1]?.method === 'POST',
    )
    const body = JSON.parse(insertCall![1].body)
    expect(body.dealer_id).toBeNull()
  })

  it('passes correct service_type from params', async () => {
    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [] }, // fiscal
      { json: [{ id: 'inv-credits' }] }, // insert
      { json: [{ email: 'a@b.com', raw_user_meta_data: null }] }, // user
      { json: { success: true } }, // email
    ])

    await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_cr',
      amountCents: 990,
      serviceType: 'auction_premium',
    })

    const insertCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/invoices') && c[1]?.method === 'POST',
    )
    const body = JSON.parse(insertCall![1].body)
    expect(body.service_type).toBe('auction_premium')
  })

  it('defaults service_type to subscription', async () => {
    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [] }, // fiscal
      { json: [{ id: 'inv-def' }] }, // insert
      { json: [{ email: 'a@b.com', raw_user_meta_data: null }] }, // user
      { json: { success: true } }, // email
    ])

    await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_def',
      amountCents: 3900,
    })

    const insertCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/invoices') && c[1]?.method === 'POST',
    )
    const body = JSON.parse(insertCall![1].body)
    expect(body.service_type).toBe('subscription')
  })

  it('sends email with correct template and variables', async () => {
    mockFetchResponses([
      { json: [] }, // idempotency
      { json: [{ id: 'dealer-1' }] }, // dealer
      { json: [{ tax_country: 'ES' }] }, // fiscal
      { json: [{ id: 'inv-email' }] }, // insert
      { json: [{ email: 'test@dealer.com', raw_user_meta_data: { display_name: 'Test Dealer' } }] },
      { json: { success: true } }, // email send
    ])

    await createAutoInvoice(sbConfig, {
      userId: 'user-1',
      stripeInvoiceId: 'si_em',
      amountCents: 3900,
      serviceType: 'subscription',
    })

    // Wait for fire-and-forget
    await new Promise((r) => setTimeout(r, 50))

    const emailCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/api/email/send'),
    )
    expect(emailCall).toBeTruthy()
    const emailBody = JSON.parse(emailCall![1].body)
    expect(emailBody.templateKey).toBe('auto_invoice_created')
    expect(emailBody.to).toBe('test@dealer.com')
    expect(emailBody.variables.name).toBe('Test Dealer')
    expect(emailBody.variables.serviceType).toBe('subscription')
    expect(emailBody.variables.amount).toBe('39.00 EUR')
  })
})
