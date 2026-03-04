import type { Vehicle } from '~/composables/useVehicles'
import { localizedField } from '~/composables/useLocalized'

interface NameFields {
  name_singular?: Record<string, string> | null
  name?: Record<string, string> | null
  name_es?: string | null
  name_en?: string | null
}

function resolveName(fields: NameFields, locale: string): string | null {
  return (
    localizedField(fields.name_singular, locale) ||
    localizedField(fields.name, locale) ||
    (locale === 'en' ? fields.name_en || fields.name_es : fields.name_es) || // NOSONAR typescript:S1874
    null
  )
}

function buildNameParts(vehicle: Vehicle, locale: string, includeYear: boolean): string[] {
  const parts: string[] = []
  const cat = vehicle.subcategories?.subcategory_categories?.[0]?.categories
  if (cat) {
    const name = resolveName(cat, locale)
    if (name) parts.push(name)
  }
  if (vehicle.subcategories) {
    const name = resolveName(vehicle.subcategories, locale)
    if (name) parts.push(name)
  }
  if (vehicle.brand) parts.push(vehicle.brand)
  if (vehicle.model) parts.push(vehicle.model)
  if (includeYear && vehicle.year) parts.push(`(${vehicle.year})`)
  return parts
}

/**
 * Build the product display name for a vehicle.
 * Format: Category + Subcategory + Brand + Model [+ (Year)]
 * Uses singular names (JSONB name_singular) for product context,
 * falling back to plural (JSONB name) then legacy columns.
 */
export function buildProductName(vehicle: Vehicle, locale: string, includeYear = false): string {
  const parts = buildNameParts(vehicle, locale, includeYear)
  if (parts.length === 0) return locale === 'en' ? 'Vehicle' : 'Vehículo'
  if (parts.length === 1 && parts[0] === `(${vehicle.year})`) {
    return locale === 'en' ? `Vehicle ${vehicle.year}` : `Vehículo ${vehicle.year}`
  }
  return parts.join(' ')
}
