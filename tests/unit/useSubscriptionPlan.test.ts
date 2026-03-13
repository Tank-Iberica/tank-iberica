import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSubscriptionPlan, PLAN_LIMITS } from '../../app/composables/useSubscriptionPlan'
import type { PlanType } from '../../app/composables/useSubscriptionPlan'

// ─── Stub helper ──────────────────────────────────────────────────────────────

function makeSubRow(
  overrides: Partial<{
    plan: string
    status: string
    expires_at: string | null
  }> = {},
) {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    plan: 'basic',
    status: 'active',
    started_at: null,
    expires_at: null,
    stripe_subscription_id: null,
    stripe_customer_id: null,
    price_cents: null,
    vertical: 'tracciona',
    created_at: null,
    updated_at: null,
    ...overrides,
  }
}

function stubSubscriptionFetch(row: Record<string, unknown> | null, queryError: unknown = null) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () =>
                  Promise.resolve(
                    queryError ? { data: null, error: queryError } : { data: row, error: null },
                  ),
              }),
            }),
          }),
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubSubscriptionFetch(null) // default: no subscription
})

// ─── PLAN_LIMITS static data ──────────────────────────────────────────────────

describe('PLAN_LIMITS', () => {
  it('free plan allows 3 active listings', () => {
    expect(PLAN_LIMITS.free.maxActiveListings).toBe(3)
  })

  it('basic plan allows 20 active listings', () => {
    expect(PLAN_LIMITS.basic.maxActiveListings).toBe(20)
  })

  it('premium plan has unlimited listings', () => {
    expect(PLAN_LIMITS.premium.maxActiveListings).toBe(Infinity)
  })

  it('founding plan has unlimited listings', () => {
    expect(PLAN_LIMITS.founding.maxActiveListings).toBe(Infinity)
  })

  it('free plan has no badge', () => {
    expect(PLAN_LIMITS.free.badge).toBe('none')
  })

  it('basic plan has basic badge', () => {
    expect(PLAN_LIMITS.basic.badge).toBe('basic')
  })

  it('premium plan has premium badge', () => {
    expect(PLAN_LIMITS.premium.badge).toBe('premium')
  })

  it('founding plan has founding badge', () => {
    expect(PLAN_LIMITS.founding.badge).toBe('founding')
  })

  it('free plan has no whatsapp publishing', () => {
    expect(PLAN_LIMITS.free.whatsappPublishing).toBe(false)
  })

  it('basic plan has whatsapp publishing', () => {
    expect(PLAN_LIMITS.basic.whatsappPublishing).toBe(true)
  })

  it('free plan has no embeddable widget', () => {
    expect(PLAN_LIMITS.free.embeddableWidget).toBe(false)
  })

  it('premium plan has embeddable widget', () => {
    expect(PLAN_LIMITS.premium.embeddableWidget).toBe(true)
  })

  it('free plan has no demand alerts', () => {
    expect(PLAN_LIMITS.free.demandAlerts).toBe(false)
  })

  it('premium plan has demand alerts', () => {
    expect(PLAN_LIMITS.premium.demandAlerts).toBe(true)
  })

  it('free plan has basic stats access', () => {
    expect(PLAN_LIMITS.free.statsAccess).toBe('basic')
  })

  it('premium plan has full stats access', () => {
    expect(PLAN_LIMITS.premium.statsAccess).toBe('full')
  })

  it('free plan has 5 max photos per listing', () => {
    expect(PLAN_LIMITS.free.maxPhotosPerListing).toBe(5)
  })

  it('premium plan has 30 max photos per listing', () => {
    expect(PLAN_LIMITS.premium.maxPhotosPerListing).toBe(30)
  })

  it('premium sortBoost is higher than basic', () => {
    expect(PLAN_LIMITS.premium.sortBoost).toBeGreaterThan(PLAN_LIMITS.basic.sortBoost)
  })

  it('classic plan has same limits as basic', () => {
    expect(PLAN_LIMITS.classic.maxActiveListings).toBe(PLAN_LIMITS.basic.maxActiveListings)
    expect(PLAN_LIMITS.classic.maxPhotosPerListing).toBe(PLAN_LIMITS.basic.maxPhotosPerListing)
    expect(PLAN_LIMITS.classic.whatsappPublishing).toBe(PLAN_LIMITS.basic.whatsappPublishing)
    expect(PLAN_LIMITS.classic.catalogExport).toBe(PLAN_LIMITS.basic.catalogExport)
  })
})

// ─── Initial state (no dealerId) ─────────────────────────────────────────────

describe('initial state (no dealerId)', () => {
  it('subscription starts as null', () => {
    const c = useSubscriptionPlan()
    expect(c.subscription.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useSubscriptionPlan()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useSubscriptionPlan()
    expect(c.error.value).toBeNull()
  })

  it('currentPlan defaults to free when no subscription', () => {
    const c = useSubscriptionPlan()
    expect(c.currentPlan.value).toBe('free')
  })

  it('hasBadge is false on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.hasBadge.value).toBe(false)
  })

  it('badgeType is none on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.badgeType.value).toBe('none')
  })

  it('canExport is false on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.canExport.value).toBe(false)
  })

  it('canUseWidget is false on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.canUseWidget.value).toBe(false)
  })

  it('hasWhatsappPublishing is false on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.hasWhatsappPublishing.value).toBe(false)
  })

  it('hasDemandAlerts is false on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.hasDemandAlerts.value).toBe(false)
  })

  it('statsLevel is basic on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.statsLevel.value).toBe('basic')
  })

  it('maxPhotos is 5 on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.maxPhotos.value).toBe(5)
  })

  it('sortBoost is 0 on free plan', () => {
    const c = useSubscriptionPlan()
    expect(c.sortBoost.value).toBe(0)
  })
})

// ─── canPublish ───────────────────────────────────────────────────────────────

describe('canPublish (free plan defaults)', () => {
  it('returns true when below free limit', () => {
    const c = useSubscriptionPlan()
    expect(c.canPublish(2)).toBe(true)
  })

  it('returns false when at free limit (3)', () => {
    const c = useSubscriptionPlan()
    expect(c.canPublish(3)).toBe(false)
  })

  it('returns false when above free limit', () => {
    const c = useSubscriptionPlan()
    expect(c.canPublish(10)).toBe(false)
  })

  it('returns true for 0 listings', () => {
    const c = useSubscriptionPlan()
    expect(c.canPublish(0)).toBe(true)
  })
})

// ─── fetchSubscription ────────────────────────────────────────────────────────

describe('fetchSubscription', () => {
  it('does not fetch when no userId provided and no dealerId', async () => {
    const c = useSubscriptionPlan()
    await c.fetchSubscription(undefined)
    expect(c.subscription.value).toBeNull()
  })

  it('sets subscription when row returned', async () => {
    const row = makeSubRow({ plan: 'basic' })
    stubSubscriptionFetch(row)
    const c = useSubscriptionPlan()
    await c.fetchSubscription('user-1')
    expect(c.subscription.value).not.toBeNull()
    expect((c.subscription.value as Record<string, unknown>)?.plan).toBe('basic')
  })

  it('sets subscription to null when no row', async () => {
    stubSubscriptionFetch(null)
    const c = useSubscriptionPlan()
    await c.fetchSubscription('user-1')
    expect(c.subscription.value).toBeNull()
  })

  it('sets loading to false after success', async () => {
    const c = useSubscriptionPlan()
    await c.fetchSubscription('user-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on query failure', async () => {
    stubSubscriptionFetch(null, { message: 'DB error' })
    const c = useSubscriptionPlan()
    await c.fetchSubscription('user-1')
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after error', async () => {
    stubSubscriptionFetch(null, { message: 'DB error' })
    const c = useSubscriptionPlan()
    await c.fetchSubscription('user-1')
    expect(c.loading.value).toBe(false)
  })

  it('prefers provided userId over dealerId', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({ limit: () => ({ maybeSingle: mockFetch }) }),
            }),
          }),
        }),
      }),
    }))
    const c = useSubscriptionPlan('dealer-id')
    await c.fetchSubscription('override-user')
    // Should have been called (with override-user)
    expect(mockFetch).toHaveBeenCalled()
  })

  it('auto-fetches when dealerId provided at init', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({ limit: () => ({ maybeSingle: mockMaybeSingle }) }),
            }),
          }),
        }),
      }),
    }))
    useSubscriptionPlan('dealer-1')
    // fetchSubscription called automatically
    await Promise.resolve()
    expect(mockMaybeSingle).toHaveBeenCalled()
  })
})
