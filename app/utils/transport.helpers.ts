/**
 * Pure functions for transport zone resolution and formatting.
 * Extracted from useTransport to enable testing without Vue reactivity.
 */

import { PROVINCE_TO_REGION } from '~/utils/geoData'

// Spanish postal code prefix → province name
export const SPANISH_POSTAL_PREFIXES: Readonly<Record<string, string>> = {
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

// Autonomous community → transport zone slug
export const REGION_TO_ZONE: Readonly<Record<string, string>> = {
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
export const FRENCH_SOUTH_PREFIXES = new Set([
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

/**
 * Resolve a postal code to a transport zone slug.
 * - Spanish CPs (5 digits, prefix 01-52) → province → region → zone
 * - Portuguese CPs (4 digits or 4+3) → 'portugal'
 * - French southern CPs → 'francia-sur'
 */
export function resolveZoneFromPostalCode(postalCode: string): string | null {
  const clean = postalCode.replaceAll(/\s+/g, '').replaceAll('-', '')

  // Portuguese postal codes: 4 digits (or 4+3 format like 1000-001 → 1000001)
  if (/^\d{4}$/.test(clean) || /^\d{7}$/.test(clean)) {
    return 'portugal'
  }

  // Spanish and French postal codes: 5 digits
  if (/^\d{5}$/.test(clean)) {
    const prefix = clean.substring(0, 2)

    const province = SPANISH_POSTAL_PREFIXES[prefix]
    if (province) {
      const region = PROVINCE_TO_REGION[province]
      if (region) {
        return REGION_TO_ZONE[region] || 'personalizado'
      }
      return 'personalizado'
    }

    if (FRENCH_SOUTH_PREFIXES.has(prefix)) {
      return 'francia-sur'
    }
  }

  return null
}

/**
 * Get the province name from a Spanish postal code.
 */
export function getProvinceFromPostalCode(postalCode: string): string | null {
  const clean = postalCode.replaceAll(/\s+/g, '').replaceAll('-', '')
  if (/^\d{5}$/.test(clean)) {
    const prefix = clean.substring(0, 2)
    return SPANISH_POSTAL_PREFIXES[prefix] || null
  }
  return null
}

/**
 * Format cents to display price string (e.g. 150000 → "1.500 €").
 */
export function formatCents(cents: number): string {
  const euros = cents / 100
  return (
    euros.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' \u20AC'
  )
}
