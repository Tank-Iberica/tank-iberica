/**
 * Bot detection middleware
 *
 * Detects and blocks known malicious scanner User-Agents.
 * Logs requests with missing UA on API routes for monitoring.
 * Does NOT block missing UA (legitimate headless clients may omit it).
 */
import { defineEventHandler, getHeader, setResponseStatus } from 'h3'
import { logger } from '../utils/logger'

/** Known malicious scanner signatures */
const SCANNER_UA_PATTERNS: RegExp[] = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /zgrab/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /nmap nse/i,
  /nessus/i,
  /openvas/i,
  /nuclei/i,
  /acunetix/i,
  /burpsuite/i,
  /python-requests\/[0-9].*scan/i,
]

/** Paths that skip bot detection (health probes, CSP reports) */
const SKIP_PATHS: string[] = [
  '/api/health',
  '/api/infra/csp-report',
  '/api/error-report',
  '/api/whatsapp/webhook',
]

export default defineEventHandler((event) => {
  const url = event.node?.req?.url ?? ''

  // Only check API endpoints
  if (!url.startsWith('/api/')) return
  if (SKIP_PATHS.some((p) => url.startsWith(p))) return

  const ua = getHeader(event, 'user-agent') ?? ''
  const ip =
    getHeader(event, 'x-forwarded-for') ??
    getHeader(event, 'x-real-ip') ??
    'unknown'

  // Block known malicious scanners
  if (ua && SCANNER_UA_PATTERNS.some((p) => p.test(ua))) {
    logger.warn('[bot-detection] scanner blocked', {
      ua,
      url,
      ip,
      method: event.method,
    })
    setResponseStatus(event, 403)
    return { error: 'Forbidden' }
  }

  // Log (but do not block) API requests with no User-Agent
  if (!ua) {
    logger.warn('[bot-detection] no user-agent on API', {
      url,
      ip,
      method: event.method,
    })
  }
})
