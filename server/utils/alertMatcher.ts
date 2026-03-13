/**
 * Alert Matcher — Pure utility for matching a vehicle against search alert filters.
 *
 * Used by the instant alerts system (#212) to determine if a newly published
 * vehicle matches a user's saved search alert criteria.
 */

export interface AlertFilters {
  category_id?: string
  subcategory_id?: string
  price_min?: number
  price_max?: number
  year_min?: number
  year_max?: number
  km_max?: number
  brand?: string
  model?: string
  zone?: string
  location_country?: string
  location_region?: string
  [key: string]: string | number | boolean | undefined
}

export interface VehicleForMatching {
  id: string
  brand: string | null
  model: string | null
  price: number | null
  year: number | null
  km: number | null
  category_id: string | null
  subcategory_id: string | null
  location_country: string | null
  location_region: string | null
  slug: string
}

/**
 * Check if a vehicle matches the given alert filters.
 * All defined filters must match (AND logic).
 * Undefined/null filter fields are ignored (match anything).
 */
export function matchesVehicle(vehicle: VehicleForMatching, filters: AlertFilters): boolean {
  if (filters.category_id && vehicle.category_id !== filters.category_id) return false

  if (filters.subcategory_id && vehicle.subcategory_id !== filters.subcategory_id) return false

  if (filters.price_min != null && (vehicle.price == null || vehicle.price < filters.price_min))
    return false

  if (filters.price_max != null && (vehicle.price == null || vehicle.price > filters.price_max))
    return false

  if (filters.year_min != null && (vehicle.year == null || vehicle.year < filters.year_min))
    return false

  if (filters.year_max != null && (vehicle.year == null || vehicle.year > filters.year_max))
    return false

  if (filters.km_max != null && (vehicle.km == null || vehicle.km > filters.km_max)) return false

  if (filters.brand && !ciMatch(vehicle.brand, filters.brand)) return false

  if (filters.model && !ciMatch(vehicle.model, filters.model)) return false

  if (filters.location_country && vehicle.location_country !== filters.location_country)
    return false

  if (filters.location_region && !ciMatch(vehicle.location_region, filters.location_region))
    return false

  if (filters.zone && !ciMatch(vehicle.location_region, filters.zone)) return false

  return true
}

/** Case-insensitive partial match (like SQL ILIKE) */
function ciMatch(value: string | null, pattern: string): boolean {
  if (!value) return false
  return value.toLowerCase().includes(pattern.toLowerCase())
}
