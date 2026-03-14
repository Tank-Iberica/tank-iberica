/**
 * Tests for POST /api/cron/dealer-onboarding
 * Covers helpers (resolveName, getDueSteps, buildOnboardingHtml) and handler integration.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockVerifyCronSecret, mockLogger, mockResendSend, MockResend } = vi.hoisted(() => {
  const mockResendSend = vi.fn().mockResolvedValue({ data: { id: 'msg_ok' }, error: null })
  // Regular function for constructor compatibility
  const MockResend = vi.fn(function () {
    return { emails: { send: mockResendSend } }
  })
  return {
    mockVerifyCronSecret: vi.fn(),
    mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    mockResendSend,
    MockResend,
  }
})

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: vi.fn(),
}))
vi.mock('../../../server/utils/safeError', () => ({
  safeError: (status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as Record<string, unknown>).statusCode = status
    return err
  },
}))
vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))
vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))
vi.mock('../../../server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://tracciona.com',
  getSiteName: () => 'Tracciona',
  getSiteEmail: () => 'hola@tracciona.com',
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
vi.mock('resend', () => ({ Resend: MockResend }))

vi.stubGlobal('useRuntimeConfig', () => ({
  resendApiKey: 'test-resend-key',
  cronSecret: 'test-secret',
}))

import { serverSupabaseServiceRole } from '#supabase/server'
import onboardingHandler, {
  resolveName,
  getDueSteps,
  buildOnboardingHtml,
  ONBOARDING_SCHEDULE,
  getPendingDealers,
  getSentSteps,
  markStepSent,
} from '../../../server/api/cron/dealer-onboarding.post'

// ── Supabase mock builder ─────────────────────────────────────────────────────

const SAMPLE_DEALERS = [
  {
    id: 'dealer-1',
    user_id: 'user-1',
    company_name: { es: 'Vehículos López', en: 'Lopez Vehicles' },
    email: 'lopez@example.com',
    created_at: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(), // day 0
    locale: 'es',
  },
  {
    id: 'dealer-2',
    user_id: null,
    company_name: 'Smith Trucks',
    email: 'smith@example.com',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // day 3
    locale: 'en',
  },
]

function makeSupabase(
  opts: {
    dealers?: typeof SAMPLE_DEALERS
    sentSteps?: number[]
    userEmail?: string | null
  } = {},
) {
  const { dealers = SAMPLE_DEALERS, sentSteps = [], userEmail = null } = opts

  const upsertMock = vi.fn().mockResolvedValue({ error: null })

  const selectMock = vi.fn((cols: string) => {
    // dealer_onboarding_emails.step query — single .eq() chain
    if (cols === 'step') {
      return {
        eq: vi.fn().mockResolvedValue({
          data: sentSteps.map((s) => ({ step: s })),
          error: null,
        }),
      }
    }
    // users.email query
    if (cols === 'email') {
      return {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: userEmail ? { email: userEmail } : null,
            error: null,
          }),
        }),
      }
    }
    // dealers query
    return {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: dealers, error: null }),
    }
  })

  return {
    from: vi.fn((table: string) => {
      if (table === 'dealer_onboarding_emails') {
        return {
          select: selectMock,
          upsert: upsertMock,
        }
      }
      if (table === 'users') {
        return { select: selectMock }
      }
      // dealers table
      return { select: selectMock }
    }),
  }
}

// ── resolveName tests ─────────────────────────────────────────────────────────

describe('resolveName', () => {
  it('returns localized es name from JSONB', () => {
    expect(resolveName({ es: 'Empresa ES', en: 'Company EN' }, 'es')).toBe('Empresa ES')
  })

  it('returns localized en name from JSONB', () => {
    expect(resolveName({ es: 'Empresa ES', en: 'Company EN' }, 'en')).toBe('Company EN')
  })

  it('falls back to es when locale not found', () => {
    expect(resolveName({ es: 'Empresa ES' }, 'fr')).toBe('Empresa ES')
  })

  it('returns string directly when not JSONB', () => {
    expect(resolveName('Trucks SL', 'es')).toBe('Trucks SL')
  })

  it('returns "Dealer" for null', () => {
    expect(resolveName(null, 'es')).toBe('Dealer')
  })
})

// ── getDueSteps tests ─────────────────────────────────────────────────────────

describe('getDueSteps', () => {
  it('returns step 0 on day 0', () => {
    expect(getDueSteps(0)).toEqual([0])
  })

  it('returns steps 0 and 1 on day 1', () => {
    expect(getDueSteps(1)).toEqual([0, 1])
  })

  it('returns steps 0, 1, 2 on day 3', () => {
    expect(getDueSteps(3)).toEqual([0, 1, 2])
  })

  it('returns steps 0-3 on day 7', () => {
    expect(getDueSteps(7)).toEqual([0, 1, 2, 3])
  })

  it('returns all 5 steps on day 14', () => {
    expect(getDueSteps(14)).toEqual([0, 1, 2, 3, 4])
  })

  it('returns all steps beyond day 14', () => {
    expect(getDueSteps(20)).toEqual([0, 1, 2, 3, 4])
  })

  it('returns empty array before day 0 (negative days)', () => {
    // All steps have dayOffset >= 0, so day -1 returns nothing
    expect(getDueSteps(-1)).toEqual([])
  })
})

// ── buildOnboardingHtml tests ─────────────────────────────────────────────────

describe('buildOnboardingHtml', () => {
  it('contains dealer name', () => {
    const html = buildOnboardingHtml(0, 'López SL', 'https://tracciona.com', 'es')
    expect(html).toContain('López SL')
  })

  it('step 0 in ES contains publish CTA', () => {
    const html = buildOnboardingHtml(0, 'Test', 'https://tracciona.com', 'es')
    expect(html).toContain('Publicar mi primer vehículo')
    expect(html).toContain('/dashboard/vehiculos/nuevo')
  })

  it('step 0 in EN contains publish CTA in english', () => {
    const html = buildOnboardingHtml(0, 'Test', 'https://tracciona.com', 'en')
    expect(html).toContain('Publish my first vehicle')
  })

  it('step 2 contains tools URL', () => {
    const html = buildOnboardingHtml(2, 'Test', 'https://tracciona.com', 'es')
    expect(html).toContain('/dashboard/herramientas')
  })

  it('step 3 contains stats URL', () => {
    const html = buildOnboardingHtml(3, 'Test', 'https://tracciona.com', 'es')
    expect(html).toContain('/dashboard/estadisticas')
  })

  it('all 5 steps produce non-empty valid HTML', () => {
    for (let step = 0; step <= 4; step++) {
      const html = buildOnboardingHtml(step, 'ACME', 'https://tracciona.com', 'es')
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('</html>')
      expect(html.length).toBeGreaterThan(500)
    }
  })

  it('sets lang=en when locale is en', () => {
    const html = buildOnboardingHtml(1, 'Test', 'https://tracciona.com', 'en')
    expect(html).toContain('lang="en"')
  })
})

// ── ONBOARDING_SCHEDULE constant tests ───────────────────────────────────────

describe('ONBOARDING_SCHEDULE', () => {
  it('has 5 steps', () => {
    expect(ONBOARDING_SCHEDULE).toHaveLength(5)
  })

  it('day offsets are 0, 1, 3, 7, 14', () => {
    expect(ONBOARDING_SCHEDULE.map((s) => s.dayOffset)).toEqual([0, 1, 3, 7, 14])
  })

  it('all steps have ES and EN subjects', () => {
    for (const step of ONBOARDING_SCHEDULE) {
      expect(step.subjectEs.length).toBeGreaterThan(5)
      expect(step.subjectEn.length).toBeGreaterThan(5)
    }
  })
})

// ── Handler integration tests ─────────────────────────────────────────────────

describe('POST /api/cron/dealer-onboarding — handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockResendSend.mockResolvedValue({ data: { id: 'msg_ok' }, error: null })
  })

  it('calls verifyCronSecret', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(makeSupabase({ dealers: [] }) as never)
    await onboardingHandler({} as never)
    expect(mockVerifyCronSecret).toHaveBeenCalled()
  })

  it('returns no_dealers when no active dealers in window', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(makeSupabase({ dealers: [] }) as never)
    const result = await onboardingHandler({} as never)
    expect(result).toMatchObject({ sent: 0, reason: 'no_dealers' })
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('No active dealers in onboarding window'),
    )
  })

  it('sends step 0 to a new dealer (day 0)', async () => {
    const day0Dealer = [{ ...SAMPLE_DEALERS[0], created_at: new Date().toISOString() }]
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: day0Dealer, sentSteps: [] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).sent).toBe(1)
    expect(mockResendSend).toHaveBeenCalledTimes(1)
  })

  it('skips steps already sent', async () => {
    const day7Dealer = [
      {
        ...SAMPLE_DEALERS[0],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
    // Steps 0-3 already sent, only step 3 was just due but already sent
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: day7Dealer, sentSteps: [0, 1, 2, 3] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).sent).toBe(0)
    expect((result as Record<string, number>).skipped).toBe(1)
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('sends multiple pending steps for a dealer on day 3', async () => {
    const day3Dealer = [
      {
        ...SAMPLE_DEALERS[0],
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
    // Steps 0 and 1 already sent, step 2 pending
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: day3Dealer, sentSteps: [0, 1] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).sent).toBe(1)
    expect(mockResendSend).toHaveBeenCalledTimes(1)
    // Subject should match step 2
    const callArg = mockResendSend.mock.calls[0][0]
    expect(callArg.subject).toContain('herramientas')
  })

  it('falls back to users.email when dealer.email is null', async () => {
    const dealerNoEmail = [
      { ...SAMPLE_DEALERS[0], email: null, created_at: new Date().toISOString() },
    ]
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({
        dealers: dealerNoEmail,
        sentSteps: [],
        userEmail: 'fallback@example.com',
      }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).sent).toBe(1)
    const callArg = mockResendSend.mock.calls[0][0]
    expect(callArg.to).toBe('fallback@example.com')
  })

  it('skips dealer with no email and no user email', async () => {
    const dealerNoEmail = [
      { ...SAMPLE_DEALERS[0], email: null, user_id: null, created_at: new Date().toISOString() },
    ]
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: dealerNoEmail, sentSteps: [] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).sent).toBe(0)
    expect((result as Record<string, number>).skipped).toBe(1)
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('No email for dealer'))
  })

  it('counts errors when Resend returns an error object', async () => {
    mockResendSend.mockResolvedValue({ data: null, error: { message: 'Rate limit' } })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: [SAMPLE_DEALERS[0]], sentSteps: [] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).errors).toBe(1)
    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('counts errors when Resend throws', async () => {
    mockResendSend.mockRejectedValue(new Error('Network error'))
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: [SAMPLE_DEALERS[0]], sentSteps: [] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).errors).toBe(1)
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Send failed'))
  })

  it('mock mode (no RESEND_API_KEY) increments skipped and marks step sent', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: '', cronSecret: 'x' }))
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: [SAMPLE_DEALERS[0]], sentSteps: [] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect((result as Record<string, number>).skipped).toBe(1)
    expect((result as Record<string, number>).sent).toBe(0)
    expect(mockResendSend).not.toHaveBeenCalled()
    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({
      resendApiKey: 'test-resend-key',
      cronSecret: 'test-secret',
    }))
  })

  it('sends EN subject to dealer with en locale', async () => {
    const enDealer = [{ ...SAMPLE_DEALERS[1], created_at: new Date().toISOString() }]
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: enDealer, sentSteps: [] }) as never,
    )
    await onboardingHandler({} as never)
    const callArg = mockResendSend.mock.calls[0][0]
    expect(callArg.subject).toBe(ONBOARDING_SCHEDULE[0].subjectEn)
  })

  it('returns summary with dealers count and batchResult', async () => {
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      makeSupabase({ dealers: SAMPLE_DEALERS, sentSteps: [] }) as never,
    )
    const result = await onboardingHandler({} as never)
    expect(result).toHaveProperty('dealers', 2)
    expect(result).toHaveProperty('batchResult')
  })
})

// ── getPendingDealers tests ───────────────────────────────────────────────────

describe('getPendingDealers', () => {
  it('returns dealers from supabase', async () => {
    const supabase = makeSupabase({ dealers: SAMPLE_DEALERS })
    const result = await getPendingDealers(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(result).toHaveLength(2)
  })

  it('returns empty array on error', async () => {
    const broken = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        })),
      })),
    }
    const result = await getPendingDealers(
      broken as unknown as import('@supabase/supabase-js').SupabaseClient,
    )
    expect(result).toHaveLength(0)
    expect(mockLogger.error).toHaveBeenCalled()
  })
})

// ── getSentSteps / markStepSent tests ────────────────────────────────────────

describe('getSentSteps', () => {
  it('returns array of sent step numbers', async () => {
    const supabase = makeSupabase({ sentSteps: [0, 1] })
    const steps = await getSentSteps(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
      'dealer-1',
    )
    expect(steps).toEqual([0, 1])
  })
})

describe('markStepSent', () => {
  it('calls upsert with correct dealer_id and step', async () => {
    const upsertFn = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn(() => ({ upsert: upsertFn, select: vi.fn() })),
    }
    await markStepSent(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
      'dealer-xyz',
      2,
    )
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ dealer_id: 'dealer-xyz', step: 2 }),
    )
  })
})
