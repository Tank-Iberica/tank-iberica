import { PROVINCE_TO_REGION, COUNTRY_NAMES } from '~/utils/geoData'

// Major Spanish cities → province mapping (instant resolution)
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

// Build reverse map: country name (normalized) → ISO code
const COUNTRY_NAME_TO_CODE: Record<string, string> = {}
for (const names of Object.values(COUNTRY_NAMES)) {
  for (const [code, name] of Object.entries(names)) {
    COUNTRY_NAME_TO_CODE[normalize(name)] = code
  }
}

export interface ParsedLocation {
  country: string | null
  province: string | null
  region: string | null
}

/**
 * Parse a location text like "Madrid, España" into structured fields (sync, local dictionary).
 */
export function parseLocationText(text: string | null): ParsedLocation {
  if (!text || !text.trim()) {
    return { country: null, province: null, region: null }
  }

  const parts = text.split(',').map(p => p.trim())
  const cityPart = parts[0] || ''
  const countryPart = parts.length > 1 ? parts[parts.length - 1] : ''

  // 1. Detect country from text
  let countryCode: string | null = null

  if (countryPart) {
    const upper = countryPart.toUpperCase()
    if (upper.length === 2 && COUNTRY_NAMES.es[upper]) {
      countryCode = upper
    }
    if (!countryCode) {
      countryCode = COUNTRY_NAME_TO_CODE[normalize(countryPart)] || null
    }
  }

  // 2. If no country found from suffix, check if the city hints at Spain
  if (!countryCode && cityPart) {
    const norm = normalize(cityPart)
    const isSpanishCity = Object.keys(CITY_TO_PROVINCE).some(k => normalize(k) === norm)
    const isSpanishProvince = Object.keys(PROVINCE_TO_REGION).some(k => normalize(k) === norm)
    if (isSpanishCity || isSpanishProvince) {
      countryCode = 'ES'
    }
  }

  // 3. Resolve province and region for Spain
  let province: string | null = null
  let region: string | null = null

  if (countryCode === 'ES' && cityPart) {
    const norm = normalize(cityPart)

    // Try as city first
    for (const [key, prov] of Object.entries(CITY_TO_PROVINCE)) {
      if (normalize(key) === norm) {
        province = prov
        region = PROVINCE_TO_REGION[prov] || null
        break
      }
    }

    // Try as province name
    if (!province) {
      for (const [prov, reg] of Object.entries(PROVINCE_TO_REGION)) {
        if (normalize(prov) === norm) {
          province = prov
          region = reg
          break
        }
      }
    }
  }

  return { country: countryCode, province, region }
}

/**
 * Geocode a location text using Nominatim (async fallback for unknown cities).
 * Returns enriched ParsedLocation with province/region from geocoding.
 * Works for any city worldwide — resolves country for all, province/region for Spain.
 */
export async function geocodeLocation(text: string | null): Promise<ParsedLocation> {
  // First try local dictionary (instant)
  const local = parseLocationText(text)

  // If we already resolved province, no need for geocoding
  if (local.province || !text || !text.trim()) {
    return local
  }

  // Geocode if: (a) country detected but no province, or (b) no country detected at all
  try {
    const query = encodeURIComponent(text.trim())
    const res = await $fetch<Array<{
      address?: {
        country_code?: string
        province?: string
        state?: string
        county?: string
        city?: string
        town?: string
        village?: string
      }
    }>>(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1&accept-language=es`, {
      headers: { 'User-Agent': 'TankIberica/1.0' },
    })

    if (res?.[0]?.address) {
      const addr = res[0].address
      const countryCode = addr.country_code?.toUpperCase() || local.country

      if (countryCode === 'ES') {
        // Nominatim returns province in "province" or "state" field
        // Try to match against our PROVINCE_TO_REGION map
        const candidates = [addr.province, addr.state, addr.county].filter(Boolean)
        for (const candidate of candidates) {
          if (!candidate) continue
          // Direct match
          for (const [prov, reg] of Object.entries(PROVINCE_TO_REGION)) {
            if (normalize(prov) === normalize(candidate)) {
              return { country: 'ES', province: prov, region: reg }
            }
          }
        }
        // If state matched a region name, find province from city
        if (addr.state) {
          const regionNorm = normalize(addr.state)
          for (const [prov, reg] of Object.entries(PROVINCE_TO_REGION)) {
            if (normalize(reg) === regionNorm) {
              return { country: 'ES', province: prov, region: reg }
            }
          }
        }
      }

      return { country: countryCode, province: null, region: null }
    }
  }
  catch {
    // Geocoding failed, return local result
  }

  return local
}
