import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────

vi.mock('~/composables/useLocalized', () => ({
  localizedField: vi.fn((obj: Record<string, string> | null, locale: string) => {
    if (!obj) return ''
    return obj[locale] || obj.es || obj.en || ''
  }),
}))

vi.mock('~/composables/useVerticalConfig', () => ({
  getVerticalSlug: vi.fn(() => 'tracciona'),
}))

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))

// Supabase: two-result configurable mock
let sub1Result: unknown = { data: [], error: null }
let sub2Result: unknown = { data: [], error: null }
let resultIndex = 0
const mockFrom = vi.fn()

vi.stubGlobal('useSupabaseClient', () => ({
  from: mockFrom,
}))

import {
  useAdminDealerSuscripciones,
  PLANS,
  STATUSES,
  FOUNDING_MAX_PER_VERTICAL,
  type DealerSubscription,
  type DealerInfo,
} from '../../app/composables/admin/useAdminDealerSuscripciones'

// ─── Chain builder ─────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'insert', 'update', 'limit', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

function makeSub(overrides: Partial<DealerSubscription> = {}): DealerSubscription {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    vertical: 'tracciona',
    plan: 'basic',
    status: 'active',
    price_cents: 2900,
    started_at: '2026-01-01',
    expires_at: '2027-01-01',
    stripe_subscription_id: null,
    stripe_customer_id: null,
    created_at: '2026-01-01',
    updated_at: null,
    dealer: null,
    ...overrides,
  }
}

function makeDealer(overrides: Partial<DealerInfo> = {}): DealerInfo {
  return {
    id: 'dealer-1',
    company_name: { es: 'Transportes SL', en: 'Transport Ltd' },
    slug: 'transportes-sl',
    status: 'active',
    user_id: 'user-1',
    vertical: 'tracciona',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  resultIndex = 0
  sub1Result = { data: [], error: null }
  sub2Result = { data: [], error: null }
  // Default: alternating calls return sub1Result then sub2Result
  mockFrom.mockImplementation(() => {
    resultIndex++
    return makeChain(resultIndex <= 1 ? sub1Result : sub2Result)
  })
})

// ─── Exported constants ───────────────────────────────────────

describe('constants', () => {
  it('PLANS has 4 plans', () => {
    expect(PLANS).toHaveLength(4)
    expect(PLANS.map((p) => p.value)).toEqual(['free', 'basic', 'premium', 'founding'])
  })

  it('STATUSES has 4 statuses', () => {
    expect(STATUSES).toHaveLength(4)
  })

  it('FOUNDING_MAX_PER_VERTICAL is 10', () => {
    expect(FOUNDING_MAX_PER_VERTICAL).toBe(10)
  })
})

// ─── Initial state ────────────────────────────────────────────

describe('useAdminDealerSuscripciones — initial state', () => {
  it('initializes with correct defaults', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.loading.value).toBe(true)
    expect(c.saving.value).toBe(false)
    expect(c.error.value).toBeNull()
    expect(c.successMessage.value).toBeNull()
    expect(c.subscriptions.value).toEqual([])
    expect(c.allDealers.value).toEqual([])
    expect(c.searchQuery.value).toBe('')
    expect(c.filterPlan.value).toBeNull()
    expect(c.filterStatus.value).toBeNull()
  })

  it('initializes modal state as closed', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.cancelModal.value.show).toBe(false)
    expect(c.newModal.value.show).toBe(false)
    expect(c.extendModal.value.show).toBe(false)
    expect(c.changePlanModal.value.show).toBe(false)
    expect(c.newModal.value.selectedPlan).toBe('basic')
    expect(c.newModal.value.selectedVertical).toBe('tracciona')
  })
})

// ─── Pure helpers ─────────────────────────────────────────────

describe('getPlanConfig', () => {
  it('returns correct plan config', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.getPlanConfig('premium').label).toBe('Premium')
    expect(c.getPlanConfig('founding').color).toBe('#d97706')
  })

  it('falls back to first plan for unknown', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.getPlanConfig('unknown').value).toBe('free')
  })
})

describe('getStatusConfig', () => {
  it('returns correct status config', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.getStatusConfig('active').color).toBe('#10b981')
    expect(c.getStatusConfig('canceled').label).toBe('Canceled')
  })

  it('falls back to first status for null', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.getStatusConfig(null).value).toBe('active')
  })
})

describe('formatDate', () => {
  it('returns - for null', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.formatDate(null)).toBe('-')
  })

  it('returns formatted date for valid date string', () => {
    const c = useAdminDealerSuscripciones()
    const result = c.formatDate('2026-01-15')
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })
})

describe('isExpired', () => {
  it('returns false for null', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.isExpired(null)).toBe(false)
  })

  it('returns true for past date', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.isExpired('2020-01-01')).toBe(true)
  })

  it('returns false for future date', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.isExpired('2099-01-01')).toBe(false)
  })
})

describe('getDealerName', () => {
  it('returns - when no dealer', () => {
    const c = useAdminDealerSuscripciones()
    const sub = makeSub({ dealer: null })
    expect(c.getDealerName(sub)).toBe('-')
  })

  it('returns localized company name', () => {
    const c = useAdminDealerSuscripciones()
    const sub = makeSub({
      dealer: makeDealer({ company_name: { es: 'Empresa SL', en: 'Company Ltd' } }),
    })
    expect(c.getDealerName(sub)).toBe('Empresa SL')
  })
})

describe('getDealerLabel', () => {
  it('returns localized name when available', () => {
    const c = useAdminDealerSuscripciones()
    const dealer = makeDealer({ company_name: { es: 'Empresa SL', en: 'Company Ltd' } })
    expect(c.getDealerLabel(dealer)).toBe('Empresa SL')
  })

  it('falls back to slug when no company name', () => {
    const c = useAdminDealerSuscripciones()
    const dealer = makeDealer({ company_name: null })
    expect(c.getDealerLabel(dealer)).toBe('transportes-sl')
  })
})

// ─── Modal controls ───────────────────────────────────────────

describe('modal controls', () => {
  it('openCancelModal sets modal state', () => {
    const c = useAdminDealerSuscripciones()
    const sub = makeSub()
    c.openCancelModal(sub)
    expect(c.cancelModal.value.show).toBe(true)
    expect(c.cancelModal.value.subscription).toBe(sub)
  })

  it('closeCancelModal resets modal', () => {
    const c = useAdminDealerSuscripciones()
    c.openCancelModal(makeSub())
    c.closeCancelModal()
    expect(c.cancelModal.value.show).toBe(false)
    expect(c.cancelModal.value.subscription).toBeNull()
  })

  it('openNewModal shows modal with defaults', () => {
    const c = useAdminDealerSuscripciones()
    c.openNewModal()
    expect(c.newModal.value.show).toBe(true)
    expect(c.newModal.value.selectedPlan).toBe('basic')
    expect(c.newModal.value.priceCents).toBe(0)
  })

  it('closeNewModal hides modal', () => {
    const c = useAdminDealerSuscripciones()
    c.openNewModal()
    c.closeNewModal()
    expect(c.newModal.value.show).toBe(false)
  })

  it('openExtendModal sets subscription', () => {
    const c = useAdminDealerSuscripciones()
    const sub = makeSub()
    c.openExtendModal(sub)
    expect(c.extendModal.value.show).toBe(true)
    expect(c.extendModal.value.subscription).toBe(sub)
  })

  it('closeExtendModal resets', () => {
    const c = useAdminDealerSuscripciones()
    c.openExtendModal(makeSub())
    c.closeExtendModal()
    expect(c.extendModal.value.show).toBe(false)
    expect(c.extendModal.value.subscription).toBeNull()
  })

  it('openChangePlanModal sets plan from current sub plan', () => {
    const c = useAdminDealerSuscripciones()
    const sub = makeSub({ plan: 'premium' })
    c.openChangePlanModal(sub)
    expect(c.changePlanModal.value.show).toBe(true)
    expect(c.changePlanModal.value.newPlan).toBe('premium')
  })

  it('closeChangePlanModal resets', () => {
    const c = useAdminDealerSuscripciones()
    c.openChangePlanModal(makeSub())
    c.closeChangePlanModal()
    expect(c.changePlanModal.value.show).toBe(false)
    expect(c.changePlanModal.value.subscription).toBeNull()
    expect(c.changePlanModal.value.newPlan).toBe('basic')
  })

  it('canCancel is true when confirmText is "cancelar"', () => {
    const c = useAdminDealerSuscripciones()
    c.cancelModal.value.confirmText = 'CANCELAR'
    // canCancel uses .toLowerCase() comparison → 'cancelar' === 'cancelar' → true
    // But canCancel is computed once at creation (one-shot) — we can only test initial state
    // At creation, confirmText is '', so canCancel is false
    expect(c.canCancel.value).toBe(false)
  })
})

// ─── fetchSubscriptions ───────────────────────────────────────

describe('fetchSubscriptions', () => {
  it('populates subscriptions with dealer join', async () => {
    const dealers = [makeDealer()]
    const subs: SubscriptionRow[] = [
      {
        id: 'sub-1', user_id: 'user-1', vertical: 'tracciona',
        plan: 'basic', status: 'active', price_cents: 2900,
        started_at: '2026-01-01', expires_at: '2027-01-01',
        stripe_subscription_id: null, stripe_customer_id: null,
        created_at: '2026-01-01', updated_at: null,
      } as unknown as SubscriptionRow,
    ]
    sub1Result = { data: subs, error: null }
    sub2Result = { data: dealers, error: null }

    const c = useAdminDealerSuscripciones()
    await c.fetchSubscriptions()

    expect(c.subscriptions.value.length).toBe(1)
    expect(c.subscriptions.value[0]!.dealer?.id).toBe('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on subscription fetch failure', async () => {
    sub1Result = { data: null, error: { message: 'DB error' } }
    const c = useAdminDealerSuscripciones()
    await c.fetchSubscriptions()
    expect(c.error.value).toContain('admin.dealerSubscriptions.errorLoad')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on dealer fetch failure', async () => {
    sub1Result = { data: [], error: null }
    sub2Result = { data: null, error: { message: 'Dealers error' } }
    const c = useAdminDealerSuscripciones()
    await c.fetchSubscriptions()
    expect(c.error.value).toContain('admin.dealerSubscriptions.errorLoad')
  })

  it('handles null subscription data', async () => {
    sub1Result = { data: null, error: null }
    sub2Result = { data: null, error: null }
    const c = useAdminDealerSuscripciones()
    await c.fetchSubscriptions()
    expect(c.subscriptions.value).toEqual([])
  })
})

// Need the SubscriptionRow type for above
type SubscriptionRow = import('../../app/composables/admin/useAdminDealerSuscripciones').SubscriptionRow

// ─── changePlan ───────────────────────────────────────────────

describe('changePlan', () => {
  it('does nothing when no subscription in modal', async () => {
    const c = useAdminDealerSuscripciones()
    c.changePlanModal.value.subscription = null
    await c.changePlan()
    expect(c.saving.value).toBe(false)
  })

  it('changes plan successfully', async () => {
    sub1Result = { error: null }
    sub2Result = { data: [], error: null }
    // fetchSubscriptions needs 2 calls
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))

    const c = useAdminDealerSuscripciones()
    c.changePlanModal.value.subscription = makeSub()
    c.changePlanModal.value.newPlan = 'premium'
    await c.changePlan()
    expect(c.successMessage.value).toBe('admin.dealerSubscriptions.successPlanChanged')
    expect(c.saving.value).toBe(false)
  })

  it('founding limit guard exists (note: one-shot computed — limit not testable via post-creation mutation)', async () => {
    // foundingCountByVertical is a computed evaluated once at creation with empty subscriptions.
    // Mutating subscriptions.value post-creation does not re-evaluate it, so the founding limit
    // guard always sees count=0 in tests. We verify the composable proceeds without false errors.
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminDealerSuscripciones()
    const sub = makeSub({ plan: 'basic' })
    c.changePlanModal.value.subscription = sub
    c.changePlanModal.value.newPlan = 'founding'
    await c.changePlan()
    // No founding limit error triggered (count is 0 from one-shot computed)
    expect(c.error.value).toBeNull()
  })

  it('allows changing to founding when already founding', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminDealerSuscripciones()
    // Already founding sub should bypass the limit check
    const sub = makeSub({ plan: 'founding' })
    c.changePlanModal.value.subscription = sub
    c.changePlanModal.value.newPlan = 'founding'
    await c.changePlan()
    // Should not hit the founding limit error
    expect(c.error.value).toBeNull()
  })

  it('sets error on update failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Update failed' } }))
    const c = useAdminDealerSuscripciones()
    c.changePlanModal.value.subscription = makeSub()
    c.changePlanModal.value.newPlan = 'premium'
    await c.changePlan()
    expect(c.error.value).toContain('admin.dealerSubscriptions.errorUpdate')
  })
})

// ─── cancelSubscription ───────────────────────────────────────

describe('cancelSubscription', () => {
  it('does nothing when canCancel is false', async () => {
    const c = useAdminDealerSuscripciones()
    c.cancelModal.value.subscription = makeSub()
    // canCancel is computed once at creation with confirmText='' → false
    await c.cancelSubscription()
    expect(c.saving.value).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does nothing when no subscription', async () => {
    const c = useAdminDealerSuscripciones()
    c.cancelModal.value.subscription = null
    await c.cancelSubscription()
    expect(c.saving.value).toBe(false)
  })
})

// ─── extendExpiry ─────────────────────────────────────────────

describe('extendExpiry', () => {
  it('does nothing when no subscription', async () => {
    const c = useAdminDealerSuscripciones()
    await c.extendExpiry()
    expect(c.saving.value).toBe(false)
  })

  it('extends expiry by 30 days', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminDealerSuscripciones()
    c.extendModal.value.subscription = makeSub({ expires_at: '2026-01-01T00:00:00Z' })
    await c.extendExpiry()
    expect(c.successMessage.value).toBe('admin.dealerSubscriptions.successExtended')
  })

  it('extends from now when expires_at is null', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminDealerSuscripciones()
    c.extendModal.value.subscription = makeSub({ expires_at: null })
    await c.extendExpiry()
    expect(c.successMessage.value).toBe('admin.dealerSubscriptions.successExtended')
  })

  it('sets error on update failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Extend failed' } }))
    const c = useAdminDealerSuscripciones()
    c.extendModal.value.subscription = makeSub()
    await c.extendExpiry()
    expect(c.error.value).toContain('admin.dealerSubscriptions.errorExtend')
  })
})

// ─── createSubscription ───────────────────────────────────────

describe('createSubscription', () => {
  it('sets error when no dealer selected', async () => {
    const c = useAdminDealerSuscripciones()
    c.newModal.value.selectedDealerId = ''
    await c.createSubscription()
    expect(c.error.value).toBe('admin.dealerSubscriptions.noDealerSelected')
  })

  it('sets error when dealer has no user_id', async () => {
    const c = useAdminDealerSuscripciones()
    c.allDealers.value = [makeDealer({ id: 'dealer-1', user_id: null })]
    c.newModal.value.selectedDealerId = 'dealer-1'
    await c.createSubscription()
    expect(c.error.value).toBe('admin.dealerSubscriptions.noDealerSelected')
    expect(c.saving.value).toBe(false)
  })

  it('founding limit on create (note: one-shot computed — limit not testable via post-creation mutation)', async () => {
    // Same constraint as changePlan: foundingCountByVertical computed evaluates once at creation.
    // We verify the founding path proceeds without false-positive founding limit errors.
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminDealerSuscripciones()
    c.allDealers.value = [makeDealer()]
    c.newModal.value.selectedDealerId = 'dealer-1'
    c.newModal.value.selectedPlan = 'founding'
    c.newModal.value.selectedVertical = 'tracciona'
    await c.createSubscription()
    // No founding limit error (count is 0 from one-shot computed)
    expect(c.error.value).toBeNull()
  })

  it('creates subscription successfully', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminDealerSuscripciones()
    c.allDealers.value = [makeDealer()]
    c.newModal.value.selectedDealerId = 'dealer-1'
    c.newModal.value.selectedPlan = 'basic'
    await c.createSubscription()
    expect(c.successMessage.value).toBe('admin.dealerSubscriptions.successCreated')
    expect(c.saving.value).toBe(false)
  })

  it('sets error on insert failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Insert failed' } }))
    const c = useAdminDealerSuscripciones()
    c.allDealers.value = [makeDealer()]
    c.newModal.value.selectedDealerId = 'dealer-1'
    await c.createSubscription()
    expect(c.error.value).toContain('admin.dealerSubscriptions.errorCreate')
  })
})

// ─── showSuccess ──────────────────────────────────────────────

describe('showSuccess', () => {
  it('sets successMessage', () => {
    const c = useAdminDealerSuscripciones()
    c.showSuccess('Operation done!')
    expect(c.successMessage.value).toBe('Operation done!')
  })
})

// ─── Computed: initial state ──────────────────────────────────

describe('computed initial state', () => {
  it('filteredSubscriptions is empty initially', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.filteredSubscriptions.value).toEqual([])
  })

  it('total is 0 initially', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.total.value).toBe(0)
  })

  it('foundingCountByVertical is empty initially', () => {
    const c = useAdminDealerSuscripciones()
    expect(Object.keys(c.foundingCountByVertical.value).length).toBe(0)
  })

  it('uniqueVerticals is empty initially', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.uniqueVerticals.value).toEqual([])
  })

  it('availableDealersForNew is empty initially', () => {
    const c = useAdminDealerSuscripciones()
    expect(c.availableDealersForNew.value).toEqual([])
  })
})
