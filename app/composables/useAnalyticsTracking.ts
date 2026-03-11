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
} as const

export type AnalyticsEventType = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]

const SESSION_STORAGE_KEY = 'analytics_session_id'

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

export function useAnalyticsTracking() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * Insert a raw analytics event into the analytics_events table.
   * Fire-and-forget — never blocks the UI.
   */
  function trackEvent(event: AnalyticsEvent): void {
    if (!import.meta.client) return

    const sessionId = getSessionId()

    const row = {
      event_type: event.event_type,
      entity_type: event.entity_type ?? null,
      entity_id: event.entity_id ?? null,
      metadata: event.metadata ?? null,
      session_id: sessionId,
      user_id: user.value?.id ?? null,
      vertical: getVerticalSlug(),
      version: EVENT_SCHEMA_VERSION,
    }

    void supabase.from('analytics_events').insert(row as never)
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
  }
}
