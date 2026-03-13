/**
 * Tests for POST /api/cron/newsletter
 *
 * Covers: helper functions (formatEur, getFirstImageUrl, buildNewsletterHtml),
 * handler logic (no vehicles, no subscribers, send success, send error, mock mode).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const { mockVerifyCronSecret, mockLogger, mockResendSend, MockResend } = vi.hoisted(() => {
  const mockResendSend = vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null })
  // Use a regular (non-arrow) function for constructor compatibility
  const MockResend = vi.fn(function () {
    return { emails: { send: mockResendSend } }
  })
  return {
    mockVerifyCronSecret: vi.fn(),
    mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    mockResendSend,
    MockResend,
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn().mockResolvedValue({}),
}))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: vi.fn(),
}))
vi.mock('../../../server/utils/safeError', () => ({
  safeError: (status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as Record<string, unknown>).statusCode = status
    return err
  },
}))
vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))
vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))
vi.mock('../../../server/utils/siteConfig', () => ({ getSiteUrl: () => 'https://tracciona.com' }))
vi.mock('../../../server/utils/batchProcessor', () => ({
  processBatch: async ({
    items,
    processor,
  }: {
    items: unknown[]
    processor: (item: unknown) => Promise<void>
  }) => {
    let processed = 0
    let errors = 0
    for (const item of items) {
      try {
        await processor(item)
        processed++
      } catch {
        errors++
      }
    }
    return { processed, errors }
  },
}))
vi.mock('resend', () => ({ Resend: MockResend }))

vi.stubGlobal('useRuntimeConfig', () => ({
  resendApiKey: 'test-resend-key',
  cronSecret: 'test-secret',
}))

import { serverSupabaseServiceRole } from '#supabase/server'
import newsletterHandler, {
  formatEur,
  getFirstImageUrl,
  buildNewsletterHtml,
  getFeaturedVehicles,
  getMarketInsight,
} from '../../../server/api/cron/newsletter.post'

// ── Supabase mock builder ──────────────────────────────────────────────────────

const SAMPLE_VEHICLES = [
  {
    id: 'v1',
    slug: 'ford-cargo-2020',
    brand: 'Ford',
    model: 'Cargo',
    year: 2020,
    price: 25000,
    featured: true,
    vehicle_images: [
      { url: 'https://img/1.jpg', thumbnail_url: 'https://img/1t.jpg', position: 0 },
    ],
  },
  {
    id: 'v2',
    slug: 'volvo-fh-2019',
    brand: 'Volvo',
    model: 'FH',
    year: 2019,
    price: 42000,
    featured: true,
    vehicle_images: [],
  },
  {
    id: 'v3',
    slug: 'man-tgx-2021',
    brand: 'MAN',
    model: 'TGX',
    year: 2021,
    price: 55000,
    featured: true,
    vehicle_images: [{ url: 'https://img/3.jpg', thumbnail_url: null, position: 1 }],
  },
  {
    id: 'v4',
    slug: 'daf-xf-2022',
    brand: 'DAF',
    model: 'XF',
    year: 2022,
    price: 61000,
    featured: true,
    vehicle_images: [],
  },
  {
    id: 'v5',
    slug: 'scania-r-2020',
    brand: 'Scania',
    model: 'R',
    year: 2020,
    price: 48000,
    featured: true,
    vehicle_images: [],
  },
]

const SAMPLE_SUBSCRIBERS = [
  { id: 'sub-001', email: 'alice@example.com' },
  { id: 'sub-002', email: 'bob@example.com' },
]

/**
 * Build a mock Supabase client.
 * - vehicles table: supports the three query shapes used in getMarketInsight
 *   plus the featured/fallback shapes used in getFeaturedVehicles
 * - newsletter_subscriptions: returns given subscribers/error
 */
function makeSupabase({
  vehicles = SAMPLE_VEHICLES,
  vehiclesError = null as Error | null,
  publishedPrices = [{ price: 30000 }, { price: 50000 }],
  newThisWeekCount = 3,
  categories = [{ category: 'camion' }, { category: 'camion' }, { category: 'furgoneta' }],
  subscribers = SAMPLE_SUBSCRIBERS as unknown[],
  subscribersError = null as Error | null,
} = {}) {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'newsletter_subscriptions') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: subscribers, error: subscribersError }),
      }
    }

    // vehicles: handle multiple query shapes
    const chain: Record<string, unknown> = {}
    const self = () => chain

    chain.eq = vi.fn().mockReturnValue(chain)
    chain.or = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.not = vi.fn().mockReturnValue(chain)
    chain.gte = vi.fn().mockReturnValue(chain)

    // limit: terminal — return vehicle list
    chain.limit = vi.fn().mockResolvedValue({ data: vehicles, error: vehiclesError })

    // maybeSingle: for market_data query (not used here but keep)
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

    chain.select = vi.fn().mockImplementation((cols: string, opts?: Record<string, unknown>) => {
      if (opts?.count === 'exact' && opts?.head === true) {
        // getMarketInsight: head count (new this week)
        return {
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count: newThisWeekCount, data: null, error: null }),
        }
      }
      if (opts?.count === 'exact') {
        // getMarketInsight: published prices with count
        return {
          eq: vi.fn().mockResolvedValue({
            data: publishedPrices,
            count: publishedPrices.length,
            error: null,
          }),
        }
      }
      if (cols === 'category') {
        // getMarketInsight: category list
        return {
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({ data: categories, error: null }),
        }
      }
      return self()
    })

    return chain
  })

  return { from: fromMock }
}

// ── Helper function tests ──────────────────────────────────────────────────────

describe('formatEur', () => {
  it('formats integer prices', () => {
    expect(formatEur(25000)).toContain('25')
    expect(formatEur(25000)).toContain('€')
  })

  it('formats zero', () => {
    const result = formatEur(0)
    expect(result).toContain('0')
  })
})

describe('getFirstImageUrl', () => {
  it('returns thumbnail_url of position 0 image', () => {
    const images = [
      { url: 'full.jpg', thumbnail_url: 'thumb.jpg', position: 0 },
      { url: 'full2.jpg', thumbnail_url: 'thumb2.jpg', position: 1 },
    ]
    expect(getFirstImageUrl(images)).toBe('thumb.jpg')
  })

  it('returns url when thumbnail_url is null', () => {
    const images = [{ url: 'full.jpg', thumbnail_url: null, position: 0 }]
    expect(getFirstImageUrl(images)).toBe('full.jpg')
  })

  it('returns null for empty array', () => {
    expect(getFirstImageUrl([])).toBeNull()
  })

  it('sorts by position before picking first', () => {
    const images = [
      { url: 'second.jpg', thumbnail_url: 'second-t.jpg', position: 1 },
      { url: 'first.jpg', thumbnail_url: 'first-t.jpg', position: 0 },
    ]
    expect(getFirstImageUrl(images)).toBe('first-t.jpg')
  })

  it('handles missing position (nulls go last)', () => {
    const images = [
      { url: 'nopos.jpg', thumbnail_url: 'nopos-t.jpg', position: null },
      { url: 'first.jpg', thumbnail_url: 'first-t.jpg', position: 0 },
    ]
    expect(getFirstImageUrl(images)).toBe('first-t.jpg')
  })
})

describe('buildNewsletterHtml', () => {
  const insight = { totalPublished: 100, avgPrice: 35000, newThisWeek: 5, topCategory: 'camion' }
  const siteUrl = 'https://tracciona.com'
  const unsubUrl = 'https://tracciona.com/api/email/unsubscribe?newsletter_id=abc'

  it('includes site URL', () => {
    const html = buildNewsletterHtml(SAMPLE_VEHICLES, insight, siteUrl, unsubUrl)
    expect(html).toContain(siteUrl)
  })

  it('includes vehicle brand and model', () => {
    const html = buildNewsletterHtml(SAMPLE_VEHICLES, insight, siteUrl, unsubUrl)
    expect(html).toContain('Ford')
    expect(html).toContain('Cargo')
  })

  it('includes market insight data', () => {
    const html = buildNewsletterHtml(SAMPLE_VEHICLES, insight, siteUrl, unsubUrl)
    expect(html).toContain('5') // newThisWeek
    expect(html).toContain('100') // totalPublished
  })

  it('includes unsubscribe link', () => {
    const html = buildNewsletterHtml(SAMPLE_VEHICLES, insight, siteUrl, unsubUrl)
    expect(html).toContain(unsubUrl)
  })

  it('includes catalog CTA link', () => {
    const html = buildNewsletterHtml(SAMPLE_VEHICLES, insight, siteUrl, unsubUrl)
    expect(html).toContain('/catalogo')
  })

  it('includes vehicle thumbnail when present', () => {
    const html = buildNewsletterHtml(SAMPLE_VEHICLES, insight, siteUrl, unsubUrl)
    expect(html).toContain('https://img/1t.jpg')
  })

  it('vehicle links use /vehiculo/{slug}', () => {
    const html = buildNewsletterHtml(SAMPLE_VEHICLES, insight, siteUrl, unsubUrl)
    expect(html).toContain('/vehiculo/ford-cargo-2020')
  })
})

// ── getFeaturedVehicles tests ──────────────────────────────────────────────────

describe('getFeaturedVehicles', () => {
  it('returns featured vehicles when 5+ found', async () => {
    const supabase = makeSupabase({ vehicles: SAMPLE_VEHICLES })
    const result = await getFeaturedVehicles(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(result).toHaveLength(5)
  })

  it('falls back to recent vehicles when featured count < 5', async () => {
    const twoFeatured = SAMPLE_VEHICLES.slice(0, 2)
    const supabase = makeSupabase({ vehicles: twoFeatured })
    // Both queries return twoFeatured; fallback returns them as well
    const result = await getFeaturedVehicles(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(result.length).toBeGreaterThan(0)
  })
})

// ── getMarketInsight tests ─────────────────────────────────────────────────────

describe('getMarketInsight', () => {
  it('computes avgPrice from published vehicles', async () => {
    const supabase = makeSupabase({ publishedPrices: [{ price: 20000 }, { price: 40000 }] })
    const insight = await getMarketInsight(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(insight.avgPrice).toBe(30000)
  })

  it('returns 0 avgPrice when no prices', async () => {
    const supabase = makeSupabase({ publishedPrices: [] })
    const insight = await getMarketInsight(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(insight.avgPrice).toBe(0)
  })

  it('returns newThisWeek count', async () => {
    const supabase = makeSupabase({ newThisWeekCount: 7 })
    const insight = await getMarketInsight(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(insight.newThisWeek).toBe(7)
  })

  it('identifies top category', async () => {
    const supabase = makeSupabase({
      categories: [{ category: 'camion' }, { category: 'camion' }, { category: 'furgoneta' }],
    })
    const insight = await getMarketInsight(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(insight.topCategory).toBe('camion')
  })
})

// ── Handler integration tests ──────────────────────────────────────────────────

describe('POST /api/cron/newsletter — handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    // vi.clearAllMocks does NOT reset implementations — MockResend hoisted regular-fn persists.
    // Only re-set the send mock which individual tests may override.
    mockResendSend.mockResolvedValue({ data: { id: 'msg_ok' }, error: null })
  })

  it('calls verifyCronSecret', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(makeSupabase({ vehicles: [] }) as never)
    await newsletterHandler({} as never)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns no_vehicles when no published vehicles exist', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(makeSupabase({ vehicles: [] }) as never)
    const result = await newsletterHandler({} as never)
    expect(result).toMatchObject({ sent: 0, reason: 'no_vehicles' })
  })

  it('returns no_subscribers when subscriber list is empty', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ vehicles: SAMPLE_VEHICLES, subscribers: [] }) as never,
    )
    const result = await newsletterHandler({} as never)
    expect(result).toMatchObject({ sent: 0, reason: 'no_subscribers' })
  })

  it('sends emails and returns correct counts', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ vehicles: SAMPLE_VEHICLES, subscribers: SAMPLE_SUBSCRIBERS }) as never,
    )
    const result = await newsletterHandler({} as never)
    expect(result).toMatchObject({
      sent: 2,
      skipped: 0,
      errors: 0,
      subscribers: 2,
      vehicles: 5,
    })
    expect(mockResendSend).toHaveBeenCalledTimes(2)
  })

  it('includes List-Unsubscribe header in each email', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ vehicles: SAMPLE_VEHICLES, subscribers: [SAMPLE_SUBSCRIBERS[0]] }) as never,
    )
    await newsletterHandler({} as never)
    const call = mockResendSend.mock.calls[0][0] as Record<string, unknown>
    const headers = call.headers as Record<string, string>
    expect(headers['List-Unsubscribe']).toContain('newsletter_id=sub-001')
  })

  it('throws 500 when subscriber fetch fails', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ vehicles: SAMPLE_VEHICLES, subscribersError: new Error('DB down') }) as never,
    )
    await expect(newsletterHandler({} as never)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('counts errors when Resend returns an error', async () => {
    mockResendSend.mockResolvedValue({ data: null, error: { message: 'Rate limited' } })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ vehicles: SAMPLE_VEHICLES, subscribers: SAMPLE_SUBSCRIBERS }) as never,
    )
    const result = await newsletterHandler({} as never)
    expect((result as Record<string, number>).errors).toBe(2)
    expect((result as Record<string, number>).sent).toBe(0)
  })

  it('skips (mock mode) when RESEND_API_KEY is not set', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: '', cronSecret: 'test-secret' }))
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ vehicles: SAMPLE_VEHICLES, subscribers: SAMPLE_SUBSCRIBERS }) as never,
    )
    const result = await newsletterHandler({} as never)
    expect((result as Record<string, number>).skipped).toBe(2)
    expect((result as Record<string, number>).sent).toBe(0)
    expect(mockResendSend).not.toHaveBeenCalled()
    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({
      resendApiKey: 'test-resend-key',
      cronSecret: 'test-secret',
    }))
  })

  it('counts errors when Resend throws', async () => {
    mockResendSend.mockRejectedValue(new Error('Network error'))
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ vehicles: SAMPLE_VEHICLES, subscribers: SAMPLE_SUBSCRIBERS }) as never,
    )
    const result = await newsletterHandler({} as never)
    expect((result as Record<string, number>).errors).toBe(2)
    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('returns no_vehicles when both vehicle queries return empty', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(makeSupabase({ vehicles: [] }) as never)
    const result = await newsletterHandler({} as never)
    expect(result).toMatchObject({ sent: 0, reason: 'no_vehicles' })
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('No published vehicles'))
  })
})
