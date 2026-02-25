import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Wrapper for serverSupabaseServiceRole with clearer naming.
 * New endpoints should use this helper for consistency.
 */
export function useSupabaseAdmin(event: H3Event) {
  return serverSupabaseServiceRole(event)
}

/**
 * Build Supabase REST API headers for direct fetch calls.
 * Useful when tables are not yet in generated types.
 */
export function useSupabaseRestHeaders(): { url: string; headers: Record<string, string> } | null {
  const config = useRuntimeConfig()
  const supabaseUrl = (config.public?.supabaseUrl as string | undefined) || process.env.SUPABASE_URL
  const supabaseKey =
    (config.supabaseServiceRoleKey as string | undefined) || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) return null

  return {
    url: supabaseUrl,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
  }
}
