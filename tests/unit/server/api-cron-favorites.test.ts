/**
 * Tests for cron jobs that notify users about favorited vehicles:
 * - POST /api/cron/favorite-price-drop
 * - POST /api/cron/favorite-sold
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockSafeError, mockServiceRole, mockVerifyCronSecret, mockProcessBatch } =
  vi.hoisted(() => {
    const mockSafeError = vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    })
    return {
      mockReadBody: vi.fn().mockResolvedValue({ secret: 'test-secret' }),
      mockSafeError,
      mockServiceRole: vi.fn(),
      mockVerifyCronSecret: vi.fn(),
      mockProcessBatch: vi.fn().mockResolvedValue({ processed: 0, errors: 0 }),
    }
  })

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
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

vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'test-secret', public: {} }))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

// ── favorite-price-drop ───────────────────────────────────────────────────────

import pricedropHandler from '../../../server/api/cron/favorite-price-drop.post'

describe('POST /api/cron/favorite-price-drop', () => {
  function makeSupabase(vehicles: unknown[], vehiclesError: unknown = null) {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: vehicles, error: vehiclesError }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    return { from: vi.fn().mockReturnValue(chain) }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([]))
    await pricedropHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns 0 counts when no vehicles found', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([]))
    const result = await pricedropHandler({} as any)
    expect(result).toMatchObject({ vehiclesChecked: 0, notificationsSent: 0 })
    expect(result.timestamp).toBeTruthy()
  })

  it('returns 0 counts when vehicles have no price drop', async () => {
    mockServiceRole.mockReturnValue(
      makeSupabase([
        {
          id: 'v1',
          brand: 'Volvo',
          model: 'FH',
          slug: 'volvo-fh',
          price: 80000,
          previous_price: 70000,
          updated_at: new Date().toISOString(),
          category_id: null,
        },
      ]),
    )
    const result = await pricedropHandler({} as any)
    // previous_price (70000) < price (80000) → no drop
    expect(result.vehiclesChecked).toBe(0)
  })

  it('throws 500 when DB query fails', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([], { message: 'DB error' }))
    await expect(pricedropHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('processes vehicles with price drop via processBatch', async () => {
    const now = new Date().toISOString()
    mockServiceRole.mockReturnValue(
      makeSupabase([
        {
          id: 'v1',
          brand: 'DAF',
          model: 'XF',
          slug: 'daf-xf',
          price: 50000,
          previous_price: 60000,
          updated_at: now,
          category_id: null,
        },
      ]),
    )
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    const result = await pricedropHandler({} as any)
    expect(mockProcessBatch).toHaveBeenCalled()
    expect(result.vehiclesChecked).toBe(1)
  })
})

// ── favorite-sold ─────────────────────────────────────────────────────────────

import favoriteSoldHandler from '../../../server/api/cron/favorite-sold.post'

describe('POST /api/cron/favorite-sold', () => {
  function makeSoldSupabase(vehicles: unknown[], vehiclesError: unknown = null) {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: vehicles, error: vehiclesError }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    return { from: vi.fn().mockReturnValue(chain) }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockProcessBatch.mockResolvedValue({ processed: 0, errors: 0 })
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue(makeSoldSupabase([]))
    await favoriteSoldHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns 0 counts when no recently sold vehicles', async () => {
    mockServiceRole.mockReturnValue(makeSoldSupabase([]))
    const result = await favoriteSoldHandler({} as any)
    expect(result).toMatchObject({ soldVehicles: 0, notificationsSent: 0 })
  })

  it('throws 500 on DB error', async () => {
    mockServiceRole.mockReturnValue(makeSoldSupabase([], { message: 'connection error' }))
    await expect(favoriteSoldHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('passes sold vehicles to processBatch', async () => {
    const now = new Date().toISOString()
    mockServiceRole.mockReturnValue(
      makeSoldSupabase([
        {
          id: 'v1',
          brand: 'Iveco',
          model: 'Daily',
          slug: 'iveco-daily',
          sold_at: now,
          category_id: 'cat-1',
        },
        {
          id: 'v2',
          brand: 'Renault',
          model: 'Trucks T',
          slug: 'renault-t',
          sold_at: now,
          category_id: null,
        },
      ]),
    )
    mockProcessBatch.mockResolvedValue({ processed: 2, errors: 0 })
    const result = await favoriteSoldHandler({} as any)
    expect(result.soldVehicles).toBe(2)
    expect(mockProcessBatch).toHaveBeenCalled()
  })
})
