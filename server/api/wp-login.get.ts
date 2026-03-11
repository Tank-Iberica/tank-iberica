/**
 * Honeypot endpoint — /api/wp-login
 *
 * Mimics a WordPress login endpoint to detect CMS scanners.
 * Logs probe attempts for security monitoring, returns 404.
 *
 * P3 §2.2 — Honeypot endpoints to detect automated scanning.
 */
import { defineEventHandler, getHeader, setResponseStatus } from 'h3'
import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const ip = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown'
  const ua = getHeader(event, 'user-agent') || 'unknown'
  const method = event.method

  logger.warn('[honeypot]', {
    endpoint: '/api/wp-login',
    ip,
    ua,
    method,
  })

  setResponseStatus(event, 404)
  return { error: 'Not found' }
})
