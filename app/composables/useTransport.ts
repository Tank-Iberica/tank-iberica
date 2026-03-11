import { ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import {
  resolveZoneFromPostalCode,
  getProvinceFromPostalCode,
  formatCents,
} from '~/utils/transport.helpers'

// ============================================
// Interfaces
// ============================================

export interface TransportZone {
  id: string
  vertical: string
  zone_name: string
  zone_slug: string
  price_cents: number
  regions: string[]
  sort_order: number
  status: string
}

export interface TransportRequest {
  id: string
  vehicle_id: string
  user_id: string
  origin_zone: string | null
  destination_zone: string | null
  destination_postal_code: string | null
  estimated_price_cents: number | null
  status: string
  created_at: string
}

export interface CalculationResult {
  zone: TransportZone | null
  zoneSlug: string
  isLocal: boolean
}

export function useTransport() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const zones = ref<TransportZone[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch active transport zones, optionally filtered by vertical.
   */
  async function fetchZones(vertical?: string): Promise<TransportZone[]> {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('transport_zones')
        .select('id, vertical, zone_name, zone_slug, price_cents, regions, sort_order, status')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })

      if (vertical) {
        query = query.eq('vertical', vertical)
      }

      const { data, error: err } = await query

      if (err) throw err

      zones.value = (data as TransportZone[]) || []
      return zones.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching transport zones'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Resolve a postal code to a transport zone slug.
   *
   * - Spanish CPs (5 digits, prefix 01-52) → province → autonomous community → zone
   * - Portuguese CPs (4 digits) → 'portugal'
   * - French southern CPs (5 digits, specific prefixes) → 'francia-sur'
   *
   * Returns the zone slug string or null if unresolvable.
   */
  /**
   * Get the province name from a Spanish postal code.
   */
  /**
   * Calculate transport price for a vehicle to a destination postal code.
   *
   * Returns zone info, slug, and whether destination is local (same province as vehicle).
   */
  function calculatePrice(
    vehicleProvince: string | null,
    destinationPostalCode: string,
  ): CalculationResult {
    const zoneSlug = resolveZoneFromPostalCode(destinationPostalCode)

    if (!zoneSlug) {
      return { zone: null, zoneSlug: '', isLocal: false }
    }

    // Check if destination is in the same province as the vehicle (local transport)
    const destProvince = getProvinceFromPostalCode(destinationPostalCode)
    const isLocal = !!(vehicleProvince && destProvince && vehicleProvince === destProvince)

    // If local, use the 'local' zone slug instead
    const effectiveSlug = isLocal ? 'local' : zoneSlug

    // Find matching zone from loaded zones
    const zone = zones.value.find((z) => z.zone_slug === effectiveSlug) || null

    return {
      zone,
      zoneSlug: effectiveSlug,
      isLocal,
    }
  }

  /**
   * Submit a transport request for a vehicle.
   */
  async function submitTransportRequest(
    vehicleId: string,
    destinationPostalCode: string,
    estimatedPriceCents: number,
    originZone: string,
    destZone: string,
  ): Promise<TransportRequest | null> {
    if (!user.value) {
      error.value = 'User not authenticated'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('transport_requests')
        .insert({
          vehicle_id: vehicleId,
          user_id: user.value.id,
          origin_zone: originZone,
          destination_zone: destZone,
          destination_postal_code: destinationPostalCode,
          estimated_price_cents: estimatedPriceCents,
          status: 'pending',
        })
        .select()
        .single()

      if (err) throw err

      return data as TransportRequest
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error submitting transport request'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch transport requests for the currently authenticated user.
   */
  async function fetchMyRequests(): Promise<TransportRequest[]> {
    if (!user.value) {
      error.value = 'User not authenticated'
      return []
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('transport_requests')
        .select(
          'id, vehicle_id, user_id, origin_zone, destination_zone, destination_postal_code, estimated_price_cents, status, created_at',
        )
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (err) throw err

      return (data as TransportRequest[]) || []
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching transport requests'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Format cents to display price string (e.g. 150000 → "1.500 €").
   */
  return {
    zones,
    loading,
    error,
    fetchZones,
    resolveZoneFromPostalCode,
    getProvinceFromPostalCode,
    calculatePrice,
    submitTransportRequest,
    fetchMyRequests,
    formatCents,
  }
}
