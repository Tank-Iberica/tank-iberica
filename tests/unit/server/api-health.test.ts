import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetQuery, mockVerifyCronSecret, mockServiceRole } = vi.hoisted(() => {
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
    mockVerifyCronSecret: vi.fn(),
    mockServiceRole: vi.fn().mockReturnValue({ from: mockFrom, auth: mockAuth }),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: mockGetQuery,
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
    mockVerifyCronSecret.mockReturnValue(undefined)
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
})
