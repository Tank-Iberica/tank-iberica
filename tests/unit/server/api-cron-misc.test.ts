/**
 * Tests for miscellaneous cron endpoints:
 * - POST /api/cron/dealer-weekly-stats
 * - POST /api/cron/price-drop-alert
 * - POST /api/cron/reservation-expiry
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
      mockReadBody: vi.fn().mockResolvedValue({ secret: 'cron-secret' }),
      mockSafeError,
      mockServiceRole: vi.fn(),
      mockVerifyCronSecret: vi.fn(),
      mockProcessBatch: vi.fn().mockResolvedValue({ processed: 0, errors: 0 }),
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
vi.mock('../../../server/utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))
vi.mock('../../utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))
vi.mock('../../../server/utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))
vi.mock('../../utils/batchProcessor', () => ({ processBatch: mockProcessBatch }))

vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: 'cron-secret',
  stripeSecretKey: undefined,
  public: {},
}))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

// ── dealer-weekly-stats ───────────────────────────────────────────────────────

import weeklyStatsHandler from '../../../server/api/cron/dealer-weekly-stats.post'

describe('POST /api/cron/dealer-weekly-stats', () => {
  function makeSupabase(dealers: unknown[], dealersError: unknown = null) {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockResolvedValue({ data: dealers, error: dealersError }),
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
    await weeklyStatsHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns empty result when no dealers', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([]))
    const result = await weeklyStatsHandler({} as any)
    expect(result).toMatchObject({ emailsSent: 0, dealersProcessed: 0 })
  })

  it('throws 500 on DB error fetching dealers', async () => {
    mockServiceRole.mockReturnValue(makeSupabase([], { message: 'DB error' }))
    await expect(weeklyStatsHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('calls processBatch with active dealers', async () => {
    const dealers = [
      { id: 'dealer-1', user_id: 'user-1', company_name: { es: 'Test' }, email: 'dealer@test.com', locale: 'es', status: 'active' },
    ]
    mockServiceRole.mockReturnValue(makeSupabase(dealers))
    mockProcessBatch.mockResolvedValue({ processed: 1, errors: 0 })
    await weeklyStatsHandler({} as any)
    expect(mockProcessBatch).toHaveBeenCalledWith(
      expect.objectContaining({ items: dealers, batchSize: 50 }),
    )
  })
})

// ── price-drop-alert ──────────────────────────────────────────────────────────

import priceDropAlertHandler from '../../../server/api/cron/price-drop-alert.post'

describe('POST /api/cron/price-drop-alert', () => {
  function makePriceDropSupabase(priceChanges: unknown[], priceError: unknown = null) {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: priceChanges, error: priceError }),
    }
    return { from: vi.fn().mockReturnValue(chain) }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue(makePriceDropSupabase([]))
    await priceDropAlertHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns empty when no price changes in last 24h', async () => {
    mockServiceRole.mockReturnValue(makePriceDropSupabase([]))
    const result = await priceDropAlertHandler({} as any)
    expect(result).toMatchObject({ checked: 0, sent: 0 })
  })

  it('returns 0 sent when all changes are price increases', async () => {
    mockServiceRole.mockReturnValue(
      makePriceDropSupabase([
        { id: 'h1', vehicle_id: 'v1', previous_price_cents: 50000, price_cents: 70000, changed_at: new Date().toISOString() },
      ]),
    )
    const result = await priceDropAlertHandler({} as any)
    expect(result).toMatchObject({ checked: 1, sent: 0 })
  })

  it('throws 500 on price_history DB error', async () => {
    mockServiceRole.mockReturnValue(makePriceDropSupabase([], { message: 'query error' }))
    await expect(priceDropAlertHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── reservation-expiry ────────────────────────────────────────────────────────

import reservationExpiryHandler from '../../../server/api/cron/reservation-expiry.post'

describe('POST /api/cron/reservation-expiry', () => {
  function makeReservationSupabase(reservations: unknown[], error: unknown = null) {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: reservations, error }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }
    return { from: vi.fn().mockReturnValue(chain) }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
  })

  it('calls verifyCronSecret', async () => {
    mockServiceRole.mockReturnValue(makeReservationSupabase([]))
    await reservationExpiryHandler({} as any)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns 0 counts when no expired reservations', async () => {
    mockServiceRole.mockReturnValue(makeReservationSupabase([]))
    const result = await reservationExpiryHandler({} as any)
    expect(result).toMatchObject({ processed: 0, refunded: 0, errors: 0 })
  })

  it('throws 500 on DB error', async () => {
    mockServiceRole.mockReturnValue(makeReservationSupabase([], { message: 'DB error' }))
    await expect(reservationExpiryHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('processes reservations without stripe payment', async () => {
    const reservations = [
      { id: 'res-1', stripe_payment_intent_id: null, status: 'pending', deposit_cents: 10000, buyer_id: 'buyer-1', vehicle_id: 'v-1' },
    ]
    let updatedData: any
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: reservations, error: null }),
        update: vi.fn().mockImplementation((data: any) => {
          updatedData = data
          return { eq: vi.fn().mockResolvedValue({ data: null, error: null }) }
        }),
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await reservationExpiryHandler({} as any)
    expect(result.processed).toBe(1)
    expect(result.refunded).toBe(0)
  })
})
