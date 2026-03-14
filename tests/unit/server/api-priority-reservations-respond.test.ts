/**
 * Tests for POST /api/priority-reservations/:id/respond
 * Task #11 — Seller respond to Reserva Prioritaria
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  mockSafeError,
  mockSupabaseUser,
  mockVerifyCsrf,
  mockValidateBody,
  mockFetch,
  mockGetRouterParam,
} = vi.hoisted(() => {
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
    mockGetRouterParam: vi.fn().mockReturnValue('res-1'),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getRouterParam: mockGetRouterParam,
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

const RESERVATION_ID = 'res-1'
const VEHICLE_ID = '44444444-4444-4444-4444-444444444444'
const BUYER_ID = 'buyer-1'
const SELLER_ID = 'seller-1'

function futureExpiry() {
  return new Date(Date.now() + 86400000).toISOString()
}

function makeReservation(overrides: Record<string, unknown> = {}) {
  return [
    {
      id: RESERVATION_ID,
      vehicle_id: VEHICLE_ID,
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      status: 'pending',
      credits_spent: 2,
      expires_at: futureExpiry(),
      ...overrides,
    },
  ]
}

import respondHandler from '../../../server/api/priority-reservations/[id]/respond.post'

// ── tests ──────────────────────────────────────────────────────────────────

describe('POST /api/priority-reservations/:id/respond', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: SELLER_ID })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockValidateBody.mockResolvedValue({ response: 'accepted' })
    mockGetRouterParam.mockReturnValue(RESERVATION_ID)
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(respondHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when reservation ID is missing', async () => {
    mockGetRouterParam.mockReturnValue(null)
    await expect(respondHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when reservation not found', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) })
    await expect(respondHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when user is not the seller', async () => {
    mockSupabaseUser.mockResolvedValue({ id: 'other-user' })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(makeReservation()),
    })
    await expect(respondHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 409 when reservation already responded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(makeReservation({ status: 'accepted' })),
    })
    await expect(respondHandler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when reservation expired', async () => {
    const pastExpiry = new Date(Date.now() - 1000).toISOString()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(makeReservation({ expires_at: pastExpiry })),
    })
    await expect(respondHandler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('returns response:accepted on acceptance (no refund)', async () => {
    mockValidateBody.mockResolvedValue({ response: 'accepted' })
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeReservation()) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) }) // PATCH reservation
    const result = await respondHandler({} as any)
    expect(result).toEqual({ response: 'accepted' })
    // Only 2 fetch calls: GET reservation + PATCH reservation status
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('refunds buyer credits on rejection', async () => {
    mockValidateBody.mockResolvedValue({ response: 'rejected' })
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeReservation()) }) // GET reservation
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) }) // PATCH status to rejected
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ balance: 3 }]) }) // GET buyer credits
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) }) // PATCH buyer credits
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) }) // POST credit_transaction
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) }) // PATCH reservation to refunded
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) }) // PATCH vehicle clear

    const result = await respondHandler({} as any)
    expect(result).toEqual({ response: 'rejected', refunded: true, creditsRefunded: 2 })
  })

  it('adds exactly credits_spent credits back to buyer on rejection', async () => {
    mockValidateBody.mockResolvedValue({ response: 'rejected' })
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeReservation()) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ balance: 5 }]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })

    await respondHandler({} as any)
    // 4th call (index 3) = buyer credits PATCH
    const patchCall = mockFetch.mock.calls[3]
    const body = JSON.parse(patchCall[1].body)
    expect(body.balance).toBe(7) // 5 + 2
  })

  it('clears vehicle priority_reserved_until on rejection', async () => {
    mockValidateBody.mockResolvedValue({ response: 'rejected' })
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeReservation()) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ balance: 2 }]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })

    await respondHandler({} as any)
    // 7th call (index 6) = vehicles PATCH
    const vehiclePatch = mockFetch.mock.calls[6]
    const body = JSON.parse(vehiclePatch[1].body)
    expect(body.priority_reserved_until).toBeNull()
  })

  it('inserts refund credit_transaction on rejection', async () => {
    mockValidateBody.mockResolvedValue({ response: 'rejected' })
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(makeReservation()) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ balance: 4 }]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })

    await respondHandler({} as any)
    // 5th call (index 4) = credit_transactions POST
    const txCall = mockFetch.mock.calls[4]
    const body = JSON.parse(txCall[1].body)
    expect(body.type).toBe('refund')
    expect(body.credits).toBe(2)
    expect(body.balance_after).toBe(6)
    expect(body.user_id).toBe(BUYER_ID)
  })
})
