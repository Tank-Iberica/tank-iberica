// ============================================
// Static geographic dataset for location filter
// ============================================

export type LocationLevel =
  | 'provincia'
  | 'comunidad'
  | 'limitrofes'
  | 'nacional'
  | 'suroeste_europeo'
  | 'union_europea'
  | 'europa'
  | 'mundo'

// Southwest European countries (Spain's immediate commercial zone)
export const SOUTHWEST_EUROPE: string[] = ['ES', 'PT', 'FR', 'AD']

// Spanish-speaking countries (ISO codes) — fallback locale = 'es'
export const SPANISH_SPEAKING_COUNTRIES: string[] = [
  'ES', // España
  'MX', // México
  'CO', // Colombia
  'AR', // Argentina
  'PE', // Perú
  'VE', // Venezuela
  'CL', // Chile
  'EC', // Ecuador
  'GT', // Guatemala
  'CU', // Cuba
  'BO', // Bolivia
  'DO', // República Dominicana
  'HN', // Honduras
  'PY', // Paraguay
  'SV', // El Salvador
  'NI', // Nicaragua
  'CR', // Costa Rica
  'PA', // Panamá
  'UY', // Uruguay
  'GQ', // Guinea Ecuatorial
]

// Latin American (non-European) Spanish-speaking countries
export const LATAM_COUNTRIES: string[] = [
  'MX',
  'CO',
  'AR',
  'PE',
  'VE',
  'CL',
  'EC',
  'GT',
  'CU',
  'BO',
  'DO',
  'HN',
  'PY',
  'SV',
  'NI',
  'CR',
  'PA',
  'UY',
  'GQ',
]

/**
 * Returns the fallback locale for a given country code.
 * Spanish-speaking countries → 'es', all others → 'en'.
 */
export function getLocaleFallbackForCountry(countryCode: string | null): 'es' | 'en' {
  if (!countryCode) return 'es'
  return SPANISH_SPEAKING_COUNTRIES.includes(countryCode.toUpperCase()) ? 'es' : 'en'
}

// --- Spanish provinces → autonomous community ---
export const PROVINCE_TO_REGION: Record<string, string> = {
  Álava: 'País Vasco',
  Albacete: 'Castilla-La Mancha',
  Alicante: 'Comunidad Valenciana',
  Almería: 'Andalucía',
  Asturias: 'Asturias',
  Ávila: 'Castilla y León',
  Badajoz: 'Extremadura',
  Barcelona: 'Cataluña',
  Burgos: 'Castilla y León',
  Cáceres: 'Extremadura',
  Cádiz: 'Andalucía',
  Cantabria: 'Cantabria',
  Castellón: 'Comunidad Valenciana',
  'Ciudad Real': 'Castilla-La Mancha',
  Córdoba: 'Andalucía',
  'A Coruña': 'Galicia',
  Cuenca: 'Castilla-La Mancha',
  Gerona: 'Cataluña',
  Granada: 'Andalucía',
  Guadalajara: 'Castilla-La Mancha',
  Guipúzcoa: 'País Vasco',
  Huelva: 'Andalucía',
  Huesca: 'Aragón',
  Jaén: 'Andalucía',
  León: 'Castilla y León',
  Lérida: 'Cataluña',
  Lugo: 'Galicia',
  Madrid: 'Comunidad de Madrid',
  Málaga: 'Andalucía',
  Murcia: 'Región de Murcia',
  Navarra: 'Navarra',
  Ourense: 'Galicia',
  Palencia: 'Castilla y León',
  'Las Palmas': 'Canarias',
  Pontevedra: 'Galicia',
  'La Rioja': 'La Rioja',
  Salamanca: 'Castilla y León',
  'Santa Cruz de Tenerife': 'Canarias',
  Segovia: 'Castilla y León',
  Sevilla: 'Andalucía',
  Soria: 'Castilla y León',
  Tarragona: 'Cataluña',
  Teruel: 'Aragón',
  Toledo: 'Castilla-La Mancha',
  Valencia: 'Comunidad Valenciana',
  Valladolid: 'Castilla y León',
  Vizcaya: 'País Vasco',
  Zamora: 'Castilla y León',
  Zaragoza: 'Aragón',
  Ceuta: 'Ceuta',
  Melilla: 'Melilla',
  Baleares: 'Islas Baleares',
}

// --- Autonomous community adjacency ---
export const REGION_ADJACENCY: Record<string, string[]> = {
  Andalucía: [
    'Extremadura',
    'Castilla-La Mancha',
    'Región de Murcia',
    'Comunidad Valenciana',
    'Ceuta',
    'Melilla',
  ],
  Aragón: [
    'Cataluña',
    'Comunidad Valenciana',
    'Castilla-La Mancha',
    'Castilla y León',
    'La Rioja',
    'Navarra',
  ],
  Asturias: ['Galicia', 'Castilla y León', 'Cantabria'],
  'Islas Baleares': ['Cataluña', 'Comunidad Valenciana'],
  Canarias: [],
  Cantabria: ['Asturias', 'Castilla y León', 'País Vasco'],
  'Castilla y León': [
    'Galicia',
    'Asturias',
    'Cantabria',
    'País Vasco',
    'La Rioja',
    'Aragón',
    'Castilla-La Mancha',
    'Comunidad de Madrid',
    'Extremadura',
  ],
  'Castilla-La Mancha': [
    'Comunidad de Madrid',
    'Castilla y León',
    'Aragón',
    'Comunidad Valenciana',
    'Región de Murcia',
    'Andalucía',
    'Extremadura',
  ],
  Cataluña: ['Aragón', 'Comunidad Valenciana', 'Islas Baleares'],
  'Comunidad Valenciana': [
    'Cataluña',
    'Aragón',
    'Castilla-La Mancha',
    'Región de Murcia',
    'Andalucía',
    'Islas Baleares',
  ],
  Extremadura: ['Castilla y León', 'Castilla-La Mancha', 'Andalucía'],
  Galicia: ['Asturias', 'Castilla y León'],
  'Comunidad de Madrid': ['Castilla y León', 'Castilla-La Mancha'],
  'Región de Murcia': ['Comunidad Valenciana', 'Castilla-La Mancha', 'Andalucía'],
  Navarra: ['País Vasco', 'La Rioja', 'Aragón'],
  'País Vasco': ['Cantabria', 'Castilla y León', 'La Rioja', 'Navarra'],
  'La Rioja': ['País Vasco', 'Navarra', 'Aragón', 'Castilla y León'],
  Ceuta: ['Andalucía'],
  Melilla: ['Andalucía'],
}

// --- European country adjacency (ISO codes) ---
export const COUNTRY_ADJACENCY: Record<string, string[]> = {
  ES: ['FR', 'PT', 'AD'],
  FR: ['ES', 'AD', 'BE', 'LU', 'DE', 'CH', 'IT', 'MC'],
  PT: ['ES'],
  AD: ['ES', 'FR'],
  DE: ['FR', 'BE', 'LU', 'NL', 'DK', 'PL', 'CZ', 'AT', 'CH'],
  IT: ['FR', 'CH', 'AT', 'SI', 'SM'],
  GB: ['IE'],
  IE: ['GB'],
  BE: ['FR', 'LU', 'DE', 'NL'],
  NL: ['BE', 'DE'],
  LU: ['FR', 'BE', 'DE'],
  CH: ['FR', 'DE', 'AT', 'IT', 'LI'],
  AT: ['DE', 'CH', 'IT', 'SI', 'HU', 'SK', 'CZ', 'LI'],
  PL: ['DE', 'CZ', 'SK', 'UA', 'BY', 'LT', 'RU'],
  CZ: ['DE', 'PL', 'SK', 'AT'],
  SK: ['CZ', 'PL', 'UA', 'HU', 'AT'],
  HU: ['AT', 'SK', 'UA', 'RO', 'RS', 'HR', 'SI'],
  SI: ['IT', 'AT', 'HU', 'HR'],
  HR: ['SI', 'HU', 'RS', 'BA', 'ME'],
  RO: ['HU', 'UA', 'MD', 'BG', 'RS'],
  BG: ['RO', 'RS', 'MK', 'GR', 'TR'],
  GR: ['BG', 'TR', 'MK', 'AL'],
  SE: ['NO', 'FI', 'DK'],
  NO: ['SE', 'FI', 'RU'],
  FI: ['SE', 'NO', 'RU'],
  DK: ['DE', 'SE'],
  EE: ['LV', 'RU'],
  LV: ['EE', 'LT', 'RU', 'BY'],
  LT: ['LV', 'PL', 'BY', 'RU'],
  RS: ['HU', 'RO', 'BG', 'MK', 'AL', 'ME', 'BA', 'HR'],
  BA: ['HR', 'RS', 'ME'],
  ME: ['HR', 'BA', 'RS', 'AL'],
  MK: ['RS', 'BG', 'GR', 'AL'],
  AL: ['ME', 'RS', 'MK', 'GR'],
  UA: ['PL', 'SK', 'HU', 'RO', 'MD', 'BY', 'RU'],
  BY: ['PL', 'LT', 'LV', 'RU', 'UA'],
  MD: ['RO', 'UA'],
  TR: ['BG', 'GR'],
  MC: ['FR'],
  SM: ['IT'],

  LI: ['CH', 'AT'],
  MT: [],
  IS: [],
  CY: [],
  RU: ['NO', 'FI', 'EE', 'LV', 'LT', 'PL', 'BY', 'UA'],
}

// --- EU member states (27) ---
export const EU_MEMBERS: string[] = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]

// --- All European countries ---
export const EUROPEAN_COUNTRIES: string[] = [
  ...EU_MEMBERS,
  'GB',
  'NO',
  'CH',
  'IS',
  'LI',
  'AD',
  'MC',
  'SM',
  'ME',
  'RS',
  'BA',
  'MK',
  'AL',
  'MD',
  'UA',
  'BY',
  'RU',
  'TR',
]

// --- Country names by locale ---
export const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  es: {
    ES: 'España',
    PT: 'Portugal',
    FR: 'Francia',
    GR: 'Grecia',
    DE: 'Alemania',
    IT: 'Italia',
    GB: 'Reino Unido',
    NL: 'Países Bajos',
    BE: 'Bélgica',
    AT: 'Austria',
    CH: 'Suiza',
    PL: 'Polonia',
    CZ: 'Chequia',
    SK: 'Eslovaquia',
    HU: 'Hungría',
    RO: 'Rumanía',
    BG: 'Bulgaria',
    HR: 'Croacia',
    SI: 'Eslovenia',
    SE: 'Suecia',
    DK: 'Dinamarca',
    FI: 'Finlandia',
    NO: 'Noruega',
    IE: 'Irlanda',
    LU: 'Luxemburgo',
    EE: 'Estonia',
    LV: 'Letonia',
    LT: 'Lituania',
    MT: 'Malta',
    CY: 'Chipre',
    IS: 'Islandia',
    AD: 'Andorra',
    MC: 'Mónaco',
    SM: 'San Marino',
    LI: 'Liechtenstein',
    ME: 'Montenegro',
    RS: 'Serbia',
    BA: 'Bosnia y Herzegovina',
    MK: 'Macedonia del Norte',
    AL: 'Albania',
    MD: 'Moldavia',
    UA: 'Ucrania',
    BY: 'Bielorrusia',
    RU: 'Rusia',
    TR: 'Turquía',
    // LATAM
    MX: 'México',
    CO: 'Colombia',
    AR: 'Argentina',
    PE: 'Perú',
    VE: 'Venezuela',
    CL: 'Chile',
    EC: 'Ecuador',
    GT: 'Guatemala',
    CU: 'Cuba',
    BO: 'Bolivia',
    DO: 'Rep. Dominicana',
    HN: 'Honduras',
    PY: 'Paraguay',
    SV: 'El Salvador',
    NI: 'Nicaragua',
    CR: 'Costa Rica',
    PA: 'Panamá',
    UY: 'Uruguay',
    GQ: 'Guinea Ecuatorial',
  },
  en: {
    ES: 'Spain',
    PT: 'Portugal',
    FR: 'France',
    GR: 'Greece',
    DE: 'Germany',
    IT: 'Italy',
    GB: 'United Kingdom',
    NL: 'Netherlands',
    BE: 'Belgium',
    AT: 'Austria',
    CH: 'Switzerland',
    PL: 'Poland',
    CZ: 'Czechia',
    SK: 'Slovakia',
    HU: 'Hungary',
    RO: 'Romania',
    BG: 'Bulgaria',
    HR: 'Croatia',
    SI: 'Slovenia',
    SE: 'Sweden',
    DK: 'Denmark',
    FI: 'Finland',
    NO: 'Norway',
    IE: 'Ireland',
    LU: 'Luxembourg',
    EE: 'Estonia',
    LV: 'Latvia',
    LT: 'Lithuania',
    MT: 'Malta',
    CY: 'Cyprus',
    IS: 'Iceland',
    AD: 'Andorra',
    MC: 'Monaco',
    SM: 'San Marino',
    LI: 'Liechtenstein',
    ME: 'Montenegro',
    RS: 'Serbia',
    BA: 'Bosnia and Herzegovina',
    MK: 'North Macedonia',
    AL: 'Albania',
    MD: 'Moldova',
    UA: 'Ukraine',
    BY: 'Belarus',
    RU: 'Russia',
    TR: 'Turkey',
    // LATAM
    MX: 'Mexico',
    CO: 'Colombia',
    AR: 'Argentina',
    PE: 'Peru',
    VE: 'Venezuela',
    CL: 'Chile',
    EC: 'Ecuador',
    GT: 'Guatemala',
    CU: 'Cuba',
    BO: 'Bolivia',
    DO: 'Dominican Republic',
    HN: 'Honduras',
    PY: 'Paraguay',
    SV: 'El Salvador',
    NI: 'Nicaragua',
    CR: 'Costa Rica',
    PA: 'Panama',
    UY: 'Uruguay',
    GQ: 'Equatorial Guinea',
  },
}

// Priority countries shown first in selector
const PRIORITY_COUNTRIES = ['ES', 'PT', 'FR', 'GR']

type CountryEntry = { code: string; name: string; flag: string }

/**
 * Returns European countries split into priority and rest (alphabetically by locale).
 */
export function getSortedEuropeanCountries(locale = 'es'): {
  priority: CountryEntry[]
  rest: CountryEntry[]
} {
  const names = COUNTRY_NAMES[locale] || COUNTRY_NAMES.es!
  const toEntry = (c: string): CountryEntry => ({
    code: c,
    name: names[c] || c,
    flag: countryFlag(c),
  })

  const priority = PRIORITY_COUNTRIES.filter((c) => EUROPEAN_COUNTRIES.includes(c)).map(toEntry)

  const rest = EUROPEAN_COUNTRIES.filter((c) => !PRIORITY_COUNTRIES.includes(c))
    .map(toEntry)
    .sort((a, b) => a.name.localeCompare(b.name, locale))

  return { priority, rest }
}

/**
 * Returns Spanish provinces sorted alphabetically.
 */
export function getSortedProvinces(): string[] {
  return Object.keys(PROVINCE_TO_REGION).sort((a, b) => a.localeCompare(b, 'es'))
}

// --- ISO code → flag emoji ---
export function countryFlag(iso: string): string {
  if (!iso || iso.length !== 2) return ''
  const upper = iso.toUpperCase()
  return String.fromCodePoint(...[...upper].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65))
}

// --- All available location levels (always show all) ---
export function getAvailableLevels(country: string | null): LocationLevel[] {
  // For Spain, show all levels including province/region
  if (country === 'ES') {
    return [
      'provincia',
      'comunidad',
      'limitrofes',
      'nacional',
      'suroeste_europeo',
      'union_europea',
      'europa',
      'mundo',
    ]
  }
  // For other countries, skip Spanish-specific levels
  return ['nacional', 'suroeste_europeo', 'union_europea', 'europa', 'mundo']
}

// --- Get default level based on detected country ---
export function getDefaultLevel(country: string | null): LocationLevel {
  // If Spain or no country detected, default to Nacional
  if (!country || country === 'ES') {
    return 'nacional'
  }
  // For other countries, default to Europa
  return 'europa'
}

// --- Get country ISO codes for a given level ---
export function getCountriesForLevel(
  level: LocationLevel,
  userCountry: string | null,
): string[] | null {
  switch (level) {
    case 'nacional':
    case 'provincia':
    case 'comunidad':
    case 'limitrofes':
      return userCountry ? [userCountry] : ['ES'] // Default to Spain
    case 'suroeste_europeo':
      return [...SOUTHWEST_EUROPE]
    case 'union_europea':
      return [...EU_MEMBERS]
    case 'europa':
      return [...EUROPEAN_COUNTRIES]
    case 'mundo':
      return null // no filter
  }
}

// --- Countries available for profile preference (Europe + LATAM) ---
type ProfileCountryEntry = { code: string; name: string; flag: string }
type ProfileCountryGroups = {
  priority: ProfileCountryEntry[]
  europe: ProfileCountryEntry[]
  latam: ProfileCountryEntry[]
}

export function getProfileCountries(locale = 'es'): ProfileCountryGroups {
  const names = COUNTRY_NAMES[locale] || COUNTRY_NAMES['es']!
  const toEntry = (c: string): ProfileCountryEntry => ({
    code: c,
    name: names[c] || c,
    flag: countryFlag(c),
  })

  const priority = ['ES', 'PT', 'FR', 'DE', 'IT', 'GB'].map(toEntry)

  const europe = EUROPEAN_COUNTRIES.filter((c) => !['ES', 'PT', 'FR', 'DE', 'IT', 'GB'].includes(c))
    .map(toEntry)
    .sort((a, b) => a.name.localeCompare(b.name, locale))

  const latam = LATAM_COUNTRIES.map(toEntry).sort((a, b) => a.name.localeCompare(b.name, locale))

  return { priority, europe, latam }
}

// --- Get regions for Spanish sub-country levels ---
export function getRegionsForLevel(
  level: LocationLevel,
  userRegion: string | null,
): string[] | null {
  switch (level) {
    case 'comunidad':
      return userRegion ? [userRegion] : null
    case 'limitrofes':
      if (!userRegion) return null
      return [userRegion, ...(REGION_ADJACENCY[userRegion] || [])]
    default:
      return null // not a region-level filter
  }
}
