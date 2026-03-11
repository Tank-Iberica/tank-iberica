/**
 * Tests for:
 * - GET /api/infra/alerts
 * - GET /api/infra/metrics
 * - PATCH /api/infra/alerts/:id
 * - POST /api/infra/setup-cf-variants
 * - GET /api/infra/slow-queries  (Nuxt global auto-imports)
 * - GET /api/infra/clusters      (Nuxt global auto-imports)
 * - POST /api/dgt-report
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'

const {
  mockReadBody,
  mockGetQuery,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockVerifyCronSecret,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockReadBody: vi.fn().mockResolvedValue({}),
    mockGetQuery: vi.fn().mockReturnValue({}),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockVerifyCronSecret: vi.fn(),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: mockGetQuery,
  readBody: mockReadBody,
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))

vi.stubGlobal('useRuntimeConfig', () => ({
  cloudflareImagesApiToken: undefined,
  cloudflareAccountId: undefined,
  public: {},
}))
vi.stubGlobal('verifyCronSecret', mockVerifyCronSecret)
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ success: true, errors: [], result: { id: 'thumb' } }))

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A query chain that can also be directly awaited (thenable). */
function makeThenableChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
  // Make it directly awaitable (Supabase PostgrestBuilder pattern)
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve({ data, error }).then(onFulfilled as any, onRejected as any)
  return chain
}

/** Returns a supabase client where call 1 = users (admin check), rest = thenableChain. */
function makeAdminSupabase(role: string | null = 'admin', secondData: any = null, secondError: any = null) {
  let callCount = 0
  return {
    from: vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // admin check: users table .select('role').eq(...).single()
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
        }
      }
      return makeThenableChain(secondData, secondError)
    }),
    rpc: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'not available' } }),
    }),
  }
}

// ── GET /api/infra/alerts ─────────────────────────────────────────────────────

import alertsGetHandler from '../../../server/api/infra/alerts.get'

describe('GET /api/infra/alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockGetQuery.mockReturnValue({})
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(alertsGetHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(alertsGetHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns alerts array for admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', [{ id: 'alert-1', component: 'supabase' }]))
    const result = await alertsGetHandler({} as any)
    expect(result.alerts).toEqual([{ id: 'alert-1', component: 'supabase' }])
    expect(result.showAll).toBe(false)
    expect(result.count).toBe(1)
  })

  it('returns empty array when no alerts', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', []))
    const result = await alertsGetHandler({} as any)
    expect(result.alerts).toEqual([])
    expect(result.count).toBe(0)
  })

  it('sets showAll:true when query.all=true', async () => {
    mockGetQuery.mockReturnValue({ all: 'true' })
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', []))
    const result = await alertsGetHandler({} as any)
    expect(result.showAll).toBe(true)
  })

  it('throws 500 when alerts query fails', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', null, { message: 'db error' }))
    await expect(alertsGetHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── GET /api/infra/metrics ────────────────────────────────────────────────────

import metricsGetHandler from '../../../server/api/infra/metrics.get'

describe('GET /api/infra/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockGetQuery.mockReturnValue({})
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(metricsGetHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(metricsGetHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns metrics for admin with default 24h period', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', [{ id: 'm1', component: 'supabase' }]))
    const result = await metricsGetHandler({} as any)
    expect(result.period).toBe('24h')
    expect(result.component).toBe('all')
    expect(result.metrics).toEqual([{ id: 'm1', component: 'supabase' }])
  })

  it('filters by component when provided', async () => {
    mockGetQuery.mockReturnValue({ component: 'cloudinary', period: '7d' })
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', []))
    const result = await metricsGetHandler({} as any)
    expect(result.period).toBe('7d')
    expect(result.component).toBe('cloudinary')
  })

  it('throws 500 when metrics query fails', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', null, { message: 'db error' }))
    await expect(metricsGetHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── PATCH /api/infra/alerts/:id ───────────────────────────────────────────────

import alertsPatchHandler from '../../../server/api/infra/alerts/[id].patch'

const validAlertId = '550e8400-e29b-41d4-a716-446655440000'
const eventWithAlertId = { context: { params: { id: validAlertId } } } as any

describe('PATCH /api/infra/alerts/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(alertsPatchHandler(eventWithAlertId)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(alertsPatchHandler(eventWithAlertId)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when alert ID is missing', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin'))
    await expect(alertsPatchHandler({ context: { params: {} } } as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when alert ID is not a valid UUID', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin'))
    await expect(alertsPatchHandler({ context: { params: { id: 'not-a-uuid' } } } as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when alert not found', async () => {
    let callCount = 0
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            callCount === 1
              ? { data: { role: 'admin' }, error: null }
              : { data: null, error: { message: 'not found' } },
          ),
        }
      }),
    }
    mockServiceRole.mockReturnValue(sb)
    await expect(alertsPatchHandler(eventWithAlertId)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns already acknowledged message when alert is already acked', async () => {
    let callCount = 0
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            callCount === 1
              ? { data: { role: 'admin' }, error: null }
              : { data: { id: validAlertId, acknowledged: true }, error: null },
          ),
        }
      }),
    }
    mockServiceRole.mockReturnValue(sb)
    const result = await alertsPatchHandler(eventWithAlertId)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Alert was already acknowledged')
  })

  it('acknowledges alert and returns success', async () => {
    let callCount = 0
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
        }
        if (callCount === 1) {
          chain.single = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        } else if (callCount === 2) {
          chain.single = vi.fn().mockResolvedValue({ data: { id: validAlertId, acknowledged_at: null }, error: null })
        } else {
          // update chain — thenable
          chain.then = (onFulfilled: Function, onRejected?: Function) =>
            Promise.resolve({ data: null, error: null }).then(onFulfilled as any, onRejected as any)
        }
        return chain
      }),
    }
    mockServiceRole.mockReturnValue(sb)
    const result = await alertsPatchHandler(eventWithAlertId)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Alert acknowledged')
  })

  it('throws 500 when update fails', async () => {
    let callCount = 0
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
        }
        if (callCount === 1) {
          chain.single = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        } else if (callCount === 2) {
          chain.single = vi.fn().mockResolvedValue({ data: { id: validAlertId, acknowledged_at: null }, error: null })
        } else {
          chain.then = (onFulfilled: Function, onRejected?: Function) =>
            Promise.resolve({ data: null, error: { message: 'update failed' } }).then(onFulfilled as any, onRejected as any)
        }
        return chain
      }),
    }
    mockServiceRole.mockReturnValue(sb)
    await expect(alertsPatchHandler(eventWithAlertId)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── POST /api/infra/setup-cf-variants ─────────────────────────────────────────

import setupCfVariantsHandler from '../../../server/api/infra/setup-cf-variants.post'

describe('POST /api/infra/setup-cf-variants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: undefined,
      cloudflareAccountId: undefined,
      public: {},
    }))
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(setupCfVariantsHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(setupCfVariantsHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 500 when Cloudflare config missing', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin'))
    await expect(setupCfVariantsHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns created variants when CF config is present', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: 'cf-token',
      cloudflareAccountId: 'cf-account',
      public: {},
    }))
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin'))
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ success: true, errors: [], result: { id: 'thumb' } }))
    const result = await setupCfVariantsHandler({} as any)
    expect(result.created).toHaveLength(4)
  })
})

// ── GET /api/infra/slow-queries (Nuxt global) ─────────────────────────────────

describe('GET /api/infra/slow-queries', () => {
  let slowQueriesHandler: Function

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.resetModules()
    const mod = await import('../../../server/api/infra/slow-queries.get')
    slowQueriesHandler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue({
      rpc: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'q1' }], error: null }),
      }),
    })
    await slowQueriesHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns slow_queries type when RPC succeeds', async () => {
    mockServiceRole.mockReturnValue({
      rpc: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [{ query: 'SELECT 1', mean_exec_time: 100 }], error: null }),
      }),
    })
    const result = await slowQueriesHandler({} as any)
    expect(result.type).toBe('slow_queries')
  })

  it('returns table_stats type when RPC fails but table_stats succeeds', async () => {
    mockServiceRole.mockReturnValue({
      rpc: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'not available' } }),
      }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ relname: 'vehicles', seq_scan: 500 }], error: null }),
      }),
    })
    const result = await slowQueriesHandler({} as any)
    expect(result.type).toBe('table_stats')
    expect(result.data).toHaveLength(1)
  })

  it('returns unavailable when both RPC and table_stats fail', async () => {
    mockServiceRole.mockReturnValue({
      rpc: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'not available' } }),
      }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'also failed' } }),
      }),
    })
    const result = await slowQueriesHandler({} as any)
    expect(result.available).toBe(false)
  })
})

// ── GET /api/infra/clusters (Nuxt global) ─────────────────────────────────────

describe('GET /api/infra/clusters', () => {
  let clustersHandler: Function

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.resetModules()
    const mod = await import('../../../server/api/infra/clusters/index.get')
    clustersHandler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(clustersHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(clustersHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns clusters array for admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', [{ id: 'c1', name: 'cluster-1' }]))
    const result = await clustersHandler({} as any)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([{ id: 'c1', name: 'cluster-1' }])
  })

  it('throws 500 when fetch clusters fails', async () => {
    let callCount = 0
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        }
        if (callCount === 1) {
          chain.single = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        } else {
          chain.then = (onFulfilled: Function, onRejected?: Function) =>
            Promise.resolve({ data: null, error: { message: 'DB error' } }).then(onFulfilled as any, onRejected as any)
        }
        return chain
      }),
    }
    mockServiceRole.mockReturnValue(sb)
    await expect(clustersHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── POST /api/dgt-report ──────────────────────────────────────────────────────

import dgtReportHandler from '../../../server/api/dgt-report.post'

const validDgtBody = {
  vehicleId: '550e8400-e29b-41d4-a716-446655440000',
  matricula: '1234BCD',
  provider: 'infocar',
}

function makeDgtSupabase(role: string | null = 'admin', vehicleData: any = { id: 'v1', brand: 'Volvo', model: 'FH16', year: 2020, verification_level: 0 }) {
  let callCount = 0
  return {
    from: vi.fn().mockImplementation(() => {
      callCount++
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
      }
      if (callCount === 1) {
        // users — admin check
        chain.single = vi.fn().mockResolvedValue({ data: { role }, error: null })
      } else if (callCount === 2) {
        // vehicles — vehicle check
        chain.single = vi.fn().mockResolvedValue({ data: vehicleData, error: null })
      } else if (callCount === 3) {
        // verification_documents — insert
        chain.single = vi.fn().mockResolvedValue({ data: { id: 'doc-1' }, error: null })
      } else {
        // vehicles update — thenable (no terminal method)
        chain.then = (onFulfilled: Function, onRejected?: Function) =>
          Promise.resolve({ data: null, error: null }).then(onFulfilled as any, onRejected as any)
      }
      return chain
    }),
  }
}

describe('POST /api/dgt-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ ...validDgtBody })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(dgtReportHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 500 when user profile fetch fails', async () => {
    let callCount = 0
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            callCount === 1
              ? { data: null, error: { message: 'error' } }
              : { data: null, error: null },
          ),
        }
      }),
    }
    mockServiceRole.mockReturnValue(sb)
    await expect(dgtReportHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 403 when user is not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(dgtReportHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when body validation fails', async () => {
    mockReadBody.mockResolvedValue({ vehicleId: 'not-a-uuid', matricula: '1234BCD' })
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin'))
    await expect(dgtReportHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when matricula is invalid', async () => {
    mockReadBody.mockResolvedValue({ vehicleId: validDgtBody.vehicleId, matricula: '!@#$' })
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin'))
    await expect(dgtReportHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle not found', async () => {
    let callCount = 0
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            callCount === 1
              ? { data: { role: 'admin' }, error: null }
              : { data: null, error: { message: 'not found' } },
          ),
        }
      }),
    }
    mockServiceRole.mockReturnValue(sb)
    await expect(dgtReportHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns success with report data for valid request', async () => {
    mockServiceRole.mockReturnValue(makeDgtSupabase('admin'))
    const result = await dgtReportHandler({} as any)
    expect(result.success).toBe(true)
    expect(result.kmScore).toBe(85)
    expect(result.reportUrl).toContain('tracciona.com')
    expect(result.documentId).toBe('doc-1')
  })
})
