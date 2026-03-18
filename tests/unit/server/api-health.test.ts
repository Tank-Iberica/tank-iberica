import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetQuery, mockGetHeader, mockVerifyCronSecret, mockServiceRole } = vi.hoisted(() => {
  const mockAuth = {
    admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }) },
  }
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        throwOnError: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })
  return {
    mockGetQuery: vi.fn(),
    mockGetHeader: vi.fn(),
    mockVerifyCronSecret: vi.fn(),
    mockServiceRole: vi.fn().mockReturnValue({ from: mockFrom, auth: mockAuth }),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: mockGetQuery,
  getHeader: mockGetHeader,
  setHeader: vi.fn(),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))

import handler from '../../../server/api/health.get'

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('setResponseStatus', vi.fn())
    vi.stubGlobal('setHeader', vi.fn())
    mockGetQuery.mockReturnValue({})
    mockGetHeader.mockReturnValue(undefined)
    mockVerifyCronSecret.mockReturnValue(undefined)
    delete process.env.HEALTH_TOKEN
    // Restore default supabase mock (tests that override it pollute later tests)
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            throwOnError: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      auth: {
        admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }) },
      },
    })
  })

  it('light mode returns status:ok with timestamp, uptime, version', async () => {
    mockGetQuery.mockReturnValue({}) // no deep param
    const result = await handler({})
    expect(result).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
      version: expect.any(String),
    })
  })

  it('light mode does not call verifyCronSecret', async () => {
    mockGetQuery.mockReturnValue({})
    await handler({})
    expect(mockVerifyCronSecret).not.toHaveBeenCalled()
  })

  it('light mode does not call supabase', async () => {
    mockGetQuery.mockReturnValue({})
    await handler({})
    expect(mockServiceRole).not.toHaveBeenCalled()
  })

  it('deep mode calls verifyCronSecret', async () => {
    mockGetQuery.mockReturnValue({ deep: '1' })
    await handler({})
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('deep mode returns db:connected and auth:ok when supabase works', async () => {
    mockGetQuery.mockReturnValue({ deep: '1' })
    const result = await handler({})
    expect(result).toMatchObject({
      status: 'ok',
      db: 'connected',
      auth: 'ok',
    })
  })

  it('deep mode triggers DB timeout reject when DB query hangs', async () => {
    vi.useFakeTimers()
    mockGetQuery.mockReturnValue({ deep: '1' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            throwOnError: vi.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      }),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        },
      },
    })
    const promise = handler({})
    await vi.advanceTimersByTimeAsync(4000)
    const result = await promise
    expect(result).toMatchObject({ db: 'error' })
    vi.useRealTimers()
  })

  it('deep mode returns db:error when supabase throws', async () => {
    mockGetQuery.mockReturnValue({ deep: '1' })
    // Make the DB ping throw
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            throwOnError: vi.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
        },
      },
    })
    const result = await handler({})
    expect(result).toMatchObject({ db: 'error' })
    expect(result.status).toBe('degraded')
  })

  it('deep mode skips external checks when env vars absent', async () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.NUXT_CLOUDINARY_CLOUD_NAME
    delete process.env.RESEND_API_KEY
    mockGetQuery.mockReturnValue({ deep: '1' })
    const result = await handler({})
    // No external checks means core-only status
    expect(result.status).toBe('ok')
    expect(result.db).toBe('connected')
    expect(result.auth).toBe('ok')
  })

  it('deep mode returns degraded when external service fails but core ok', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
    // $fetch.raw will throw in test env (not a real network call)
    mockGetQuery.mockReturnValue({ deep: '1' })
    const result = await handler({})
    // Core (db+auth) is ok, but external fails → degraded
    expect(result.status).toBe('degraded')
    expect(result.db).toBe('connected')
    expect(result.auth).toBe('ok')
    delete process.env.STRIPE_SECRET_KEY
  })

  // ─── #84 — HEALTH_TOKEN ─────────────────────────────────────────────────

  it('deep mode accepts HEALTH_TOKEN via x-health-token header', async () => {
    process.env.HEALTH_TOKEN = 'my-health-secret'
    mockGetQuery.mockReturnValue({ deep: '1' })
    mockGetHeader.mockImplementation((_e: unknown, name: string) => {
      if (name === 'x-health-token') return 'my-health-secret'
      return undefined
    })
    const result = await handler({})
    expect(result.status).toBe('ok')
    // Should NOT fall back to verifyCronSecret
    expect(mockVerifyCronSecret).not.toHaveBeenCalled()
  })

  it('deep mode accepts HEALTH_TOKEN via Bearer authorization', async () => {
    process.env.HEALTH_TOKEN = 'my-health-secret'
    mockGetQuery.mockReturnValue({ deep: '1' })
    mockGetHeader.mockImplementation((_e: unknown, name: string) => {
      if (name === 'authorization') return 'Bearer my-health-secret'
      return undefined
    })
    const result = await handler({})
    expect(result.status).toBe('ok')
    expect(mockVerifyCronSecret).not.toHaveBeenCalled()
  })

  it('deep mode falls back to cronSecret when HEALTH_TOKEN not set', async () => {
    // HEALTH_TOKEN not set (deleted in beforeEach)
    mockGetQuery.mockReturnValue({ deep: '1' })
    await handler({})
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('deep mode falls back to cronSecret when HEALTH_TOKEN header wrong', async () => {
    process.env.HEALTH_TOKEN = 'my-health-secret'
    mockGetQuery.mockReturnValue({ deep: '1' })
    mockGetHeader.mockReturnValue('wrong-token')
    await handler({})
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })
})
