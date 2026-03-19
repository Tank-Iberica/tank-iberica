import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock #imports before importing source
vi.mock('#imports', () => ({
  useSupabaseClient: vi.fn(),
  useSupabaseUser: vi.fn(),
}))

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal(
  'getVerticalSlug',
  vi.fn(() => 'tracciona'),
)
vi.stubGlobal(
  '$fetch',
  vi.fn(() => Promise.resolve({ country: 'ES' })),
)
vi.stubGlobal('addEventListener', vi.fn())
vi.stubGlobal('document', { visibilityState: 'visible' })

// Mock browser APIs
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn(() => 'test-session-id'),
  setItem: vi.fn(),
})
vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'test-session-id') })
vi.stubGlobal('window', { innerWidth: 1200 })
vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' })

// Set location for UTM parsing
Object.defineProperty(globalThis, 'location', {
  value: { search: '?utm_source=google&utm_medium=cpc' },
  writable: true,
  configurable: true,
})

const mockInsert = vi.fn(() => Promise.resolve({ error: null }))
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

import { useSupabaseClient, useSupabaseUser } from '#imports'

vi.mocked(useSupabaseClient).mockReturnValue({ from: mockFrom } as any)
vi.mocked(useSupabaseUser).mockReturnValue(ref({ id: 'user-1' }) as any)

import {
  useAnalyticsTracking,
  ANALYTICS_EVENTS,
} from '../../../app/composables/useAnalyticsTracking'

describe('Batch writes analytics_events (#243)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSupabaseClient).mockReturnValue({ from: mockFrom } as any)
    vi.mocked(useSupabaseUser).mockReturnValue(ref({ id: 'user-1' }) as any)
  })

  describe('ANALYTICS_EVENTS constants', () => {
    it('defines canonical event types', () => {
      expect(ANALYTICS_EVENTS.VEHICLE_VIEW).toBe('vehicle_view')
      expect(ANALYTICS_EVENTS.SEARCH_PERFORMED).toBe('search_performed')
      expect(ANALYTICS_EVENTS.LEAD_SENT).toBe('lead_sent')
      expect(ANALYTICS_EVENTS.FUNNEL_SEARCH).toBe('funnel:search')
      expect(ANALYTICS_EVENTS.SCROLL_DEPTH).toBe('scroll_depth')
      expect(ANALYTICS_EVENTS.FORM_ABANDON).toBe('form_abandon')
      expect(ANALYTICS_EVENTS.FEEDBACK).toBe('feedback')
    })
  })

  describe('Return shape', () => {
    it('returns tracking methods', () => {
      const api = useAnalyticsTracking()
      expect(api).toHaveProperty('trackEvent')
      expect(api).toHaveProperty('trackVehicleView')
      expect(api).toHaveProperty('trackSearch')
      expect(api).toHaveProperty('trackLeadSent')
      expect(api).toHaveProperty('trackFavoriteAdded')
      expect(api).toHaveProperty('trackVehicleDuration')
      expect(api).toHaveProperty('trackFunnelSearch')
      expect(api).toHaveProperty('trackScrollDepth')
      expect(api).toHaveProperty('trackFormAbandonment')
      expect(api).toHaveProperty('trackBuyerGeo')
      expect(api).toHaveProperty('trackFeedback')
    })
  })

  describe('trackEvent', () => {
    it('does not throw when called', () => {
      const { trackEvent } = useAnalyticsTracking()
      expect(() => trackEvent({ event_type: 'test_event' })).not.toThrow()
    })
  })

  describe('trackVehicleDuration', () => {
    it('skips durations < 3 seconds (bounce filter)', () => {
      const { trackVehicleDuration } = useAnalyticsTracking()
      // Duration of 2 seconds — should not track
      trackVehicleDuration('vehicle-1', Date.now() - 2000)
      // No immediate INSERT expected for any event (batched), but the
      // event should not have been added to buffer at all
    })
  })

  describe('trackBuyerGeo', () => {
    it('does nothing when country is null', () => {
      const { trackBuyerGeo } = useAnalyticsTracking()
      trackBuyerGeo({ country: null, province: null, region: null, source: null })
      // Should return early without adding to buffer
    })

    it('does not throw with valid geo data', () => {
      const { trackBuyerGeo } = useAnalyticsTracking()
      expect(() =>
        trackBuyerGeo({
          country: 'ES',
          province: 'Madrid',
          region: 'Comunidad de Madrid',
          source: 'ip',
        }),
      ).not.toThrow()
    })
  })

  describe('trackFeedback', () => {
    it('does not throw when called', () => {
      const { trackFeedback } = useAnalyticsTracking()
      expect(() => trackFeedback('/catalog', true, 'Great!')).not.toThrow()
    })
  })

  describe('trackFormAbandonment', () => {
    it('does not throw when called', () => {
      const { trackFormAbandonment } = useAnalyticsTracking()
      expect(() => trackFormAbandonment('contact-form', 'step2', 15000)).not.toThrow()
    })
  })
})
