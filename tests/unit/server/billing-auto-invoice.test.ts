import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock vatRates module
vi.mock('../../../server/utils/vatRates', () => ({
  getVatRate: vi.fn((country: string) => {
    const rates: Record<string, number> = { ES: 21, DE: 19, FR: 20, PT: 23 }
    return rates[country?.toUpperCase()] ?? 21
  }),
  calculateTaxFromGross: vi.fn((gross: number, rate: number) =>
    Math.round((gross * rate) / (100 + rate)),
  ),
}))

import { createAutoInvoice } from '../../../server/services/billing'
import type { SupabaseRestConfig } from '../../../server/services/billing'

const config: SupabaseRestConfig = {
  url: 'https://test.supabase.co',
  serviceRoleKey: 'test-key',
}

const baseParams = {
  userId: 'user-123',
  stripeInvoiceId: 'in_stripe_test',
  amountCents: 12100,
}

function mockFetchResponses(...responses: unknown[]) {
  const queue = [...responses]
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(queue.shift()),
    }),
  ) as unknown as typeof globalThis.fetch
}

describe('createAutoInvoice', () => {
  const originalFetch = globalThis.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NUXT_PUBLIC_SITE_URL = ''
    process.env.CRON_SECRET = ''
    delete process.env.QUADERNO_API_KEY
    delete process.env.QUADERNO_API_URL
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env = { ...originalEnv }
  })

  it('uses dynamic VAT from dealer fiscal data', async () => {
    globalThis.fetch = mockFetchResponses(
      [],                                    // idempotency check (no existing invoice)
      [{ id: 'dealer-1' }],                 // dealer lookup
      [{ tax_country: 'DE' }],              // fiscal data
      [{ id: 'inv-1' }],                    // insert result
    )

    const result = await createAutoInvoice(config, baseParams)
    expect(result.taxCountry).toBe('DE')
    expect(result.vatRate).toBe(19)
    expect(result.id).toBe('inv-1')
  })

  it('defaults to ES/21% when no fiscal data', async () => {
    globalThis.fetch = mockFetchResponses(
      [],                                    // idempotency check
      [{ id: 'dealer-1' }],                 // dealer lookup
      [],                                    // no fiscal data
      [{ id: 'inv-2' }],                    // insert result
    )

    const result = await createAutoInvoice(config, baseParams)
    expect(result.taxCountry).toBe('ES')
    expect(result.vatRate).toBe(21)
  })

  it('skips creation for existing stripe invoice (idempotency)', async () => {
    globalThis.fetch = mockFetchResponses(
      [{ id: 'existing-inv' }],             // existing invoice found
    )

    const result = await createAutoInvoice(config, baseParams)
    expect(result.id).toBe('existing-inv')
    expect(result.vatRate).toBe(0) // sentinel for idempotent skip
  })

  it('skips idempotency when stripeInvoiceId is null', async () => {
    globalThis.fetch = mockFetchResponses(
      [{ id: 'dealer-1' }],                 // dealer lookup (no idempotency check)
      [{ tax_country: 'ES' }],              // fiscal data
      [{ id: 'inv-3' }],                    // insert result
    )

    const result = await createAutoInvoice(config, {
      ...baseParams,
      stripeInvoiceId: null,
    })
    expect(result.id).toBe('inv-3')
  })

  it('integrates with Quaderno when API key is set', async () => {
    process.env.QUADERNO_API_KEY = 'test-quaderno-key'

    globalThis.fetch = mockFetchResponses(
      [],                                    // idempotency check
      [{ id: 'dealer-1' }],                 // dealer lookup
      [{ tax_country: 'ES' }],              // fiscal data
      { permalink: 'https://quaderno.io/invoice.pdf' }, // Quaderno response
      [{ id: 'inv-4' }],                    // insert result
    )

    const result = await createAutoInvoice(config, baseParams)
    expect(result.pdfUrl).toBe('https://quaderno.io/invoice.pdf')
    expect(result.quadernoConfigured).toBe(true)
  })

  it('continues when Quaderno fails', async () => {
    process.env.QUADERNO_API_KEY = 'test-quaderno-key'

    const queue = [
      [],                                    // idempotency check
      [{ id: 'dealer-1' }],                 // dealer lookup
      [{ tax_country: 'ES' }],              // fiscal data
    ]
    let callCount = 0
    globalThis.fetch = vi.fn(() => {
      callCount++
      if (callCount === 4) {
        // Quaderno call fails
        return Promise.reject(new Error('Network error'))
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(queue.shift() || [{ id: 'inv-5' }]),
      })
    }) as unknown as typeof globalThis.fetch

    const result = await createAutoInvoice(config, baseParams)
    expect(result.pdfUrl).toBeNull()
    expect(result.id).toBe('inv-5')
  })

  it('does not send email without CRON_SECRET', async () => {
    process.env.NUXT_PUBLIC_SITE_URL = 'https://tracciona.com'
    process.env.CRON_SECRET = ''

    globalThis.fetch = mockFetchResponses(
      [],
      [{ id: 'dealer-1' }],
      [{ tax_country: 'ES' }],
      [{ id: 'inv-6' }],
    )

    await createAutoInvoice(config, baseParams)
    // 4 fetch calls (idempotency, dealer, fiscal, insert) — no email call
    expect(globalThis.fetch).toHaveBeenCalledTimes(4)
  })

  it('handles null dealer gracefully', async () => {
    globalThis.fetch = mockFetchResponses(
      [],                                    // idempotency check
      [],                                    // no dealer found
      [{ id: 'inv-7' }],                    // insert (no fiscal lookup)
    )

    const result = await createAutoInvoice(config, baseParams)
    expect(result.dealerId).toBeNull()
    expect(result.taxCountry).toBe('ES')
  })

  it('passes serviceType through to insert', async () => {
    globalThis.fetch = mockFetchResponses(
      [],
      [{ id: 'dealer-1' }],
      [{ tax_country: 'ES' }],
      [{ id: 'inv-8' }],
    )

    await createAutoInvoice(config, {
      ...baseParams,
      serviceType: 'transport',
    })

    const insertCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[3]
    const body = JSON.parse(insertCall[1].body)
    expect(body.service_type).toBe('transport')
  })

  it('defaults serviceType to subscription', async () => {
    globalThis.fetch = mockFetchResponses(
      [],
      [{ id: 'dealer-1' }],
      [{ tax_country: 'ES' }],
      [{ id: 'inv-9' }],
    )

    await createAutoInvoice(config, baseParams)

    const insertCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[3]
    const body = JSON.parse(insertCall[1].body)
    expect(body.service_type).toBe('subscription')
  })

  it('sends email with correct template variables', async () => {
    process.env.NUXT_PUBLIC_SITE_URL = 'https://tracciona.com'
    process.env.CRON_SECRET = 'test-secret'

    globalThis.fetch = mockFetchResponses(
      [],
      [{ id: 'dealer-1' }],
      [{ tax_country: 'ES' }],
      [{ id: 'inv-10' }],
      [{ email: 'test@test.com', raw_user_meta_data: { display_name: 'Test User' } }],
      {}, // email send response
    )

    await createAutoInvoice(config, baseParams)

    // Wait for fire-and-forget email
    await new Promise((r) => setTimeout(r, 50))

    const emailCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (call: unknown[]) => String(call[0]).includes('/api/email/send'),
    )
    expect(emailCall).toBeDefined()
    const emailBody = JSON.parse(emailCall![1].body)
    expect(emailBody.templateKey).toBe('auto_invoice_created')
    expect(emailBody.to).toBe('test@test.com')
    expect(emailBody.variables.name).toBe('Test User')
    expect(emailBody.variables.amount).toBe('121.00 EUR')
  })
})
