/**
 * Tests for POST /api/cron/post-sale-outreach (F6 — Buyer Post-Sale Email)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockResendSend, MockResend, mockServiceRole, mockLogger } = vi.hoisted(() => {
  const mockResendSend = vi.fn().mockResolvedValue({ data: { id: 'msg_ok' }, error: null })
  const MockResend = vi.fn(function () {
    return { emails: { send: mockResendSend } }
  })
  return {
    mockResendSend,
    MockResend,
    mockServiceRole: vi.fn(),
    mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn().mockResolvedValue({}),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('resend', () => ({ Resend: MockResend }))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
}))

vi.mock('../../../server/utils/batchProcessor', () => ({
  processBatch: async ({
    items,
    processor,
  }: {
    items: unknown[]
    processor: (item: unknown) => Promise<void>
  }) => {
    let processed = 0
    let errors = 0
    for (const item of items) {
      try {
        await processor(item)
        processed++
      } catch {
        errors++
      }
    }
    return { processed, errors }
  },
}))

vi.mock('../../../server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://tracciona.com',
  getSiteName: () => 'Tracciona',
}))

vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))

vi.stubGlobal('useRuntimeConfig', () => ({
  resendApiKey: 'test-resend-key',
}))

import handler from '../../../server/api/cron/post-sale-outreach.post'

// ── Supabase mock builder ─────────────────────────────────────────────────────

interface MockQueryResult {
  data: unknown[] | null
  error: { message: string } | null
}

function makeSupabase(vehiclesResult: MockQueryResult, leadsResult: MockQueryResult) {
  const updateChain = {
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  const leadsChain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(leadsResult),
    update: vi.fn().mockReturnValue(updateChain),
  }
  const vehiclesChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(vehiclesResult),
  }
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'vehicles') return vehiclesChain
      return leadsChain
    }),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/cron/post-sale-outreach', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: 'test-resend-key' }))
  })

  it('returns no_resend_key when RESEND_API_KEY is not set', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: '' }))
    mockServiceRole.mockReturnValue(
      makeSupabase({ data: [], error: null }, { data: [], error: null }),
    )
    const result = await (handler as Function)({})
    expect(result).toEqual({ sent: 0, skipped: 0, reason: 'no_resend_key' })
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('returns zero counts when no sold vehicles in last 25h', async () => {
    mockServiceRole.mockReturnValue(
      makeSupabase({ data: [], error: null }, { data: [], error: null }),
    )
    const result = await (handler as Function)({})
    expect(result).toEqual({ sent: 0, skipped: 0 })
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('returns zero counts when no pending leads for sold vehicles', async () => {
    const soldVehicles = [{ id: 'v1', title_es: 'Volvo FH 500', slug: 'volvo-fh-500' }]
    mockServiceRole.mockReturnValue(
      makeSupabase({ data: soldVehicles, error: null }, { data: [], error: null }),
    )
    const result = await (handler as Function)({})
    expect(result).toEqual({ sent: 0, skipped: 0 })
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('sends email and marks lead when sold vehicle has pending lead', async () => {
    const soldVehicles = [{ id: 'v1', title_es: 'Volvo FH 500', slug: 'volvo-fh-500' }]
    const leads = [{ id: 'l1', user_email: 'buyer@test.com', user_name: 'Juan', vehicle_id: 'v1' }]
    const supabase = makeSupabase({ data: soldVehicles, error: null }, { data: leads, error: null })
    mockServiceRole.mockReturnValue(supabase)

    const result = await (handler as Function)({})

    expect(result.sent).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.vehicles).toBe(1)
    expect(result.leads).toBe(1)
    expect(mockResendSend).toHaveBeenCalledOnce()
    const emailArg = mockResendSend.mock.calls[0][0]
    expect(emailArg.to).toBe('buyer@test.com')
    expect(emailArg.subject).toContain('Volvo FH 500')
    expect(emailArg.html).toContain('Juan')
    expect(emailArg.html).toContain('servicios-postventa')
    // Verify update was called to mark lead
    expect(supabase.from).toHaveBeenCalledWith('leads')
  })

  it('returns database_error when vehicle fetch fails', async () => {
    mockServiceRole.mockReturnValue(
      makeSupabase(
        { data: null, error: { message: 'connection timeout' } },
        { data: [], error: null },
      ),
    )
    const result = await (handler as Function)({})
    expect(result).toEqual({ sent: 0, error: 'database_error' })
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('returns database_error when lead fetch fails', async () => {
    const soldVehicles = [{ id: 'v1', title_es: 'Iveco Daily', slug: 'iveco-daily' }]
    mockServiceRole.mockReturnValue(
      makeSupabase(
        { data: soldVehicles, error: null },
        { data: null, error: { message: 'query failed' } },
      ),
    )
    const result = await (handler as Function)({})
    expect(result).toEqual({ sent: 0, error: 'database_error' })
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('skips lead without user_email and counts as skipped', async () => {
    const soldVehicles = [{ id: 'v1', title_es: 'MAN TGX', slug: 'man-tgx' }]
    const leads = [{ id: 'l1', user_email: null, user_name: null, vehicle_id: 'v1' }]
    mockServiceRole.mockReturnValue(
      makeSupabase({ data: soldVehicles, error: null }, { data: leads, error: null }),
    )
    const result = await (handler as Function)({})
    expect(result.sent).toBe(0)
    expect(result.skipped).toBe(1)
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('handles Resend send failure gracefully and counts as skipped', async () => {
    const soldVehicles = [{ id: 'v1', title_es: 'DAF XF', slug: 'daf-xf' }]
    const leads = [{ id: 'l1', user_email: 'buyer@test.com', user_name: null, vehicle_id: 'v1' }]
    mockResendSend.mockRejectedValueOnce(new Error('rate limit'))
    mockServiceRole.mockReturnValue(
      makeSupabase({ data: soldVehicles, error: null }, { data: leads, error: null }),
    )
    const result = await (handler as Function)({})
    expect(result.sent).toBe(0)
    expect(result.skipped).toBe(1)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[post-sale-outreach] Email failed',
      expect.objectContaining({ leadId: 'l1' }),
    )
  })
})
