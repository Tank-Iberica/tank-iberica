import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Shared mocks ──────────────────────────────────────────────────────────────

const { mockSafeError, mockServiceRole, mockSupabaseUser } = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  const mockSupabaseUser = vi.fn().mockResolvedValue(null)
  const mockServiceRole = vi.fn().mockReturnValue({ from: vi.fn() })
  return { mockSafeError, mockServiceRole, mockSupabaseUser }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  setResponseHeader: vi.fn(),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))

// ── GET /api/dealer/api-key ───────────────────────────────────────────────────

describe('GET /api/dealer/api-key', () => {
  let getHandler: Function

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('h3', () => ({ defineEventHandler: (fn: Function) => fn, setResponseHeader: vi.fn() }))
    vi.mock('#supabase/server', () => ({
      serverSupabaseServiceRole: mockServiceRole,
      serverSupabaseUser: mockSupabaseUser,
    }))
    vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))

    const mod = await import('../../../server/api/dealer/api-key.get')
    getHandler = mod.default as Function
  })

  it('throws 401 when user is not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(getHandler({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 404 when dealer not found for user', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@test.com' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    })
    await expect(getHandler({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns masked API key when subscription exists', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'dealer@test.com' })
    let callCount = 0
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'dealer-1', subscription_type: 'premium' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { api_key: 'trk_abc123456789012345678901234567890', rate_limit_daily: 5000, active: true },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        // usage count
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 42, error: null }),
            }),
          }),
        }
      }),
    })

    const result = await getHandler({})
    expect(result.hasKey).toBe(true)
    expect(result.apiKey).toContain('trk_')
    expect(result.apiKey).toContain('*')
    expect(result.plan).toBe('premium')
    expect(result.rateLimit).toBe(5000)
    expect(result.usageToday).toBe(42)
  })

  it('returns null apiKey when no subscription', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'dealer@test.com' })
    let callCount = 0
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'dealer-1', subscription_type: 'basic' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }),
    })
    const result = await getHandler({})
    expect(result.hasKey).toBe(false)
    expect(result.apiKey).toBeNull()
    expect(result.usageToday).toBe(0)
  })

  it('uses free plan rate limit (50) for unknown plan', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'dealer@test.com' })
    let callCount = 0
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'dealer-1', subscription_type: null },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }),
    })
    const result = await getHandler({})
    expect(result.rateLimit).toBe(50)
    expect(result.plan).toBe('free')
  })
})

// ── POST /api/dealer/api-key ──────────────────────────────────────────────────

describe('POST /api/dealer/api-key', () => {
  let postHandler: Function

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mock('h3', () => ({ defineEventHandler: (fn: Function) => fn, setResponseHeader: vi.fn() }))
    vi.mock('#supabase/server', () => ({
      serverSupabaseServiceRole: mockServiceRole,
      serverSupabaseUser: mockSupabaseUser,
    }))
    vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))

    const mod = await import('../../../server/api/dealer/api-key.post')
    postHandler = mod.default as Function
  })

  it('throws 401 when user is not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(postHandler({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 404 when dealer not found', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@test.com' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    })
    await expect(postHandler({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when dealer is on free plan', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'free@test.com' })
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'dealer-1', company_name: 'Test', subscription_type: 'free' },
              error: null,
            }),
          }),
        }),
      }),
    })
    await expect(postHandler({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('generates and returns new API key for basic plan', async () => {
    mockSupabaseUser.mockResolvedValue({
      id: 'user-1',
      email: 'dealer@test.com',
      user_metadata: { display_name: 'Test Dealer' },
    })
    let callCount = 0
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'dealer-1', company_name: 'Trucks SL', subscription_type: 'basic' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (callCount === 2) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
    })

    const result = await postHandler({})
    expect(result.apiKey).toMatch(/^trk_/)
    expect(result.plan).toBe('basic')
    expect(result.rateLimit).toBe(500)
  })

  it('throws 500 when insert fails', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'dealer@test.com' })
    let callCount = 0
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'dealer-1', company_name: { es: 'Test' }, subscription_type: 'premium' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (callCount === 2) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }
      }),
    })
    await expect(postHandler({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('handles JSONB company_name object (extracts es locale)', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'dealer@test.com' })
    let callCount = 0
    let insertedData: any
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'dealer-1', company_name: { es: 'Camiones SA', en: 'Trucks SA' }, subscription_type: 'founding' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (callCount === 2) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        return {
          insert: vi.fn().mockImplementation((data: any) => {
            insertedData = data
            return Promise.resolve({ data: null, error: null })
          }),
        }
      }),
    })
    const result = await postHandler({})
    expect(result.plan).toBe('founding')
    expect(result.rateLimit).toBe(5000)
    expect(insertedData?.company_name).toBe('Camiones SA')
  })
})
