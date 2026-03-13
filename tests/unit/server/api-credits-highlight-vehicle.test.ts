/**
 * Tests for POST /api/credits/highlight-vehicle
 * Task #15 — Color/fondo/marco especial (2 créditos)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── hoisted mocks ────────────────────────────────────────────────────────────

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

vi.mock('h3', () => ({ defineEventHandler: (fn: Function) => fn }))
vi.mock('#supabase/server', () => ({ serverSupabaseUser: mockSupabaseUser }))
vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCsrf', () => ({ verifyCsrf: mockVerifyCsrf }))
vi.mock('../../../server/utils/validateBody', () => ({ validateBody: mockValidateBody }))

vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-key',
  public: { supabaseUrl: 'https://test.supabase.co' },
}))

// ── constants ────────────────────────────────────────────────────────────────

const USER_ID = 'user-1'
const DEALER_ID = 'dealer-1'
const VEHICLE_ID = 'vehicle-1'

// ── helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown) {
  return { ok: true, json: vi.fn().mockResolvedValue(data) }
}

function setupHappyPath(opts: { style?: string; currentStyle?: string | null; balance?: number }) {
  const { style = 'gold', currentStyle = null, balance = 5 } = opts
  mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID, style })
  mockFetch
    .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }])) // GET dealers
    .mockResolvedValueOnce(
      jsonResponse([
        {
          id: VEHICLE_ID,
          dealer_id: DEALER_ID,
          highlight_style: currentStyle,
          status: 'published',
        },
      ]),
    ) // GET vehicle
    .mockResolvedValueOnce(jsonResponse([{ balance }])) // GET user_credits
    .mockResolvedValueOnce(jsonResponse({})) // PATCH user_credits
    .mockResolvedValueOnce(jsonResponse({})) // POST credit_transactions
    .mockResolvedValueOnce(jsonResponse({})) // PATCH vehicles
}

import handler from '../../../server/api/credits/highlight-vehicle.post'

// ── tests ────────────────────────────────────────────────────────────────────

describe('POST /api/credits/highlight-vehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: USER_ID })
    mockVerifyCsrf.mockReturnValue(undefined)
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 for invalid style', async () => {
    // Style is validated before any fetch calls in the handler
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID, style: 'rainbow' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 403 when no dealer account', async () => {
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID, style: 'gold' })
    mockFetch.mockResolvedValueOnce(jsonResponse([])) // no dealers
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID, style: 'gold' })
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(jsonResponse([]))
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when vehicle belongs to another dealer', async () => {
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID, style: 'gold' })
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(
        jsonResponse([
          { id: VEHICLE_ID, dealer_id: 'other-dealer', highlight_style: null, status: 'published' },
        ]),
      )
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns alreadyApplied when same style already set', async () => {
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID, style: 'gold' })
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(
        jsonResponse([
          { id: VEHICLE_ID, dealer_id: DEALER_ID, highlight_style: 'gold', status: 'published' },
        ]),
      )
    const result = await handler({} as any)
    expect(result).toEqual({ alreadyApplied: true, style: 'gold' })
    // No credit deduction
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws 402 when insufficient credits', async () => {
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID, style: 'gold' })
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(
        jsonResponse([
          { id: VEHICLE_ID, dealer_id: DEALER_ID, highlight_style: null, status: 'published' },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([{ balance: 1 }])) // only 1 credit
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('returns highlighted:true on success', async () => {
    setupHappyPath({ style: 'gold', balance: 5 })
    const result = await handler({} as any)
    expect(result).toEqual({ highlighted: true, style: 'gold', creditsRemaining: 3 })
  })

  it('deducts exactly 2 credits from balance', async () => {
    setupHappyPath({ style: 'premium', balance: 7 })
    const result = await handler({} as any)
    expect((result as any).creditsRemaining).toBe(5)

    // PATCH user_credits call (index 3)
    const patchCall = mockFetch.mock.calls[3]
    const body = JSON.parse(patchCall[1].body)
    expect(body.balance).toBe(5)
  })

  it('records credit_transaction with correct fields', async () => {
    setupHappyPath({ style: 'spotlight', balance: 4 })
    await handler({} as any)

    // POST credit_transactions (index 4)
    const txCall = mockFetch.mock.calls[4]
    const body = JSON.parse(txCall[1].body)
    expect(body.type).toBe('spend')
    expect(body.credits).toBe(-2)
    expect(body.balance_after).toBe(2)
    expect(body.user_id).toBe(USER_ID)
    expect(body.vehicle_id).toBe(VEHICLE_ID)
  })

  it('patches vehicle with correct highlight_style', async () => {
    setupHappyPath({ style: 'urgent', balance: 3 })
    await handler({} as any)

    // PATCH vehicles (index 5)
    const vehiclePatch = mockFetch.mock.calls[5]
    const body = JSON.parse(vehiclePatch[1].body)
    expect(body.highlight_style).toBe('urgent')
  })

  it('works for all 4 valid styles', async () => {
    for (const style of ['gold', 'premium', 'spotlight', 'urgent']) {
      vi.clearAllMocks()
      mockSupabaseUser.mockResolvedValue({ id: USER_ID })
      setupHappyPath({ style, balance: 10 })
      const result = await handler({} as any)
      expect((result as any).highlighted).toBe(true)
      expect((result as any).style).toBe(style)
    }
  })
})
