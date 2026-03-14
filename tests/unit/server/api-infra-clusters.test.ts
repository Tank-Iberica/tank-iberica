/**
 * Tests for:
 * - POST /api/infra/clusters            (Nuxt global, create cluster)
 * - PATCH /api/infra/clusters/:id       (Nuxt global, update cluster)
 * - POST /api/infra/clusters/:id/prepare-migration (Nuxt global)
 * - POST /api/infra/migrate-images      (h3 explicit)
 * - POST /api/infra/csp-report          (h3 explicit)
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

const {
  mockReadBody,
  mockGetRouterParam,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockFetch,
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
    mockFetch: vi
      .fn()
      .mockResolvedValue({
        pipeline: 'cloudflare',
        urls: {
          gallery: 'https://cf.img/g',
          thumb: 'https://cf.img/t',
          card: 'https://cf.img/c',
          og: 'https://cf.img/og',
        },
        original: 'https://res.cloudinary.com/img.jpg',
      }),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getRouterParam: mockGetRouterParam,
  getHeader: vi.fn().mockReturnValue(undefined),
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

// Nuxt global stubs
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('safeError', mockSafeError)
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  cloudflareImagesApiToken: undefined,
  cloudflareAccountId: undefined,
  cloudflareImagesDeliveryUrl: undefined,
  public: {},
}))
vi.stubGlobal('useSupabaseRestHeaders', vi.fn().mockReturnValue(null))

// Static imports for h3-explicit files
import migrateImagesHandler from '../../../server/api/infra/migrate-images.post'
import cspReportHandler from '../../../server/api/infra/csp-report.post'

// Dynamic imports for Nuxt-global files
let createClusterHandler: any
let patchClusterHandler: any
let prepareMigrationHandler: any

beforeAll(async () => {
  createClusterHandler = (await import('../../../server/api/infra/clusters/index.post')).default
  patchClusterHandler = (await import('../../../server/api/infra/clusters/[id].patch')).default
  prepareMigrationHandler = (
    await import('../../../server/api/infra/clusters/[id]/prepare-migration.post')
  ).default
})

// ── Helpers ──────────────────────────────────────────────────────────────────

const validUUID = '550e8400-e29b-41d4-a716-446655440000'
const validUUID2 = '660e8400-e29b-41d4-a716-446655440000'

function makeChain(data: any = null, error: any = null, count: number | null = null) {
  const resolved = { data, error, ...(count !== null ? { count } : {}) }
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve(resolved).then(onFulfilled as any, onRejected as any)
  return chain
}

function makeMultiChain(steps: Array<{ data?: any; error?: any; count?: number }>) {
  let callCount = 0
  return {
    from: vi.fn().mockImplementation(() => {
      const step = steps[callCount++] ?? { data: null, error: null }
      return makeChain(step.data ?? null, step.error ?? null, step.count ?? null)
    }),
  }
}

function makeAdminSupabase(
  adminRole = 'admin',
  ...extraSteps: Array<{ data?: any; error?: any; count?: number }>
) {
  return makeMultiChain([{ data: { role: adminRole } }, ...extraSteps])
}

// ── POST /api/infra/clusters ─────────────────────────────────────────────────

describe('POST /api/infra/clusters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ name: 'New Cluster', supabase_url: 'https://xyz.supabase.co' })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(createClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(createClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when name is missing', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({ supabase_url: 'https://xyz.supabase.co' })
    await expect(createClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when supabase_url is missing', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({ name: 'Cluster' })
    await expect(createClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when weight_limit is invalid', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({
      name: 'Cluster',
      supabase_url: 'https://x.supabase.co',
      weight_limit: -1,
    })
    await expect(createClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when DB insert fails', async () => {
    mockServiceRole.mockReturnValue(
      makeAdminSupabase('admin', { data: null, error: { message: 'DB error' } }),
    )
    await expect(createClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns created cluster data on success', async () => {
    const clusterData = { id: validUUID, name: 'New Cluster', status: 'active' }
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', { data: clusterData }))
    const result = await createClusterHandler({} as any)
    expect(result).toEqual(clusterData)
  })
})

// ── PATCH /api/infra/clusters/:id ────────────────────────────────────────────

describe('PATCH /api/infra/clusters/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockGetRouterParam.mockReturnValue(validUUID)
    mockReadBody.mockResolvedValue({ name: 'Updated Cluster' })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(patchClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(patchClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when clusterId is invalid UUID', async () => {
    mockGetRouterParam.mockReturnValue('not-a-uuid')
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    await expect(patchClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when body has invalid field value', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({ weight_limit: -5 })
    await expect(patchClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when no valid fields provided', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({})
    await expect(patchClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when DB update fails', async () => {
    mockServiceRole.mockReturnValue(
      makeAdminSupabase('admin', { data: null, error: { message: 'DB error' } }),
    )
    await expect(patchClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 404 when cluster not found', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', { data: null, error: null }))
    await expect(patchClusterHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns updated cluster data on success', async () => {
    const clusterData = { id: validUUID, name: 'Updated Cluster', status: 'active' }
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin', { data: clusterData }))
    const result = await patchClusterHandler({} as any)
    expect(result).toEqual(clusterData)
  })
})

// ── POST /api/infra/clusters/:id/prepare-migration ────────────────────────────

describe('POST /api/infra/clusters/:id/prepare-migration', () => {
  const validBody = { verticalToMigrate: 'tracciona', targetClusterId: validUUID2 }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockGetRouterParam.mockReturnValue(validUUID)
    mockReadBody.mockResolvedValue({ ...validBody })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when sourceClusterId is invalid UUID', async () => {
    mockGetRouterParam.mockReturnValue('not-a-uuid')
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when verticalToMigrate is missing', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({ targetClusterId: validUUID2 })
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when targetClusterId is invalid UUID', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({ verticalToMigrate: 'tracciona', targetClusterId: 'bad' })
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when source and target are the same', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase())
    mockReadBody.mockResolvedValue({ verticalToMigrate: 'tracciona', targetClusterId: validUUID })
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when source cluster not found', async () => {
    mockServiceRole.mockReturnValue(
      makeAdminSupabase(
        'admin',
        { data: null, error: { message: 'not found' } }, // source cluster
      ),
    )
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when target cluster not found', async () => {
    mockServiceRole.mockReturnValue(
      makeMultiChain([
        { data: { role: 'admin' } },
        { data: { id: validUUID, name: 'Source' } },
        { data: null, error: { message: 'not found' } },
      ]),
    )
    await expect(prepareMigrationHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns migration plan when both clusters exist', async () => {
    const sourceCluster = { id: validUUID, name: 'Source' }
    const targetCluster = { id: validUUID2, name: 'Target' }
    // Steps: admin check, source cluster, target cluster, then multiple count queries
    const countStep = { data: null, error: null, count: 5 }
    const dealerIdsStep = { data: [{ id: 'd1' }, { id: 'd2' }], error: null }
    mockServiceRole.mockReturnValue(
      makeMultiChain([
        { data: { role: 'admin' } }, // admin check
        { data: sourceCluster }, // source cluster
        { data: targetCluster }, // target cluster
        { data: null, count: 2 }, // dealers count
        { data: dealerIdsStep.data }, // dealer IDs for vehicles
        { data: null, count: 10 }, // vehicles count
        { data: null, count: 5 }, // categories
        { data: null, count: 3 }, // subcategories
        { data: null, count: 1 }, // vertical_config
        { data: null, count: 0 }, // active_landings
        { data: null, count: 7 }, // articles
      ]),
    )
    const result = await prepareMigrationHandler({} as any)
    expect(result.vertical).toBe('tracciona')
    expect(result.source_cluster.name).toBe('Source')
    expect(result.target_cluster.name).toBe('Target')
    expect(Array.isArray(result.tables)).toBe(true)
    expect(result.estimated_time_seconds).toBeGreaterThan(0)
  })
})

// ── POST /api/infra/migrate-images ────────────────────────────────────────────

describe('POST /api/infra/migrate-images', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({})
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: undefined,
      cloudflareAccountId: undefined,
      cloudflareImagesDeliveryUrl: undefined,
      public: {},
    }))
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(migrateImagesHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when not admin', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('dealer'))
    await expect(migrateImagesHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 500 when CF config missing', async () => {
    mockServiceRole.mockReturnValue(makeAdminSupabase('admin'))
    await expect(migrateImagesHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns zeros when no cloudinary images to migrate', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: 'cf-token',
      cloudflareAccountId: 'cf-account',
      cloudflareImagesDeliveryUrl: 'https://imagedelivery.net',
      public: {},
    }))
    mockServiceRole.mockReturnValue(
      makeMultiChain([
        { data: { role: 'admin' } }, // admin check
        { data: [] }, // images query (empty)
        { data: null, count: 0 }, // remaining count
      ]),
    )
    const result = await migrateImagesHandler({} as any)
    expect(result.processed).toBe(0)
    expect(result.remaining).toBe(0)
  })

  it('increments errorCount when $fetch returns cloudinary fallback', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: 'cf-token',
      cloudflareAccountId: 'cf-account',
      cloudflareImagesDeliveryUrl: 'https://imagedelivery.net',
      public: {},
    }))
    const images = [
      {
        id: 'img-1',
        url: 'https://res.cloudinary.com/test/img.jpg',
        vehicle_id: 'v1',
        thumbnail_url: null,
      },
    ]
    mockServiceRole.mockReturnValue(
      makeMultiChain([{ data: { role: 'admin' } }, { data: images }, { data: null, count: 0 }]),
    )
    // $fetch returns cloudinary pipeline (fallback) → errorCount++
    mockFetch.mockResolvedValue({
      pipeline: 'cloudinary',
      urls: { gallery: '', thumb: '', card: '', og: '' },
      original: images[0].url,
    })
    const result = await migrateImagesHandler({} as any)
    expect(result.processed).toBe(0)
    expect(result.errors).toBe(1)
  })
})

// ── POST /api/infra/csp-report ────────────────────────────────────────────────

describe('POST /api/infra/csp-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns received for valid CSP report', async () => {
    mockReadBody.mockResolvedValue({
      'csp-report': {
        'document-uri': 'https://tracciona.com/page',
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.com/script.js',
      },
    })
    const result = await cspReportHandler({} as any)
    expect(result.status).toBe('received')
  })

  it('returns no_report when csp-report key missing', async () => {
    mockReadBody.mockResolvedValue({ other: 'data' })
    const result = await cspReportHandler({} as any)
    expect(result.status).toBe('no_report')
  })

  it('returns filtered for chrome-extension blocked URI', async () => {
    mockReadBody.mockResolvedValue({
      'csp-report': {
        'blocked-uri': 'chrome-extension://abc/script.js',
        'violated-directive': 'script-src',
      },
    })
    const result = await cspReportHandler({} as any)
    expect(result.status).toBe('filtered')
  })

  it('returns invalid when readBody throws', async () => {
    mockReadBody.mockRejectedValue(new Error('Parse error'))
    const result = await cspReportHandler({} as any)
    expect(result.status).toBe('invalid')
  })
})
