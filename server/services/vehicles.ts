/**
 * Vehicle service — common queries and operations.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Get a vehicle by ID with common joins */
export async function getVehicleById(
  supabase: SupabaseClient,
  vehicleId: string,
  select = 'id, brand, model, year, price, slug, status, dealer_id, category_id',
) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(select)
    .eq('id', vehicleId)
    .single()

  if (error) return null
  return data
}

/** Get a vehicle by slug */
export async function getVehicleBySlug(
  supabase: SupabaseClient,
  slug: string,
  select = 'id, brand, model, year, price, slug, status, dealer_id, category_id',
) {
  const { data, error } = await supabase.from('vehicles').select(select).eq('slug', slug).single()

  if (error) return null
  return data
}

/** Count active vehicles for a dealer */
export async function countDealerActiveVehicles(
  supabase: SupabaseClient,
  dealerId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('dealer_id', dealerId)
    .eq('status', 'active')

  if (error) return 0
  return count || 0
}
