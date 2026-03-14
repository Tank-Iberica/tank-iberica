/**
 * Tests for POST /api/credits/priority-reserve
 * Task #11 — Reserva Prioritaria
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockSafeError, mockSupabaseUser, mockVerifyCsrf, mockValidateBody, mockFetch } = vi.hoisted(
  () => {
    const mockSafeError = vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    })
    return {
      mockSafeError,
      mockSupabaseUser: vi.fn().mockResolvedValue(null),
      mockVerifyCsrf: vi.fn(),
      mockValidateBody: vi.fn(),
      mockFetch: vi.fn(),
    }
  },
)

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCsrf', () => ({ verifyCsrf: mockVerifyCsrf }))
vi.mock('../../../server/utils/validateBody', () => ({ validateBody: mockValidateBody }))

vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-service-key',
  public: {},
}))
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')

// ── helpers ────────────────────────────────────────────────────────────────

const VEHICLE_ID = '33333333-3333-3333-3333-333333333333'
const BUYER_ID = 'buyer-1'
const SELLER_ID = 'seller-1'
const DEALER_ID = 'dealer-a'
const RESERVATION_ID = 'res-1'

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return [
    {
      id: VEHICLE_ID,
      status: 'published',
      is_protected: false,
      priority_reserved_until: null,
      dealer_id: DEALER_ID,
      ...overrides,
    },
  ]
}

/** Setup sequential fetches for the happy path */
function setupHappyPath(credits = [{ balance: 5 }]) {
  mockFetch
    // vehicles GET
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeVehicle()) })
    // dealers GET (immunity check — seller user_id)
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ user_id: SELLER_ID }]) })
    // subscriptions GET (seller plan — not premium)
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ plan: 'classic' }]) })
    // dealers GET (buyer owns check)
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) }) // buyer is not a dealer
    // dealers GET (seller user_id for reservation record)
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ user_id: SELLER_ID }]) })
    // user_credits GET
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(credits) })
    // user_credits PATCH (deduct)
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
    // priority_reservations POST
    .mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: RESERVATION_ID }]),
    })
    // vehicles PATCH (set priority_reserved_until)
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
    // credit_transactions POST
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
}

import handler from '../../../server/api/credits/priority-reserve.post'

// ── tests ──────────────────────────────────────────────────────────────────

describe('POST /api/credits/priority-reserve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: BUYER_ID })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 400 when vehicle not published', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(makeVehicle({ status: 'sold' })),
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 409 when vehicle is_protected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(makeVehicle({ is_protected: true })),
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when vehicle already has active priority reservation', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(makeVehicle({ priority_reserved_until: futureDate })),
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when seller has Premium immunity', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeVehicle()) })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ user_id: SELLER_ID }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ plan: 'premium' }]),
      })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when seller has Founding immunity', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeVehicle()) })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ user_id: SELLER_ID }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ plan: 'founding' }]),
      })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 402 when buyer has insufficient credits', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeVehicle()) })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ user_id: SELLER_ID }]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ plan: 'classic' }]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) }) // no buyer dealer
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ user_id: SELLER_ID }]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ balance: 1 }]) })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('returns reserved:true with reservationId and expiresAt on success', async () => {
    setupHappyPath()
    const result = await handler({} as any)
    expect(result).toMatchObject({
      reserved: true,
      reservationId: RESERVATION_ID,
      creditsRemaining: 3,
    })
    expect((result as any).expiresAt).toBeTruthy()
  })

  it('deducts exactly 2 credits', async () => {
    setupHappyPath([{ balance: 7 }])
    await handler({} as any)
    // user_credits PATCH is 7th fetch call (index 6)
    const patchCall = mockFetch.mock.calls[6]
    const body = JSON.parse(patchCall[1].body)
    expect(body.balance).toBe(5)
  })

  it('sets priority_reserved_until 48h in the future on vehicle', async () => {
    setupHappyPath()
    const before = Date.now()
    await handler({} as any)
    // vehicles PATCH is 9th call (index 8)
    const vehiclePatch = mockFetch.mock.calls[8]
    const body = JSON.parse(vehiclePatch[1].body)
    const expiresAt = new Date(body.priority_reserved_until).getTime()
    const expected48h = before + 48 * 60 * 60 * 1000
    // Allow 5s window
    expect(expiresAt).toBeGreaterThanOrEqual(expected48h - 5000)
    expect(expiresAt).toBeLessThanOrEqual(expected48h + 5000)
  })

  it('inserts credit_transaction with type=spend and credits=-2', async () => {
    setupHappyPath([{ balance: 4 }])
    await handler({} as any)
    // credit_transactions POST is 10th call (index 9)
    const txCall = mockFetch.mock.calls[9]
    const body = JSON.parse(txCall[1].body)
    expect(body.type).toBe('spend')
    expect(body.credits).toBe(-2)
    expect(body.balance_after).toBe(2)
    expect(body.user_id).toBe(BUYER_ID)
    expect(body.vehicle_id).toBe(VEHICLE_ID)
  })
})
