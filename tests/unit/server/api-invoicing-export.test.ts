import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/* ---------- mocks ---------- */
let mockGetQuery = vi.fn()
const mockSetHeader = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: (...args: unknown[]) => mockGetQuery(...args),
  createError: (opts: { statusCode: number; message?: string; statusMessage?: string }) => {
    const e = new Error(opts.message || opts.statusMessage || '') as Error & { statusCode: number }
    e.statusCode = opts.statusCode
    return e
  },
}))

const mockSupabaseUser = vi.fn()
const mockFrom = vi.fn()
const mockSupabaseServiceRole = vi.fn()

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...args: unknown[]) => mockSupabaseUser(...args),
  serverSupabaseServiceRole: (...args: unknown[]) => mockSupabaseServiceRole(...args),
}))

/* --------- import handler --------- */
import handler from '../../../server/api/invoicing/export-csv.get'

/* --------- helpers --------- */
function createEvent() {
  return {
    node: { res: { setHeader: mockSetHeader } },
  }
}

function setupSupabaseMock(opts: {
  role?: string
  dealerId?: string
  userError?: boolean
  dealerError?: boolean
}) {
  const chain: Record<string, Function> = {}
  chain.from = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockImplementation(() => {
    const lastFrom = (chain.from as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0]
    if (lastFrom === 'users') {
      if (opts.userError) return Promise.resolve({ data: null, error: { message: 'err' } })
      return Promise.resolve({ data: { role: opts.role || 'admin' }, error: null })
    }
    if (lastFrom === 'dealers') {
      if (opts.dealerError) return Promise.resolve({ data: null, error: { message: 'err' } })
      return Promise.resolve({ data: { id: opts.dealerId || 'dealer-1' }, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })

  mockSupabaseServiceRole.mockReturnValue(chain)
  return chain
}

const sampleInvoices = [
  {
    id: 'inv-1',
    dealer_id: 'dealer-1',
    user_id: 'user-1',
    stripe_invoice_id: 'in_test',
    service_type: 'subscription',
    amount_cents: 12100,
    tax_cents: 2100,
    currency: 'EUR',
    pdf_url: 'https://example.com/invoice.pdf',
    status: 'paid',
    created_at: '2026-01-15T10:00:00Z',
  },
]

describe('export-csv.get', () => {
  const originalFetch = globalThis.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockGetQuery.mockReturnValue({})

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(sampleInvoices),
    }) as unknown as typeof globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env = { ...originalEnv }
  })

  /* --- auth --- */
  it('rejects unauthenticated requests', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    setupSupabaseMock({ role: 'admin' })
    await expect(handler(createEvent())).rejects.toThrow('Authentication required')
  })

  it('rejects user with no role data', async () => {
    setupSupabaseMock({ userError: true })
    await expect(handler(createEvent())).rejects.toThrow('Unable to verify')
  })

  it('rejects non-admin with no dealer', async () => {
    setupSupabaseMock({ role: 'dealer', dealerError: true })
    await expect(handler(createEvent())).rejects.toThrow('No dealer associated')
  })

  /* --- CSV format --- */
  it('returns CSV with correct headers (including Net and PDF URL)', async () => {
    setupSupabaseMock({ role: 'admin' })
    const result = await handler(createEvent())
    const lines = (result as string).split('\n')
    expect(lines[0]).toContain('Net (EUR)')
    expect(lines[0]).toContain('PDF URL')
  })

  it('calculates net amount in CSV rows', async () => {
    setupSupabaseMock({ role: 'admin' })
    const result = await handler(createEvent())
    const lines = (result as string).split('\n')
    // amount=121.00, tax=21.00, net=100.00
    expect(lines[1]).toContain('"100.00"')
  })

  it('includes pdf_url in CSV rows', async () => {
    setupSupabaseMock({ role: 'admin' })
    const result = await handler(createEvent())
    expect(result).toContain('https://example.com/invoice.pdf')
  })

  it('sets Content-Type to text/csv', async () => {
    setupSupabaseMock({ role: 'admin' })
    await handler(createEvent())
    expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8')
  })

  it('sets Content-Disposition with correct filename', async () => {
    setupSupabaseMock({ role: 'admin' })
    mockGetQuery.mockReturnValue({ month: '2026-01' })
    await handler(createEvent())
    expect(mockSetHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="invoices-2026-01.csv"',
    )
  })

  /* --- JSON format --- */
  it('returns JSON when format=json', async () => {
    setupSupabaseMock({ role: 'admin' })
    mockGetQuery.mockReturnValue({ format: 'json' })
    const result = await handler(createEvent())
    expect(Array.isArray(result)).toBe(true)
    const arr = result as Array<Record<string, unknown>>
    expect(arr[0].amount).toBe(121)
    expect(arr[0].tax).toBe(21)
    expect(arr[0].net).toBe(100)
    expect(arr[0].pdf_url).toBe('https://example.com/invoice.pdf')
  })

  it('sets Content-Type to application/json for JSON format', async () => {
    setupSupabaseMock({ role: 'admin' })
    mockGetQuery.mockReturnValue({ format: 'json' })
    await handler(createEvent())
    expect(mockSetHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/json; charset=utf-8',
    )
  })

  it('returns date field in JSON format', async () => {
    setupSupabaseMock({ role: 'admin' })
    mockGetQuery.mockReturnValue({ format: 'json' })
    const result = await handler(createEvent()) as Array<Record<string, unknown>>
    expect(result[0].date).toBe('2026-01-15T10:00:00Z')
  })

  /* --- date filters --- */
  it('applies month filter to fetch URL', async () => {
    setupSupabaseMock({ role: 'admin' })
    mockGetQuery.mockReturnValue({ month: '2026-01' })
    await handler(createEvent())
    const fetchUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(fetchUrl).toContain('created_at=gte.2026-01-01')
    expect(fetchUrl).toContain('created_at=lt.2026-02-01')
  })

  it('applies year filter to fetch URL', async () => {
    setupSupabaseMock({ role: 'admin' })
    mockGetQuery.mockReturnValue({ year: '2025' })
    await handler(createEvent())
    const fetchUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(fetchUrl).toContain('created_at=gte.2025-01-01')
    expect(fetchUrl).toContain('created_at=lt.2026-01-01')
  })

  /* --- dealer filter --- */
  it('adds dealer filter for non-admin users', async () => {
    setupSupabaseMock({ role: 'dealer', dealerId: 'dealer-42' })
    await handler(createEvent())
    const fetchUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(fetchUrl).toContain('dealer_id=eq.dealer-42')
  })

  /* --- error handling --- */
  it('throws on non-array fetch response', async () => {
    setupSupabaseMock({ role: 'admin' })
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ error: 'something went wrong' }),
    }) as unknown as typeof globalThis.fetch
    await expect(handler(createEvent())).rejects.toThrow('Error fetching invoices')
  })

  /* --- select includes pdf_url --- */
  it('includes pdf_url in Supabase select query', async () => {
    setupSupabaseMock({ role: 'admin' })
    await handler(createEvent())
    const fetchUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(fetchUrl).toContain('pdf_url')
  })
})

