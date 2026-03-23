/**
 * GET /api/alerts/:id/matches
 *
 * Returns top 20 published vehicles matching an alert's saved filters.
 * Auth required — only the alert owner can view matches.
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../../utils/safeError'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const id = getRouterParam(event, 'id')
  if (!id) throw safeError(400, 'Missing alert ID')

  const supabase = serverSupabaseServiceRole(event)

  // Fetch the alert and verify ownership
  const { data: alert, error: alertError } = await supabase
    .from('search_alerts')
    .select('id, filters, user_id')
    .eq('id', id)
    .single()

  if (alertError || !alert) throw safeError(404, 'Alert not found')
  if (alert.user_id !== user.id) throw safeError(403, 'Not your alert')

  const filters = (alert.filters ?? {}) as Record<string, unknown>

  // Build vehicle query with alert filters
  let query = supabase
    .from('vehicles')
    .select('id, brand, model, year, price, slug, main_image_url, location_province, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)

  // Apply filters dynamically
  if (filters.brand && typeof filters.brand === 'string') {
    query = query.ilike('brand', filters.brand)
  }
  if (filters.category_id && typeof filters.category_id === 'string') {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters.subcategory_id && typeof filters.subcategory_id === 'string') {
    query = query.eq('subcategory_id', filters.subcategory_id)
  }
  if (typeof filters.price_min === 'number') {
    query = query.gte('price', filters.price_min)
  }
  if (typeof filters.price_max === 'number') {
    query = query.lte('price', filters.price_max)
  }
  if (typeof filters.year_min === 'number') {
    query = query.gte('year', filters.year_min)
  }
  if (typeof filters.year_max === 'number') {
    query = query.lte('year', filters.year_max)
  }
  if (filters.location_province_eq && typeof filters.location_province_eq === 'string') {
    query = query.eq('location_province', filters.location_province_eq)
  }
  if (Array.isArray(filters.location_countries) && filters.location_countries.length) {
    query = query.in('location_country', filters.location_countries as string[])
  }

  const { data: vehicles, error: vError } = await query

  if (vError) throw safeError(500, `DB error: ${vError.message}`)

  return { matches: vehicles ?? [], total: vehicles?.length ?? 0 }
})
