import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInvoicing } from '../../app/composables/useInvoicing'

// ─── Reactive computed override ───────────────────────────────────────────────
// The default computed stub is one-shot. Override to use a getter for reactivity.

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() {
      return (fn as () => unknown)()
    },
  }))
  // Default Supabase stub (no data)
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  }))
})

// ─── formatAmount ─────────────────────────────────────────────────────────────

describe('formatAmount', () => {
  it('returns "-" for 0 cents', () => {
    const c = useInvoicing()
    expect(c.formatAmount(0)).toBe('-')
  })

  it('returns "-" for falsy values', () => {
    const c = useInvoicing()
    expect(c.formatAmount(0, 'EUR')).toBe('-')
  })

  it('formats 10000 cents as 100.00 EUR', () => {
    const c = useInvoicing()
    const result = c.formatAmount(10000)
    expect(result).toContain('100')
    expect(result).toContain('€')
  })

  it('formats 2900 cents correctly (29 EUR)', () => {
    const c = useInvoicing()
    const result = c.formatAmount(2900)
    expect(result).toContain('29')
  })

  it('uses EUR currency by default', () => {
    const c = useInvoicing()
    const result = c.formatAmount(5000)
    expect(result).toContain('€')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('invoices starts as empty array', () => {
    const c = useInvoicing()
    expect(c.invoices.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useInvoicing()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useInvoicing()
    expect(c.error.value).toBeNull()
  })

  it('totalAmount starts as 0', () => {
    const c = useInvoicing()
    expect(c.totalAmount.value).toBe(0)
  })

  it('totalTax starts as 0', () => {
    const c = useInvoicing()
    expect(c.totalTax.value).toBe(0)
  })
})

// ─── totalAmount computed ─────────────────────────────────────────────────────

describe('totalAmount', () => {
  it('sums amount_cents of paid invoices only', () => {
    const c = useInvoicing()
    ;(c.invoices as { value: unknown[] }).value = [
      { id: '1', status: 'paid', amount_cents: 10000, tax_cents: 2000, currency: 'EUR' },
      { id: '2', status: 'pending', amount_cents: 5000, tax_cents: 1000, currency: 'EUR' },
      { id: '3', status: 'paid', amount_cents: 3000, tax_cents: 600, currency: 'EUR' },
    ]
    expect(c.totalAmount.value).toBe(13000)
  })

  it('returns 0 when no paid invoices', () => {
    const c = useInvoicing()
    ;(c.invoices as { value: unknown[] }).value = [
      { id: '1', status: 'pending', amount_cents: 5000, tax_cents: 1000, currency: 'EUR' },
    ]
    expect(c.totalAmount.value).toBe(0)
  })

  it('returns 0 with empty invoices array', () => {
    const c = useInvoicing()
    expect(c.totalAmount.value).toBe(0)
  })
})

// ─── totalTax computed ────────────────────────────────────────────────────────

describe('totalTax', () => {
  it('sums tax_cents of paid invoices only', () => {
    const c = useInvoicing()
    ;(c.invoices as { value: unknown[] }).value = [
      { id: '1', status: 'paid', amount_cents: 10000, tax_cents: 2100, currency: 'EUR' },
      { id: '2', status: 'cancelled', amount_cents: 5000, tax_cents: 1000, currency: 'EUR' },
      { id: '3', status: 'paid', amount_cents: 3000, tax_cents: 630, currency: 'EUR' },
    ]
    expect(c.totalTax.value).toBe(2730)
  })

  it('treats null tax_cents as 0', () => {
    const c = useInvoicing()
    ;(c.invoices as { value: unknown[] }).value = [
      { id: '1', status: 'paid', amount_cents: 10000, tax_cents: null, currency: 'EUR' },
    ]
    expect(c.totalTax.value).toBe(0)
  })

  it('returns 0 with empty array', () => {
    const c = useInvoicing()
    expect(c.totalTax.value).toBe(0)
  })
})

// ─── loadInvoices ─────────────────────────────────────────────────────────────

describe('loadInvoices', () => {
  it('sets invoices from DB rows', async () => {
    const rows = [
      { id: '1', service_type: 'subscription', amount_cents: 2900, tax_cents: 609, currency: 'EUR', pdf_url: null, status: 'paid', created_at: '2026-01-01', stripe_invoice_id: null },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }))
    const c = useInvoicing()
    await c.loadInvoices('dealer-1')
    expect(c.invoices.value).toHaveLength(1)
    expect((c.invoices.value[0] as Record<string, unknown>).service_type).toBe('subscription')
  })

  it('sets loading to false after success', async () => {
    const c = useInvoicing()
    await c.loadInvoices('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    }))
    const c = useInvoicing()
    await c.loadInvoices('dealer-1')
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    }))
    const c = useInvoicing()
    await c.loadInvoices('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets invoices to empty on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    }))
    const c = useInvoicing()
    await c.loadInvoices('dealer-1')
    expect(c.invoices.value).toHaveLength(0)
  })
})
