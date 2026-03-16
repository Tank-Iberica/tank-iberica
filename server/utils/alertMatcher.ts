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

/** Check if a numeric field fails a minimum filter. */
function failsMin(value: number | null, min: number | undefined | null): boolean {
  return min != null && (value == null || value < min)
}

/** Check if a numeric field fails a maximum filter. */
function failsMax(value: number | null, max: number | undefined | null): boolean {
  return max != null && (value == null || value > max)
}

/** Check if a string field fails an exact-match filter. */
function failsEq(value: string | null, filter: string | undefined): boolean {
  return !!filter && value !== filter
}

/** Check if a string field fails a case-insensitive partial-match filter. */
function failsCi(value: string | null, filter: string | undefined): boolean {
  return !!filter && !ciMatch(value, filter)
}

/**
 * Check if a vehicle matches the given alert filters.
 * All defined filters must match (AND logic).
 * Undefined/null filter fields are ignored (match anything).
 */
export function matchesVehicle(vehicle: VehicleForMatching, filters: AlertFilters): boolean {
  if (failsEq(vehicle.category_id, filters.category_id)) return false
  if (failsEq(vehicle.subcategory_id, filters.subcategory_id)) return false
  if (failsMin(vehicle.price, filters.price_min)) return false
  if (failsMax(vehicle.price, filters.price_max)) return false
  if (failsMin(vehicle.year, filters.year_min)) return false
  if (failsMax(vehicle.year, filters.year_max)) return false
  if (failsMax(vehicle.km, filters.km_max)) return false
  if (failsCi(vehicle.brand, filters.brand)) return false
  if (failsCi(vehicle.model, filters.model)) return false
  if (failsEq(vehicle.location_country, filters.location_country)) return false
  if (failsCi(vehicle.location_region, filters.location_region)) return false
  if (failsCi(vehicle.location_region, filters.zone)) return false
  return true
}

/** Case-insensitive partial match (like SQL ILIKE) */
function ciMatch(value: string | null, pattern: string): boolean {
  if (!value) return false
  return value.toLowerCase().includes(pattern.toLowerCase())
}
