/**
 * Vehicle Repository — server-side data access layer for vehicles.
 *
 * Centralizes query logic and column selection to prevent inline query sprawl.
 * All methods are vertical-aware and enforce column selection for performance.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Minimal columns for listing/catalog contexts (avoids fetching heavy fields) */
const LIST_COLUMNS =
  'id, slug, title, price, currency, status, vertical, category_id, subcategory_id, year, mileage, location_province, location_country, images, dealer_id, created_at, updated_at, featured, views_count'

/** Full columns for vehicle detail pages */
const DETAIL_COLUMNS = `${LIST_COLUMNS}, description, description_en, characteristics, documents, financial_info, is_ai_generated, sold_at, reserved_at, metadata`

export const vehicleRepository = {
  /**
   * Find published vehicles for a vertical (catalog / public listing).
   */
  findPublished(
    supabase: SupabaseClient,
    options: { vertical: string; limit?: number; orderBy?: string; ascending?: boolean },
  ) {
    const { vertical, limit = 50, orderBy = 'created_at', ascending = false } = options
    let query = supabase
      .from('vehicles')
      .select(LIST_COLUMNS)
      .eq('vertical', vertical)
      .eq('status', 'published')
      .order(orderBy, { ascending })

    if (limit) query = query.limit(limit)
    return query
  },

  /**
   * Find a single vehicle by ID.
   */
  findById(supabase: SupabaseClient, id: string) {
    return supabase.from('vehicles').select(DETAIL_COLUMNS).eq('id', id).single()
  },

  /**
   * Find a single vehicle by slug (for public detail pages).
   */
  findBySlug(supabase: SupabaseClient, slug: string) {
    return supabase.from('vehicles').select(DETAIL_COLUMNS).eq('slug', slug).single()
  },

  /**
   * Find all vehicles belonging to a dealer.
   */
  findByDealer(
    supabase: SupabaseClient,
    dealerId: string,
    options: { status?: string; limit?: number } = {},
  ) {
    const { status, limit = 100 } = options
    let query = supabase
      .from('vehicles')
      .select(LIST_COLUMNS)
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)
    return query
  },

  /**
   * Find a single vehicle by ref_code (e.g. "TRC-00123"). (#60)
   */
  findByRefCode(supabase: SupabaseClient, refCode: string) {
    return supabase
      .from('vehicles')
      .select(`${DETAIL_COLUMNS}, ref_code`)
      .eq('ref_code', refCode.toUpperCase())
      .single()
  },

  /**
   * Find vehicles that match a status for a given vertical (for cron jobs / admin).
   */
  findByStatus(supabase: SupabaseClient, vertical: string, status: string, limit = 100) {
    return supabase
      .from('vehicles')
      .select(LIST_COLUMNS)
      .eq('vertical', vertical)
      .eq('status', status)
      .order('updated_at', { ascending: true })
      .limit(limit)
  },
}
