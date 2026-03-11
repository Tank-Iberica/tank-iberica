import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if a request has already been processed (idempotency check)
 * Returns cached response if found and not expired, otherwise null
 */
export async function checkIdempotency(
  supabase: SupabaseClient,
  idempotencyKey: string,
): Promise<unknown> {
  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('response, expires_at')
    .eq('key', idempotencyKey)
    .maybeSingle()

  if (error || !data) return null
  if (new Date(data.expires_at) < new Date()) return null // expired
  return data.response
}

/**
 * Store the result of a request for idempotency
 */
export async function storeIdempotencyResponse(
  supabase: SupabaseClient,
  idempotencyKey: string,
  endpoint: string,
  response: unknown,
): Promise<void> {
  await supabase.from('idempotency_keys').insert({
    key: idempotencyKey,
    endpoint,
    response,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })
}

/**
 * Get idempotency key from request headers
 * Standard: Idempotency-Key header
 */
export function getIdempotencyKey(headers: Record<string, string | string[] | undefined>): string | null {
  const key = headers['idempotency-key'] || headers['Idempotency-Key']
  if (Array.isArray(key)) return key[0] || null
  return key || null
}
