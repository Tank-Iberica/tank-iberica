import type { Vehicle } from '~/composables/useVehicles'
import { localizedField } from '~/composables/useLocalized'

/**
 * Build the product display name for a vehicle.
 * Format: Category + Subcategory + Brand + Model [+ (Year)]
 * Uses singular names (JSONB name_singular) for product context,
 * falling back to plural (JSONB name) then legacy columns.
 */
export function buildProductName(vehicle: Vehicle, locale: string, includeYear = false): string {
  const parts: string[] = []

  // Category (parent level, via junction) — singular for product names
  const cat = vehicle.subcategories?.subcategory_categories?.[0]?.categories
  if (cat) {
    const name =
      localizedField(cat.name_singular, locale) ||
      localizedField(cat.name, locale) ||
      (locale === 'en' ? cat.name_en || cat.name_es : cat.name_es)
    if (name) parts.push(name)
  }

  // Subcategory — singular for product names
  if (vehicle.subcategories) {
    const sub = vehicle.subcategories
    const name =
      localizedField(sub.name_singular, locale) ||
      localizedField(sub.name, locale) ||
      (locale === 'en' ? sub.name_en || sub.name_es : sub.name_es)
    if (name) parts.push(name)
  }

  // Brand + Model
  if (vehicle.brand) parts.push(vehicle.brand)
  if (vehicle.model) parts.push(vehicle.model)

  // Year (only in grid/detail views)
  if (includeYear && vehicle.year) {
    parts.push(`(${vehicle.year})`)
  }

  // Fallback if no meaningful data
  if (parts.length === 0) {
    return locale === 'en' ? 'Vehicle' : 'Vehículo'
  }
  if (parts.length === 1 && parts[0] === `(${vehicle.year})`) {
    return locale === 'en' ? `Vehicle ${vehicle.year}` : `Vehículo ${vehicle.year}`
  }

  return parts.join(' ')
}
