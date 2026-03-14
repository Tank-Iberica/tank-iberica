/**
 * Tests for:
 * - GET /api/invoicing/export-csv
 * - POST /api/invoicing/create-invoice
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { mockReadBody, mockGetQuery, mockSafeError, mockServiceRole, mockSupabaseUser } = vi.hoisted(
  () => {
    const mockSafeError = vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    })
    return {
      mockReadBody: vi.fn().mockResolvedValue({}),
      mockGetQuery: vi.fn().mockReturnValue({}),
      mockSafeError,
      mockServiceRole: vi.fn(),
      mockSupabaseUser: vi.fn().mockResolvedValue(null),
    }
  },
)

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getQuery: mockGetQuery,
  getHeaders: vi.fn().mockReturnValue({}),
  getHeader: vi.fn().mockReturnValue(undefined),
  getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
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

vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: undefined,
  quadernoApiKey: undefined,
  quadernoApiUrl: undefined,
  public: {},
}))

function makeChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnThis(),
  }
  return { from: vi.fn().mockReturnValue(chain) }
}

// ── GET /api/invoicing/export-csv ─────────────────────────────────────────

import exportCsvHandler from '../../../server/api/invoicing/export-csv.get'

const csvEvent = {
  node: {
    req: { headers: {} },
    res: { setHeader: vi.fn() },
  },
} as any

describe('GET /api/invoicing/export-csv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({})
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue([]),
      }),
    )
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('throws 500 when supabase not configured', async () => {
    await expect(exportCsvHandler(csvEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 401 when user not authenticated', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockSupabaseUser.mockResolvedValue(null)
    await expect(exportCsvHandler(csvEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user data not found', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockServiceRole.mockReturnValue(makeChain(null, { message: 'not found' }))
    await expect(exportCsvHandler(csvEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when non-admin has no dealer', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    let callCount = 0
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            callCount === 1
              ? { data: { role: 'dealer' }, error: null } // user role
              : { data: null, error: { message: 'not found' } }, // no dealer
          ),
        }
        return chain
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    await expect(exportCsvHandler(csvEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns CSV string for admin user', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockServiceRole.mockReturnValue(makeChain({ role: 'admin' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi
          .fn()
          .mockResolvedValue([
            {
              id: 'inv-1',
              dealer_id: 'd1',
              user_id: 'u1',
              stripe_invoice_id: null,
              service_type: 'subscription',
              amount_cents: 2900,
              tax_cents: 609,
              currency: 'EUR',
              status: 'paid',
              created_at: '2024-01-01',
            },
          ]),
      }),
    )
    const result = await exportCsvHandler(csvEvent)
    expect(typeof result).toBe('string')
    expect(result).toContain('ID')
    expect(result).toContain('inv-1')
  })

  it('applies month filter to query', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockGetQuery.mockReturnValue({ month: '2024-01' })
    mockServiceRole.mockReturnValue(makeChain({ role: 'admin' }))
    const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) })
    vi.stubGlobal('fetch', fetchMock)
    await exportCsvHandler(csvEvent)
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('2024-01-01')
  })
})

// ── POST /api/invoicing/create-invoice ────────────────────────────────────

import createInvoiceHandler from '../../../server/api/invoicing/create-invoice.post'

const validInvoiceBody = {
  dealerId: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000002',
  serviceType: 'subscription',
  amountCents: 2900,
}

describe('POST /api/invoicing/create-invoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ ...validInvoiceBody })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue([]),
      }),
    )
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(createInvoiceHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when missing required fields', async () => {
    mockReadBody.mockResolvedValue({ dealerId: 'dealer-1' })
    await expect(createInvoiceHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when supabase not configured', async () => {
    await expect(createInvoiceHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 403 when dealer not owned by user', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockServiceRole.mockReturnValue(makeChain(null, { message: 'not found' }))
    await expect(createInvoiceHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns success with correct vatRate for ES', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockServiceRole.mockReturnValue(makeChain({ id: 'dealer-1' }))
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([{ tax_country: 'ES' }]) }) // fiscal data
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue([{ id: 'inv-1', ...validInvoiceBody }]),
        }), // insert
    )
    const result = await createInvoiceHandler({} as any)
    expect(result.success).toBe(true)
    expect(result.vatRate).toBe(0.21)
    expect(result.taxCountry).toBe('ES')
  })

  it('uses default ES vatRate when country not found', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockServiceRole.mockReturnValue(makeChain({ id: 'dealer-1' }))
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([]) }) // no fiscal data
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue([{ id: 'inv-1' }]) }),
    )
    const result = await createInvoiceHandler({} as any)
    expect(result.vatRate).toBe(0.21)
    expect(result.taxCountry).toBe('ES')
  })
})
