import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAudienceSegmentation } from '../../app/composables/useAudienceSegmentation'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() { return fn() },
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }))
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('sessionId starts as empty string', () => {
    const c = useAudienceSegmentation()
    expect(c.sessionId.value).toBe('')
  })

  it('segments starts as empty array (no profile)', () => {
    const c = useAudienceSegmentation()
    expect(c.segments.value).toHaveLength(0)
  })
})

// ─── trackCategoryView ────────────────────────────────────────────────────────

describe('trackCategoryView', () => {
  it('creates a cat: segment after tracking', () => {
    const c = useAudienceSegmentation()
    c.trackCategoryView('tractoras')
    expect(c.segments.value).toContain('cat:tractoras')
  })

  it('does not add duplicate categories', () => {
    const c = useAudienceSegmentation()
    c.trackCategoryView('tractoras')
    c.trackCategoryView('tractoras')
    const catSegs = (c.segments.value as string[]).filter((s) => s === 'cat:tractoras')
    expect(catSegs).toHaveLength(1)
  })

  it('increments page_views per call', () => {
    const c = useAudienceSegmentation()
    c.trackCategoryView('tractoras')
    c.trackCategoryView('camiones')
    c.trackCategoryView('furgonetas')
    // 3 views = intent:researcher
    expect(c.segments.value).toContain('intent:researcher')
  })

  it('limits cat segments to 5', () => {
    const c = useAudienceSegmentation()
    for (let i = 0; i < 7; i++) {
      c.trackCategoryView(`cat-${i}`)
    }
    const catSegs = (c.segments.value as string[]).filter((s) => s.startsWith('cat:'))
    expect(catSegs).toHaveLength(5)
  })
})

// ─── trackBrandSearch ─────────────────────────────────────────────────────────

describe('trackBrandSearch', () => {
  it('adds brand segment for single brand', () => {
    const c = useAudienceSegmentation()
    c.trackBrandSearch('MAN')
    expect(c.segments.value).toContain('brand:man')
  })

  it('normalizes brand to lowercase', () => {
    const c = useAudienceSegmentation()
    c.trackBrandSearch('VOLVO')
    expect(c.segments.value).toContain('brand:volvo')
  })

  it('adds multi_interest for 3+ brands', () => {
    const c = useAudienceSegmentation()
    c.trackBrandSearch('MAN')
    c.trackBrandSearch('VOLVO')
    c.trackBrandSearch('SCANIA')
    expect(c.segments.value).toContain('brand:multi_interest')
  })

  it('does not add duplicate brands', () => {
    const c = useAudienceSegmentation()
    c.trackBrandSearch('man')
    c.trackBrandSearch('MAN')
    const brandSegs = (c.segments.value as string[]).filter((s) => s.startsWith('brand:'))
    // Only 1 brand → 'brand:man' (single brand, not multi)
    expect(brandSegs).toHaveLength(1)
    expect(brandSegs[0]).toBe('brand:man')
  })

  it('ignores empty brand string', () => {
    const c = useAudienceSegmentation()
    c.trackBrandSearch('   ')
    const brandSegs = (c.segments.value as string[]).filter((s) => s.startsWith('brand:'))
    expect(brandSegs).toHaveLength(0)
  })
})

// ─── trackPriceRange ──────────────────────────────────────────────────────────

describe('trackPriceRange', () => {
  it('adds price:budget for max <= 30000', () => {
    const c = useAudienceSegmentation()
    c.trackPriceRange(0, 25000)
    expect(c.segments.value).toContain('price:budget')
  })

  it('adds price:mid for max between 30000 and 100000', () => {
    const c = useAudienceSegmentation()
    c.trackPriceRange(20000, 80000)
    expect(c.segments.value).toContain('price:mid')
  })

  it('adds price:premium for max > 100000', () => {
    const c = useAudienceSegmentation()
    c.trackPriceRange(50000, 150000)
    expect(c.segments.value).toContain('price:premium')
  })
})

// ─── trackPageView ────────────────────────────────────────────────────────────

describe('trackPageView', () => {
  it('increments page_views and generates intent segment', () => {
    const c = useAudienceSegmentation()
    // 1 view = intent:browser
    c.trackPageView()
    expect(c.segments.value).toContain('intent:browser')
  })

  it('becomes intent:researcher at 3 views', () => {
    const c = useAudienceSegmentation()
    for (let i = 0; i < 3; i++) c.trackPageView()
    expect(c.segments.value).toContain('intent:researcher')
  })

  it('becomes intent:buyer at 10 views', () => {
    const c = useAudienceSegmentation()
    for (let i = 0; i < 10; i++) c.trackPageView()
    expect(c.segments.value).toContain('intent:buyer')
  })

  it('adds freq:regular at 5 views', () => {
    const c = useAudienceSegmentation()
    for (let i = 0; i < 5; i++) c.trackPageView()
    expect(c.segments.value).toContain('freq:regular')
  })

  it('adds freq:heavy at 20 views', () => {
    const c = useAudienceSegmentation()
    for (let i = 0; i < 20; i++) c.trackPageView()
    expect(c.segments.value).toContain('freq:heavy')
  })
})

// ─── getSegmentsForPrebid ─────────────────────────────────────────────────────

describe('getSegmentsForPrebid', () => {
  it('returns user.data array structure', () => {
    const c = useAudienceSegmentation()
    const result = c.getSegmentsForPrebid() as { user: { data: Array<{ name: string; segment: unknown[] }> } }
    expect(result).toHaveProperty('user')
    expect(result.user.data[0]?.name).toBe('tracciona')
  })

  it('returns segment IDs from computed segments', () => {
    const c = useAudienceSegmentation()
    c.trackPageView()
    const result = c.getSegmentsForPrebid() as { user: { data: Array<{ segment: Array<{ id: string }> }> } }
    expect(result.user.data[0]?.segment.length).toBeGreaterThan(0)
  })
})
