import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  mockReadBody,
  mockGetHeader,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockProcessBatch,
  mockLogger,
  mockNormalizePlan,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockReadBody: vi.fn().mockResolvedValue({ vehicle_id: 'v-1' }),
    mockGetHeader: vi.fn().mockReturnValue('test-secret'),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
    mockProcessBatch: vi.fn().mockResolvedValue({ processed: 0, errors: 0 }),
    mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    mockNormalizePlan: vi.fn((p: string) => p),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getHeader: mockGetHeader,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/alertMatcher', () => ({
  matchesVehicle: vi.fn().mockReturnValue(true),
}))
vi.mock('../../utils/alertMatcher', () => ({
  matchesVehicle: vi.fn().mockReturnValue(true),
}))
vi.mock('../../../server/utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))
vi.mock('../../utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))
vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))
vi.mock('../../utils/logger', () => ({ logger: mockLogger }))
vi.mock('../../../server/services/subscriptionLimits', () => ({
  normalizePlan: mockNormalizePlan,
}))
vi.mock('../../services/subscriptionLimits', () => ({
  normalizePlan: mockNormalizePlan,
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  internalApiSecret: 'test-secret',
  cronSecret: 'test-secret',
  public: {},
}))
const mockFetch = vi.fn().mockResolvedValue({ ok: true })
vi.stubGlobal('$fetch', mockFetch)

import handler from '../../../server/api/alerts/instant.post'

// -- Supabase mock helpers --------------------------------------------------

const vehicle = {
  id: 'v-1',
  brand: 'Mercedes-Benz',
  model: 'Actros',
  price: 45000,
  year: 2020,
  km: 280000,
  category_id: 'cat-1',
  subcategory_id: 'sub-1',
  location_country: 'ES',
  location_region: 'León',
  slug: 'mercedes-benz-actros',
}

const subs = [
  { user_id: 'user-pro-1', plan: 'premium' },
  { user_id: 'user-pro-2', plan: 'founding' },
  { user_id: 'user-basic', plan: 'basic' },
]

const alerts = [
  {
    id: 'alert-1',
    user_id: 'user-pro-1',
    filters: { brand: 'Mercedes' },
    frequency: 'instant',
    last_sent_at: null,
    channels: ['email'],
  },
  {
    id: 'alert-2',
    user_id: 'user-pro-2',
    filters: {},
    frequency: 'instant',
    last_sent_at: null,
    channels: ['email', 'push'],
  },
]

const users = [
  { id: 'user-pro-1', email: 'pro1@test.com', name: 'Pro User 1', lang: 'es', phone: null },
  {
    id: 'user-pro-2',
    email: 'pro2@test.com',
    name: 'Pro User 2',
    lang: 'en',
    phone: '+34600000000',
  },
]

function makeChain(data: unknown, error: unknown = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    limit: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data : [data], error }),
    update: vi.fn().mockReturnThis(),
  }
  // For non-single queries
  chain.then = (res: Function) => Promise.resolve({ data, error }).then(res)
  return chain
}

function makeSupabase(options: {
  vehicle?: unknown
  vehicleErr?: unknown
  subs?: unknown[]
  alerts?: unknown[]
  alertsErr?: unknown
  users?: unknown[]
}) {
  let callCount = 0
  return {
    from: vi.fn((table: string) => {
      if (table === 'vehicles') {
        return makeChain(options.vehicle ?? vehicle, options.vehicleErr ?? null)
      }
      if (table === 'subscriptions') {
        const chain = makeChain(options.subs ?? subs)
        chain.eq = vi.fn().mockReturnValue({
          data: options.subs ?? subs,
          error: null,
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({ data: options.subs ?? subs, error: null }),
        })
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: options.subs ?? subs, error: null }),
          }),
        }
      }
      if (table === 'search_alerts') {
        callCount++
        if (callCount <= 1) {
          // First call: fetch alerts
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: options.alerts ?? alerts,
                    error: options.alertsErr ?? null,
                  }),
                }),
              }),
            }),
          }
        }
        // Second call: update last_sent_at
        return {
          update: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: options.users ?? users,
              error: null,
            }),
          }),
        }
      }
      return makeChain(null)
    }),
  }
}

const mockEvent = {} as any

describe('POST /api/alerts/instant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({ vehicle_id: 'v-1' })
    mockGetHeader.mockReturnValue('test-secret')
    mockNormalizePlan.mockImplementation((p: string) => p)
    mockProcessBatch.mockImplementation(async ({ items, processor }: any) => {
      for (const item of items) {
        await processor(item)
      }
      return { processed: items.length, errors: 0 }
    })
  })

  it('returns 401 when no auth provided', async () => {
    mockGetHeader.mockReturnValue(null)
    mockSupabaseUser.mockResolvedValueOnce(null)

    await expect(handler(mockEvent)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(401, expect.any(String))
  })

  it('returns 400 when vehicle_id is missing', async () => {
    mockReadBody.mockResolvedValueOnce({})

    await expect(handler(mockEvent)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(400, expect.any(String))
  })

  it('returns skipped when vehicle not found', async () => {
    const sb = makeSupabase({ vehicle: null, vehicleErr: { message: 'not found' } })
    mockServiceRole.mockReturnValue(sb)

    const result = await handler(mockEvent)
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('vehicle_not_found_or_not_published')
  })

  it('returns no_active_subscriptions when no subs', async () => {
    const sb = makeSupabase({ subs: [] })
    // Override vehicle chain to return single
    sb.from = vi.fn((table: string) => {
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      return makeChain(null)
    })
    mockServiceRole.mockReturnValue(sb)

    const result = await handler(mockEvent)
    expect(result.reason).toBe('no_active_subscriptions')
  })

  it('returns no_pro_users when all basic subs', async () => {
    mockNormalizePlan.mockReturnValue('basic')
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ user_id: 'u1', plan: 'basic' }],
                error: null,
              }),
            }),
          }
        }
        return makeChain(null)
      }),
    }
    mockServiceRole.mockReturnValue(sb)

    const result = await handler(mockEvent)
    expect(result.reason).toBe('no_pro_users')
  })

  it('accepts authenticated user when no internal secret', async () => {
    mockGetHeader.mockReturnValue(null)
    mockSupabaseUser.mockResolvedValueOnce({ id: 'user-1' })

    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return makeChain(null)
      }),
    }
    mockServiceRole.mockReturnValue(sb)

    const result = await handler(mockEvent)
    expect(result.reason).toBe('no_active_subscriptions')
    // Did NOT throw 401
  })

  it('returns no_active_alerts when no alerts match pro users', async () => {
    mockNormalizePlan.mockImplementation((p: string) => p)
    let alertCallCount = 0
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: subs, error: null }),
            }),
          }
        }
        if (table === 'search_alerts') {
          alertCallCount++
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }
        }
        return makeChain(null)
      }),
    }
    mockServiceRole.mockReturnValue(sb)

    const result = await handler(mockEvent)
    expect(result.reason).toBe('no_active_alerts')
  })

  it('sends email notifications for matched alerts', async () => {
    mockNormalizePlan.mockImplementation((p: string) => p)
    // We need matchesVehicle to return true (already mocked at top)
    let alertCallCount = 0
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: subs, error: null }),
            }),
          }
        }
        if (table === 'search_alerts') {
          alertCallCount++
          if (alertCallCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: alerts, error: null }),
                  }),
                }),
              }),
            }
          }
          // Update call
          return {
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: users, error: null }),
            }),
          }
        }
        return makeChain(null)
      }),
    }
    mockServiceRole.mockReturnValue(sb)

    const result = await handler(mockEvent)
    expect(result.matched).toBeGreaterThan(0)
    expect(result.users).toBeGreaterThan(0)
    // $fetch called for email and push
    expect(mockFetch).toHaveBeenCalled()
  })

  it('skips alerts on cooldown (last_sent_at < 60s ago)', async () => {
    mockNormalizePlan.mockImplementation((p: string) => p)
    const recentAlerts = alerts.map((a) => ({
      ...a,
      last_sent_at: new Date(Date.now() - 30_000).toISOString(), // 30s ago
    }))

    let alertCallCount = 0
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: subs, error: null }),
            }),
          }
        }
        if (table === 'search_alerts') {
          alertCallCount++
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: recentAlerts, error: null }),
                }),
              }),
            }),
          }
        }
        return makeChain(null)
      }),
    }
    mockServiceRole.mockReturnValue(sb)

    const result = await handler(mockEvent)
    expect(result.reason).toBe('all_on_cooldown')
    expect(result.notified).toBe(0)
  })

  it('handles alert fetch error gracefully', async () => {
    mockNormalizePlan.mockImplementation((p: string) => p)
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: vehicle, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: subs, error: null }),
            }),
          }
        }
        if (table === 'search_alerts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'DB error' },
                  }),
                }),
              }),
            }),
          }
        }
        return makeChain(null)
      }),
    }
    mockServiceRole.mockReturnValue(sb)

    await expect(handler(mockEvent)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(500, expect.stringContaining('DB error'))
  })
})
