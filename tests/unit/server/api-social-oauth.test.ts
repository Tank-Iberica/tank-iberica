/**
 * Tests for /api/social/oauth/connect and /api/social/oauth/callback
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
let mockSupabase: ReturnType<typeof makeMockSupabase>

vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))

vi.mock('../../../server/utils/siteConfig', () => ({
  getSiteUrl: vi.fn().mockReturnValue('https://tracciona.es'),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(() => Promise.resolve({ id: 'admin-uuid-1', email: 'admin@test.com' })),
  serverSupabaseServiceRole: vi.fn(() => mockSupabase),
}))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    getQuery: vi.fn(),
    sendRedirect: vi.fn().mockImplementation((_event, url) => ({ redirected: true, url })),
    createError: vi
      .fn()
      .mockImplementation(({ statusCode, message }: { statusCode: number; message: string }) => {
        const e = new Error(message) as Error & { statusCode: number }
        e.statusCode = statusCode
        return e
      }),
  }
})

// ── Supabase mock factory ─────────────────────────────────────────────────────

interface MockOpts {
  stateRecord?: {
    platform: string
    admin_id: string
    redirect_to: string
    expires_at: string
  } | null
  stateError?: boolean
  upsertError?: boolean
  tokenData?: { access_token: string; expires_in?: number } | null
}

function makeMockSupabase(opts: MockOpts = {}) {
  const stateRecord =
    opts.stateRecord !== undefined
      ? opts.stateRecord
      : {
          platform: 'linkedin',
          admin_id: 'admin-uuid-1',
          redirect_to: '/admin/social',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'social_oauth_states') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: opts.stateError ? null : stateRecord,
                error: opts.stateError ? { message: 'not found' } : null,
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      if (table === 'vertical_config') {
        return {
          upsert: vi
            .fn()
            .mockResolvedValue({ error: opts.upsertError ? { message: 'upsert error' } : null }),
        }
      }
      return {}
    }),
  }
}

function makeEvent(queryOverrides: Record<string, string> = {}) {
  return {} as never
}

// ── connect.get.ts tests ──────────────────────────────────────────────────────

describe('GET /api/social/oauth/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = makeMockSupabase()
    process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id'
    process.env.FACEBOOK_APP_ID = 'test-facebook-app-id'
    process.env.X_CLIENT_ID = 'test-x-client-id'
  })

  it('returns redirectUrl for linkedin', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'linkedin' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    const result = await handler(makeEvent())
    expect((result as { redirectUrl: string }).redirectUrl).toContain(
      'linkedin.com/oauth/v2/authorization',
    )
  })

  it('returns redirectUrl for x', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'x' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    const result = await handler(makeEvent())
    expect((result as { redirectUrl: string }).redirectUrl).toContain('twitter.com/i/oauth2/authorize')
  })

  it('returns redirectUrl for facebook', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'facebook' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    const result = await handler(makeEvent())
    expect((result as { redirectUrl: string }).redirectUrl).toContain('facebook.com/dialog/oauth')
  })

  it('throws 400 for invalid platform', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'tiktok' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 503 when client ID not configured', async () => {
    delete process.env.LINKEDIN_CLIENT_ID
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'linkedin' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 503 })
  })

  it('throws 401 when no admin user', async () => {
    const supabaseMod = await import('#supabase/server')
    vi.mocked(supabaseMod.serverSupabaseUser).mockResolvedValueOnce(null as never)
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'linkedin' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('includes state param in redirect URL', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'linkedin' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    const result = await handler(makeEvent())
    const url = new URL((result as { redirectUrl: string }).redirectUrl)
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{32}$/)
  })

  it('stores state in social_oauth_states', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ platform: 'linkedin' })
    const { default: handler } = await import('../../../server/api/social/oauth/connect.get')
    await handler(makeEvent())
    expect(mockSupabase.from).toHaveBeenCalledWith('social_oauth_states')
  })
})

// ── callback.get.ts tests ─────────────────────────────────────────────────────

describe('GET /api/social/oauth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = makeMockSupabase()
    process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id'
    process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-secret'

    // Mock fetch for token exchange
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue({ access_token: 'test-access-token', expires_in: 3600 }),
    } as never)
  })

  it('redirects with oauth_error on user-denied', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ error: 'access_denied', error_description: 'User denied' })
    const { default: handler } = await import('../../../server/api/social/oauth/callback.get')
    const result = await handler(makeEvent())
    expect((result as { url: string }).url).toContain('oauth_error=')
  })

  it('redirects with invalid_state on bad state', async () => {
    mockSupabase = makeMockSupabase({ stateError: true })
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ code: 'abc123', state: 'invalid-state' })
    const { default: handler } = await import('../../../server/api/social/oauth/callback.get')
    const result = await handler(makeEvent())
    expect((result as { url: string }).url).toContain('oauth_error=invalid_state')
  })

  it('redirects with state_expired on expired state', async () => {
    mockSupabase = makeMockSupabase({
      stateRecord: {
        platform: 'linkedin',
        admin_id: 'admin-uuid-1',
        redirect_to: '/admin/social',
        expires_at: new Date(Date.now() - 1000).toISOString(), // expired
      },
    })
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ code: 'abc123', state: 'valid-state' })
    const { default: handler } = await import('../../../server/api/social/oauth/callback.get')
    const result = await handler(makeEvent())
    expect((result as { url: string }).url).toContain('oauth_error=state_expired')
  })

  it('redirects with oauth_success on valid flow', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ code: 'valid-code', state: 'valid-state' })
    const { default: handler } = await import('../../../server/api/social/oauth/callback.get')
    const result = await handler(makeEvent())
    expect((result as { url: string }).url).toContain('oauth_success=linkedin')
  })

  it('stores tokens in vertical_config on success', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({ code: 'valid-code', state: 'valid-state' })
    const { default: handler } = await import('../../../server/api/social/oauth/callback.get')
    await handler(makeEvent())
    expect(mockSupabase.from).toHaveBeenCalledWith('vertical_config')
  })

  it('redirects with missing_params when no code/state', async () => {
    const h3 = await import('h3')
    vi.mocked(h3.getQuery).mockReturnValue({})
    const { default: handler } = await import('../../../server/api/social/oauth/callback.get')
    const result = await handler(makeEvent())
    expect((result as { url: string }).url).toContain('oauth_error=missing_params')
  })
})
