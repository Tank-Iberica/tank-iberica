/**
 * Tests for:
 * - POST /api/cron/k6-readiness-check (h3 explicit)
 * - POST /api/infra/clusters/:id/execute-migration (Nuxt global)
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

const {
  mockReadBody,
  mockGetRouterParam,
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
    mockGetRouterParam: vi.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440000'),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockVerifyCronSecret: vi.fn(),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getRouterParam: mockGetRouterParam,
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

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: vi.fn().mockResolvedValue({ error: null, id: 'email-id' }) }
  },
}))

// Nuxt global stubs
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('safeError', mockSafeError)
vi.stubGlobal('useRuntimeConfig', () => ({
  resendApiKey: undefined,
  public: {},
}))

// Static import for h3-explicit file
import k6ReadinessHandler from '../../../server/api/cron/k6-readiness-check.post'

// Dynamic import for Nuxt-global file
let executeMigrationHandler: any

beforeAll(async () => {
  executeMigrationHandler = (await import('../../../server/api/infra/clusters/[id]/execute-migration.post')).default
})

// ── Helpers ──────────────────────────────────────────────────────────────────

const validUUID = '550e8400-e29b-41d4-a716-446655440000'
const validUUID2 = '660e8400-e29b-41d4-a716-446655440000'

function makeCountChain(count: number, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error, count }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error }),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve({ data: null, error, count }).then(onFulfilled as any, onRejected as any)
  return chain
}

function makeDataChain(data: any, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve({ data, error }).then(onFulfilled as any, onRejected as any)
  return chain
}

function makeMultiFromClient(responses: Array<{ data?: any; error?: any; count?: number }>) {
  let callCount = 0
  return {
    from: vi.fn().mockImplementation(() => {
      const r = responses[callCount++] ?? { data: null, error: null }
      if (r.count !== undefined) return makeCountChain(r.count, r.error)
      return makeDataChain(r.data ?? null, r.error ?? null)
    }),
  }
}

// ── POST /api/cron/k6-readiness-check ────────────────────────────────────────

describe('POST /api/cron/k6-readiness-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    vi.stubGlobal('useRuntimeConfig', () => ({
      resendApiKey: undefined,
      public: {},
    }))
  })

  it('throws 500 when vehicle count query fails', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { count: 0, error: { message: 'DB error' } },
    ]))
    await expect(k6ReadinessHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when dealer count query fails', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { count: 60 },                               // vehicles ok
      { count: 0, error: { message: 'DB error' } }, // dealers fail
    ]))
    await expect(k6ReadinessHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns conditionsMet:false when not enough vehicles', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { count: 10 },  // < 50 vehicles
      { count: 3 },   // enough dealers
    ]))
    const result = await k6ReadinessHandler({} as any)
    expect(result.conditionsMet).toBe(false)
    expect(result.vehiclesReady).toBe(false)
    expect(result.dealersReady).toBe(true)
    expect(result.notified).toBe(false)
  })

  it('returns conditionsMet:false when not enough dealers', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { count: 60 },  // enough vehicles
      { count: 1 },   // < 2 dealers
    ]))
    const result = await k6ReadinessHandler({} as any)
    expect(result.conditionsMet).toBe(false)
    expect(result.vehiclesReady).toBe(true)
    expect(result.dealersReady).toBe(false)
  })

  it('returns notified:false with reason when conditions met but no RESEND key', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { count: 60 },
      { count: 3 },
    ]))
    const result = await k6ReadinessHandler({} as any)
    expect(result.conditionsMet).toBe(true)
    expect(result.notified).toBe(false)
    expect(result.reason).toContain('RESEND_API_KEY')
  })

  it('returns notified:true when conditions met and email sent', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      resendApiKey: 'test-resend-key',
      public: {},
    }))
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { count: 60 },
      { count: 3 },
    ]))
    const result = await k6ReadinessHandler({} as any)
    expect(result.conditionsMet).toBe(true)
    expect(result.notified).toBe(true)
  })
})

// ── POST /api/infra/clusters/:id/execute-migration ───────────────────────────

describe('POST /api/infra/clusters/:id/execute-migration', () => {
  const validBody = { verticalToMigrate: 'tracciona', targetClusterId: validUUID2 }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockGetRouterParam.mockReturnValue(validUUID)
    mockReadBody.mockResolvedValue({ ...validBody })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when not admin', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'dealer' } }]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when sourceClusterId is invalid UUID', async () => {
    mockGetRouterParam.mockReturnValue('not-a-uuid')
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when verticalToMigrate is missing', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    mockReadBody.mockResolvedValue({ targetClusterId: validUUID2 })
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when targetClusterId is invalid UUID', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    mockReadBody.mockResolvedValue({ verticalToMigrate: 'tracciona', targetClusterId: 'bad' })
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when source and target cluster are the same', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    mockReadBody.mockResolvedValue({ verticalToMigrate: 'tracciona', targetClusterId: validUUID })
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when source cluster not found', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },                    // admin check
      { data: null, error: { message: 'not found' } }, // source cluster
    ]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when target cluster not found', async () => {
    const sourceCluster = { id: validUUID, name: 'Source', verticals: ['tracciona'], weight_used: 1, weight_limit: 5 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },
      { data: sourceCluster },                          // source found
      { data: null, error: { message: 'not found' } },  // target not found
    ]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 500 when setting migrating status fails', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 1 }
    const targetCluster = { id: validUUID2, verticals: ['boats'], weight_used: 0.5 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },           // admin check
      { data: sourceCluster },               // source cluster
      { data: targetCluster },               // target cluster
      { error: { message: 'status update failed' } }, // set status to migrating fails
    ]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSafeError).toHaveBeenCalledWith(500, expect.stringContaining('Failed to update cluster status'))
  })

  it('throws 500 and reverts status when data export fails', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 1 }
    const targetCluster = { id: validUUID2, verticals: ['boats'], weight_used: 0.5 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },          // admin check
      { data: sourceCluster },              // source cluster
      { data: targetCluster },              // target cluster
      { data: null },                       // set status to migrating OK
      { error: { message: 'dealers query exploded' } }, // dealers query fails → exportVerticalData throws
    ]))

    // The from('dealers').select('*').eq() chain will resolve with { data: null, error: { message: ... } }
    // But exportVerticalData doesn't check for errors — it just uses data.
    // Actually, looking more carefully: the dealers query doesn't throw, it just returns { data: null }.
    // So data.dealers = null ?? [] = []. That won't throw.
    // We need an actual throw inside exportVerticalData.
    // Let's make a custom mock that throws on the 5th from() call.

    // Reset and use a custom mock
    const fromCalls: Array<{ data?: any; error?: any }> = [
      { data: { role: 'admin' } },          // #1 admin check
      { data: sourceCluster },              // #2 source cluster
      { data: targetCluster },              // #3 target cluster
      { data: null },                       // #4 set status to migrating OK
      // #5 dealers query — will throw
    ]
    let callIdx = 0
    const throwingClient = {
      from: vi.fn().mockImplementation(() => {
        const idx = callIdx++
        if (idx === 4) {
          // Make the dealers query chain throw when awaited
          const chain: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockRejectedValue(new Error('DB connection lost')),
          }
          chain.then = (_onFulfilled: Function, onRejected?: Function) =>
            Promise.reject(new Error('DB connection lost')).then(undefined, onRejected)
          return chain
        }
        // For #6+ (revert status call and beyond), return normal success
        const r = fromCalls[idx] ?? { data: null }
        return makeDataChain(r.data ?? null, r.error ?? null)
      }),
    }
    mockServiceRole.mockReturnValue(throwingClient)
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSafeError).toHaveBeenCalledWith(500, expect.stringContaining('Data export failed'))
  })

  it('throws 500 when source cluster update fails', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 1 }
    const targetCluster = { id: validUUID2, verticals: ['boats'], weight_used: 0.5 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },                                    // #1 admin check
      { data: sourceCluster },                                        // #2 source cluster
      { data: targetCluster },                                        // #3 target cluster
      { data: null },                                                 // #4 set status to migrating
      { data: [{ id: 'd1', vertical: 'tracciona' }] },               // #5 dealers
      { data: [{ id: 'v1', dealer_id: 'd1' }] },                     // #6 vehicles
      { data: [{ id: 'c1' }] },                                      // #7 categories
      { data: [{ id: 'sc1' }] },                                     // #8 subcategories
      { data: [{ slug: 'tracciona' }] },                              // #9 vertical_config
      { data: [{ id: 'l1', vertical: 'tracciona' }] },               // #10 active_landings
      { data: [{ id: 'a1', vertical: 'tracciona' }] },               // #11 articles
      { error: { message: 'source update failed' } },                 // #12 update source cluster fails
    ]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSafeError).toHaveBeenCalledWith(500, expect.stringContaining('Failed to update source cluster'))
  })

  it('throws 500 when target cluster update fails', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 1 }
    const targetCluster = { id: validUUID2, verticals: ['boats'], weight_used: 0.5 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },                                    // #1 admin check
      { data: sourceCluster },                                        // #2 source cluster
      { data: targetCluster },                                        // #3 target cluster
      { data: null },                                                 // #4 set status to migrating
      { data: [{ id: 'd1', vertical: 'tracciona' }] },               // #5 dealers
      { data: [{ id: 'v1', dealer_id: 'd1' }] },                     // #6 vehicles
      { data: [{ id: 'c1' }] },                                      // #7 categories
      { data: [{ id: 'sc1' }] },                                     // #8 subcategories
      { data: [{ slug: 'tracciona' }] },                              // #9 vertical_config
      { data: [{ id: 'l1', vertical: 'tracciona' }] },               // #10 active_landings
      { data: [{ id: 'a1', vertical: 'tracciona' }] },               // #11 articles
      { data: null },                                                 // #12 update source cluster OK
      { error: { message: 'target update failed' } },                 // #13 update target cluster fails
    ]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSafeError).toHaveBeenCalledWith(500, expect.stringContaining('Failed to update target cluster'))
  })

  it('completes full migration with dealers and vehicles', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona', 'boats'], weight_used: 2.5 }
    const targetCluster = { id: validUUID2, verticals: ['agro'], weight_used: 0.5 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },                                    // #1 admin check
      { data: sourceCluster },                                        // #2 source cluster
      { data: targetCluster },                                        // #3 target cluster
      { data: null },                                                 // #4 set status to migrating
      { data: [{ id: 'd1', vertical: 'tracciona' }] },               // #5 dealers
      { data: [{ id: 'v1', dealer_id: 'd1' }, { id: 'v2', dealer_id: 'd1' }] }, // #6 vehicles
      { data: [{ id: 'c1' }] },                                      // #7 categories
      { data: [{ id: 'sc1' }, { id: 'sc2' }] },                      // #8 subcategories
      { data: [{ slug: 'tracciona' }] },                              // #9 vertical_config
      { data: [{ id: 'l1' }] },                                      // #10 active_landings
      { data: [{ id: 'a1' }, { id: 'a2' }] },                        // #11 articles
      { data: null },                                                 // #12 update source cluster
      { data: null },                                                 // #13 update target cluster
      { data: null },                                                 // #14 set status back to active
      { data: null },                                                 // #15 activity_logs insert
    ]))

    const result = await executeMigrationHandler({} as any)

    expect(result.status).toBe('completed')
    expect(result.tables_migrated).toHaveLength(7)
    expect(result.tables_migrated[0]).toEqual({ name: 'dealers', rows: 1 })
    expect(result.tables_migrated[1]).toEqual({ name: 'vehicles', rows: 2 })
    expect(result.tables_migrated[2]).toEqual({ name: 'categories', rows: 1 })
    expect(result.tables_migrated[3]).toEqual({ name: 'subcategories', rows: 2 })
    expect(result.tables_migrated[4]).toEqual({ name: 'vertical_config', rows: 1 })
    expect(result.tables_migrated[5]).toEqual({ name: 'active_landings', rows: 1 })
    expect(result.tables_migrated[6]).toEqual({ name: 'articles', rows: 2 })

    expect(result.exported_data.dealers).toEqual([{ id: 'd1', vertical: 'tracciona' }])
    expect(result.exported_data.vehicles).toEqual([{ id: 'v1', dealer_id: 'd1' }, { id: 'v2', dealer_id: 'd1' }])
    expect(result.exported_data.categories).toEqual([{ id: 'c1' }])
    expect(result.exported_data.subcategories).toEqual([{ id: 'sc1' }, { id: 'sc2' }])
    expect(result.exported_data.vertical_config).toEqual([{ slug: 'tracciona' }])
    expect(result.exported_data.active_landings).toEqual([{ id: 'l1' }])
    expect(result.exported_data.articles).toEqual([{ id: 'a1' }, { id: 'a2' }])

    // Source removes 'tracciona', keeps 'boats'
    expect(result.source_cluster.id).toBe(validUUID)
    expect(result.source_cluster.verticals).toEqual(['boats'])

    // Target adds 'tracciona' to existing 'agro'
    expect(result.target_cluster.id).toBe(validUUID2)
    expect(result.target_cluster.verticals).toEqual(['agro', 'tracciona'])

    // Weight: 10 rows total → 10 * 0.001 = 0.01
    // source: 2.5 - 0.01 = 2.49, target: 0.5 + 0.01 = 0.51
    expect(result.source_cluster.weight_used).toBe(2.49)
    expect(result.target_cluster.weight_used).toBe(0.51)

    // next_steps should be present
    expect(result.next_steps).toHaveLength(3)
    expect(result.next_steps[0]).toContain('Apply migrations')
    expect(result.next_steps[1]).toContain('Import exported data')
    expect(result.next_steps[2]).toContain('Cloudflare')
  })

  it('completes migration with no dealers (skips vehicles query)', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 0.5 }
    const targetCluster = { id: validUUID2, verticals: null, weight_used: null }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },                                    // #1 admin check
      { data: sourceCluster },                                        // #2 source cluster
      { data: targetCluster },                                        // #3 target cluster
      { data: null },                                                 // #4 set status to migrating
      { data: [] },                                                   // #5 dealers (empty)
      // vehicles query is SKIPPED since dealerIds.length === 0
      { data: [] },                                                   // #6 categories
      { data: [] },                                                   // #7 subcategories
      { data: [] },                                                   // #8 vertical_config
      { data: [] },                                                   // #9 active_landings
      { data: [] },                                                   // #10 articles
      { data: null },                                                 // #11 update source cluster
      { data: null },                                                 // #12 update target cluster
      { data: null },                                                 // #13 set status back to active
      { data: null },                                                 // #14 activity_logs insert
    ]))

    const result = await executeMigrationHandler({} as any)

    expect(result.status).toBe('completed')
    expect(result.tables_migrated).toHaveLength(7)
    expect(result.tables_migrated[0]).toEqual({ name: 'dealers', rows: 0 })
    expect(result.tables_migrated[1]).toEqual({ name: 'vehicles', rows: 0 })

    // Vehicles should be empty array (skipped query)
    expect(result.exported_data.vehicles).toEqual([])

    // Source verticals: was ['tracciona'], remove 'tracciona' → []
    expect(result.source_cluster.verticals).toEqual([])

    // Target verticals: was null → [vertical]
    expect(result.target_cluster.verticals).toEqual(['tracciona'])

    // Weight: 0 rows → source stays at 0.5, target stays at 0 (null → 0)
    expect(result.source_cluster.weight_used).toBe(0.5)
    expect(result.target_cluster.weight_used).toBe(0)
  })

  it('handles null verticals on source cluster', async () => {
    const sourceCluster = { id: validUUID, verticals: null, weight_used: null }
    const targetCluster = { id: validUUID2, verticals: ['boats'], weight_used: 1.0 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },                                    // #1
      { data: sourceCluster },                                        // #2
      { data: targetCluster },                                        // #3
      { data: null },                                                 // #4 set status
      { data: [] },                                                   // #5 dealers
      { data: [] },                                                   // #6 categories
      { data: [] },                                                   // #7 subcategories
      { data: [] },                                                   // #8 vertical_config
      { data: [] },                                                   // #9 active_landings
      { data: [] },                                                   // #10 articles
      { data: null },                                                 // #11 update source
      { data: null },                                                 // #12 update target
      { data: null },                                                 // #13 status active
      { data: null },                                                 // #14 activity_logs
    ]))

    const result = await executeMigrationHandler({} as any)

    // null verticals → filter produces []
    expect(result.source_cluster.verticals).toEqual([])
    // target: ['boats'] + 'tracciona'
    expect(result.target_cluster.verticals).toEqual(['boats', 'tracciona'])
    // null weight_used → 0
    expect(result.source_cluster.weight_used).toBe(0)
  })

  it('handles null data from queries in exportVerticalData (fallback to empty arrays)', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 0.1 }
    const targetCluster = { id: validUUID2, verticals: [], weight_used: 0 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },                                    // #1
      { data: sourceCluster },                                        // #2
      { data: targetCluster },                                        // #3
      { data: null },                                                 // #4 set status
      { data: null },                                                 // #5 dealers → null (fallback to [])
      // vehicles query skipped (no dealers)
      { data: null },                                                 // #6 categories → null
      { data: null },                                                 // #7 subcategories → null
      { data: null },                                                 // #8 vertical_config → null
      { data: null },                                                 // #9 active_landings → null
      { data: null },                                                 // #10 articles → null
      { data: null },                                                 // #11 update source
      { data: null },                                                 // #12 update target
      { data: null },                                                 // #13 status active
      { data: null },                                                 // #14 activity_logs
    ]))

    const result = await executeMigrationHandler({} as any)

    expect(result.status).toBe('completed')
    // All should be empty arrays due to ?? [] fallback
    expect(result.exported_data.dealers).toEqual([])
    expect(result.exported_data.vehicles).toEqual([])
    expect(result.exported_data.categories).toEqual([])
    expect(result.exported_data.subcategories).toEqual([])
    expect(result.exported_data.vertical_config).toEqual([])
    expect(result.exported_data.active_landings).toEqual([])
    expect(result.exported_data.articles).toEqual([])

    // All rows 0 → weight stays the same
    expect(result.source_cluster.weight_used).toBe(0.1)
    expect(result.target_cluster.weight_used).toBe(0)
  })

  it('correctly calculates weight when migrating many rows', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 5.0 }
    const targetCluster = { id: validUUID2, verticals: [], weight_used: 0 }
    // 100 dealers + 500 vehicles + 10 categories + 20 subcategories + 1 config + 5 landings + 50 articles = 686 rows
    const manyDealers = Array.from({ length: 100 }, (_, i) => ({ id: `d${i}`, vertical: 'tracciona' }))
    const manyVehicles = Array.from({ length: 500 }, (_, i) => ({ id: `v${i}`, dealer_id: `d${i % 100}` }))
    const manyCategories = Array.from({ length: 10 }, (_, i) => ({ id: `c${i}` }))
    const manySubcategories = Array.from({ length: 20 }, (_, i) => ({ id: `sc${i}` }))
    const manyLandings = Array.from({ length: 5 }, (_, i) => ({ id: `l${i}` }))
    const manyArticles = Array.from({ length: 50 }, (_, i) => ({ id: `a${i}` }))

    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },
      { data: sourceCluster },
      { data: targetCluster },
      { data: null },                   // set status migrating
      { data: manyDealers },            // dealers
      { data: manyVehicles },           // vehicles
      { data: manyCategories },         // categories
      { data: manySubcategories },      // subcategories
      { data: [{ slug: 'tracciona' }] }, // vertical_config
      { data: manyLandings },           // active_landings
      { data: manyArticles },           // articles
      { data: null },                   // update source
      { data: null },                   // update target
      { data: null },                   // status active
      { data: null },                   // activity_logs
    ]))

    const result = await executeMigrationHandler({} as any)

    const totalRows = 100 + 500 + 10 + 20 + 1 + 5 + 50 // 686
    const weightDelta = totalRows * 0.001 // 0.686
    // source: max(0, 5.0 - 0.686) = 4.314, rounded to 2dp = 4.31
    // target: 0 + 0.686 = 0.686, rounded to 2dp = 0.69
    expect(result.source_cluster.weight_used).toBe(Math.round((5.0 - weightDelta) * 100) / 100)
    expect(result.target_cluster.weight_used).toBe(Math.round(weightDelta * 100) / 100)
  })

  it('clamps source weight_used to 0 when rows exceed weight', async () => {
    // source weight is 0.001, migrating 100 rows → delta = 0.1 > 0.001
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 0.001 }
    const targetCluster = { id: validUUID2, verticals: [], weight_used: 0 }
    const dealers = Array.from({ length: 100 }, (_, i) => ({ id: `d${i}`, vertical: 'tracciona' }))

    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },
      { data: sourceCluster },
      { data: targetCluster },
      { data: null },
      { data: dealers },              // 100 dealers
      { data: [] },                   // 0 vehicles (but dealer_ids > 0 so query runs)
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: null },
      { data: null },
      { data: null },
      { data: null },
    ]))

    const result = await executeMigrationHandler({} as any)
    // Math.max(0, 0.001 - 0.1) = 0
    expect(result.source_cluster.weight_used).toBe(0)
  })

  it('throws 400 when verticalToMigrate is not a string', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    mockReadBody.mockResolvedValue({ verticalToMigrate: 123, targetClusterId: validUUID2 })
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when targetClusterId is not a string', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    mockReadBody.mockResolvedValue({ verticalToMigrate: 'tracciona', targetClusterId: 123 })
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when sourceClusterId param is missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
    expect(mockSafeError).toHaveBeenCalledWith(400, 'Invalid source cluster ID')
  })

  it('throws 400 when verticalToMigrate is empty string', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([{ data: { role: 'admin' } }]))
    mockReadBody.mockResolvedValue({ verticalToMigrate: '', targetClusterId: validUUID2 })
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when source cluster data is null without error', async () => {
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },
      { data: null },                    // source cluster: no data, no error
      { data: { id: validUUID2 } },      // target cluster
    ]))
    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('reverts status with non-Error export failure message', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 1 }
    const targetCluster = { id: validUUID2, verticals: [], weight_used: 0 }

    let callIdx = 0
    const customClient = {
      from: vi.fn().mockImplementation(() => {
        const idx = callIdx++
        if (idx === 0) return makeDataChain({ role: 'admin' })  // admin check
        if (idx === 1) return makeDataChain(sourceCluster)       // source cluster
        if (idx === 2) return makeDataChain(targetCluster)       // target cluster
        if (idx === 3) return makeDataChain(null)                // set migrating status
        if (idx === 4) {
          // dealers query — throw a non-Error object
          const chain: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockRejectedValue('string error'),
          }
          chain.then = (_onFulfilled: Function, onRejected?: Function) =>
            Promise.reject('string error').then(undefined, onRejected)
          return chain
        }
        return makeDataChain(null) // revert status and beyond
      }),
    }
    mockServiceRole.mockReturnValue(customClient)

    await expect(executeMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSafeError).toHaveBeenCalledWith(500, 'Data export failed: Unknown export error')
  })

  it('logs migration activity with correct metadata', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 0.5 }
    const targetCluster = { id: validUUID2, verticals: [], weight_used: 0 }
    const client = makeMultiFromClient([
      { data: { role: 'admin' } },
      { data: sourceCluster },
      { data: targetCluster },
      { data: null },
      { data: [{ id: 'd1', vertical: 'tracciona' }] },
      { data: [{ id: 'v1', dealer_id: 'd1' }] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: null },
      { data: null },
      { data: null },
      { data: null },
    ])
    mockServiceRole.mockReturnValue(client)

    await executeMigrationHandler({} as any)

    // Verify from() was called at least 15 times (all steps including activity_logs)
    expect(client.from).toHaveBeenCalledTimes(15)
    // The 15th call is for activity_logs
    expect(client.from).toHaveBeenNthCalledWith(15, 'activity_logs')
  })

  it('handles vehicles query returning null when dealers exist', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 1 }
    const targetCluster = { id: validUUID2, verticals: [], weight_used: 0 }
    mockServiceRole.mockReturnValue(makeMultiFromClient([
      { data: { role: 'admin' } },
      { data: sourceCluster },
      { data: targetCluster },
      { data: null },
      { data: [{ id: 'd1', vertical: 'tracciona' }] },   // dealers exist
      { data: null },                                       // vehicles query returns null
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: null },
      { data: null },
      { data: null },
      { data: null },
    ]))

    const result = await executeMigrationHandler({} as any)

    // vehicles should fall back to [] via ?? []
    expect(result.exported_data.vehicles).toEqual([])
    expect(result.tables_migrated[1]).toEqual({ name: 'vehicles', rows: 0 })
  })

  it('verifies from() is called with correct table names in order', async () => {
    const sourceCluster = { id: validUUID, verticals: ['tracciona'], weight_used: 0 }
    const targetCluster = { id: validUUID2, verticals: [], weight_used: 0 }
    const client = makeMultiFromClient([
      { data: { role: 'admin' } },
      { data: sourceCluster },
      { data: targetCluster },
      { data: null },
      { data: [{ id: 'd1', vertical: 'tracciona' }] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: [] },
      { data: null },
      { data: null },
      { data: null },
      { data: null },
    ])
    mockServiceRole.mockReturnValue(client)

    await executeMigrationHandler({} as any)

    const fromCalls = client.from.mock.calls.map((c: any[]) => c[0])
    expect(fromCalls).toEqual([
      'users',              // #1 admin check
      'infra_clusters',     // #2 source cluster
      'infra_clusters',     // #3 target cluster
      'infra_clusters',     // #4 set status migrating
      'dealers',            // #5
      'vehicles',           // #6
      'categories',         // #7
      'subcategories',      // #8
      'vertical_config',    // #9
      'active_landings',    // #10
      'articles',           // #11
      'infra_clusters',     // #12 update source
      'infra_clusters',     // #13 update target
      'infra_clusters',     // #14 status active
      'activity_logs',      // #15
    ])
  })
})
