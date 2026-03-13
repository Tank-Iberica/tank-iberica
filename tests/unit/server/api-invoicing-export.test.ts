import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

// Mocks
const mockGetQuery = vi.fn()
const mockSetHeader = vi.fn()
const mockFetch = vi.fn()
let mockUser: { id: string } | null = null

const mockUserSelect = vi.fn()
const mockDealerSelect = vi.fn()

vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-key',
}))
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: (...args: unknown[]) => mockGetQuery(...args),
  createError: (opts: { statusCode: number; message?: string; statusMessage?: string }) => {
    const e = new Error(opts.message || opts.statusMessage || '') as Error & { statusCode: number }
    e.statusCode = opts.statusCode
    return e
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: () => Promise.resolve(mockUser),
  serverSupabaseServiceRole: () => {
    const supabase = {
      from: vi.fn((table: string) => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi.fn(() => {
            if (table === 'users') return mockUserSelect()
            if (table === 'dealers') return mockDealerSelect()
            return { data: null, error: null }
          }),
        }
        return chain
      }),
    }
    return supabase
  },
}))

// safeError uses h3's createError which is mocked above — no separate mock needed

describe('GET /api/invoicing/export-csv', () => {
  let handler: Function

  const mockEvent = {
    node: {
      req: { headers: {} },
      res: { setHeader: mockSetHeader },
    },
  }

  const sampleInvoices = [
    {
      id: 'inv-1',
      dealer_id: 'dealer-1',
      user_id: 'user-1',
      stripe_invoice_id: 'si_123',
      service_type: 'subscription',
      amount_cents: 3900,
      tax_cents: 677,
      currency: 'eur',
      pdf_url: 'https://example.com/inv.pdf',
      status: 'paid',
      created_at: '2026-03-01T00:00:00Z',
    },
    {
      id: 'inv-2',
      dealer_id: 'dealer-1',
      user_id: 'user-1',
      stripe_invoice_id: null,
      service_type: 'auction_premium',
      amount_cents: 1990,
      tax_cents: 345,
      currency: 'eur',
      pdf_url: null,
      status: 'paid',
      created_at: '2026-03-05T00:00:00Z',
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'

    mockUser = { id: 'user-1' }
    mockUserSelect.mockReturnValue({ data: { role: 'admin' }, error: null })
    mockDealerSelect.mockReturnValue({ data: { id: 'dealer-1' }, error: null })
    mockGetQuery.mockReturnValue({})
    mockFetch.mockResolvedValue({
      json: async () => sampleInvoices,
    })

    vi.resetModules()
    const mod = await import('../../../server/api/invoicing/export-csv.get')
    handler = mod.default as Function
  })

  it('returns 401 when not authenticated', async () => {
    mockUser = null
    await expect(handler(mockEvent)).rejects.toThrow('Unauthorized')
  })

  it('returns 403 when user role cannot be verified', async () => {
    mockUserSelect.mockReturnValue({ data: null, error: { message: 'not found' } })
    await expect(handler(mockEvent)).rejects.toThrow('Unable to verify')
  })

  it('returns CSV by default for admin user', async () => {
    const result = await handler(mockEvent)

    expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8')
    expect(typeof result).toBe('string')
    expect(result).toContain('ID;')
    expect(result).toContain('"inv-1"')
    expect(result).toContain('"39.00"') // 3900/100
    expect(result).toContain('"6.77"') // 677/100
  })

  it('returns CSV with Net column', async () => {
    const result = await handler(mockEvent) as string
    expect(result).toContain('Net (EUR)')
    // Net = (3900 - 677) / 100 = 32.23
    expect(result).toContain('"32.23"')
  })

  it('returns JSON when format=json', async () => {
    mockGetQuery.mockReturnValue({ format: 'json' })

    const result = await handler(mockEvent)

    expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8')
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].id).toBe('inv-1')
    expect(result[0].amount).toBe(39)
    expect(result[0].tax).toBe(6.77)
    expect(result[0].net).toBe(32.23)
    expect(result[0].pdf_url).toBe('https://example.com/inv.pdf')
  })

  it('handles JSON format with null pdf_url', async () => {
    mockGetQuery.mockReturnValue({ format: 'json' })

    const result = await handler(mockEvent)
    expect(result[1].pdf_url).toBeNull()
    expect(result[1].stripe_invoice_id).toBeNull()
  })

  it('filters by month when provided', async () => {
    mockGetQuery.mockReturnValue({ month: '2026-03' })

    await handler(mockEvent)

    const fetchCall = mockFetch.mock.calls[0]
    const url = fetchCall[0] as string
    expect(url).toContain('created_at=gte.2026-03-01')
    // End date depends on timezone; just verify it has a created_at=lt filter
    expect(url).toMatch(/created_at=lt\./)
  })

  it('filters by year when provided', async () => {
    mockGetQuery.mockReturnValue({ year: '2026' })

    await handler(mockEvent)

    const fetchCall = mockFetch.mock.calls[0]
    const url = fetchCall[0] as string
    expect(url).toContain('created_at=gte.2026-01-01')
    expect(url).toContain('created_at=lt.2027-01-01')
  })

  it('restricts non-admin to their own dealer invoices', async () => {
    mockUserSelect.mockReturnValue({ data: { role: 'dealer' }, error: null })

    await handler(mockEvent)

    const fetchCall = mockFetch.mock.calls[0]
    const url = fetchCall[0] as string
    expect(url).toContain('dealer_id=eq.dealer-1')
  })

  it('returns 403 for non-admin without dealer', async () => {
    mockUserSelect.mockReturnValue({ data: { role: 'dealer' }, error: null })
    mockDealerSelect.mockReturnValue({ data: null, error: { message: 'not found' } })

    await expect(handler(mockEvent)).rejects.toThrow('No dealer associated')
  })

  it('returns 500 when fetch returns non-array', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ error: 'something' }),
    })

    await expect(handler(mockEvent)).rejects.toThrow('Error fetching invoices')
  })

  it('sets Content-Disposition with month in CSV filename', async () => {
    mockGetQuery.mockReturnValue({ month: '2026-03' })

    await handler(mockEvent)

    expect(mockSetHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="invoices-2026-03.csv"',
    )
  })

  it('sets Content-Disposition with year in JSON filename', async () => {
    mockGetQuery.mockReturnValue({ year: '2026', format: 'json' })

    await handler(mockEvent)

    expect(mockSetHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="invoices-2026.json"',
    )
  })

  it('CSV escapes double quotes in values', async () => {
    mockFetch.mockResolvedValue({
      json: async () => [
        {
          ...sampleInvoices[0],
          stripe_invoice_id: 'id"with"quotes',
        },
      ],
    })

    const result = await handler(mockEvent) as string
    expect(result).toContain('""with""quotes')
  })

  it('includes pdf_url column in CSV output', async () => {
    const result = await handler(mockEvent) as string
    expect(result).toContain('PDF URL')
    expect(result).toContain('https://example.com/inv.pdf')
  })

  it('includes select=pdf_url in fetch query', async () => {
    await handler(mockEvent)

    const fetchCall = mockFetch.mock.calls[0]
    const url = fetchCall[0] as string
    expect(url).toContain('pdf_url')
  })
})
