import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardIndex } from '../../app/composables/dashboard/useDashboardIndex'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: null as unknown }
const mockStats = { value: { activeListings: 0 } }

function stubDealerDashboard(overrides = {}) {
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    stats: mockStats,
    recentLeads: { value: [] },
    topVehicles: { value: [] },
    loading: { value: false },
    error: { value: null },
    loadDashboardData: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = null
  mockStats.value = { activeListings: 0 }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useSubscriptionPlan', () => ({
    currentPlan: { value: 'free' },
    planLimits: { value: {} },
    fetchSubscription: vi.fn().mockResolvedValue(undefined),
  }))
  vi.stubGlobal('useDealerHealthScore', () => ({
    score: { value: { total: 75 } },
    calculateScore: vi.fn().mockResolvedValue(undefined),
  }))
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
  vi.stubGlobal('formatDate', (d: string) => d)
  vi.stubGlobal('getStatusColor', () => 'green')
  stubDealerDashboard()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as false', () => {
    const c = useDashboardIndex()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardIndex()
    expect(c.error.value).toBeNull()
  })

  it('healthScore starts as null', () => {
    const c = useDashboardIndex()
    expect(c.healthScore.value).toBeNull()
  })

  it('currentPlan starts as free', () => {
    const c = useDashboardIndex()
    expect(c.currentPlan.value).toBe('free')
  })
})

// ─── onboardingComplete ───────────────────────────────────────────────────────

describe('onboardingComplete', () => {
  it('returns false when no dealer profile', () => {
    const c = useDashboardIndex()
    expect(c.onboardingComplete.value).toBe(false)
  })

  it('returns false when onboarding_completed is false', () => {
    mockDealerProfile.value = { id: 'd-1', onboarding_completed: false }
    const c = useDashboardIndex()
    expect(c.onboardingComplete.value).toBe(false)
  })

  it('returns true when onboarding_completed is true', () => {
    mockDealerProfile.value = { id: 'd-1', onboarding_completed: true }
    const c = useDashboardIndex()
    expect(c.onboardingComplete.value).toBe(true)
  })
})

// ─── onboardingSteps ──────────────────────────────────────────────────────────

describe('onboardingSteps', () => {
  it('returns empty array when no dealer profile', () => {
    const c = useDashboardIndex()
    expect(c.onboardingSteps.value).toHaveLength(0)
  })

  it('returns 5 steps when dealer profile loaded', () => {
    mockDealerProfile.value = {
      id: 'd-1', company_name: 'Dealer', phone: '600000000', email: null,
      logo_url: null, theme_primary: null, onboarding_completed: false,
    }
    const c = useDashboardIndex()
    expect(c.onboardingSteps.value).toHaveLength(5)
  })

  it('email step is always done', () => {
    mockDealerProfile.value = { id: 'd-1', company_name: 'X', phone: null, email: null, logo_url: null, theme_primary: null }
    const c = useDashboardIndex()
    const emailStep = (c.onboardingSteps.value as Array<{ key: string; done: boolean }>).find((s) => s.key === 'email')
    expect(emailStep?.done).toBe(true)
  })

  it('vehicle step done when activeListings > 0', () => {
    mockDealerProfile.value = { id: 'd-1', company_name: 'X', phone: null, email: null, logo_url: null, theme_primary: null }
    mockStats.value = { activeListings: 3 }
    const c = useDashboardIndex()
    const vehicleStep = (c.onboardingSteps.value as Array<{ key: string; done: boolean }>).find((s) => s.key === 'vehicle')
    expect(vehicleStep?.done).toBe(true)
  })
})

// ─── onboardingProgress ───────────────────────────────────────────────────────

describe('onboardingProgress', () => {
  it('returns 0 when no steps', () => {
    const c = useDashboardIndex()
    expect(c.onboardingProgress.value).toBe(0)
  })

  it('returns 20 when 1 of 5 steps done', () => {
    mockDealerProfile.value = {
      id: 'd-1', company_name: null, phone: null, email: null,
      logo_url: null, theme_primary: null, onboarding_completed: false,
    }
    // Only email step (always done) = 1/5 = 20%
    const c = useDashboardIndex()
    expect(c.onboardingProgress.value).toBe(20)
  })
})

// ─── healthScoreClass ─────────────────────────────────────────────────────────

describe('healthScoreClass', () => {
  it('returns score-low when healthScore is null', () => {
    const c = useDashboardIndex()
    expect(c.healthScoreClass.value).toBe('score-low')
  })

  it('returns score-high for total >= 80', () => {
    const c = useDashboardIndex()
    c.healthScore.value = { total: 85 }
    expect(c.healthScoreClass.value).toBe('score-high')
  })

  it('returns score-mid for total 50-79', () => {
    const c = useDashboardIndex()
    c.healthScore.value = { total: 60 }
    expect(c.healthScoreClass.value).toBe('score-mid')
  })

  it('returns score-low for total < 50', () => {
    const c = useDashboardIndex()
    c.healthScore.value = { total: 30 }
    expect(c.healthScoreClass.value).toBe('score-low')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('sets healthScore after init when dealer has id', async () => {
    mockDealerProfile.value = { id: 'd-1' }
    const c = useDashboardIndex()
    await c.init()
    expect(c.healthScore.value).not.toBeNull()
    expect((c.healthScore.value as { total: number }).total).toBe(75)
  })

  it('does not throw when no dealer profile', async () => {
    const c = useDashboardIndex()
    await expect(c.init()).resolves.toBeUndefined()
  })
})
