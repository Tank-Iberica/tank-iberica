/**
 * Tests for remaining cron endpoints:
 * - POST /api/cron/auto-auction
 * - POST /api/cron/freshness-check
 * - POST /api/cron/founding-expiry
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { mockReadBody, mockSafeError, mockVerifyCronSecret, mockProcessBatch, mockFetchWithRetry } =
  vi.hoisted(() => {
    const mockSafeError = vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    })
    return {
      mockReadBody: vi.fn().mockResolvedValue({}),
      mockSafeError,
      mockVerifyCronSecret: vi.fn(),
      mockProcessBatch: vi.fn().mockResolvedValue({ processed: 0, errors: 0 }),
      mockFetchWithRetry: vi.fn(),
    }
  })

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))
vi.mock('../../../server/utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))
vi.mock('../../../server/utils/fetchWithRetry', () => ({ fetchWithRetry: mockFetchWithRetry }))

vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: undefined,
  cronSecret: 'test-cron',
  public: {},
}))

vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

function makeJsonResponse(data: unknown, ok = true) {
  return { json: vi.fn().mockResolvedValue(data), ok, status: ok ? 200 : 500 }
}

// ── POST /api/cron/auto-auction ────────────────────────────────────────────

import autoAuctionHandler from '../../../server/api/cron/auto-auction.post'

describe('POST /api/cron/auto-auction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('calls verifyCronSecret', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    // Actual call order: RPC → vehicles → config
    mockFetchWithRetry
      .mockResolvedValueOnce(makeJsonResponse(null))    // RPC call
      .mockResolvedValueOnce(makeJsonResponse([]))      // vehicles query
      .mockResolvedValueOnce(makeJsonResponse([{ auction_defaults: null, commission_rates: {} }])) // config
    await autoAuctionHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('throws 500 when supabase not configured', async () => {
    await expect(autoAuctionHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns processed:0 when no vehicles', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockFetchWithRetry
      .mockResolvedValueOnce(makeJsonResponse(null))    // RPC call
      .mockResolvedValueOnce(makeJsonResponse([]))      // vehicles query
      .mockResolvedValueOnce(makeJsonResponse([{ auction_defaults: null, commission_rates: {} }])) // config
    const result = await autoAuctionHandler({} as any)
    expect(result.processed).toBe(0)
    expect(result.created).toBe(0)
    expect(result.timestamp).toBeTruthy()
  })

  it('returns processed count for vehicles not past threshold', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const futureDate = new Date(Date.now() + 100 * 24 * 3600 * 1000).toISOString()
    const vehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH16', price: 80000, auto_auction_after_days: 30, auto_auction_starting_pct: 70, created_at: futureDate },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(makeJsonResponse(null))    // RPC call
      .mockResolvedValueOnce(makeJsonResponse(vehicles)) // vehicles query
      .mockResolvedValueOnce(makeJsonResponse([{ auction_defaults: null, commission_rates: {} }])) // config
    const result = await autoAuctionHandler({} as any)
    expect(result.processed).toBe(1)
    expect(result.created).toBe(0)
  })

  it('calls processBatch for eligible vehicles', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const pastDate = new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString()
    const vehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH16', price: 80000, auto_auction_after_days: 30, auto_auction_starting_pct: 70, created_at: pastDate },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(makeJsonResponse(null))    // RPC call
      .mockResolvedValueOnce(makeJsonResponse(vehicles)) // vehicles query
      .mockResolvedValueOnce(makeJsonResponse([{ auction_defaults: null, commission_rates: {} }])) // config
      .mockResolvedValueOnce(makeJsonResponse([]))       // auctions dedup lookup
    mockProcessBatch.mockResolvedValueOnce({ processed: 1, errors: 0 })
    await autoAuctionHandler({} as any)
    expect(mockProcessBatch).toHaveBeenCalledWith(
      expect.objectContaining({ items: vehicles, batchSize: 50 }),
    )
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })
})

// ── POST /api/cron/freshness-check ────────────────────────────────────────

import freshnessHandler from '../../../server/api/cron/freshness-check.post'

describe('POST /api/cron/freshness-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchWithRetry.mockReset()
    mockReadBody.mockResolvedValue({})
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('throws 500 when supabase not configured', async () => {
    await expect(freshnessHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns reminded/paused/expired:0 when no vehicles', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    // Step 1 (reminder), Step 2 (pause candidates), Step 3 (expire candidates)
    mockFetchWithRetry
      .mockResolvedValueOnce(makeJsonResponse([]))   // reminder vehicles
      .mockResolvedValueOnce(makeJsonResponse([]))   // pause candidates
      .mockResolvedValueOnce(makeJsonResponse([]))   // expire candidates
    const result = await freshnessHandler({} as any)
    expect(result.reminded).toBe(0)
    expect(result.paused).toBe(0)
    expect(result.expired).toBe(0)
    expect(result.timestamp).toBeTruthy()
  })

  it('calls processBatch for vehicles to remind', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const vehicles = [{ id: 'v1', freshness_reminder_count: 0 }]
    mockFetchWithRetry
      .mockResolvedValueOnce(makeJsonResponse(vehicles))
      .mockResolvedValueOnce(makeJsonResponse([]))
      .mockResolvedValueOnce(makeJsonResponse([]))
    mockProcessBatch.mockResolvedValueOnce({ processed: 1, errors: 0 })
    await freshnessHandler({} as any)
    expect(mockProcessBatch).toHaveBeenCalled()
  })

  it('pauses vehicles when candidates pass filter', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const now = new Date()
    const remindedAt = new Date(now.getTime() - 20 * 24 * 3600 * 1000).toISOString()
    const updatedAt = new Date(now.getTime() - 25 * 24 * 3600 * 1000).toISOString()
    // Candidate where updated_at < freshness_reminded_at → should be paused
    const candidates = [{ id: 'v1', updated_at: updatedAt, freshness_reminded_at: remindedAt }]
    mockFetchWithRetry
      .mockResolvedValueOnce(makeJsonResponse([]))        // reminder: none
      .mockResolvedValueOnce(makeJsonResponse(candidates)) // pause candidates
      .mockResolvedValueOnce(makeJsonResponse([]))        // expire candidates
    // processBatch is called 3 times: reminders(0), pauses(1), expires(0)
    mockProcessBatch
      .mockResolvedValueOnce({ processed: 0, errors: 0 }) // reminders (empty)
      .mockResolvedValueOnce({ processed: 1, errors: 0 }) // pauses
      .mockResolvedValueOnce({ processed: 0, errors: 0 }) // expires (empty)
    const result = await freshnessHandler({} as any)
    expect(result.paused).toBe(1)
  })
})

// ── POST /api/cron/founding-expiry ────────────────────────────────────────

import foundingExpiryHandler from '../../../server/api/cron/founding-expiry.post'

describe('POST /api/cron/founding-expiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchWithRetry.mockReset()
    mockReadBody.mockResolvedValue({})
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('throws 500 when supabase not configured', async () => {
    await expect(foundingExpiryHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns zeros when fetch fails', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockFetchWithRetry.mockResolvedValueOnce(makeJsonResponse([], false))
    await expect(foundingExpiryHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns zeros when no founding subscriptions', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    mockFetchWithRetry.mockResolvedValueOnce(makeJsonResponse([]))
    const result = await foundingExpiryHandler({} as any)
    expect(result.notified_30d).toBe(0)
    expect(result.notified_7d).toBe(0)
    expect(result.expired).toBe(0)
    expect(result.vehicles_paused).toBe(0)
    expect(result.timestamp).toBeTruthy()
  })

  it('calls processBatch when founding subscriptions found', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const subscriptions = [
      { id: 'sub-1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(), vertical: 'tracciona' },
    ]
    mockFetchWithRetry.mockResolvedValueOnce(makeJsonResponse(subscriptions))
    mockProcessBatch.mockResolvedValueOnce({ processed: 1, errors: 0 })
    await foundingExpiryHandler({} as any)
    expect(mockProcessBatch).toHaveBeenCalledWith(
      expect.objectContaining({ items: subscriptions, batchSize: 20 }),
    )
  })
})
