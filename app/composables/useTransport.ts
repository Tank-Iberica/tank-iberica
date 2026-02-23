import { ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { PROVINCE_TO_REGION } from '~/utils/geoData'

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

// ============================================
// Spanish postal code prefix → province name
// ============================================

const SPANISH_POSTAL_PREFIXES: Record<string, string> = {
  '01': 'Álava',
  '02': 'Albacete',
  '03': 'Alicante',
  '04': 'Almería',
  '05': 'Ávila',
  '06': 'Badajoz',
  '07': 'Baleares',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Cáceres',
  '11': 'Cádiz',
  '12': 'Castellón',
  '13': 'Ciudad Real',
  '14': 'Córdoba',
  '15': 'A Coruña',
  '16': 'Cuenca',
  '17': 'Gerona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Guipúzcoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaén',
  '24': 'León',
  '25': 'Lérida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Málaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Ourense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia',
  '47': 'Valladolid',
  '48': 'Vizcaya',
  '49': 'Zamora',
  '50': 'Zaragoza',
  '51': 'Ceuta',
  '52': 'Melilla',
}

// ============================================
// Autonomous community → transport zone slug
// ============================================

const REGION_TO_ZONE: Record<string, string> = {
  Galicia: 'zona-1',
  Asturias: 'zona-1',
  Cantabria: 'zona-1',
  'País Vasco': 'zona-1',
  Navarra: 'zona-1',
  Aragón: 'zona-1',
  Cataluña: 'zona-1',
  'Comunidad de Madrid': 'zona-2',
  'Castilla y León': 'zona-2',
  'Castilla-La Mancha': 'zona-2',
  Extremadura: 'zona-2',
  'La Rioja': 'zona-2',
  Andalucía: 'zona-3',
  'Región de Murcia': 'zona-3',
  'Comunidad Valenciana': 'zona-3',
  'Islas Baleares': 'personalizado',
  Canarias: 'personalizado',
  Ceuta: 'personalizado',
  Melilla: 'personalizado',
}

// French southern départements that map to francia-sur
const FRENCH_SOUTH_PREFIXES = new Set([
  '09',
  '11',
  '12',
  '30',
  '31',
  '32',
  '34',
  '46',
  '48',
  '65',
  '66',
  '81',
  '82',
])

// ============================================
// Composable
// ============================================

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
        .select('*')
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
  function resolveZoneFromPostalCode(postalCode: string): string | null {
    const clean = postalCode.replace(/\s+/g, '').replace(/-/g, '')

    // Portuguese postal codes: 4 digits (or 4+3 format like 1000-001)
    if (/^\d{4}$/.test(clean) || /^\d{7}$/.test(clean)) {
      return 'portugal'
    }

    // Spanish and French postal codes: 5 digits
    if (/^\d{5}$/.test(clean)) {
      const prefix = clean.substring(0, 2)

      // Check Spanish postal code
      const province = SPANISH_POSTAL_PREFIXES[prefix]
      if (province) {
        const region = PROVINCE_TO_REGION[province]
        if (region) {
          return REGION_TO_ZONE[region] || 'personalizado'
        }
        return 'personalizado'
      }

      // Check French southern départements
      if (FRENCH_SOUTH_PREFIXES.has(prefix)) {
        return 'francia-sur'
      }
    }

    return null
  }

  /**
   * Get the province name from a Spanish postal code.
   */
  function getProvinceFromPostalCode(postalCode: string): string | null {
    const clean = postalCode.replace(/\s+/g, '').replace(/-/g, '')
    if (/^\d{5}$/.test(clean)) {
      const prefix = clean.substring(0, 2)
      return SPANISH_POSTAL_PREFIXES[prefix] || null
    }
    return null
  }

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
        .select('*')
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
  function formatCents(cents: number): string {
    const euros = cents / 100
    return (
      euros.toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }) + ' \u20AC'
    )
  }

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
