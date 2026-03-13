import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  mockReadBody,
  mockSafeError,
  mockServiceRole,
  mockVerifyCronSecret,
  mockProcessBatch,
  mockLogger,
} = vi.hoisted(() => {
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
    mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
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
vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))
vi.mock('../../utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))
vi.mock('../../../server/utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))
vi.mock('../../utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))
vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))
vi.mock('../../utils/logger', () => ({ logger: mockLogger }))

vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'cron-secret', public: {} }))
const mockFetch = vi.fn().mockResolvedValue({ ok: true })
vi.stubGlobal('$fetch', mockFetch)

import handler, { effectiveFrequency } from '../../../server/api/cron/search-alerts.post'

function makeSupabase(alerts: unknown[], alertsError: unknown = null) {
  // subscriptions query resolves via chain.then (no .limit() terminal)
  // default to 'premium' so existing frequency tests are unaffected by tier enforcement
  const subsData = (alerts as Array<{ user_id?: string }>)
    .filter((a) => a.user_id)
    .map((a) => ({ user_id: a.user_id, plan: 'premium' }))

  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: alerts, error: alertsError }),
    then: (r: (v: unknown) => void) => Promise.resolve({ data: subsData, error: null }).then(r),
    catch: (r: (v: unknown) => void) => Promise.resolve({ data: subsData, error: null }).catch(r),
  }
  return { from: vi.fn().mockReturnValue(chain) }
}

describe('POST /api/cron/search-alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([]))
    await handler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns empty result when no alerts found', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([]))
    const result = await handler({} as any)
    expect(result).toMatchObject({ alertsProcessed: 0, emailsSent: 0 })
    expect(result.timestamp).toBeTruthy()
  })

  it('returns empty result when alerts is null', async () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockServiceRole.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
    const result = await handler({} as any)
    expect(result).toMatchObject({ alertsProcessed: 0, emailsSent: 0 })
  })

  it('throws 500 when DB query fails', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([], { message: 'DB error' }))
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('calls processBatch when alerts exist', async () => {
    const alerts = [
      {
        id: 'alert-1',
        user_id: 'user-1',
        filters: { brand: 'Volvo' },
        frequency: 'daily',
        last_sent_at: null,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await handler({} as any)
    expect(mockProcessBatch).toHaveBeenCalledWith(
      expect.objectContaining({ items: alerts, batchSize: 50 }),
    )
  })

  it('returns batchResult in response', async () => {
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'instant',
        last_sent_at: null,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    const result = await handler({} as any)
    expect(result).toHaveProperty('batchResult')
  })

  it('filters out ineligible alerts before batch processing', async () => {
    const recentDate = new Date(Date.now() - 3600 * 1000).toISOString() // 1 hour ago
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'daily',
        last_sent_at: recentDate,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
    await handler({} as any)
    // processBatch should be called with empty eligible alerts
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(0)
  })

  it('passes eligible instant alerts to processBatch', async () => {
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: { brand: 'Volvo' },
        frequency: 'instant',
        last_sent_at: null,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(1)
    expect(batchCall.items[0].id).toBe('a1')
  })

  it('passes eligible weekly alerts (last_sent > 7d ago)', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'weekly',
        last_sent_at: tenDaysAgo,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(1)
  })

  it('treats null frequency as daily', async () => {
    const alerts = [
      { id: 'a1', user_id: 'u1', filters: {}, frequency: null, last_sent_at: null, active: true },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(1)
  })

  it('filters out unknown frequency type', async () => {
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'monthly',
        last_sent_at: null,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(0)
  })

  it('instant alert is ineligible if last sent < 60s ago', async () => {
    const thirtySecsAgo = new Date(Date.now() - 30_000).toISOString()
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'instant',
        last_sent_at: thirtySecsAgo,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(0)
  })

  it('instant alert is eligible if last sent > 60s ago', async () => {
    const twoMinsAgo = new Date(Date.now() - 120_000).toISOString()
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'instant',
        last_sent_at: twoMinsAgo,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(1)
  })

  it('weekly alert is ineligible if last sent < 7d ago', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'weekly',
        last_sent_at: threeDaysAgo,
        active: true,
      },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(0)
  })

  it('handles readBody failure gracefully', async () => {
    mockReadBody.mockRejectedValueOnce(new Error('parse error'))
    mockServiceRole.mockReturnValue(makeSupabase([]))
    const result = await handler({} as any)
    expect(result).toMatchObject({ alertsProcessed: 0, emailsSent: 0 })
  })

  it('mixes eligible and ineligible alerts, only eligible reach processor', async () => {
    const recentDate = new Date(Date.now() - 3600 * 1000).toISOString() // 1h ago
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'daily',
        last_sent_at: recentDate,
        active: true,
      }, // ineligible
      {
        id: 'a2',
        user_id: 'u2',
        filters: {},
        frequency: 'daily',
        last_sent_at: null,
        active: true,
      }, // eligible
      {
        id: 'a3',
        user_id: 'u3',
        filters: {},
        frequency: 'monthly',
        last_sent_at: null,
        active: true,
      }, // ineligible (unknown freq)
    ]
    mockServiceRole.mockReturnValue(makeSupabase(alerts))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await handler({} as any)
    const batchCall = mockProcessBatch.mock.calls[0]?.[0]
    expect(batchCall.items).toHaveLength(1)
    expect(batchCall.items[0].id).toBe('a2')
  })
})

// ── Processor callback tests (exercising the inner batch logic) ──────────────
// These tests use a processBatch mock that actually invokes the processor callback
// to test vehicle querying, user lookup, email sending, and last_sent_at update.

describe('POST /api/cron/search-alerts — processor callback', () => {
  // Override processBatch to invoke the processor
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockFetch.mockResolvedValue({ ok: true })
    mockProcessBatch.mockImplementation(async ({ items, processor }: any) => {
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
    })
  })

  // Creates a thenable chain mock that behaves like Supabase query builder:
  // every method returns `this`, and `await`ing the chain resolves to { data, error }.
  function makeThenableChain(resolvedData: unknown, resolvedError: unknown = null) {
    const chain: any = {
      select: vi.fn().mockImplementation(() => chain),
      eq: vi.fn().mockImplementation(() => chain),
      gte: vi.fn().mockImplementation(() => chain),
      lte: vi.fn().mockImplementation(() => chain),
      ilike: vi.fn().mockImplementation(() => chain),
      in: vi.fn().mockImplementation(() => chain),
      order: vi.fn().mockImplementation(() => chain),
      limit: vi.fn().mockImplementation(() => chain),
      single: vi.fn().mockImplementation(() => chain),
      then: (resolve: Function) => resolve({ data: resolvedData, error: resolvedError }),
    }
    return chain
  }

  function makeFullSupabase(opts: {
    alerts: unknown[]
    alertsError?: unknown
    vehicles?: unknown[]
    vehiclesError?: unknown
    userData?: unknown
    userError?: unknown
  }) {
    const {
      alerts,
      alertsError = null,
      vehicles = [],
      vehiclesError = null,
      userData = null,
      userError = null,
    } = opts

    let alertQueryCount = 0
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'search_alerts' && alertQueryCount === 0) {
          alertQueryCount++
          // First call: the initial query for active alerts
          return makeThenableChain(alerts, alertsError)
        }
        if (table === 'search_alerts') {
          // Subsequent calls: the update call
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        if (table === 'subscriptions') {
          // Return premium plan for all alert owners so tier enforcement doesn't interfere
          const subsData = alerts.map((a: any) => ({ user_id: a.user_id, plan: 'premium' }))
          return makeThenableChain(subsData, null)
        }
        if (table === 'vehicles') {
          return makeThenableChain(vehicles, vehiclesError)
        }
        if (table === 'users') {
          return makeThenableChain(userData, userError)
        }
        return makeThenableChain([], null)
      }),
    }
    return supabase
  }

  it('sends email and updates last_sent_at when vehicles match', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: { brand: 'Volvo' },
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Volvo',
        model: 'FH16',
        price: 85000,
        year: 2023,
        slug: 'volvo-fh16',
        category_id: 'c1',
        location_country: 'ES',
        location_region: 'Madrid',
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'Test User', lang: 'es' }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(1)
    expect(result.emailsSent).toBe(1)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          templateKey: 'search_alert_match',
          to: 'user@test.com',
          locale: 'es',
        }),
      }),
    )
    // Verify last_sent_at update was called
    expect(supabase.from).toHaveBeenCalledWith('search_alerts')
  })

  it('skips email when no matching vehicles', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles: [], userData: null })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips when vehicles query returns null data', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles: null as any })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
  })

  it('logs error and skips when vehicle query fails', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }

    const supabase = makeFullSupabase({
      alerts: [alert],
      vehiclesError: { message: 'vehicle query failed' },
    })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error querying vehicles for alert a1'),
    )
  })

  it('logs error and skips when user not found', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Scania',
        model: 'R500',
        price: 95000,
        year: 2022,
        slug: 'scania-r500',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]

    const supabase = makeFullSupabase({
      alerts: [alert],
      vehicles,
      userError: { message: 'not found' },
    })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('User not found for alert a1'),
    )
  })

  it('logs error and skips when user data is null', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'MAN',
        model: 'TGX',
        price: 70000,
        year: 2021,
        slug: 'man-tgx',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]

    const supabase = makeFullSupabase({
      alerts: [alert],
      vehicles,
      userData: null,
      userError: null,
    })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('User not found for alert a1'),
    )
  })

  it('uses email as user_name when name is null', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'DAF',
        model: 'XF',
        price: 60000,
        year: 2020,
        slug: 'daf-xf',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'nolabel@test.com', name: null, lang: 'en' }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ user_name: 'nolabel@test.com' }),
          locale: 'en',
        }),
      }),
    )
  })

  it('defaults locale to es when user lang is null', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Iveco',
        model: 'Daily',
        price: null,
        year: null,
        slug: 'iveco-daily',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'Test', lang: null }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({ locale: 'es' }),
      }),
    )
  })

  it('logs error but does not crash when $fetch fails', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Renault',
        model: 'T',
        price: 55000,
        year: 2019,
        slug: 'renault-t',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    mockFetch.mockRejectedValueOnce(new Error('email service down'))

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send email for alert a1'),
    )
  })

  it('logs error when $fetch throws non-Error', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Renault',
        model: 'T',
        price: 55000,
        year: 2019,
        slug: 'renault-t',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    mockFetch.mockRejectedValueOnce('string error')

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.emailsSent).toBe(0)
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Unknown error'))
  })

  it('applies all filter types correctly', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {
        category_id: 'cat-1',
        price_min: 10000,
        price_max: 50000,
        year_min: 2018,
        year_max: 2023,
        brand: 'Volvo',
        location_country: 'ES',
        location_region: 'Catalonia',
      },
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Volvo',
        model: 'FL',
        price: 35000,
        year: 2020,
        slug: 'volvo-fl',
        category_id: 'cat-1',
        location_country: 'ES',
        location_region: 'Catalonia',
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'Filters User', lang: 'es' }

    const eqCalls: string[] = []
    const gteCalls: string[] = []
    const lteCalls: string[] = []
    const ilikeCalls: string[] = []

    // Thenable vehicle chain that tracks filter calls
    const vehicleChain: any = {
      select: vi.fn().mockImplementation(() => vehicleChain),
      eq: vi.fn().mockImplementation((field: string) => {
        eqCalls.push(field)
        return vehicleChain
      }),
      gte: vi.fn().mockImplementation((field: string) => {
        gteCalls.push(field)
        return vehicleChain
      }),
      lte: vi.fn().mockImplementation((field: string) => {
        lteCalls.push(field)
        return vehicleChain
      }),
      ilike: vi.fn().mockImplementation((field: string) => {
        ilikeCalls.push(field)
        return vehicleChain
      }),
      order: vi.fn().mockImplementation(() => vehicleChain),
      limit: vi.fn().mockImplementation(() => vehicleChain),
      then: (resolve: Function) => resolve({ data: vehicles, error: null }),
    }

    // Thenable user chain
    const userChain: any = {
      select: vi.fn().mockImplementation(() => userChain),
      eq: vi.fn().mockImplementation(() => userChain),
      single: vi.fn().mockImplementation(() => userChain),
      then: (resolve: Function) => resolve({ data: user, error: null }),
    }

    let alertQueryCount = 0
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'search_alerts' && alertQueryCount === 0) {
          alertQueryCount++
          return makeThenableChain([alert], null)
        }
        if (table === 'search_alerts') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        if (table === 'subscriptions')
          return makeThenableChain([{ user_id: alert.user_id, plan: 'premium' }], null)
        if (table === 'vehicles') return vehicleChain
        if (table === 'users') return userChain
        return makeThenableChain([], null)
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)

    // Verify the filter functions were called for the right fields
    expect(eqCalls).toContain('category_id')
    expect(eqCalls).toContain('location_country')
    expect(eqCalls).toContain('location_region')
    expect(gteCalls).toContain('price')
    expect(gteCalls).toContain('year')
    expect(lteCalls).toContain('price')
    expect(lteCalls).toContain('year')
    expect(ilikeCalls).toContain('brand')
  })

  it('caps vehicle list at 10 in email variables', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    // Generate 15 vehicles
    const vehicles = Array.from({ length: 15 }, (_, i) => ({
      id: `v${i}`,
      brand: 'Brand',
      model: `Model${i}`,
      price: 10000 + i * 1000,
      year: 2020 + (i % 5),
      slug: `brand-model${i}`,
      category_id: null,
      location_country: null,
      location_region: null,
      created_at: new Date().toISOString(),
    }))
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    expect(mockFetch).toHaveBeenCalled()
    const emailBody = mockFetch.mock.calls[0][1].body
    // vehicle_list should contain 10 items (comma separated), not 15
    const commaCount = (emailBody.variables.vehicle_list.match(/,/g) || []).length
    expect(commaCount).toBe(9) // 10 items = 9 commas
    // match_count should still be 15 (full count)
    expect(emailBody.variables.match_count).toBe('15')
  })

  it('formats vehicles without price or year correctly', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Volvo',
        model: 'FH',
        price: null,
        year: null,
        slug: 'volvo-fh',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    const emailBody = mockFetch.mock.calls[0][1].body
    // No year or price info should be appended
    expect(emailBody.variables.vehicle_list).toBe('Volvo FH')
  })

  it('uses sinceDate from last_sent_at when available', async () => {
    const lastSentAt = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: lastSentAt,
      active: true,
    }
    // Make the alert eligible by having last_sent > 24h ago (which it is)
    const vehicles = [
      {
        id: 'v1',
        brand: 'DAF',
        model: 'CF',
        price: 40000,
        year: 2021,
        slug: 'daf-cf',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    let gteDateUsed: string | undefined

    // Thenable vehicle chain that captures gte('created_at', ...) value
    const vehicleChain: any = {
      select: vi.fn().mockImplementation(() => vehicleChain),
      eq: vi.fn().mockImplementation(() => vehicleChain),
      gte: vi.fn().mockImplementation((_field: string, val: string) => {
        if (_field === 'created_at') gteDateUsed = val
        return vehicleChain
      }),
      lte: vi.fn().mockImplementation(() => vehicleChain),
      ilike: vi.fn().mockImplementation(() => vehicleChain),
      order: vi.fn().mockImplementation(() => vehicleChain),
      limit: vi.fn().mockImplementation(() => vehicleChain),
      then: (resolve: Function) => resolve({ data: vehicles, error: null }),
    }

    let alertQueryCount = 0
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'search_alerts' && alertQueryCount === 0) {
          alertQueryCount++
          return makeThenableChain([alert], null)
        }
        if (table === 'search_alerts') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        if (table === 'subscriptions')
          return makeThenableChain([{ user_id: alert.user_id, plan: 'premium' }], null)
        if (table === 'vehicles') return vehicleChain
        if (table === 'users') return makeThenableChain(user, null)
        return makeThenableChain([], null)
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    // sinceDate should be the last_sent_at value
    expect(gteDateUsed).toBe(lastSentAt)
  })

  it('uses 7-day fallback as sinceDate when last_sent_at is null', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'MAN',
        model: 'TGL',
        price: 30000,
        year: 2020,
        slug: 'man-tgl',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    let gteDateUsed: string | undefined

    // Thenable vehicle chain that captures gte('created_at', ...) value
    const vehicleChain2: any = {
      select: vi.fn().mockImplementation(() => vehicleChain2),
      eq: vi.fn().mockImplementation(() => vehicleChain2),
      gte: vi.fn().mockImplementation((_field: string, val: string) => {
        if (_field === 'created_at') gteDateUsed = val
        return vehicleChain2
      }),
      lte: vi.fn().mockImplementation(() => vehicleChain2),
      ilike: vi.fn().mockImplementation(() => vehicleChain2),
      order: vi.fn().mockImplementation(() => vehicleChain2),
      limit: vi.fn().mockImplementation(() => vehicleChain2),
      then: (resolve: Function) => resolve({ data: vehicles, error: null }),
    }

    let alertQueryCount = 0
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'search_alerts' && alertQueryCount === 0) {
          alertQueryCount++
          return makeThenableChain([alert], null)
        }
        if (table === 'search_alerts') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        if (table === 'subscriptions')
          return makeThenableChain([{ user_id: alert.user_id, plan: 'premium' }], null)
        if (table === 'vehicles') return vehicleChain2
        if (table === 'users') return makeThenableChain(user, null)
        return makeThenableChain([], null)
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    // sinceDate should be approximately 7 days ago (ISO string)
    expect(gteDateUsed).toBeDefined()
    const fallbackDate = new Date(gteDateUsed!)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    expect(Math.abs(fallbackDate.getTime() - sevenDaysAgo)).toBeLessThan(5000)
  })

  it('handles null filters gracefully (defaults to {})', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: null,
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'MB',
        model: 'Actros',
        price: 80000,
        year: 2022,
        slug: 'mb-actros',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.emailsSent).toBe(1)
  })

  it('sends x-internal-secret header when cronSecret is set', async () => {
    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Iveco',
        model: 'S-Way',
        price: 75000,
        year: 2023,
        slug: 'iveco-sway',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        headers: { 'x-internal-secret': 'cron-secret' },
      }),
    )
  })

  it('sends empty headers when cronSecret is falsy', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: '', public: {} }))
    // Also clear CRON_SECRET env
    const origEnv = process.env.CRON_SECRET
    delete process.env.CRON_SECRET

    const alert = {
      id: 'a1',
      user_id: 'u1',
      filters: {},
      frequency: 'daily',
      last_sent_at: null,
      active: true,
    }
    const vehicles = [
      {
        id: 'v1',
        brand: 'Iveco',
        model: 'Daily',
        price: 30000,
        year: 2021,
        slug: 'iveco-daily',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user = { id: 'u1', email: 'user@test.com', name: 'User', lang: 'es' }

    const supabase = makeFullSupabase({ alerts: [alert], vehicles, userData: user })
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        headers: {},
      }),
    )

    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'cron-secret', public: {} }))
    if (origEnv !== undefined) process.env.CRON_SECRET = origEnv
  })

  it('processes multiple eligible alerts independently', async () => {
    const alerts = [
      {
        id: 'a1',
        user_id: 'u1',
        filters: {},
        frequency: 'daily',
        last_sent_at: null,
        active: true,
      },
      {
        id: 'a2',
        user_id: 'u2',
        filters: {},
        frequency: 'daily',
        last_sent_at: null,
        active: true,
      },
    ]
    const vehicles = [
      {
        id: 'v1',
        brand: 'Volvo',
        model: 'FH',
        price: 90000,
        year: 2023,
        slug: 'volvo-fh',
        category_id: null,
        location_country: null,
        location_region: null,
        created_at: new Date().toISOString(),
      },
    ]
    const user1 = { id: 'u1', email: 'u1@test.com', name: 'User1', lang: 'es' }
    const user2 = { id: 'u2', email: 'u2@test.com', name: 'User2', lang: 'en' }

    let userCallCount = 0
    let alertQueryCount = 0
    const supabase: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'search_alerts' && alertQueryCount === 0) {
          alertQueryCount++
          return makeThenableChain(alerts, null)
        }
        if (table === 'search_alerts') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        if (table === 'subscriptions') {
          const subsData = alerts.map((a: any) => ({ user_id: a.user_id, plan: 'premium' }))
          return makeThenableChain(subsData, null)
        }
        if (table === 'vehicles') {
          return makeThenableChain(vehicles, null)
        }
        if (table === 'users') {
          userCallCount++
          const user = userCallCount <= 1 ? user1 : user2
          return makeThenableChain(user, null)
        }
        return makeThenableChain([], null)
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.alertsProcessed).toBe(2)
    expect(result.emailsSent).toBe(2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

// ── effectiveFrequency unit tests (backlog #12 tier enforcement) ─────────────

describe('effectiveFrequency', () => {
  it('premium allows instant', () => {
    expect(effectiveFrequency('instant', 'premium')).toBe('instant')
  })

  it('premium allows daily', () => {
    expect(effectiveFrequency('daily', 'premium')).toBe('daily')
  })

  it('premium allows weekly', () => {
    expect(effectiveFrequency('weekly', 'premium')).toBe('weekly')
  })

  it('founding allows instant', () => {
    expect(effectiveFrequency('instant', 'founding')).toBe('instant')
  })

  it('classic caps instant to daily', () => {
    expect(effectiveFrequency('instant', 'classic')).toBe('daily')
  })

  it('classic allows daily', () => {
    expect(effectiveFrequency('daily', 'classic')).toBe('daily')
  })

  it('classic allows weekly', () => {
    expect(effectiveFrequency('weekly', 'classic')).toBe('weekly')
  })

  it('basic caps instant to weekly', () => {
    expect(effectiveFrequency('instant', 'basic')).toBe('weekly')
  })

  it('basic caps daily to weekly', () => {
    expect(effectiveFrequency('daily', 'basic')).toBe('weekly')
  })

  it('basic allows weekly', () => {
    expect(effectiveFrequency('weekly', 'basic')).toBe('weekly')
  })

  it('free caps instant to weekly', () => {
    expect(effectiveFrequency('instant', 'free')).toBe('weekly')
  })

  it('null alert frequency defaults to daily before cap', () => {
    // null → 'daily', premium cap = instant → effective = 'daily'
    expect(effectiveFrequency(null, 'premium')).toBe('daily')
    // null → 'daily', basic cap = weekly → effective = 'weekly'
    expect(effectiveFrequency(null, 'basic')).toBe('weekly')
  })

  it('unknown plan defaults to weekly cap', () => {
    expect(effectiveFrequency('instant', 'unknown_plan')).toBe('weekly')
  })
})
