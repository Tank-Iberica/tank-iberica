/**
 * Tests for:
 * - POST /api/cron/publish-scheduled (uses Nuxt global auto-imports — dynamic import needed)
 * - POST /api/cron/whatsapp-retry (explicit h3 imports)
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'

const { mockReadBody, mockSafeError, mockServiceRole, mockVerifyCronSecret, mockProcessBatch } =
  vi.hoisted(() => {
    const mockSafeError = vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    })
    return {
      mockReadBody: vi.fn().mockResolvedValue({ secret: 'cron-secret' }),
      mockSafeError,
      mockServiceRole: vi.fn(),
      mockVerifyCronSecret: vi.fn(),
      mockProcessBatch: vi.fn().mockResolvedValue({ processed: 0, errors: 0 }),
    }
  })

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))
vi.mock('../../utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))
vi.mock('../../../server/utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))
vi.mock('../../utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))

vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: 'cron-secret',
  supabaseServiceRoleKey: 'test-key',
  public: {},
}))

// whatsapp-retry reads process.env.SUPABASE_URL directly
process.env.SUPABASE_URL = 'https://test.supabase.co'
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue([]),
  ok: true,
}))

// ── publish-scheduled ─────────────────────────────────────────────────────────
// Uses Nuxt global auto-imports — must use dynamic import pattern

describe('POST /api/cron/publish-scheduled', () => {
  let publishHandler: Function

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.stubGlobal('safeError', mockSafeError)
    vi.resetModules()
    const mod = await import('../../../server/api/cron/publish-scheduled.post')
    publishHandler = mod.default as Function
  })

  function makeSupabase(articles: unknown[], fetchErr: unknown = null, updateErr: unknown = null) {
    const newsCalls = { n: 0 }
    const vehiclesCalls = { n: 0 }
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'news') {
          newsCalls.n++
          if (newsCalls.n === 1) {
            // First call: fetch scheduled articles
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: articles, error: fetchErr }),
                }),
              }),
            }
          }
          // Second call: update articles to published
          return {
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: null, error: updateErr }),
            }),
          }
        }
        // vehicles table
        vehiclesCalls.n++
        if (vehiclesCalls.n === 1) {
          // First call: fetch scheduled vehicles (always returns empty in base mock)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }
        }
        // Second call: update vehicles to published
        return {
          update: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }
      }),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([]))
    await publishHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns published:0 when no scheduled articles', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([]))
    const result = await publishHandler({} as any)
    expect(result).toEqual({ articles: { published: 0 }, vehicles: { published: 0 }, total: 0 })
  })

  it('throws 500 when fetch fails', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([], { message: 'DB error' }))
    await expect(publishHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns published count for articles and vehicles', async () => {
    const articles = [
      { id: 'a1', title_es: 'Artículo uno', slug: 'articulo-uno' },
      { id: 'a2', title_es: 'Artículo dos', slug: 'articulo-dos' },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(articles))
    const result = await publishHandler({} as any)
    expect(result.articles.published).toBe(2)
    expect(result.vehicles.published).toBe(0)
    expect(result.total).toBe(2)
  })

  it('throws 500 when update fails', async () => {
    const articles = [{ id: 'a1', title_es: 'Test', slug: 'test' }]
    mockServiceRole.mockReturnValue(makeSupabase(articles, null, { message: 'update error' }))
    await expect(publishHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── whatsapp-retry ────────────────────────────────────────────────────────────

import whatsappRetryHandler from '../../../server/api/cron/whatsapp-retry.post'

describe('POST /api/cron/whatsapp-retry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
    vi.mocked(fetch).mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
      ok: true,
    } as any)
  })

  it('calls verifyCronSecret', async () => {
    await whatsappRetryHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns retried:0 when no failed submissions', async () => {
    const result = await whatsappRetryHandler({} as any)
    expect(result).toMatchObject({ retried: 0 })
  })

  it('calls processBatch when there are failed submissions', async () => {
    const failedSubs = [{ id: 'sub-1', retry_count: 1 }]
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(failedSubs), ok: true } as any)
      .mockResolvedValue({ json: vi.fn().mockResolvedValue([]), ok: true } as any)
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await whatsappRetryHandler({} as any)
    expect(mockProcessBatch).toHaveBeenCalledWith(
      expect.objectContaining({ items: failedSubs, batchSize: 5 }),
    )
  })

  it('throws 500 when SUPABASE_URL is not configured', async () => {
    const origUrl = process.env.SUPABASE_URL
    process.env.SUPABASE_URL = ''
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'cron-secret',
      supabaseServiceRoleKey: '',
      public: {},
    }))
    try {
      await expect(whatsappRetryHandler({} as any)).rejects.toThrow()
    } finally {
      process.env.SUPABASE_URL = origUrl
      vi.stubGlobal('useRuntimeConfig', () => ({
        cronSecret: 'cron-secret',
        supabaseServiceRoleKey: 'test-key',
        public: {},
      }))
    }
  })

  it('marks permanently failed submissions (retry_count >= 3)', async () => {
    const failedSubs = [{ id: 'sub-1', retry_count: 1 }]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(failedSubs), ok: true } as any) // Initial query
      .mockResolvedValue({ json: vi.fn().mockResolvedValue([]), ok: true } as any) // Subsequent
    vi.mocked(fetch).mockImplementation(fetchMock as any)
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })

    const result = await whatsappRetryHandler({} as any)
    expect(result).toMatchObject({ retried: 1 })
    // The last fetch call is the PATCH to mark permanently_failed — check the body
    const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
    expect(lastCall?.[0]).toContain('retry_count=gte.3')
    const lastBody = JSON.parse((lastCall?.[1] as any)?.body || '{}')
    expect(lastBody.status).toBe('permanently_failed')
  })

  it('handles non-array response from fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue(null),
      ok: true,
    } as any)
    const result = await whatsappRetryHandler({} as any)
    expect(result).toMatchObject({ retried: 0 })
  })

  it('returns retried count and errors from processBatch', async () => {
    const failedSubs = [
      { id: 'sub-1', retry_count: 0 },
      { id: 'sub-2', retry_count: 1 },
    ]
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(failedSubs), ok: true } as any)
      .mockResolvedValue({ json: vi.fn().mockResolvedValue([]), ok: true } as any)
    mockProcessBatch.mockResolvedValue({ processed: 2, errors: 1 })

    const result = await whatsappRetryHandler({} as any)
    expect(result.retried).toBe(2)
    expect(result.errors).toBe(1)
  })

  it('has delayBetweenBatchesMs in processBatch call', async () => {
    const failedSubs = [{ id: 'sub-1', retry_count: 0 }]
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(failedSubs), ok: true } as any)
      .mockResolvedValue({ json: vi.fn().mockResolvedValue([]), ok: true } as any)
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })

    await whatsappRetryHandler({} as any)
    expect(mockProcessBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        batchSize: 5,
        delayBetweenBatchesMs: 2000,
      }),
    )
  })
})
