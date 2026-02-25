/**
 * Supabase query helpers with automatic vertical filtering.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

function getVerticalSlug(): string {
  try {
    return (useRuntimeConfig().public.vertical as string) || 'tracciona'
  } catch {
    return 'tracciona'
  }
}

export function vehiclesQuery(supabase: SupabaseClient, vertical?: string) {
  const v = vertical || getVerticalSlug()
  return supabase.from('vehicles').select('*').eq('vertical', v)
}

export function dealersQuery(supabase: SupabaseClient, vertical?: string) {
  const v = vertical || getVerticalSlug()
  return supabase.from('dealers').select('*').eq('vertical', v)
}

export function articlesQuery(supabase: SupabaseClient, vertical?: string) {
  const v = vertical || getVerticalSlug()
  return supabase.from('articles').select('*').eq('vertical', v)
}

export function categoriesQuery(supabase: SupabaseClient, vertical?: string) {
  const v = vertical || getVerticalSlug()
  return supabase.from('categories').select('*').eq('vertical', v)
}
