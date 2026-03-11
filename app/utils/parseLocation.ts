import { PROVINCE_TO_REGION, COUNTRY_NAMES } from '~/utils/geoData'

// Major Spanish cities → province mapping (instant resolution)
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

function detectCountryCode(countryPart: string): string | null {
  if (!countryPart) return null
  const upper = countryPart.toUpperCase()
  if (upper.length === 2 && COUNTRY_NAMES.es?.[upper]) return upper
  return COUNTRY_NAME_TO_CODE[normalize(countryPart)] || null
}

function isSpanishLocation(cityPart: string): boolean {
  const norm = normalize(cityPart)
  return (
    Object.keys(CITY_TO_PROVINCE).some((k) => normalize(k) === norm) ||
    Object.keys(PROVINCE_TO_REGION).some((k) => normalize(k) === norm)
  )
}

function resolveSpanishProvince(cityPart: string): { province: string; region: string } | null {
  const norm = normalize(cityPart)
  for (const [key, prov] of Object.entries(CITY_TO_PROVINCE)) {
    if (normalize(key) === norm) {
      return { province: prov, region: PROVINCE_TO_REGION[prov] || '' }
    }
  }
  for (const [prov, reg] of Object.entries(PROVINCE_TO_REGION)) {
    if (normalize(prov) === norm) {
      return { province: prov, region: reg }
    }
  }
  return null
}

/**
 * Parse a location text like "Madrid, España" into structured fields (sync, local dictionary).
 */
export function parseLocationText(text: string | null): ParsedLocation {
  if (!text?.trim()) {
    return { country: null, province: null, region: null }
  }

  const parts = text.split(',').map((p) => p.trim())
  const cityPart = parts[0] || ''
  const countryPart = parts.length > 1 ? (parts.at(-1) ?? '') : ''

  let countryCode = detectCountryCode(countryPart)

  if (!countryCode && cityPart && isSpanishLocation(cityPart)) {
    countryCode = 'ES'
  }

  if (countryCode === 'ES' && cityPart) {
    const resolved = resolveSpanishProvince(cityPart)
    if (resolved) return { country: 'ES', ...resolved }
  }

  return { country: countryCode, province: null, region: null }
}

interface NominatimAddress {
  country_code?: string
  province?: string
  state?: string
  county?: string
  city?: string
  town?: string
  village?: string
}

function matchProvinceByCandidate(candidate: string): ParsedLocation | null {
  for (const [prov, reg] of Object.entries(PROVINCE_TO_REGION)) {
    if (normalize(prov) === normalize(candidate)) {
      return { country: 'ES', province: prov, region: reg }
    }
  }
  return null
}

function matchProvinceByRegion(state: string): ParsedLocation | null {
  const regionNorm = normalize(state)
  for (const [prov, reg] of Object.entries(PROVINCE_TO_REGION)) {
    if (normalize(reg) === regionNorm) {
      return { country: 'ES', province: prov, region: reg }
    }
  }
  return null
}

function resolveNominatimAddress(
  addr: NominatimAddress,
  fallbackCountry: string | null,
): ParsedLocation {
  const countryCode = addr.country_code?.toUpperCase() || fallbackCountry

  if (countryCode === 'ES') {
    const candidates = [addr.province, addr.state, addr.county].filter(Boolean) as string[]
    for (const candidate of candidates) {
      const match = matchProvinceByCandidate(candidate)
      if (match) return match
    }
    if (addr.state) {
      const match = matchProvinceByRegion(addr.state)
      if (match) return match
    }
  }

  return { country: countryCode, province: null, region: null }
}

/**
 * Geocode a location text using Nominatim (async fallback for unknown cities).
 * Returns enriched ParsedLocation with province/region from geocoding.
 * Works for any city worldwide — resolves country for all, province/region for Spain.
 */
export async function geocodeLocation(text: string | null): Promise<ParsedLocation> {
  const local = parseLocationText(text)

  if (local.province || !text?.trim()) {
    return local
  }

  try {
    const query = encodeURIComponent(text.trim())
    const res = await $fetch<Array<{ address?: NominatimAddress }>>(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1&accept-language=es`,
      { headers: { 'User-Agent': 'TankIberica/1.0' } },
    )

    if (res?.[0]?.address) {
      return resolveNominatimAddress(res[0].address, local.country)
    }
  } catch {
    // Geocoding failed, return local result
  }

  return local
}
