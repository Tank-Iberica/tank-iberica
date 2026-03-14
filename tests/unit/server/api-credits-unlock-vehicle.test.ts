/**
 * Tests for POST /api/credits/unlock-vehicle
 * Task #9 — vehicle_unlocks early access
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

function makeJsonFetch(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(data),
  })
}

/** Sets up fetch to return in order: vehicles, unlocks, credits */
function setupFetches(opts: {
  vehicles?: unknown[]
  unlocks?: unknown[]
  credits?: unknown[]
  patchOk?: boolean
  insertUnlockOk?: boolean
  insertTxOk?: boolean
}) {
  const {
    vehicles = [{ id: 'v1', visible_from: futureDate(), status: 'published' }],
    unlocks = [],
    credits = [{ balance: 5 }],
    patchOk = true,
    insertUnlockOk = true,
    insertTxOk = true,
  } = opts

  mockFetch
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(vehicles) }) // vehicles GET
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(unlocks) }) // vehicle_unlocks GET
    .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(credits) }) // user_credits GET
    .mockResolvedValueOnce({ ok: patchOk, json: vi.fn().mockResolvedValue({}) }) // user_credits PATCH
    .mockResolvedValueOnce({ ok: insertUnlockOk, json: vi.fn().mockResolvedValue({}) }) // vehicle_unlocks POST
    .mockResolvedValueOnce({ ok: insertTxOk, json: vi.fn().mockResolvedValue({}) }) // credit_transactions POST
}

function futureDate() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString()
}

const VEHICLE_ID = '11111111-1111-1111-1111-111111111111'

// ── import handler ─────────────────────────────────────────────────────────

import unlockHandler from '../../../server/api/credits/unlock-vehicle.post'

// ── tests ──────────────────────────────────────────────────────────────────

describe('POST /api/credits/unlock-vehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockValidateBody.mockResolvedValue({ vehicleId: VEHICLE_ID })
  })

  it('throws 401 when user is not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(unlockHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 404 when vehicle does not exist', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) })
    await expect(unlockHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 400 when vehicle is not published', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: 'v1', visible_from: futureDate(), status: 'draft' }]),
    })
    await expect(unlockHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns alreadyVisible when visible_from is in the past', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: 'v1', visible_from: pastDate, status: 'published' }]),
    })
    const result = await unlockHandler({} as any)
    expect(result).toEqual({ alreadyVisible: true })
  })

  it('returns alreadyVisible when visible_from is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: 'v1', visible_from: null, status: 'published' }]),
    })
    const result = await unlockHandler({} as any)
    expect(result).toEqual({ alreadyVisible: true })
  })

  it('returns alreadyVisible when vehicle is_protected (bypasses visible_from delay)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue([
          { id: 'v1', visible_from: futureDate(), is_protected: true, status: 'published' },
        ]),
    })
    const result = await unlockHandler({} as any)
    expect(result).toEqual({ alreadyVisible: true })
  })

  it('returns alreadyUnlocked when existing unlock record found', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([{ id: 'v1', visible_from: futureDate(), status: 'published' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 'existing-unlock' }]),
      })
    const result = await unlockHandler({} as any)
    expect(result).toEqual({ alreadyUnlocked: true })
  })

  it('throws 402 when user has no credits row', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([{ id: 'v1', visible_from: futureDate(), status: 'published' }]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) }) // no unlocks
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) }) // no credits row
    await expect(unlockHandler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('throws 402 when balance is 0', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([{ id: 'v1', visible_from: futureDate(), status: 'published' }]),
      })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ balance: 0 }]) })
    await expect(unlockHandler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('returns unlocked:true and creditsRemaining on success', async () => {
    setupFetches({ credits: [{ balance: 3 }] })
    const result = await unlockHandler({} as any)
    expect(result).toEqual({ unlocked: true, creditsRemaining: 2 })
  })

  it('deducts exactly 1 credit from balance', async () => {
    setupFetches({ credits: [{ balance: 10 }] })
    await unlockHandler({} as any)
    // 4th fetch call is the PATCH with new balance
    const patchCall = mockFetch.mock.calls[3]
    const body = JSON.parse(patchCall[1].body)
    expect(body.balance).toBe(9)
  })

  it('inserts vehicle_unlock record with correct data', async () => {
    setupFetches({})
    await unlockHandler({} as any)
    // 5th fetch is vehicle_unlocks POST
    const insertCall = mockFetch.mock.calls[4]
    const body = JSON.parse(insertCall[1].body)
    expect(body.user_id).toBe('user-1')
    expect(body.vehicle_id).toBe(VEHICLE_ID)
    expect(body.credits_spent).toBe(1)
  })

  it('inserts credit_transaction record with type=spend', async () => {
    setupFetches({ credits: [{ balance: 5 }] })
    await unlockHandler({} as any)
    // 6th fetch is credit_transactions POST
    const txCall = mockFetch.mock.calls[5]
    const body = JSON.parse(txCall[1].body)
    expect(body.type).toBe('spend')
    expect(body.credits).toBe(-1)
    expect(body.balance_after).toBe(4)
    expect(body.user_id).toBe('user-1')
    expect(body.vehicle_id).toBe(VEHICLE_ID)
  })
})
