import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'

/**
 * Verify cron secret from request body or headers.
 * Fail-closed: in production, throws 500 if CRON_SECRET is not configured.
 * In dev, warns and allows execution without secret.
 */
export function verifyCronSecret(event: H3Event, bodySecret?: string): void {
  const config = useRuntimeConfig()
  const cronSecret = config.cronSecret || process.env.CRON_SECRET

  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 500, message: 'CRON_SECRET not configured' })
    }
    console.warn('[verifyCronSecret] No CRON_SECRET configured — allowing in dev mode')
    return
  }

  const headerSecret = getHeader(event, 'x-cron-secret')
  const authHeader = getHeader(event, 'authorization')

  const isAuthorized =
    bodySecret === cronSecret ||
    headerSecret === cronSecret ||
    authHeader === `Bearer ${cronSecret}`

  if (!isAuthorized) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}
