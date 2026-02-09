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

const STORAGE_KEY = 'tank_user_location'

// Major Spanish cities → province mapping (for manual input resolution)
const CITY_TO_PROVINCE: Record<string, string> = {
  'madrid': 'Madrid',
  'barcelona': 'Barcelona',
  'valencia': 'Valencia',
  'sevilla': 'Sevilla',
  'zaragoza': 'Zaragoza',
  'málaga': 'Málaga',
  'malaga': 'Málaga',
  'murcia': 'Murcia',
  'palma': 'Baleares',
  'bilbao': 'Vizcaya',
  'alicante': 'Alicante',
  'córdoba': 'Córdoba',
  'cordoba': 'Córdoba',
  'valladolid': 'Valladolid',
  'vigo': 'Pontevedra',
  'gijón': 'Asturias',
  'gijon': 'Asturias',
  'hospitalet': 'Barcelona',
  'vitoria': 'Álava',
  'granada': 'Granada',
  'elche': 'Alicante',
  'oviedo': 'Asturias',
  'santander': 'Cantabria',
  'pamplona': 'Navarra',
  'san sebastián': 'Guipúzcoa',
  'san sebastian': 'Guipúzcoa',
  'donostia': 'Guipúzcoa',
  'salamanca': 'Salamanca',
  'burgos': 'Burgos',
  'cádiz': 'Cádiz',
  'cadiz': 'Cádiz',
  'logroño': 'La Rioja',
  'logrono': 'La Rioja',
  'toledo': 'Toledo',
  'lleida': 'Lérida',
  'lérida': 'Lérida',
  'lerida': 'Lérida',
  'girona': 'Gerona',
  'gerona': 'Gerona',
  'tarragona': 'Tarragona',
  'huelva': 'Huelva',
  'jaén': 'Jaén',
  'jaen': 'Jaén',
  'almería': 'Almería',
  'almeria': 'Almería',
  'castellón': 'Castellón',
  'castellon': 'Castellón',
  'león': 'León',
  'leon': 'León',
  'cáceres': 'Cáceres',
  'caceres': 'Cáceres',
  'badajoz': 'Badajoz',
  'lugo': 'Lugo',
  'ourense': 'Ourense',
  'huesca': 'Huesca',
  'teruel': 'Teruel',
  'soria': 'Soria',
  'segovia': 'Segovia',
  'ávila': 'Ávila',
  'avila': 'Ávila',
  'palencia': 'Palencia',
  'zamora': 'Zamora',
  'cuenca': 'Cuenca',
  'guadalajara': 'Guadalajara',
  'ciudad real': 'Ciudad Real',
  'albacete': 'Albacete',
  'a coruña': 'A Coruña',
  'coruña': 'A Coruña',
  'las palmas': 'Las Palmas',
  'santa cruz de tenerife': 'Santa Cruz de Tenerife',
  'tenerife': 'Santa Cruz de Tenerife',
  'ceuta': 'Ceuta',
  'melilla': 'Melilla',
}

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '').trim()
}

/**
 * Resolve a city name to Spanish province/region if possible.
 */
function resolveSpanishCity(city: string): { province: string, region: string } | null {
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
  const location = useState<UserLocation>('userLocation', () => ({
    country: null,
    province: null,
    region: null,
    city: null,
    source: null,
  }))

  const detected = ref(false)

  async function detect() {
    if (detected.value) return
    detected.value = true

    // 1. Check localStorage for manual override
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as UserLocation
          if (parsed.country) {
            location.value = { ...parsed, source: 'manual' }
            return
          }
        }
      }
      catch { /* ignore */ }
    }

    // 2. Try navigator.geolocation → reverse geocode
    if (import.meta.client && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 600000,
          })
        })
        const { latitude, longitude } = pos.coords
        const res = await $fetch<{ address?: { country_code?: string, city?: string, town?: string, village?: string, state?: string, province?: string } }>(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
          { headers: { 'User-Agent': 'TankIberica/1.0' } },
        )
        if (res.address) {
          const countryCode = res.address.country_code?.toUpperCase() || null
          const city = res.address.city || res.address.town || res.address.village || null
          let province: string | null = null
          let region: string | null = null
          if (countryCode === 'ES') {
            // Try local city → province mapping first
            if (city) {
              const resolved = resolveSpanishCity(city)
              if (resolved) {
                province = resolved.province
                region = resolved.region
              }
            }
            // Fallback: use Nominatim's province/state fields
            if (!province && res.address.province) {
              province = res.address.province
              region = PROVINCE_TO_REGION[province] || res.address.state || null
            }
            if (!province && res.address.state) {
              // state = autonomous community, try to match as province
              const resolved = resolveSpanishCity(res.address.state)
              if (resolved) {
                province = resolved.province
                region = resolved.region
              } else {
                region = res.address.state
              }
            }
          } else {
            // Non-Spain: use Nominatim fields directly
            province = res.address.province || res.address.state || null
          }
          location.value = { country: countryCode, province, region, city, source: 'geolocation' }
          return
        }
      }
      catch { /* geolocation denied or failed, continue to IP fallback */ }
    }

    // 3. Fallback: IP country via server route
    try {
      const res = await $fetch<{ country: string | null }>('/api/geo')
      if (res.country) {
        location.value = {
          country: res.country,
          province: null,
          region: null,
          city: null,
          source: 'ip',
        }
        return
      }
    }
    catch { /* server route failed */ }

    // 4. No location detected
    location.value = { country: null, province: null, region: null, city: null, source: null }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location.value))
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
