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
      sessionId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
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
      vertical: 'tracciona',
    }

    supabase
      .from('analytics_events')
      .insert(row as never)
      .then(() => {
        // success — no action needed
      })
      .catch(() => {
        // silently ignore tracking errors
      })
  }

  /**
   * Track a vehicle detail page view.
   */
  function trackVehicleView(vehicleId: string, metadata?: Record<string, unknown>): void {
    trackEvent({
      event_type: 'vehicle_view',
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
      event_type: 'search_performed',
      metadata: filters,
    })
  }

  /**
   * Track a lead sent to a dealer for a specific vehicle.
   */
  function trackLeadSent(vehicleId: string, dealerId: string): void {
    trackEvent({
      event_type: 'lead_sent',
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
      event_type: 'favorite_added',
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
  }
}
