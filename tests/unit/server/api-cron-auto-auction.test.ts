import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFetchWithRetry } = vi.hoisted(() => ({
  mockFetchWithRetry: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('../../../server/utils/batchProcessor', () => ({
  processBatch: async ({ items, processor }: { items: unknown[]; processor: (item: unknown) => Promise<void> }) => {
    let processed = 0
    let errors = 0
    for (const item of items) {
      try { await processor(item); processed++ } catch { errors++ }
    }
    return { processed, errors }
  },
}))

vi.mock('../../../server/utils/fetchWithRetry', () => ({
  fetchWithRetry: (...a: unknown[]) => mockFetchWithRetry(...a),
}))

vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: 'test-key' }))

import handler from '../../../server/api/cron/auto-auction.post'

function jsonRes(data: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500 }
}

describe('auto-auction cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('throws 500 when service not configured', async () => {
    process.env.SUPABASE_URL = ''
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: '' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: 'test-key' }))
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('returns zero when no vehicles found', async () => {
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(null)) // RPC call (caught)
      .mockResolvedValueOnce(jsonRes([])) // direct query
    const result = await (handler as Function)({})
    expect(result.processed).toBe(0)
    expect(result.created).toBe(0)
  })

  it('returns zero when vehicles response is not array', async () => {
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(null))
      .mockResolvedValueOnce(jsonRes({ error: 'bad' }))
    const result = await (handler as Function)({})
    expect(result.processed).toBe(0)
  })

  it('creates auction for eligible vehicle without existing auction', async () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
    const vehicles = [{
      id: 'v1', brand: 'Volvo', model: 'FH', price: 50000,
      auto_auction_after_days: 30, auto_auction_starting_pct: 70,
      created_at: oldDate,
    }]

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(null)) // RPC
      .mockResolvedValueOnce(jsonRes(vehicles)) // vehicles query
      .mockResolvedValueOnce(jsonRes([{ auction_defaults: null, commission_rates: {} }])) // config
      .mockResolvedValueOnce(jsonRes([])) // auctions check (no existing)
      .mockResolvedValueOnce(jsonRes({}, true)) // create auction

    const result = await (handler as Function)({})
    expect(result.processed).toBe(1)
    expect(result.created).toBe(1)
  })

  it('skips vehicle with existing active auction', async () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const vehicles = [{
      id: 'v1', brand: 'Volvo', model: 'FH', price: 50000,
      auto_auction_after_days: 30, auto_auction_starting_pct: 70,
      created_at: oldDate,
    }]

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(null)) // RPC
      .mockResolvedValueOnce(jsonRes(vehicles))
      .mockResolvedValueOnce(jsonRes([{ auction_defaults: null, commission_rates: {} }])) // config
      .mockResolvedValueOnce(jsonRes([{ vehicle_id: 'v1' }])) // existing auction

    const result = await (handler as Function)({})
    expect(result.created).toBe(0)
  })

  it('skips vehicle not past threshold', async () => {
    const recentDate = new Date().toISOString() // just now
    const vehicles = [{
      id: 'v1', brand: 'MAN', model: 'TGX', price: 40000,
      auto_auction_after_days: 30, auto_auction_starting_pct: 70,
      created_at: recentDate,
    }]

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(null))
      .mockResolvedValueOnce(jsonRes(vehicles))

    const result = await (handler as Function)({})
    // Vehicle is not eligible (threshold not reached), so no auctions query needed
    expect(result.created).toBe(0)
  })
})
