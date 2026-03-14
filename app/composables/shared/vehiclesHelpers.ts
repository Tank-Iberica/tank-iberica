/**
 * Pure helper functions for vehicle catalog queries.
 * applyFilters is separated from the composable so it can be tested in isolation.
 */

import type { VehicleFilters } from './vehiclesTypes'

// Supabase query builder chain — internal type for filter functions
export interface FilterChain {
  eq: (col: string, val: unknown) => FilterChain
  gte: (col: string, val: unknown) => FilterChain
  lte: (col: string, val: unknown) => FilterChain
  in: (col: string, vals: readonly unknown[]) => FilterChain
  or: (filters: string) => FilterChain
  ilike: (col: string, pattern: string) => FilterChain
}

/**
 * Applies catalog filters to a Supabase query builder chain.
 * Handles location (province > region > country), category, price, year, brand, featured.
 */
export function applyFilters(query: FilterChain, filters: VehicleFilters): FilterChain {
  let q = query

  q = q.or('visible_from.is.null,visible_from.lte.' + new Date().toISOString())

  if ((filters.actions || filters.categories)?.length) {
    q = q.in('category', (filters.actions || filters.categories!) as never)
  } else if (filters.action || filters.category) {
    q = q.eq('category', (filters.action || filters.category!) as never)
  }

  if (filters.category_id) q = q.eq('category_id', filters.category_id)
  if (filters.price_min !== undefined) q = q.gte('price', filters.price_min)
  if (filters.price_max !== undefined) q = q.lte('price', filters.price_max)
  if (filters.year_min !== undefined) q = q.gte('year', filters.year_min)
  if (filters.year_max !== undefined) q = q.lte('year', filters.year_max)
  if (filters.brand) q = q.ilike('brand', `%${filters.brand}%`)

  // Location filters (mutually exclusive, most specific wins)
  if (filters.location_province_eq) {
    q = q.eq('location_province', filters.location_province_eq)
  } else if (filters.location_regions?.length) {
    q = q.in('location_region', filters.location_regions)
  } else if (filters.location_countries?.length) {
    q = q.in('location_country', filters.location_countries)
  }

  if (filters.featured) q = q.eq('featured', true)
  if (filters.dealer_id) q = q.eq('dealer_id', filters.dealer_id)

  // #54 — Top-rated filter: only vehicles from dealers with trust_score >= 80
  if (filters.top_rated) q = q.gte('dealers.trust_score' as never, 80)

  return q
}
