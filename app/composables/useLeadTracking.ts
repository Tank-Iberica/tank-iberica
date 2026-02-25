/**
 * Composable for tracking lead generation events.
 * Uses the existing analytics_events table to record
 * contact clicks, ficha views, and favorites.
 * All tracking calls are fire-and-forget.
 */

export function useLeadTracking() {
  const supabase = useSupabaseClient()

  function track(eventType: string, data: Record<string, unknown>): void {
    supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        entity_type: eventType.includes('view') ? 'vehicle' : 'lead',
        entity_id: (data.vehicle_id as string) || null,
        metadata: data,
        created_at: new Date().toISOString(),
      })
      .then(() => {})
      .catch(() => {})
  }

  function trackContactClick(
    vehicleId: string,
    dealerId: string,
    method: 'phone' | 'whatsapp' | 'form',
  ): void {
    track('contact_click', { vehicle_id: vehicleId, dealer_id: dealerId, method })
  }

  function trackFichaView(vehicleId: string, dealerId: string): void {
    track('ficha_view', { vehicle_id: vehicleId, dealer_id: dealerId })
  }

  function trackFavorite(vehicleId: string): void {
    track('favorite_add', { vehicle_id: vehicleId })
  }

  return {
    trackContactClick,
    trackFichaView,
    trackFavorite,
  }
}
