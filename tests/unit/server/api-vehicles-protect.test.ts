/**
 * Tests for POST /api/vehicles/:id/protect
 * Task #10 — is_protected flag (2 credits)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockSafeError, mockSupabaseUser, mockVerifyCsrf, mockFetch, mockGetRouterParam } =
  vi.hoisted(() => {
    const mockSafeError = vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    })
    return {
      mockSafeError,
      mockSupabaseUser: vi.fn().mockResolvedValue(null),
      mockVerifyCsrf: vi.fn(),
      mockFetch: vi.fn(),
      mockGetRouterParam: vi.fn().mockReturnValue('vehicle-id-1'),
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

vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-service-key',
  public: {},
}))

vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')

// ── helpers ────────────────────────────────────────────────────────────────

const VEHICLE_ID = '22222222-2222-2222-2222-222222222222'
const DEALER_ID = 'dealer-1'
const USER_ID = 'user-1'

function setupFetches(opts: {
  vehicles?: unknown[]
  dealers?: unknown[]
  credits?: unknown[]
  patchCreditsOk?: boolean
  patchVehicleOk?: boolean
  insertTxOk?: boolean
}) {
  const {
    vehicles = [{ id: VEHICLE_ID, is_protected: false, status: 'published', dealer_id: DEALER_ID }],
    dealers = [{ id: DEALER_ID }],
    credits = [{ balance: 5 }],
    patchCreditsOk = true,
    patchVehicleOk = true,
    insertTxOk = true,
  } = opts

  mockFetch
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(vehicles) }) // vehicles GET
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(dealers) }) // dealers GET
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(credits) }) // user_credits GET
    .mockResolvedValueOnce({ ok: patchCreditsOk, json: vi.fn().mockResolvedValue({}) }) // user_credits PATCH
    .mockResolvedValueOnce({ ok: patchVehicleOk, json: vi.fn().mockResolvedValue({}) }) // vehicles PATCH
    .mockResolvedValueOnce({ ok: insertTxOk, json: vi.fn().mockResolvedValue({}) }) // credit_transactions POST
}

import protectHandler from '../../../server/api/vehicles/[id]/protect.post'

// ── tests ──────────────────────────────────────────────────────────────────

describe('POST /api/vehicles/:id/protect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: USER_ID })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockGetRouterParam.mockReturnValue(VEHICLE_ID)
  })

  it('throws 401 when user is not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when vehicle ID is missing', async () => {
    mockGetRouterParam.mockReturnValue(null)
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle does not exist', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) }) // no vehicle
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 400 when vehicle is not published', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue([
          { id: VEHICLE_ID, is_protected: false, status: 'draft', dealer_id: DEALER_ID },
        ]),
    })
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 403 when dealer not found for user', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { id: VEHICLE_ID, is_protected: false, status: 'published', dealer_id: DEALER_ID },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) }) // no dealer
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when dealer does not own the vehicle', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: VEHICLE_ID,
            is_protected: false,
            status: 'published',
            dealer_id: 'other-dealer',
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ id: DEALER_ID }]) })
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns alreadyProtected when vehicle is already protected', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { id: VEHICLE_ID, is_protected: true, status: 'published', dealer_id: DEALER_ID },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ id: DEALER_ID }]) })
    const result = await protectHandler({} as any)
    expect(result).toEqual({ alreadyProtected: true })
  })

  it('throws 402 when no credits row found', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { id: VEHICLE_ID, is_protected: false, status: 'published', dealer_id: DEALER_ID },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ id: DEALER_ID }]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) }) // no credits
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('throws 402 when balance is less than 2', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { id: VEHICLE_ID, is_protected: false, status: 'published', dealer_id: DEALER_ID },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ id: DEALER_ID }]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ balance: 1 }]) })
    await expect(protectHandler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('returns protected:true and creditsRemaining on success', async () => {
    setupFetches({ credits: [{ balance: 4 }] })
    const result = await protectHandler({} as any)
    expect(result).toEqual({ protected: true, creditsRemaining: 2 })
  })

  it('deducts exactly 2 credits from balance', async () => {
    setupFetches({ credits: [{ balance: 10 }] })
    await protectHandler({} as any)
    // 4th fetch is the user_credits PATCH
    const patchCall = mockFetch.mock.calls[3]
    const body = JSON.parse(patchCall[1].body)
    expect(body.balance).toBe(8)
  })

  it('sets is_protected=true on the vehicle', async () => {
    setupFetches({})
    await protectHandler({} as any)
    // 5th fetch is vehicles PATCH
    const vehiclePatch = mockFetch.mock.calls[4]
    const body = JSON.parse(vehiclePatch[1].body)
    expect(body.is_protected).toBe(true)
  })

  it('inserts credit_transaction with type=spend and credits=-2', async () => {
    setupFetches({ credits: [{ balance: 6 }] })
    await protectHandler({} as any)
    // 6th fetch is credit_transactions POST
    const txCall = mockFetch.mock.calls[5]
    const body = JSON.parse(txCall[1].body)
    expect(body.type).toBe('spend')
    expect(body.credits).toBe(-2)
    expect(body.balance_after).toBe(4)
    expect(body.user_id).toBe(USER_ID)
    expect(body.vehicle_id).toBe(VEHICLE_ID)
  })
})
