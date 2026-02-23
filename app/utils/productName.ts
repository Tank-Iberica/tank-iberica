import type { Vehicle } from '~/composables/useVehicles'

/**
 * Build the product display name for a vehicle.
 * Format: Category + Subcategory + Brand + Model [+ (Year)]
 * Uses singular names (name_singular_es/en) for product context,
 * falling back to plural (name_es/en) if singular is not set.
 */
export function buildProductName(vehicle: Vehicle, locale: string, includeYear = false): string {
  const parts: string[] = []

  // Category (parent level, via junction) — singular for product names
  const cat = vehicle.subcategories?.subcategory_categories?.[0]?.categories
  if (cat) {
    const name =
      locale === 'en'
        ? cat.name_singular_en || cat.name_singular_es || cat.name_en || cat.name_es
        : cat.name_singular_es || cat.name_es
    parts.push(name)
  }

  // Subcategory — singular for product names
  if (vehicle.subcategories) {
    const name =
      locale === 'en'
        ? vehicle.subcategories.name_singular_en ||
          vehicle.subcategories.name_singular_es ||
          vehicle.subcategories.name_en ||
          vehicle.subcategories.name_es
        : vehicle.subcategories.name_singular_es || vehicle.subcategories.name_es
    parts.push(name)
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
