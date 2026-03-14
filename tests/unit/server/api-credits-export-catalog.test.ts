/**
 * Tests for POST /api/credits/export-catalog
 * Task #16 — Exportar catálogo gated por créditos
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── hoisted mocks ────────────────────────────────────────────────────────────

const { mockSafeError, mockSupabaseUser, mockVerifyCsrf, mockFetch } = vi.hoisted(() => {
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
  }
})

vi.mock('h3', () => ({ defineEventHandler: (fn: Function) => fn }))
vi.mock('#supabase/server', () => ({ serverSupabaseUser: mockSupabaseUser }))
vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCsrf', () => ({ verifyCsrf: mockVerifyCsrf }))

vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-key',
  public: { supabaseUrl: 'https://test.supabase.co' },
}))

// ── constants ────────────────────────────────────────────────────────────────

const USER_ID = 'user-1'
const DEALER_ID = 'dealer-1'

// ── helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown) {
  return { ok: true, json: vi.fn().mockResolvedValue(data) }
}

function setupMocks(plan: string, balance = 5) {
  mockFetch
    .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }])) // GET dealers
    .mockResolvedValueOnce(jsonResponse([{ plan }])) // GET subscriptions
    .mockResolvedValueOnce(jsonResponse([{ balance }])) // GET user_credits (basic/classic only)
    .mockResolvedValueOnce(jsonResponse({})) // PATCH user_credits
    .mockResolvedValueOnce(jsonResponse({})) // POST credit_transactions
}

import handler from '../../../server/api/credits/export-catalog.post'

// ── tests ────────────────────────────────────────────────────────────────────

describe('POST /api/credits/export-catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: USER_ID })
    mockVerifyCsrf.mockReturnValue(undefined)
  })

  it('throws 401 when unauthenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when no dealer account', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([])) // no dealers
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when plan is free (no active sub)', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(jsonResponse([])) // no active subscription
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  // ── Premium / Founding: free ──────────────────────────────────────────────

  it('returns free:true for premium plan (no credit deduction)', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(jsonResponse([{ plan: 'premium' }]))
    const result = await handler({} as any)
    expect(result).toMatchObject({ free: true, plan: 'premium', creditsUsed: 0 })
    // Only 2 fetch calls (dealer + subscription), no credit calls
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns free:true for founding plan', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(jsonResponse([{ plan: 'founding' }]))
    const result = await handler({} as any)
    expect(result).toMatchObject({ free: true, plan: 'founding' })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  // ── Basic / Classic: paid ─────────────────────────────────────────────────

  it('throws 402 when basic plan with 0 credits', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(jsonResponse([{ plan: 'basic' }]))
      .mockResolvedValueOnce(jsonResponse([{ balance: 0 }]))
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('throws 402 when classic plan with 0 credits', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(jsonResponse([{ plan: 'classic' }]))
      .mockResolvedValueOnce(jsonResponse([{ balance: 0 }]))
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('deducts 1 credit for basic plan and returns result', async () => {
    setupMocks('basic', 4)
    const result = await handler({} as any)
    expect(result).toMatchObject({
      free: false,
      plan: 'basic',
      creditsUsed: 1,
      creditsRemaining: 3,
    })
  })

  it('deducts 1 credit for classic plan', async () => {
    setupMocks('classic', 2)
    const result = await handler({} as any)
    expect(result).toMatchObject({
      free: false,
      plan: 'classic',
      creditsUsed: 1,
      creditsRemaining: 1,
    })
  })

  it('patches user_credits with correct new balance', async () => {
    setupMocks('basic', 6)
    await handler({} as any)
    // PATCH user_credits is the 4th call (index 3)
    const patchCall = mockFetch.mock.calls[3]
    const body = JSON.parse(patchCall[1].body)
    expect(body.balance).toBe(5)
  })

  it('records credit_transaction with spend type', async () => {
    setupMocks('classic', 3)
    await handler({} as any)
    // POST credit_transactions is the 5th call (index 4)
    const txCall = mockFetch.mock.calls[4]
    const body = JSON.parse(txCall[1].body)
    expect(body.type).toBe('spend')
    expect(body.credits).toBe(-1)
    expect(body.balance_after).toBe(2)
    expect(body.user_id).toBe(USER_ID)
  })

  it('uses balance=0 when no user_credits row exists', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: DEALER_ID }]))
      .mockResolvedValueOnce(jsonResponse([{ plan: 'basic' }]))
      .mockResolvedValueOnce(jsonResponse([])) // no credits row
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 402 })
  })
})
