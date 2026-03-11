import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGtag } from '../../app/composables/useGtag'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubConsent(marketing = false) {
  vi.stubGlobal('useConsent', () => ({
    hasConsent: (type: string) => type === 'marketing' && marketing,
  }))
}

function stubRuntimeConfig(googleAdsId = 'AW-123') {
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { googleAdsId },
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubConsent(false)
  stubRuntimeConfig()
  // Remove gtag from globalThis
  delete (globalThis as Record<string, unknown>).gtag
})

// ─── canTrack ─────────────────────────────────────────────────────────────────

describe('canTrack', () => {
  it('returns false when no googleAdsId configured', () => {
    stubRuntimeConfig('')
    stubConsent(true)
    ;(globalThis as Record<string, unknown>).gtag = vi.fn()
    const c = useGtag()
    expect(c.canTrack()).toBe(false)
  })

  it('returns false when marketing consent not given', () => {
    stubConsent(false)
    ;(globalThis as Record<string, unknown>).gtag = vi.fn()
    const c = useGtag()
    expect(c.canTrack()).toBe(false)
  })

  it('returns false when gtag is not a function', () => {
    stubConsent(true)
    delete (globalThis as Record<string, unknown>).gtag
    const c = useGtag()
    expect(c.canTrack()).toBe(false)
  })

  it('returns true when all conditions met', () => {
    stubConsent(true)
    ;(globalThis as Record<string, unknown>).gtag = vi.fn()
    const c = useGtag()
    expect(c.canTrack()).toBe(true)
  })
})

// ─── trackEvent ───────────────────────────────────────────────────────────────

describe('trackEvent', () => {
  it('does not call gtag when canTrack is false', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(false) // no consent → canTrack = false
    const c = useGtag()
    c.trackEvent('test_event')
    expect(mockGtag).not.toHaveBeenCalled()
  })

  it('calls gtag with event and params when canTrack is true', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackEvent('test_event', { value: 42 })
    expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { value: 42 })
  })
})

// ─── trackViewItem ────────────────────────────────────────────────────────────

describe('trackViewItem', () => {
  it('fires view_item event when consented', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackViewItem('v1', 'Camión MAN', 25000)
    expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', expect.objectContaining({
      items: expect.arrayContaining([expect.objectContaining({ item_id: 'v1' })]),
    }))
  })

  it('does not fire when not consented', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(false)
    const c = useGtag()
    c.trackViewItem('v1', 'Camión MAN', 25000)
    expect(mockGtag).not.toHaveBeenCalled()
  })
})

// ─── trackSearch ──────────────────────────────────────────────────────────────

describe('trackSearch', () => {
  it('fires search event with search_term', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackSearch('camión', { category: 'tractoras' })
    expect(mockGtag).toHaveBeenCalledWith('event', 'search', expect.objectContaining({
      search_term: 'camión',
      category: 'tractoras',
    }))
  })
})

// ─── trackGenerateLead ────────────────────────────────────────────────────────

describe('trackGenerateLead', () => {
  it('fires generate_lead and conversion events', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackGenerateLead('v1', 'd1')
    expect(mockGtag).toHaveBeenCalledTimes(2)
    const calls = mockGtag.mock.calls.map((c: unknown[]) => c[1])
    expect(calls).toContain('generate_lead')
    expect(calls).toContain('conversion')
  })
})

// ─── trackBeginCheckout ───────────────────────────────────────────────────────

describe('trackBeginCheckout', () => {
  it('fires begin_checkout event with plan and price', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackBeginCheckout('basic', 29)
    expect(mockGtag).toHaveBeenCalledWith('event', 'begin_checkout', expect.objectContaining({
      value: 29,
      currency: 'EUR',
    }))
  })
})

// ─── trackSubscribe ───────────────────────────────────────────────────────────

describe('trackSubscribe', () => {
  it('fires purchase and conversion events', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackSubscribe('basic', 29)
    expect(mockGtag).toHaveBeenCalledTimes(2)
    const calls = mockGtag.mock.calls.map((c: unknown[]) => c[1])
    expect(calls).toContain('purchase')
    expect(calls).toContain('conversion')
  })
})

// ─── trackRegister ────────────────────────────────────────────────────────────

describe('trackRegister', () => {
  it('fires sign_up and conversion events', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackRegister()
    const calls = mockGtag.mock.calls.map((c: unknown[]) => c[1])
    expect(calls).toContain('sign_up')
    expect(calls).toContain('conversion')
  })
})

// ─── trackRequestTransport ────────────────────────────────────────────────────

describe('trackRequestTransport', () => {
  it('fires conversion event with vehicle_id', () => {
    const mockGtag = vi.fn()
    ;(globalThis as Record<string, unknown>).gtag = mockGtag
    stubConsent(true)
    const c = useGtag()
    c.trackRequestTransport('vehicle-99')
    expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
      vehicle_id: 'vehicle-99',
    }))
  })
})
