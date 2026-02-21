/**
 * useGtag — Google Ads conversion tracking composable
 *
 * Wrapper around gtag.js that respects GDPR cookie consent.
 * Only fires events if user has consented to marketing cookies.
 */

/**
 * Type-safe gtag function (globally injected by gtag.js)
 */
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetIdOrEventName: string | Date,
      params?: Record<string, unknown>,
    ) => void
    dataLayer?: unknown[]
  }
}

export function useGtag() {
  const { hasConsent } = useConsent()
  const config = useRuntimeConfig()

  /**
   * Check if gtag is available and user has consented.
   */
  function canTrack(): boolean {
    if (import.meta.server) return false
    if (!config.public.googleAdsId) return false
    if (!hasConsent('marketing')) return false
    return typeof window.gtag === 'function'
  }

  /**
   * Generic event tracking.
   * Use specific helper methods below for standard events.
   */
  function trackEvent(eventName: string, params?: Record<string, unknown>): void {
    if (!canTrack()) return

    try {
      window.gtag!('event', eventName, params)
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[gtag] Failed to track event:', eventName, error)
      }
    }
  }

  /**
   * Track product/vehicle view (Google Ads view_item event).
   */
  function trackViewItem(vehicleId: string, title: string, price: number): void {
    trackEvent('view_item', {
      items: [
        {
          item_id: vehicleId,
          item_name: title,
          price,
        },
      ],
    })
  }

  /**
   * Track search query (Google Ads search event).
   */
  function trackSearch(query: string, filters: Record<string, unknown> = {}): void {
    trackEvent('search', {
      search_term: query,
      ...filters,
    })
  }

  /**
   * Track lead generation (contact dealer button).
   * Fires both generate_lead and contact_dealer conversion.
   */
  function trackGenerateLead(vehicleId: string, dealerId: string): void {
    // Standard generate_lead event
    trackEvent('generate_lead', {
      vehicle_id: vehicleId,
      dealer_id: dealerId,
    })

    // Custom conversion: contact_dealer
    trackEvent('conversion', {
      send_to: `${config.public.googleAdsId}/contact_dealer`,
      vehicle_id: vehicleId,
      dealer_id: dealerId,
    })
  }

  /**
   * Track checkout start (subscription plan selection).
   */
  function trackBeginCheckout(plan: string, price: number): void {
    trackEvent('begin_checkout', {
      items: [
        {
          item_id: plan,
          item_name: `Suscripción ${plan}`,
          price,
        },
      ],
      value: price,
      currency: 'EUR',
    })
  }

  /**
   * Track successful subscription (payment completed).
   * Fires both purchase and subscribe_pro conversion.
   */
  function trackSubscribe(plan: string, price: number): void {
    // Standard purchase event
    trackEvent('purchase', {
      transaction_id: `sub_${Date.now()}`,
      value: price,
      currency: 'EUR',
      items: [
        {
          item_id: plan,
          item_name: `Suscripción ${plan}`,
          price,
        },
      ],
    })

    // Custom conversion: subscribe_pro
    trackEvent('conversion', {
      send_to: `${config.public.googleAdsId}/subscribe_pro`,
      value: price,
      currency: 'EUR',
      plan,
    })
  }

  /**
   * Track user registration.
   * Fires both sign_up and register conversion.
   */
  function trackRegister(): void {
    // Standard sign_up event
    trackEvent('sign_up', {
      method: 'email',
    })

    // Custom conversion: register
    trackEvent('conversion', {
      send_to: `${config.public.googleAdsId}/register`,
    })
  }

  /**
   * Track transport request (load board interaction).
   * Fires request_transport conversion.
   */
  function trackRequestTransport(vehicleId: string): void {
    trackEvent('conversion', {
      send_to: `${config.public.googleAdsId}/request_transport`,
      vehicle_id: vehicleId,
    })
  }

  return {
    /** Check if tracking is available and consented */
    canTrack,
    /** Generic event tracking */
    trackEvent,
    /** Track vehicle view */
    trackViewItem,
    /** Track search query */
    trackSearch,
    /** Track lead generation (contact dealer) */
    trackGenerateLead,
    /** Track checkout start (subscription) */
    trackBeginCheckout,
    /** Track successful subscription */
    trackSubscribe,
    /** Track user registration */
    trackRegister,
    /** Track transport request */
    trackRequestTransport,
  }
}
