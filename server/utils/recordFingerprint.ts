/**
 * Record a device fingerprint for a user in the DB (fire-and-forget).
 *
 * Calls the `upsert_user_fingerprint` RPC which does an atomic
 * INSERT ... ON CONFLICT DO UPDATE with request_count increment.
 *
 * Never throws — errors are silently logged so the caller is never blocked.
 */
import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'

// DJB2 hash — same algorithm as getFingerprintKey() in rateLimit.ts
function djb2Hex(raw: string): string {
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i)
    hash = hash >>> 0
  }
  return hash.toString(16)
}

/** Partial IP — first two octets to reduce PII surface. */
function ipHint(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}`
  // IPv6 — take first two groups
  return ip.split(':').slice(0, 2).join(':')
}

/**
 * Record device fingerprint for a user. Fire-and-forget — does NOT block,
 * errors are swallowed after logging.
 *
 * @param event  - H3 request event (to read headers)
 * @param userId - Authenticated user UUID
 */
export function recordFingerprint(event: H3Event, userId: string): void {
  const ua = getHeader(event, 'user-agent') || ''
  const lang = getHeader(event, 'accept-language') || ''
  const fpHash = djb2Hex(`${ua}|${lang}`)

  const uaHint = ua.substring(0, 120) || null
  const rawIp =
    getHeader(event, 'cf-connecting-ip') ||
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(event, 'x-real-ip') ||
    null
  const ipHintVal = rawIp ? ipHint(rawIp) : null

  const supabase = serverSupabaseServiceRole(event) as SupabaseClient

  // Fire-and-forget
  Promise.resolve(
    supabase.rpc('upsert_user_fingerprint', {
      p_user_id: userId,
      p_fp_hash: fpHash,
      p_ua_hint: uaHint,
      p_ip_hint: ipHintVal,
    }),
  )
    .then(({ error }: { error?: { message: string } | null }) => {
      if (error) {
        logger.warn('[recordFingerprint] RPC failed', {
          userId: userId.substring(0, 8),
          fpHash,
          error: error.message,
        })
      }
    })
    .catch((err: unknown) => {
      logger.warn('[recordFingerprint] Unexpected error', {
        userId: userId.substring(0, 8),
        error: err instanceof Error ? err.message : String(err),
      })
    })
}
