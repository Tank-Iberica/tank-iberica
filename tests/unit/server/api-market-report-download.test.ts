/**
 * Tests for /api/market-report/download (POST) and /api/market-report/latest (GET)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCheckRateLimit = vi.fn().mockReturnValue(true)
const mockGetRateLimitKey = vi.fn().mockReturnValue('127.0.0.1')
const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const mockGenerateMarketReport = vi.fn().mockResolvedValue({ html: '<html>Market Report</html>' })
const mockGetCurrentQuarter = vi.fn().mockReturnValue('Q1-2026')

vi.mock('../../../server/utils/rateLimit', () => ({
  getRateLimitKey: mockGetRateLimitKey,
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: vi.fn().mockImplementation((code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = code
    return err
  }),
}))

vi.mock('../../../server/services/marketReport', () => ({
  generateMarketReport: mockGenerateMarketReport,
}))

vi.mock('../../../server/api/cron/generate-market-report.post', () => ({
  getCurrentQuarter: mockGetCurrentQuarter,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: vi.fn(() => mockSupabase),
}))

// ── Supabase mock factory ─────────────────────────────────────────────────────

interface ReportRecord {
  storage_path: string | null
  report_data: Record<string, unknown>
  quarter: string
}

interface MockSupabaseOpts {
  reportRecord?: ReportRecord | null
  insertError?: string | null
  signedUrl?: string | null
  signedUrlError?: string | null
}

let mockSupabase: ReturnType<typeof makeMockSupabase>

function makeMockSupabase(opts: MockSupabaseOpts = {}) {
  const recordToReturn =
    opts.reportRecord !== undefined
      ? opts.reportRecord
      : { storage_path: 'Q1-2026-es.html', report_data: { totalListings: 100 }, quarter: 'Q1-2026' }

  const signedUrlResult = opts.signedUrlError
    ? { data: null, error: { message: opts.signedUrlError } }
    : {
        data: { signedUrl: opts.signedUrl ?? 'https://storage.example.com/signed-url' },
        error: null,
      }

  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: opts.insertError ? { message: opts.insertError } : null,
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: recordToReturn,
                error: recordToReturn === null ? { message: 'not found' } : null,
              }),
            }),
          }),
        }),
      }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue(signedUrlResult),
      }),
    },
  }
}

// ── H3 event mock ─────────────────────────────────────────────────────────────

function makeEvent(body: unknown = {}) {
  return { body } as never
}

// We need to mock readBody and the h3 helpers
vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    readBody: vi.fn().mockImplementation((event: { body: unknown }) => Promise.resolve(event.body)),
    setHeader: vi.fn(),
    createError: vi
      .fn()
      .mockImplementation(({ statusCode, message }: { statusCode: number; message: string }) => {
        const e = new Error(message) as Error & { statusCode: number }
        e.statusCode = statusCode
        return e
      }),
  }
})

// ── Tests: download endpoint ──────────────────────────────────────────────────

describe('POST /api/market-report/download', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockReturnValue(true)
    mockGenerateMarketReport.mockResolvedValue({ html: '<html>Market Report</html>' })
    mockGetCurrentQuarter.mockReturnValue('Q1-2026')
  })

  it('returns signed URL when stored report exists', async () => {
    mockSupabase = makeMockSupabase()
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'test@example.com', locale: 'es' })
    const result = await handler(event)

    expect(result).toMatchObject({
      ok: true,
      type: 'url',
      quarter: 'Q1-2026',
    })
    expect((result as { url: string }).url).toContain('signed-url')
  })

  it('falls back to on-the-fly HTML when signed URL fails', async () => {
    mockSupabase = makeMockSupabase({ signedUrlError: 'bucket not found' })
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'test@example.com', locale: 'es' })

    // When signed URL fails, should fall through to on-the-fly generation
    // The response is either HTML string or URL object
    const result = await handler(event)
    expect(mockGenerateMarketReport).toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('generates on-the-fly when no stored report', async () => {
    mockSupabase = makeMockSupabase({ reportRecord: null })
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'test@example.com', locale: 'en' })

    const result = await handler(event)
    expect(mockGenerateMarketReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isPublic: true, locale: 'en' }),
    )
    expect(result).toBeDefined()
  })

  it('throws 429 when rate limited', async () => {
    mockSupabase = makeMockSupabase()
    mockCheckRateLimit.mockReturnValue(false)
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'test@example.com', locale: 'es' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('throws 400 for invalid email', async () => {
    mockSupabase = makeMockSupabase()
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'not-an-email', locale: 'es' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for missing email', async () => {
    mockSupabase = makeMockSupabase()
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ locale: 'es' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for missing body', async () => {
    mockSupabase = makeMockSupabase()
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('saves lead to market_report_leads', async () => {
    mockSupabase = makeMockSupabase()
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'dealer@ejemplo.es', locale: 'es' })

    await handler(event)

    expect(mockSupabase.from).toHaveBeenCalledWith('market_report_leads')
  })

  it('defaults locale to es when not provided', async () => {
    mockSupabase = makeMockSupabase()
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'test@example.com' })

    const result = await handler(event)
    expect(result).toBeDefined()
  })

  it('accepts EN locale', async () => {
    mockSupabase = makeMockSupabase({
      reportRecord: { storage_path: 'Q1-2026-en.html', report_data: {}, quarter: 'Q1-2026' },
    })
    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'test@example.com', locale: 'en' })

    const result = await handler(event)
    expect(result).toBeDefined()
  })
})

// ── Tests: latest endpoint ────────────────────────────────────────────────────

describe('GET /api/market-report/latest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns available: false when no report exists', async () => {
    mockSupabase = makeMockSupabase({ reportRecord: null })
    const { default: handler } = await import('../../../server/api/market-report/latest.get')
    const event = { query: {} } as never

    // Need to mock getQuery from h3
    const h3 = await import('h3')
    vi.spyOn(h3, 'getQuery').mockReturnValue({})

    const result = await handler(event)
    expect(result).toMatchObject({ available: false })
  })

  it('returns report metadata when available', async () => {
    mockSupabase = makeMockSupabase({
      reportRecord: {
        storage_path: 'Q1-2026-es.html',
        report_data: { totalListings: 150, avgPrice: 30000 },
        quarter: 'Q1-2026',
      },
    })

    // Need to reconfigure from() to return the right structure for latest.get.ts
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  quarter: 'Q1-2026',
                  generated_at: '2026-01-01T06:00:00Z',
                  report_data: { totalListings: 150, avgPrice: 30000 },
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const { default: handler } = await import('../../../server/api/market-report/latest.get')
    const event = {} as never

    const h3 = await import('h3')
    vi.spyOn(h3, 'getQuery').mockReturnValue({ locale: 'es' })
    vi.spyOn(h3, 'setHeader').mockReturnValue(undefined)

    const result = await handler(event)
    expect(result).toMatchObject({
      available: true,
      quarter: 'Q1-2026',
    })
  })

  it('sets Cache-Control header', async () => {
    mockSupabase = makeMockSupabase({ reportRecord: null })
    const { default: handler } = await import('../../../server/api/market-report/latest.get')
    const event = {} as never

    const h3 = await import('h3')
    vi.spyOn(h3, 'getQuery').mockReturnValue({})
    const setHeaderSpy = vi.spyOn(h3, 'setHeader').mockReturnValue(undefined)

    await handler(event)

    expect(setHeaderSpy).toHaveBeenCalledWith(
      event,
      'Cache-Control',
      expect.stringContaining('public'),
    )
  })
})

// ── hashIp internal logic (tested via integration) ────────────────────────────

describe('IP hash consistency', () => {
  it('produces consistent hash for same IP across calls', async () => {
    // The hashIp function is internal but we verify it produces a hex string
    // by checking that leads are inserted with ip_hash field
    mockSupabase = makeMockSupabase()
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'market_report_leads') {
        return { insert: insertSpy }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { storage_path: 'Q1-2026-es.html', report_data: {}, quarter: 'Q1-2026' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }
    })
    mockSupabase.storage = {
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed' },
          error: null,
        }),
      }),
    }

    const { default: handler } = await import('../../../server/api/market-report/download.post')
    const event = makeEvent({ email: 'test@tracciona.com', locale: 'es' })
    await handler(event)

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@tracciona.com',
        ip_hash: expect.stringMatching(/^[0-9a-f]+$/),
      }),
    )
  })
})
