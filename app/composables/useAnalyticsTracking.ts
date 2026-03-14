/**
 * useAnalyticsTracking — Tracks analytics events into the analytics_events Supabase table.
 *
 * All tracking is fire-and-forget: it never blocks the UI and errors are caught silently.
 * On the server (SSR), tracking is skipped entirely.
 * A session_id is generated per browser session via sessionStorage.
 */

import { useSupabaseClient, useSupabaseUser } from '#imports'

interface AnalyticsEvent {
  event_type: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, unknown>
}

/** Current event schema version — bump when breaking changes to event structure */
const EVENT_SCHEMA_VERSION = 1

/**
 * #243 — Batch write buffer for analytics events.
 * Accumulates events for BATCH_FLUSH_MS, then inserts in a single query.
 * Reduces DB writes by ~90% compared to one INSERT per event.
 */
const BATCH_FLUSH_MS = 10_000
const _eventBuffer: Record<string, unknown>[] = []
let _flushTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Canonical event type constants.
 * See docs/tracciona-docs/referencia/EVENT-TAXONOMY.md for full documentation.
 */
export const ANALYTICS_EVENTS = {
  VEHICLE_VIEW: 'vehicle_view',
  VEHICLE_DURATION: 'vehicle_duration',
  SEARCH_PERFORMED: 'search_performed',
  LEAD_SENT: 'lead_sent',
  FAVORITE_ADDED: 'favorite_added',
  FUNNEL_SEARCH: 'funnel:search',
  FUNNEL_VIEW_VEHICLE: 'funnel:view_vehicle',
  FUNNEL_CONTACT_SELLER: 'funnel:contact_seller',
  FUNNEL_RESERVATION: 'funnel:reservation',
  // Data capture — Bloque 6b
  SCROLL_DEPTH: 'scroll_depth',
  FORM_ABANDON: 'form_abandon',
  VEHICLE_COMPARISON: 'vehicle_comparison',
  BUYER_GEO: 'buyer_geo',
  FEEDBACK: 'feedback',
} as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

const SESSION_STORAGE_KEY = 'analytics_session_id'
const GEO_STORAGE_KEY = 'analytics_geo_country'

/**
 * Get or create a session ID stored in sessionStorage.
 * Returns null on the server or if sessionStorage is unavailable.
 */
function getSessionId(): string | null {
  if (!import.meta.client) return null

  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
    }
    return sessionId
  } catch {
    // sessionStorage may be unavailable in private/incognito mode
    return null
  }
}

interface UtmParams {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
}

/** Extract UTM parameters from the current URL query string */
function getUtmParams(): UtmParams {
  if (!import.meta.client)
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
    }

  try {
    const params = new URLSearchParams(globalThis.location.search)
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
    }
  } catch {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
    }
  }
}

/** Get or lazily fetch the visitor's country code via /api/geo (CF-IPCountry).
 *  Cached in sessionStorage to avoid repeated fetches. */
let _geoCountryPromise: Promise<string | null> | null = null

function getGeoCountry(): Promise<string | null> {
  if (!import.meta.client) return Promise.resolve(null)

  // Return cached promise if already in-flight or resolved
  if (_geoCountryPromise) return _geoCountryPromise

  // Check sessionStorage first
  try {
    const cached = sessionStorage.getItem(GEO_STORAGE_KEY)
    if (cached !== null) return Promise.resolve(cached || null)
  } catch {
    // sessionStorage unavailable
  }

  _geoCountryPromise = $fetch<{ country: string | null }>('/api/geo')
    .then((res) => {
      const c = res.country ?? null
      try {
        sessionStorage.setItem(GEO_STORAGE_KEY, c ?? '')
      } catch {
        // ignore
      }
      return c
    })
    .catch(() => null)

  return _geoCountryPromise
}

/** Detect device type from viewport width */
function getDeviceType(): string | null {
  if (!import.meta.client) return null
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

/** Detect platform/OS from user agent */
function getPlatform(): string | null {
  if (!import.meta.client) return null
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios'
  if (ua.includes('android')) return 'android'
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('linux')) return 'linux'
  return 'other'
}

/**
 * Composable for analytics tracking.
 * @returns Vue composable state and methods for analytics tracking
 */
export function useAnalyticsTracking() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /** Flush buffered events to DB in a single batch INSERT */
  function flushEventBuffer(): void {
    if (_eventBuffer.length === 0) return
    const batch = _eventBuffer.splice(0)
    void supabase.from('analytics_events').insert(batch as never)
  }

  // Flush on page unload to avoid losing buffered events
  if (import.meta.client) {
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushEventBuffer()
    })
  }

  /**
   * Insert a raw analytics event into the analytics_events table.
   * Events are buffered for 10s and flushed as a batch INSERT.
   * Fire-and-forget — never blocks the UI.
   */
  function trackEvent(event: AnalyticsEvent): void {
    if (!import.meta.client) return

    const sessionId = getSessionId()
    const utm = getUtmParams()

    // Fire-and-forget including geo (may be null on first event of session)
    void getGeoCountry().then((buyerCountry) => {
      const row = {
        event_type: event.event_type,
        entity_type: event.entity_type ?? null,
        entity_id: event.entity_id ?? null,
        metadata: event.metadata ?? null,
        session_id: sessionId,
        user_id: user.value?.id ?? null,
        vertical: getVerticalSlug(),
        version: EVENT_SCHEMA_VERSION,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        device_type: getDeviceType(),
        platform: getPlatform(),
        buyer_country: buyerCountry,
      }

      _eventBuffer.push(row)

      // Schedule flush if not already scheduled
      if (!_flushTimer) {
        _flushTimer = setTimeout(() => {
          _flushTimer = null
          flushEventBuffer()
        }, BATCH_FLUSH_MS)
      }
    })
  }

  /**
   * Track a vehicle detail page view.
   */
  function trackVehicleView(vehicleId: string, metadata?: Record<string, unknown>): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.VEHICLE_VIEW,
      entity_type: 'vehicle',
      entity_id: vehicleId,
      metadata,
    })
  }

  /**
   * Track a catalog search with the applied filters.
   */
  function trackSearch(filters: Record<string, unknown>): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.SEARCH_PERFORMED,
      metadata: filters,
    })
  }

  /**
   * Track a lead sent to a dealer for a specific vehicle.
   */
  function trackLeadSent(vehicleId: string, dealerId: string): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.LEAD_SENT,
      entity_type: 'vehicle',
      entity_id: vehicleId,
      metadata: { dealer_id: dealerId },
    })
  }

  /**
   * Track a vehicle being added to favorites.
   */
  function trackFavoriteAdded(vehicleId: string): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.FAVORITE_ADDED,
      entity_type: 'vehicle',
      entity_id: vehicleId,
    })
  }

  /**
   * Track how long a user spent on a vehicle detail page.
   * Call on page unmount with the timestamp recorded on mount.
   * Minimum 3s to filter accidental clicks / bounces.
   */
  function trackVehicleDuration(vehicleId: string, startedAt: number): void {
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000)
    if (durationSeconds < 3) return
    trackEvent({
      event_type: ANALYTICS_EVENTS.VEHICLE_DURATION,
      entity_type: 'vehicle',
      entity_id: vehicleId,
      metadata: { duration_seconds: durationSeconds },
    })
  }

  // --- Funnel tracking ---

  /** Track funnel step: user searches in catalog */
  function trackFunnelSearch(filters: Record<string, unknown>): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.FUNNEL_SEARCH,
      metadata: filters,
    })
  }

  /** Track funnel step: user views a vehicle detail page */
  function trackFunnelViewVehicle(vehicleId: string, source?: string): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.FUNNEL_VIEW_VEHICLE,
      entity_type: 'vehicle',
      entity_id: vehicleId,
      metadata: source ? { source } : undefined,
    })
  }

  /** Track funnel step: user contacts the seller */
  function trackFunnelContactSeller(vehicleId: string, dealerId: string): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.FUNNEL_CONTACT_SELLER,
      entity_type: 'vehicle',
      entity_id: vehicleId,
      metadata: { dealer_id: dealerId },
    })
  }

  /** Track funnel step: user places a reservation */
  function trackFunnelReservation(vehicleId: string): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.FUNNEL_RESERVATION,
      entity_type: 'vehicle',
      entity_id: vehicleId,
    })
  }

  /** #44 — Track scroll depth milestones (25/50/75/100) */
  function trackScrollDepth(vehicleId: string, depth: 25 | 50 | 75 | 100): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.SCROLL_DEPTH,
      entity_type: 'vehicle',
      entity_id: vehicleId,
      metadata: { depth_pct: depth },
    })
  }

  /** #43 — Track form abandonment */
  function trackFormAbandonment(formId: string, stepReached: string, timeSpentMs: number): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.FORM_ABANDON,
      metadata: {
        form_id: formId,
        step_reached: stepReached,
        time_spent_seconds: Math.round(timeSpentMs / 1000),
      },
    })
  }

  /** #40 — Track when user has viewed 2+ similar vehicles in one session */
  function trackVehicleComparison(vehicleIds: string[]): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.VEHICLE_COMPARISON,
      metadata: { vehicle_ids: vehicleIds, count: vehicleIds.length },
    })
  }

  /**
   * #38 — Track buyer geographic origin as a dedicated event.
   * Emits a BUYER_GEO event with enriched location data (country, province, region, source).
   * Should be called once per session from the vehicle detail page or app init.
   * The country is also passively added to every event via getGeoCountry().
   */
  function trackBuyerGeo(location: {
    country: string | null
    province: string | null
    region: string | null
    source: 'geolocation' | 'ip' | 'manual' | null
  }): void {
    if (!location.country) return
    trackEvent({
      event_type: ANALYTICS_EVENTS.BUYER_GEO,
      metadata: {
        country: location.country,
        province: location.province ?? null,
        region: location.region ?? null,
        source: location.source ?? null,
      },
    })
  }

  /** #267 — Track in-app feedback (thumbs up/down + optional comment) */
  function trackFeedback(page: string, helpful: boolean, comment?: string): void {
    trackEvent({
      event_type: ANALYTICS_EVENTS.FEEDBACK,
      metadata: {
        page,
        helpful,
        ...(comment ? { comment } : {}),
      },
    })
  }

  return {
    trackEvent,
    trackVehicleView,
    trackSearch,
    trackLeadSent,
    trackFavoriteAdded,
    trackVehicleDuration,
    trackFunnelSearch,
    trackFunnelViewVehicle,
    trackFunnelContactSeller,
    trackFunnelReservation,
    trackScrollDepth,
    trackFormAbandonment,
    trackVehicleComparison,
    trackBuyerGeo,
    trackFeedback,
  }
}
