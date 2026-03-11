/**
 * Honeypot endpoint — POST /api/wp-login
 *
 * Handles POST probes (WordPress login attempts).
 * Logs for security monitoring, returns 404.
 */
import { defineEventHandler, getHeader, setResponseStatus } from 'h3'
import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const ip = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown'
  const ua = getHeader(event, 'user-agent') || 'unknown'

  logger.warn('[honeypot]', {
    endpoint: '/api/wp-login',
    ip,
    ua,
    method: 'POST',
  })

  setResponseStatus(event, 404)
  return { error: 'Not found' }
})
