import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePrecios } from '../../app/composables/usePrecios'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'select'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error, count: 0 }
  chain.limit = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() { return fn() },
  }))
  vi.stubGlobal('useI18n', () => ({
    t: (key: string, _params?: unknown) => key,
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain([]),
    }),
  }))
  vi.stubGlobal('useLocalePath', () => (path: string) => path)
  vi.stubGlobal('navigateTo', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com' }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('billingInterval starts as month', () => {
    const c = usePrecios()
    expect(c.billingInterval.value).toBe('month')
  })

  it('loading starts as false', () => {
    const c = usePrecios()
    expect(c.loading.value).toBe(false)
  })

  it('checkoutError starts as empty string', () => {
    const c = usePrecios()
    expect(c.checkoutError.value).toBe('')
  })

  it('openFaq starts as null', () => {
    const c = usePrecios()
    expect(c.openFaq.value).toBeNull()
  })
})

// ─── planCards ────────────────────────────────────────────────────────────────

describe('planCards', () => {
  it('returns 4 plan cards', () => {
    const c = usePrecios()
    expect(c.planCards.value).toHaveLength(4)
  })

  it('free plan has price 0', () => {
    const c = usePrecios()
    const free = c.planCards.value.find((p) => p.plan === 'free')
    expect(free?.price).toBe('0')
  })

  it('founding plan is marked as founding', () => {
    const c = usePrecios()
    const founding = c.planCards.value.find((p) => p.plan === 'founding')
    expect(founding?.founding).toBe(true)
  })

  it('basic plan is highlighted', () => {
    const c = usePrecios()
    const basic = c.planCards.value.find((p) => p.plan === 'basic')
    expect(basic?.highlighted).toBe(true)
  })

  it('premium plan is not highlighted', () => {
    const c = usePrecios()
    const premium = c.planCards.value.find((p) => p.plan === 'premium')
    expect(premium?.highlighted).toBe(false)
  })

  it('basic suffix changes with billing interval', () => {
    const c = usePrecios()
    c.billingInterval.value = 'year'
    const basic = c.planCards.value.find((p) => p.plan === 'basic')
    expect(basic?.suffix).toBe('pricing.year')
  })

  it('basic suffix is month when interval is month', () => {
    const c = usePrecios()
    c.billingInterval.value = 'month'
    const basic = c.planCards.value.find((p) => p.plan === 'basic')
    expect(basic?.suffix).toBe('pricing.month')
  })
})

// ─── comparisonRows ───────────────────────────────────────────────────────────

describe('comparisonRows', () => {
  it('returns 11 comparison rows', () => {
    const c = usePrecios()
    expect(c.comparisonRows.value).toHaveLength(11)
  })

  it('first row has correct active listings data', () => {
    const c = usePrecios()
    const row = c.comparisonRows.value[0]
    expect(row?.free).toBe('3')
    expect(row?.basic).toBe('20')
  })

  it('badge row has boolean values for free', () => {
    const c = usePrecios()
    const badgeRow = c.comparisonRows.value.find((r) => r.label === 'pricing.compareBadge')
    expect(badgeRow?.free).toBe(false)
    expect(badgeRow?.basic).toBe(true)
  })
})

// ─── faqs ─────────────────────────────────────────────────────────────────────

describe('faqs', () => {
  it('returns 4 FAQ items', () => {
    const c = usePrecios()
    expect(c.faqs.value).toHaveLength(4)
  })

  it('each FAQ has question and answer', () => {
    const c = usePrecios()
    for (const faq of c.faqs.value) {
      expect(faq.question).toBeDefined()
      expect(faq.answer).toBeDefined()
    }
  })
})

// ─── toggleFaq ────────────────────────────────────────────────────────────────

describe('toggleFaq', () => {
  it('opens FAQ at index', () => {
    const c = usePrecios()
    c.toggleFaq(1)
    expect(c.openFaq.value).toBe(1)
  })

  it('closes FAQ when same index is toggled', () => {
    const c = usePrecios()
    c.toggleFaq(1)
    c.toggleFaq(1)
    expect(c.openFaq.value).toBeNull()
  })

  it('switches to different FAQ index', () => {
    const c = usePrecios()
    c.toggleFaq(0)
    c.toggleFaq(2)
    expect(c.openFaq.value).toBe(2)
  })
})

// ─── handleCta ────────────────────────────────────────────────────────────────

describe('handleCta', () => {
  it('navigates to admin for free plan when logged in', () => {
    const mockNavigate = vi.fn()
    vi.stubGlobal('navigateTo', mockNavigate)
    const c = usePrecios()
    c.handleCta('free')
    expect(mockNavigate).toHaveBeenCalledWith('/admin/productos')
  })

  it('navigates to login for free plan when not logged in', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const mockNavigate = vi.fn()
    vi.stubGlobal('navigateTo', mockNavigate)
    const c = usePrecios()
    c.handleCta('free')
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('sets href to mailto for founding plan', () => {
    const originalHref = Object.getOwnPropertyDescriptor(globalThis, 'location')
    const mockLocation = { href: '' }
    Object.defineProperty(globalThis, 'location', { value: mockLocation, configurable: true })
    const c = usePrecios()
    c.handleCta('founding')
    expect(mockLocation.href).toContain('mailto:')
    if (originalHref) {
      Object.defineProperty(globalThis, 'location', originalHref)
    }
  })
})

// ─── checkTrialEligibility (via init) ────────────────────────────────────────

describe('checkTrialEligibility', () => {
  it('sets isTrialEligible to true when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = usePrecios()
    await c.init()
    expect(c.isTrialEligible.value).toBe(true)
  })

  it('sets isTrialEligible to true when user has no subscriptions', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
      }),
    }))
    const c = usePrecios()
    await c.init()
    expect(c.isTrialEligible.value).toBe(true)
  })

  it('sets isTrialEligible to false when user has subscriptions', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([{ id: 'sub-1' }]),
      }),
    }))
    const c = usePrecios()
    await c.init()
    expect(c.isTrialEligible.value).toBe(false)
  })
})
