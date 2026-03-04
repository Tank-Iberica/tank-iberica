import { ref, readonly } from 'vue'
import { useState } from '#imports'
import { PROVINCE_TO_REGION, EUROPEAN_COUNTRIES } from '~/utils/geoData'

export interface UserLocation {
  country: string | null
  province: string | null
  region: string | null
  city: string | null
  source: 'geolocation' | 'ip' | 'manual' | null
}

const STORAGE_KEY = 'tracciona_user_location'

// Major Spanish cities → province mapping (for manual input resolution)
const CITY_TO_PROVINCE: Record<string, string> = {
  madrid: 'Madrid',
  barcelona: 'Barcelona',
  valencia: 'Valencia',
  sevilla: 'Sevilla',
  zaragoza: 'Zaragoza',
  málaga: 'Málaga',
  malaga: 'Málaga',
  murcia: 'Murcia',
  palma: 'Baleares',
  bilbao: 'Vizcaya',
  alicante: 'Alicante',
  córdoba: 'Córdoba',
  cordoba: 'Córdoba',
  valladolid: 'Valladolid',
  vigo: 'Pontevedra',
  gijón: 'Asturias',
  gijon: 'Asturias',
  hospitalet: 'Barcelona',
  vitoria: 'Álava',
  granada: 'Granada',
  elche: 'Alicante',
  oviedo: 'Asturias',
  santander: 'Cantabria',
  pamplona: 'Navarra',
  'san sebastián': 'Guipúzcoa',
  'san sebastian': 'Guipúzcoa',
  donostia: 'Guipúzcoa',
  salamanca: 'Salamanca',
  burgos: 'Burgos',
  cádiz: 'Cádiz',
  cadiz: 'Cádiz',
  logroño: 'La Rioja',
  logrono: 'La Rioja',
  toledo: 'Toledo',
  lleida: 'Lérida',
  lérida: 'Lérida',
  lerida: 'Lérida',
  girona: 'Gerona',
  gerona: 'Gerona',
  tarragona: 'Tarragona',
  huelva: 'Huelva',
  jaén: 'Jaén',
  jaen: 'Jaén',
  almería: 'Almería',
  almeria: 'Almería',
  castellón: 'Castellón',
  castellon: 'Castellón',
  león: 'León',
  leon: 'León',
  cáceres: 'Cáceres',
  caceres: 'Cáceres',
  badajoz: 'Badajoz',
  lugo: 'Lugo',
  ourense: 'Ourense',
  huesca: 'Huesca',
  teruel: 'Teruel',
  soria: 'Soria',
  segovia: 'Segovia',
  ávila: 'Ávila',
  avila: 'Ávila',
  palencia: 'Palencia',
  zamora: 'Zamora',
  cuenca: 'Cuenca',
  guadalajara: 'Guadalajara',
  'ciudad real': 'Ciudad Real',
  albacete: 'Albacete',
  'a coruña': 'A Coruña',
  coruña: 'A Coruña',
  'las palmas': 'Las Palmas',
  'santa cruz de tenerife': 'Santa Cruz de Tenerife',
  tenerife: 'Santa Cruz de Tenerife',
  ceuta: 'Ceuta',
  melilla: 'Melilla',
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .trim()
}

/**
 * Resolve a city name to Spanish province/region if possible.
 */
function resolveSpanishCity(city: string): { province: string; region: string } | null {
  const norm = normalize(city)
  // Try direct city lookup
  for (const [key, province] of Object.entries(CITY_TO_PROVINCE)) {
    if (normalize(key) === norm) {
      const region = PROVINCE_TO_REGION[province]
      if (region) return { province, region }
    }
  }
  // Try as province name
  for (const [province, region] of Object.entries(PROVINCE_TO_REGION)) {
    if (normalize(province) === norm) {
      return { province, region }
    }
  }
  return null
}

export function useUserLocation() {
  const supabase = useSupabaseClient()
  const location = useState<UserLocation>('userLocation', () => ({
    country: null,
    province: null,
    region: null,
    city: null,
    source: null,
  }))

  const detected = ref(false)

  function tryStoredLocation(): UserLocation | null {
    if (!import.meta.client) return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      const parsed = JSON.parse(stored) as UserLocation
      return parsed.country ? { ...parsed, source: 'manual' } : null
    } catch {
      return null
    }
  }

  function resolveProvinceRegion(
    countryCode: string | null,
    city: string | null,
    address: { province?: string; state?: string },
  ): { province: string | null; region: string | null } {
    if (countryCode !== 'ES') {
      return { province: address.province || address.state || null, region: null }
    }
    // Try local city → province mapping
    if (city) {
      const resolved = resolveSpanishCity(city)
      if (resolved) return resolved
    }
    // Fallback: Nominatim province/state
    if (address.province) {
      return {
        province: address.province,
        region: PROVINCE_TO_REGION[address.province] || address.state || null,
      }
    }
    if (address.state) {
      const resolved = resolveSpanishCity(address.state)
      if (resolved) return resolved
      return { province: null, region: address.state }
    }
    return { province: null, region: null }
  }

  async function tryGeolocation(): Promise<UserLocation | null> {
    if (!import.meta.client || !navigator.geolocation) return null
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 600000,
      })
    })
    const { latitude, longitude } = pos.coords
    const latRounded = Math.round(latitude * 100) / 100
    const lngRounded = Math.round(longitude * 100) / 100

    // Check Supabase geocoding cache first
    const { data: cached } = await supabase
      .from('geocoding_cache')
      .select('country_code, city, province, region')
      .eq('lat_rounded', latRounded)
      .eq('lng_rounded', lngRounded)
      .single()

    if (cached) {
      return {
        country: cached.country_code,
        province: cached.province,
        region: cached.region,
        city: cached.city,
        source: 'geolocation',
      }
    }

    // No cache hit — call Nominatim
    const res = await $fetch<{
      address?: {
        country_code?: string
        city?: string
        town?: string
        village?: string
        state?: string
        province?: string
      }
    }>(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
      { headers: { 'User-Agent': 'Tracciona/1.0' } },
    )
    if (!res.address) return null

    const countryCode = res.address.country_code?.toUpperCase() || null
    const city = res.address.city || res.address.town || res.address.village || null
    const { province, region } = resolveProvinceRegion(countryCode, city, res.address)

    // Fire-and-forget: store result in geocoding cache
    supabase
      .from('geocoding_cache')
      .upsert({
        lat_rounded: latRounded,
        lng_rounded: lngRounded,
        country_code: countryCode,
        city,
        province,
        region,
        raw_response: res,
      })
      .select()
      .single()

    return { country: countryCode, province, region, city, source: 'geolocation' }
  }

  async function tryIpLocation(): Promise<UserLocation | null> {
    const res = await $fetch<{ country: string | null }>('/api/geo')
    if (!res.country) return null
    return { country: res.country, province: null, region: null, city: null, source: 'ip' }
  }

  const NO_LOCATION: UserLocation = {
    country: null,
    province: null,
    region: null,
    city: null,
    source: null,
  }

  async function detect() {
    if (detected.value) return
    detected.value = true

    // 1. Check localStorage for manual override
    const stored = tryStoredLocation()
    if (stored) {
      location.value = stored
      return
    }

    // 2. Try navigator.geolocation → reverse geocode
    try {
      const geo = await tryGeolocation()
      if (geo) {
        location.value = geo
        return
      }
    } catch {
      /* geolocation denied or failed, continue to IP fallback */
    }

    // 3. Fallback: IP country via server route
    try {
      const ip = await tryIpLocation()
      if (ip) {
        location.value = ip
        return
      }
    } catch {
      /* server route failed */
    }

    // 4. No location detected
    location.value = NO_LOCATION
  }

  function setManualLocation(city: string, country: string, province?: string, region?: string) {
    // If country is Spain and no province/region given, try to resolve from city
    let prov = province || null
    let reg = region || null
    if (country === 'ES' && !prov && city) {
      const resolved = resolveSpanishCity(city)
      if (resolved) {
        prov = resolved.province
        reg = resolved.region
      }
    }

    location.value = {
      country,
      province: prov,
      region: reg,
      city,
      source: 'manual',
    }

    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(location.value))
      } catch {
        // localStorage may be full or unavailable in private mode
      }
    }
  }

  function isInEurope(): boolean {
    return !!location.value.country && EUROPEAN_COUNTRIES.includes(location.value.country)
  }

  return {
    location: readonly(location),
    detect,
    setManualLocation,
    isInEurope,
  }
}
