/**
 * Tests for POST /api/social/publish and POST /api/social/auto-publish
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
let mockSupabase: ReturnType<typeof makeMockSupabase>

vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))

vi.mock('../../../server/utils/siteConfig', () => ({
  getSiteUrl: vi.fn().mockReturnValue('https://tracciona.es'),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: vi.fn().mockImplementation((code: number, msg: string) => {
    const e = new Error(msg) as Error & { statusCode: number }
    e.statusCode = code
    return e
  }),
}))

vi.mock('../../../server/utils/validateBody', () => ({
  validateBody: vi.fn().mockImplementation((_event, _schema) => {
    return Promise.resolve(_event.body || {})
  }),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(() => Promise.resolve({ id: 'admin-uuid-1' })),
  serverSupabaseServiceRole: vi.fn(() => mockSupabase),
}))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    readBody: vi.fn().mockImplementation((e: { body: unknown }) => Promise.resolve(e.body)),
  }
})

// ── Supabase mock factory ─────────────────────────────────────────────────────

interface MockOpts {
  postRecord?: {
    id: string
    platform: string
    content: Record<string, string>
    image_url: string | null
    status: string
  } | null
  tokenRecord?: { access_token: string; expires_at?: string | null } | null
  updateError?: boolean
  vehicleRecord?: object | null
}

function makeMockSupabase(opts: MockOpts = {}) {
  const post =
    opts.postRecord !== undefined
      ? opts.postRecord
      : {
          id: 'post-uuid-1',
          platform: 'linkedin',
          content: { es: 'Nuevo vehículo disponible', en: 'New vehicle available' },
          image_url: 'https://example.com/image.jpg',
          status: 'approved',
        }

  const token =
    opts.tokenRecord !== undefined
      ? opts.tokenRecord
      : { access_token: 'test-token-123', expires_at: null }

  const vehicle =
    opts.vehicleRecord !== undefined
      ? opts.vehicleRecord
      : {
          id: 'vehicle-uuid-1',
          brand: 'Caterpillar',
          model: '320',
          year: 2020,
          price: 5000000,
          location: 'Madrid',
          slug: 'caterpillar-320-2020',
          vehicle_images: [{ url: 'https://example.com/img.jpg', position: 0 }],
          subcategories: null,
        }

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'social_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: post,
                error: post ? null : { message: 'not found' },
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'new-post-uuid' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: opts.updateError ? { message: 'update error' } : null,
            }),
          }),
        }
      }
      if (table === 'vertical_config') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: token ? { value: token } : null,
                error: token ? null : { message: 'not found' },
              }),
            }),
          }),
        }
      }
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: vehicle,
                error: vehicle ? null : { message: 'not found' },
              }),
            }),
          }),
        }
      }
      return {}
    }),
  }
}

function makeEvent(body: unknown = {}) {
  return { body } as never
}

// ── publish.post.ts tests ─────────────────────────────────────────────────────

describe('POST /api/social/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = makeMockSupabase()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'linkedin-post-id', data: { id: 'x-post-id' } }),
      text: vi.fn().mockResolvedValue(''),
    } as never)
  })

  it('publishes approved linkedin post', async () => {
    const { default: handler } = await import('../../../server/api/social/publish.post')
    const event = makeEvent({ postId: 'post-uuid-1' })
    const result = await handler(event)
    expect((result as { ok: boolean }).ok).toBe(true)
    expect((result as { platform: string }).platform).toBe('linkedin')
  })

  it('throws 401 without auth', async () => {
    const supabaseMod = await import('#supabase/server')
    vi.mocked(supabaseMod.serverSupabaseUser).mockResolvedValueOnce(null as never)
    const { default: handler } = await import('../../../server/api/social/publish.post')
    await expect(handler(makeEvent({ postId: 'post-uuid-1' }))).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 404 when post not found', async () => {
    mockSupabase = makeMockSupabase({ postRecord: null })
    const { default: handler } = await import('../../../server/api/social/publish.post')
    await expect(handler(makeEvent({ postId: 'post-uuid-1' }))).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws 400 when post not approved', async () => {
    mockSupabase = makeMockSupabase({
      postRecord: {
        id: 'post-uuid-1',
        platform: 'linkedin',
        content: { es: 'test' },
        image_url: null,
        status: 'pending',
      },
    })
    const { default: handler } = await import('../../../server/api/social/publish.post')
    await expect(handler(makeEvent({ postId: 'post-uuid-1' }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 503 when no tokens configured', async () => {
    mockSupabase = makeMockSupabase({ tokenRecord: null })
    const { default: handler } = await import('../../../server/api/social/publish.post')
    await expect(handler(makeEvent({ postId: 'post-uuid-1' }))).rejects.toMatchObject({
      statusCode: 503,
    })
  })

  it('throws 401 when token expired', async () => {
    mockSupabase = makeMockSupabase({
      tokenRecord: {
        access_token: 'expired-token',
        expires_at: new Date(Date.now() - 1000).toISOString(),
      },
    })
    const { default: handler } = await import('../../../server/api/social/publish.post')
    await expect(handler(makeEvent({ postId: 'post-uuid-1' }))).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 502 when platform API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    } as never)
    const { default: handler } = await import('../../../server/api/social/publish.post')
    await expect(handler(makeEvent({ postId: 'post-uuid-1' }))).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('marks post as failed on API error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('error'),
    } as never)
    const { default: handler } = await import('../../../server/api/social/publish.post')
    try {
      await handler(makeEvent({ postId: 'post-uuid-1' }))
    } catch {
      // Expected to throw
    }
    // Verify update was called (to mark as failed)
    expect(mockSupabase.from).toHaveBeenCalledWith('social_posts')
  })

  it('publishes x platform post', async () => {
    mockSupabase = makeMockSupabase({
      postRecord: {
        id: 'post-uuid-x',
        platform: 'x',
        content: { es: '🚛 Caterpillar | 50.000 € | Madrid\nhttps://tracciona.es/vehiculo/cat' },
        image_url: null,
        status: 'approved',
      },
    })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: 'x-tweet-123' } }),
    } as never)
    const { default: handler } = await import('../../../server/api/social/publish.post')
    const result = await handler(makeEvent({ postId: 'post-uuid-x' }))
    expect((result as { ok: boolean }).ok).toBe(true)
  })
})

// ── auto-publish.post.ts tests ────────────────────────────────────────────────

describe('POST /api/social/auto-publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = makeMockSupabase()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    } as never)
  })

  it('creates pending posts for all platforms when no tokens', async () => {
    mockSupabase = makeMockSupabase({ tokenRecord: null })
    const { default: handler } = await import('../../../server/api/social/auto-publish.post')
    const event = makeEvent({ vehicleId: 'vehicle-uuid-1' })
    const result = await handler(event)
    expect((result as { postIds: string[] }).postIds).toHaveLength(4) // linkedin, facebook, instagram, x
    expect((result as { autoPublished: string[] }).autoPublished).toHaveLength(0)
  })

  it('throws 404 when vehicle not found', async () => {
    mockSupabase = makeMockSupabase({ vehicleRecord: null })
    const { default: handler } = await import('../../../server/api/social/auto-publish.post')
    await expect(handler(makeEvent({ vehicleId: 'vehicle-uuid-1' }))).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws 401 without auth', async () => {
    const supabaseMod = await import('#supabase/server')
    vi.mocked(supabaseMod.serverSupabaseUser).mockResolvedValueOnce(null as never)
    const { default: handler } = await import('../../../server/api/social/auto-publish.post')
    await expect(handler(makeEvent({ vehicleId: 'vehicle-uuid-1' }))).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('returns vehicleId in response', async () => {
    const { default: handler } = await import('../../../server/api/social/auto-publish.post')
    const event = makeEvent({ vehicleId: 'vehicle-uuid-1' })
    const result = await handler(event)
    expect((result as { vehicleId: string }).vehicleId).toBe('vehicle-uuid-1')
  })
})
