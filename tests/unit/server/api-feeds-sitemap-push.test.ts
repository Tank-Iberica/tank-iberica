/**
 * Tests for:
 * - GET /api/merchant-feed   (Nuxt global, createClient)
 * - GET /api/market-report   (Nuxt global, #supabase/server)
 * - GET /api/market/valuation (h3 explicit, createClient)
 * - GET /api/__sitemap       (Nuxt global, createClient)
 * - POST /api/push/send      (Nuxt global, #supabase/server)
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

const {
  mockGetQuery,
  mockGetHeader,
  mockGetRequestHeader,
  mockReadBody,
  mockSetResponseStatus,
  mockSetResponseHeader,
  mockSetHeader,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockCreateClient,
  mockGenerateMarketReport,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockGetQuery: vi.fn().mockReturnValue({}),
    mockGetHeader: vi.fn().mockReturnValue(undefined),
    mockGetRequestHeader: vi.fn().mockReturnValue(undefined),
    mockReadBody: vi.fn().mockResolvedValue({}),
    mockSetResponseStatus: vi.fn(),
    mockSetResponseHeader: vi.fn(),
    mockSetHeader: vi.fn(),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockCreateClient: vi.fn(),
    mockGenerateMarketReport: vi.fn().mockResolvedValue({ html: '<html>Report</html>' }),
  }
})

// h3 mock (for files with explicit h3 imports, e.g. market/valuation.get.ts)
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: mockGetQuery,
  getHeader: mockGetHeader,
  getRequestHeader: mockGetRequestHeader,
  readBody: mockReadBody,
  setResponseStatus: mockSetResponseStatus,
  setResponseHeader: mockSetResponseHeader,
  setHeader: mockSetHeader,
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

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}))

vi.mock('~~/server/services/marketReport', () => ({
  generateMarketReport: mockGenerateMarketReport,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

// Stub Nuxt global auto-imports (for files without explicit h3 import)
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('getHeader', mockGetHeader)
vi.stubGlobal('getRequestHeader', mockGetRequestHeader)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('setResponseStatus', mockSetResponseStatus)
vi.stubGlobal('setResponseHeader', mockSetResponseHeader)
vi.stubGlobal('setHeader', mockSetHeader)
vi.stubGlobal('safeError', mockSafeError)
vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: undefined,
  vapidPublicKey: undefined,
  vapidPrivateKey: undefined,
  vapidEmail: undefined,
  supabaseServiceRoleKey: undefined,
  public: { vapidPublicKey: undefined, siteUrl: 'https://tracciona.com' },
}))

// Static import for h3-explicit handler (works because vi.mock('h3',...) is hoisted)
import valuationHandler from '../../../server/api/market/valuation.get'

// Dynamic imports for Nuxt-global handlers (needs globals stubbed before module eval)
let merchantFeedHandler: any
let marketReportHandler: any
let sitemapHandler: any
let pushSendHandler: any

beforeAll(async () => {
  merchantFeedHandler = (await import('../../../server/api/merchant-feed.get')).default
  marketReportHandler = (await import('../../../server/api/market-report.get')).default
  sitemapHandler = (await import('../../../server/api/__sitemap')).default
  pushSendHandler = (await import('../../../server/api/push/send.post')).default
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    delete: vi.fn().mockReturnThis(),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve({ data, error }).then(onFulfilled as any, onRejected as any)
  return chain
}

function makeClient(data: any = null, error: any = null) {
  return { from: vi.fn().mockReturnValue(makeChain(data, error)) }
}

// ── GET /api/merchant-feed ───────────────────────────────────────────────────

describe('GET /api/merchant-feed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset getHeader so ETag check never matches by default
    mockGetHeader.mockReturnValue(undefined)
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_KEY
    // Disable the min-threshold gate for most tests (1 valid item is enough)
    process.env.MERCHANT_FEED_MIN_ITEMS = '1'
  })
  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_KEY
    delete process.env.MERCHANT_FEED_MIN_ITEMS
  })

  it('returns error string when supabase not configured', async () => {
    const result = await merchantFeedHandler({} as any)
    expect(result).toBe('Missing service configuration')
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 500)
  })

  it('returns error string when DB fails', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    mockCreateClient.mockReturnValue(makeClient(null, { message: 'db error' }))
    const result = await merchantFeedHandler({} as any)
    expect(result).toContain('Error fetching vehicles')
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 500)
  })

  it('returns valid XML with empty channel when no vehicles', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    mockCreateClient.mockReturnValue(makeClient([]))
    const result = await merchantFeedHandler({} as any)
    expect(typeof result).toBe('string')
    expect(result).toContain('<?xml')
    expect(result).toContain('<rss')
  })

  it('includes item in XML for vehicle with image and price', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    const vehicles = [{
      id: 'v1', slug: 'scania-r450-2020', brand: 'Scania', model: 'R450',
      year: 2020, price: 80000, description_es: 'Buen camion', category: 'camiones',
      vehicle_images: [{ url: 'https://res.cloudinary.com/test/img.jpg', position: 0 }],
    }]
    mockCreateClient.mockReturnValue(makeClient(vehicles))
    const result = await merchantFeedHandler({} as any)
    expect(result).toContain('<item>')
    expect(result).toContain('Scania')
    expect(result).toContain('80000.00 EUR')
  })

  it('sorts multiple images by position', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    const vehicles = [{
      id: 'v1', slug: 'scania-r450-2020', brand: 'Scania', model: 'R450',
      year: 2020, price: 80000, description_es: 'Buen camion', category: 'camiones',
      vehicle_images: [
        { url: 'https://res.cloudinary.com/test/img2.jpg', position: 1 },
        { url: 'https://res.cloudinary.com/test/img1.jpg', position: 0 },
      ],
    }]
    mockCreateClient.mockReturnValue(makeClient(vehicles))
    const result = await merchantFeedHandler({} as any)
    expect(result).toContain('<item>')
    expect(result).toContain('img1.jpg')
  })

  it('filters out vehicles without image or price', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    const vehicles = [{
      id: 'v1', slug: 'no-image', brand: 'Volvo', model: 'FH16', year: 2019,
      price: null, description_es: null, category: 'camiones', vehicle_images: [],
    }]
    mockCreateClient.mockReturnValue(makeClient(vehicles))
    const result = await merchantFeedHandler({} as any)
    expect(result).not.toContain('<item>')
  })

  it('returns 304 and empty string when ETag matches', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    mockCreateClient.mockReturnValue(makeClient([]))

    // First call to capture the ETag
    await merchantFeedHandler({} as any)
    const etagCall = (mockSetHeader.mock.calls as any[]).find((args: any[]) => args[1] === 'ETag')
    const etag = etagCall?.[2]
    expect(etag).toBeTruthy()

    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(makeClient([]))
    mockGetHeader.mockReturnValue(etag)

    const result = await merchantFeedHandler({} as any)
    expect(result).toBe('')
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 304)
  })

  it('returns empty feed (no items) when valid items below min threshold', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    process.env.MERCHANT_FEED_MIN_ITEMS = '3' // threshold = 3
    // Only 1 valid vehicle → below threshold
    const vehicles = [
      {
        id: 'v1', slug: 'volvo-fh16', brand: 'Volvo', model: 'FH16',
        year: 2021, price: 90000, description_es: 'Camion', category: 'camiones',
        vehicle_images: [{ url: 'https://res.cloudinary.com/test/img.jpg', position: 0 }],
      },
    ]
    mockCreateClient.mockReturnValue(makeClient(vehicles))
    const result = await merchantFeedHandler({} as any)
    expect(result).toContain('<?xml')
    expect(result).toContain('<rss')
    expect(result).not.toContain('<item>')
    // Should set the X-Feed-Status header
    const statusHeaderCall = mockSetResponseHeader.mock.calls.find(
      (args: any[]) => args[1] === 'X-Feed-Status',
    )
    expect(statusHeaderCall).toBeTruthy()
    expect(statusHeaderCall[2]).toContain('pending-minimum-threshold')
  })

  it('returns items when valid items meet or exceed min threshold', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    process.env.MERCHANT_FEED_MIN_ITEMS = '2' // threshold = 2
    const makeVehicle = (id: string, slug: string) => ({
      id, slug, brand: 'Volvo', model: 'FH16',
      year: 2021, price: 90000, description_es: 'Camion', category: 'camiones',
      vehicle_images: [{ url: `https://res.cloudinary.com/test/${id}.jpg`, position: 0 }],
    })
    mockCreateClient.mockReturnValue(makeClient([makeVehicle('v1', 'volvo-1'), makeVehicle('v2', 'volvo-2')]))
    const result = await merchantFeedHandler({} as any)
    expect(result).toContain('<item>')
    // Should NOT set X-Feed-Status header
    const statusHeaderCall = mockSetResponseHeader.mock.calls.find(
      (args: any[]) => args[1] === 'X-Feed-Status',
    )
    expect(statusHeaderCall).toBeFalsy()
  })
})

// ── GET /api/market-report ───────────────────────────────────────────────────

describe('GET /api/market-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({})
    mockSupabaseUser.mockResolvedValue(null)
    mockGenerateMarketReport.mockResolvedValue({ html: '<html>Report</html>' })
  })

  it('throws 401 when not public and no authentication', async () => {
    await expect(marketReportHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 500 when user profile fetch fails', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    })
    await expect(marketReportHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 403 when authenticated user is not admin', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'dealer' }, error: null }),
      }),
    })
    await expect(marketReportHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns HTML for admin user', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
      }),
    })
    const result = await marketReportHandler({} as any)
    expect(result).toBe('<html>Report</html>')
  })

  it('skips auth and returns HTML for public=true', async () => {
    mockGetQuery.mockReturnValue({ public: 'true' })
    const result = await marketReportHandler({} as any)
    expect(result).toBe('<html>Report</html>')
    expect(mockSupabaseUser).not.toHaveBeenCalled()
  })

  it('throws 500 when generateMarketReport throws', async () => {
    mockGetQuery.mockReturnValue({ public: 'true' })
    mockGenerateMarketReport.mockRejectedValue(new Error('Report generation failed'))
    await expect(marketReportHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── GET /api/market/valuation ─────────────────────────────────────────────────

const valuationEvent = { node: { res: { setHeader: vi.fn() } } } as any

describe('GET /api/market/valuation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ brand: 'Scania' })
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseServiceRoleKey: undefined,
      public: {},
    }))
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })
  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  function makeValuationClient(prices: number[], error: any = null) {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: prices.map(p => ({ price: p })),
          error,
        }),
      }),
    }
  }

  it('returns error when brand is missing', async () => {
    mockGetQuery.mockReturnValue({})
    const result = await valuationHandler(valuationEvent)
    expect(result).toMatchObject({ error: 'brand is required' })
  })

  it('returns error when supabase not configured', async () => {
    const result = await valuationHandler(valuationEvent)
    expect(result).toMatchObject({ error: 'Service unavailable' })
  })

  it('returns error on DB error', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockCreateClient.mockReturnValue(makeValuationClient([], { message: 'db error' }))
    const result = await valuationHandler(valuationEvent)
    expect(result).toMatchObject({ error: 'Database error' })
  })

  it('returns low confidence with null priceStats for fewer than 3 prices', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockCreateClient.mockReturnValue(makeValuationClient([50000, 60000]))
    const result = await valuationHandler(valuationEvent) as any
    expect(result.confidence).toBe('low')
    expect(result.priceStats).toBeNull()
    expect(result.sampleSize).toBe(2)
  })

  it('returns priceStats with low confidence for 3-7 prices', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockCreateClient.mockReturnValue(makeValuationClient([10000, 20000, 30000, 40000, 50000]))
    const result = await valuationHandler(valuationEvent) as any
    expect(result.confidence).toBe('low')
    expect(result.priceStats).not.toBeNull()
    expect(result.priceStats.avg).toBe(30000)
    expect(result.priceStats.min).toBe(10000)
    expect(result.priceStats.max).toBe(50000)
  })

  it('returns medium confidence for 8-19 prices', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const prices = Array.from({ length: 10 }, (_, i) => (i + 1) * 10000)
    mockCreateClient.mockReturnValue(makeValuationClient(prices))
    const result = await valuationHandler(valuationEvent) as any
    expect(result.confidence).toBe('medium')
  })

  it('returns high confidence for 20+ prices', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const prices = Array.from({ length: 25 }, (_, i) => (i + 1) * 10000)
    mockCreateClient.mockReturnValue(makeValuationClient(prices))
    const result = await valuationHandler(valuationEvent) as any
    expect(result.confidence).toBe('high')
    expect(result.sampleSize).toBe(25)
  })

  it('applies model and year filters when provided', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockGetQuery.mockReturnValue({ brand: 'Scania', model: 'R450', year: '2018' })
    const iliktMock = vi.fn().mockReturnThis()
    const gteMock = vi.fn().mockReturnThis()
    const lteMock = vi.fn().mockReturnThis()
    mockCreateClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: iliktMock,
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: gteMock,
        lte: lteMock,
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
    await valuationHandler(valuationEvent)
    expect(iliktMock).toHaveBeenCalledWith('model', '%R450%')
    expect(gteMock).toHaveBeenCalledWith('year', 2015)
    expect(lteMock).toHaveBeenCalledWith('year', 2021)
  })
})

// ── GET /api/__sitemap ────────────────────────────────────────────────────────

describe('GET /api/__sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_KEY
    delete process.env.SUPABASE_ANON_KEY
  })
  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_KEY
    delete process.env.SUPABASE_ANON_KEY
  })

  it('returns empty array when supabase not configured', async () => {
    const result = await sitemapHandler({} as any)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('returns array of sitemap URLs when all queries succeed', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_KEY = 'test-key'

    const vehicles = [{
      slug: 'scania-r450', brand: 'Scania', model: 'R450', year: 2020,
      updated_at: '2024-01-01', vehicle_images: [],
    }]
    const news = [{ slug: 'news-1', updated_at: '2024-01-01', published_at: null, section: 'noticias' }]
    const tableData = [vehicles, news, [], [], []]
    let callCount = 0

    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const data = tableData[callCount++] ?? []
        return makeChain(data)
      }),
    })

    const result = await sitemapHandler({} as any)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('loc')
  })

  it('returns 304 and empty array when ETag matches', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_KEY = 'test-key'
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain([])) })

    await sitemapHandler({} as any)
    const etagCall = (mockSetResponseHeader.mock.calls as any[]).find(args => args[1] === 'ETag')
    const etag = etagCall?.[2]

    vi.clearAllMocks()
    mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain([])) })
    mockGetRequestHeader.mockReturnValue(etag)

    const result = await sitemapHandler({} as any)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 304)
  })
})

// ── POST /api/push/send ───────────────────────────────────────────────────────

describe('POST /api/push/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHeader.mockReturnValue(undefined)
    mockSupabaseUser.mockResolvedValue(null)
    mockReadBody.mockResolvedValue({ userId: '00000000-0000-0000-0000-000000000001', title: 'Test', body: 'Message' })
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-cron',
      vapidPublicKey: undefined,
      vapidPrivateKey: undefined,
      vapidEmail: undefined,
      public: { vapidPublicKey: undefined },
    }))
  })

  it('throws 401 when no internal secret and not authenticated', async () => {
    await expect(pushSendHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when authenticated but not admin', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'dealer' }, error: null }),
      }),
    })
    await expect(pushSendHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when required fields are missing', async () => {
    mockGetHeader.mockReturnValue('test-cron')
    mockReadBody.mockResolvedValue({ title: 'Test' }) // missing userId and body
    await expect(pushSendHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when VAPID keys not configured', async () => {
    mockGetHeader.mockReturnValue('test-cron')
    await expect(pushSendHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns success:false when no subscriptions found', async () => {
    mockGetHeader.mockReturnValue('test-cron')
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-cron',
      vapidPublicKey: 'vapid-pub',
      vapidPrivateKey: 'vapid-priv',
      vapidEmail: 'admin@test.com',
      public: { vapidPublicKey: 'vapid-pub' },
    }))
    mockServiceRole.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain([])) })
    const result = await pushSendHandler({} as any)
    expect(result.success).toBe(false)
    expect(result.sent).toBe(0)
  })

  it('sends notifications and returns success:true when subscriptions exist', async () => {
    mockGetHeader.mockReturnValue('test-cron')
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-cron',
      vapidPublicKey: 'vapid-pub',
      vapidPrivateKey: 'vapid-priv',
      vapidEmail: 'admin@test.com',
      public: { vapidPublicKey: 'vapid-pub' },
    }))
    const subscriptions = [{
      id: 'sub-1',
      endpoint: 'https://fcm.example.com/sub',
      keys: { p256dh: 'pubkey', auth: 'authkey' },
    }]
    mockServiceRole.mockReturnValue({ from: vi.fn().mockReturnValue(makeChain(subscriptions)) })
    const result = await pushSendHandler({} as any)
    expect(result.success).toBe(true)
    expect(result.sent).toBe(1)
    expect(result.total).toBe(1)
  })
})
