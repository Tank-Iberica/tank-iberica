import type { Vehicle } from '~/composables/useVehicles'

/**
 * Build the product display name for a vehicle.
 * Format: Subcategory + Type + Brand + Model [+ (Year)]
 * Uses singular names (name_singular_es/en) for product context,
 * falling back to plural (name_es/en) if singular is not set.
 */
export function buildProductName(vehicle: Vehicle, locale: string, includeYear = false): string {
  const parts: string[] = []

  // Subcategory (parent level, via junction) — singular for product names
  const sub = vehicle.types?.type_subcategories?.[0]?.subcategories
  if (sub) {
    const name = locale === 'en'
      ? (sub.name_singular_en || sub.name_singular_es || sub.name_en || sub.name_es)
      : (sub.name_singular_es || sub.name_es)
    parts.push(name)
  }

  // Type — singular for product names
  if (vehicle.types) {
    const name = locale === 'en'
      ? (vehicle.types.name_singular_en || vehicle.types.name_singular_es || vehicle.types.name_en || vehicle.types.name_es)
      : (vehicle.types.name_singular_es || vehicle.types.name_es)
    parts.push(name)
  }

  // Brand + Model
  parts.push(vehicle.brand)
  parts.push(vehicle.model)

  // Year (only in grid/detail views)
  if (includeYear && vehicle.year) {
    parts.push(`(${vehicle.year})`)
  }

  return parts.join(' ')
}
