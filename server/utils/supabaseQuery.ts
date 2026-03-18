/**
 * Supabase query helpers with automatic vertical filtering.
 * Callers should provide explicit column lists via the `columns` parameter.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

function getVerticalSlug(): string {
  try {
    return useRuntimeConfig().public.vertical || 'tracciona'
  } catch {
    return 'tracciona'
  }
}

export function vehiclesQuery(supabase: SupabaseClient, vertical?: string, columns = 'id, slug, brand, model, year, price, status, vertical, category_id, subcategory_id, location, location_country, dealer_id, featured, created_at') {
  const v = vertical || getVerticalSlug()
  return supabase.from('vehicles').select(columns).eq('vertical', v)
}

export function dealersQuery(supabase: SupabaseClient, vertical?: string, columns = 'id, slug, user_id, company_name, logo_url, status, vertical, subscription_type, created_at') {
  const v = vertical || getVerticalSlug()
  return supabase.from('dealers').select(columns).eq('vertical', v)
}

export function articlesQuery(supabase: SupabaseClient, vertical?: string, columns = 'id, slug, title, status, section, vertical, published_at, cover_image_url, author, tags') {
  const v = vertical || getVerticalSlug()
  return supabase.from('articles').select(columns).eq('vertical', v)
}

export function categoriesQuery(supabase: SupabaseClient, vertical?: string, columns = 'id, slug, name, vertical') {
  const v = vertical || getVerticalSlug()
  return supabase.from('categories').select(columns).eq('vertical', v)
}
