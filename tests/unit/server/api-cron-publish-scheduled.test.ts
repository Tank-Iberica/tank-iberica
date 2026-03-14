import { describe, it, expect, vi, beforeEach } from 'vitest'

/* ---------- mocks ---------- */
const mockVerifyCronSecret = vi.fn()
vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: (...args: unknown[]) => mockVerifyCronSecret(...args),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  createError: (opts: { statusCode: number; message?: string; statusMessage?: string }) => {
    const e = new Error(opts.message || opts.statusMessage || '') as Error & { statusCode: number }
    e.statusCode = opts.statusCode
    return e
  },
}))

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockLte = vi.fn()
const mockNot = vi.fn()
const mockUpdate = vi.fn()
const mockIn = vi.fn()

const supabaseChain: Record<string, Function> = {
  from: mockFrom,
  select: mockSelect,
  eq: mockEq,
  lte: mockLte,
  not: mockNot,
  update: mockUpdate,
  in: mockIn,
}

// Each method returns the chain for chaining
for (const key of Object.keys(supabaseChain)) {
  ;(supabaseChain[key] as ReturnType<typeof vi.fn>).mockReturnValue(supabaseChain)
}

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => supabaseChain,
}))

// safeError is auto-imported by Nuxt — provide global mock
vi.stubGlobal('safeError', (statusCode: number, message: string) => {
  const e = new Error(message) as Error & { statusCode: number }
  e.statusCode = statusCode
  return e
})

import handler from '../../../server/api/cron/publish-scheduled.post'

describe('publish-scheduled.post', () => {
  const event = {}

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chain returns
    for (const key of Object.keys(supabaseChain)) {
      ;(supabaseChain[key] as ReturnType<typeof vi.fn>).mockReturnValue(supabaseChain)
    }
  })

  it('calls verifyCronSecret', async () => {
    // No articles, no vehicles
    mockLte.mockResolvedValueOnce({ data: [], error: null })
    mockLte.mockResolvedValueOnce({ data: [], error: null })

    await handler(event)
    expect(mockVerifyCronSecret).toHaveBeenCalledWith(event)
  })

  it('returns zero counts when nothing is scheduled', async () => {
    mockLte.mockResolvedValueOnce({ data: [], error: null })
    mockLte.mockResolvedValueOnce({ data: [], error: null })

    const result = await handler(event)
    expect(result).toEqual({
      articles: { published: 0 },
      vehicles: { published: 0 },
      total: 0,
    })
  })

  it('publishes scheduled articles', async () => {
    const articles = [
      { id: 'art-1', title_es: 'Test Article', slug: 'test-article' },
      { id: 'art-2', title_es: 'Another Article', slug: 'another' },
    ]
    // First lte call = articles query
    mockLte.mockResolvedValueOnce({ data: articles, error: null })
    // update().in() for articles
    mockIn.mockResolvedValueOnce({ error: null })
    // Second lte call = vehicles query
    mockLte.mockResolvedValueOnce({ data: [], error: null })

    const result = await handler(event)
    expect(result.articles.published).toBe(2)
    expect(result.vehicles.published).toBe(0)
    expect(result.total).toBe(2)
  })

  it('publishes scheduled vehicles', async () => {
    // No articles
    mockLte.mockResolvedValueOnce({ data: [], error: null })
    // Vehicles
    const vehicles = [
      { id: 'veh-1', title_es: 'Truck 1', slug: 'truck-1' },
    ]
    mockLte.mockResolvedValueOnce({ data: vehicles, error: null })
    mockIn.mockResolvedValueOnce({ error: null })

    const result = await handler(event)
    expect(result.articles.published).toBe(0)
    expect(result.vehicles.published).toBe(1)
    expect(result.total).toBe(1)
  })

  it('publishes both articles and vehicles', async () => {
    const articles = [{ id: 'art-1', title_es: 'Article', slug: 'article' }]
    const vehicles = [{ id: 'veh-1', title_es: 'Vehicle', slug: 'vehicle' }]

    mockLte.mockResolvedValueOnce({ data: articles, error: null })
    mockIn.mockResolvedValueOnce({ error: null })
    mockLte.mockResolvedValueOnce({ data: vehicles, error: null })
    mockIn.mockResolvedValueOnce({ error: null })

    const result = await handler(event)
    expect(result.articles.published).toBe(1)
    expect(result.vehicles.published).toBe(1)
    expect(result.total).toBe(2)
  })

  it('throws on article fetch error', async () => {
    mockLte.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    await expect(handler(event)).rejects.toThrow('Fetch scheduled articles failed')
  })

  it('throws on article update error', async () => {
    const articles = [{ id: 'art-1', title_es: 'A', slug: 'a' }]
    mockLte.mockResolvedValueOnce({ data: articles, error: null })
    mockIn.mockResolvedValueOnce({ error: { message: 'Update failed' } })

    await expect(handler(event)).rejects.toThrow('Update scheduled articles failed')
  })

  it('throws on vehicle fetch error', async () => {
    mockLte.mockResolvedValueOnce({ data: [], error: null })
    mockLte.mockResolvedValueOnce({ data: null, error: { message: 'Vehicle DB error' } })

    await expect(handler(event)).rejects.toThrow('Fetch scheduled vehicles failed')
  })

  it('throws on vehicle update error', async () => {
    mockLte.mockResolvedValueOnce({ data: [], error: null })
    const vehicles = [{ id: 'veh-1', title_es: 'V', slug: 'v' }]
    mockLte.mockResolvedValueOnce({ data: vehicles, error: null })
    mockIn.mockResolvedValueOnce({ error: { message: 'Vehicle update failed' } })

    await expect(handler(event)).rejects.toThrow('Update scheduled vehicles failed')
  })

  it('updates articles with correct status fields', async () => {
    const articles = [{ id: 'art-1', title_es: 'A', slug: 'a' }]
    mockLte.mockResolvedValueOnce({ data: articles, error: null })
    mockIn.mockResolvedValueOnce({ error: null })
    mockLte.mockResolvedValueOnce({ data: [], error: null })

    await handler(event)

    // Check that update was called with status: 'published'
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    )
    // Check that in was called with the article IDs
    expect(mockIn).toHaveBeenCalledWith('id', ['art-1'])
  })

  it('clears scheduled_publish_at on vehicle publish', async () => {
    mockLte.mockResolvedValueOnce({ data: [], error: null })
    const vehicles = [{ id: 'veh-1', title_es: 'V', slug: 'v' }]
    mockLte.mockResolvedValueOnce({ data: vehicles, error: null })
    mockIn.mockResolvedValueOnce({ error: null })

    await handler(event)

    // The second update call should include scheduled_publish_at: null
    const updateCalls = mockUpdate.mock.calls
    const vehicleUpdateCall = updateCalls.find((call: unknown[]) =>
      (call[0] as Record<string, unknown>).scheduled_publish_at === null,
    )
    expect(vehicleUpdateCall).toBeDefined()
  })
})
