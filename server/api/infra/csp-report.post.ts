/**
 * CSP Violation Report endpoint.
 *
 * Receives Content-Security-Policy violation reports from browsers.
 * Logs them for monitoring and XSS detection.
 *
 * POST /api/infra/csp-report
 */
import { defineEventHandler, readBody } from 'h3'
import { logger } from '../../utils/logger'

interface CspReport {
  'csp-report'?: {
    'document-uri'?: string
    'violated-directive'?: string
    'blocked-uri'?: string
    'source-file'?: string
    'line-number'?: number
    'column-number'?: number
    'original-policy'?: string
    disposition?: string
  }
}

// Rate limit: avoid flooding logs
let reportCount = 0
let lastResetTime = Date.now()
const MAX_REPORTS_PER_MINUTE = 50

// Per-directive violation counts for alerting
// Resets every minute along with the main rate limit counter
const directiveCounts = new Map<string, number>()
const ALERT_THRESHOLD = 5 // alert when same directive fires >5 times/min

export default defineEventHandler(async (event) => {
  // Simple rate limit for report flooding
  const now = Date.now()
  if (now - lastResetTime > 60_000) {
    reportCount = 0
    directiveCounts.clear()
    lastResetTime = now
  }
  reportCount++
  if (reportCount > MAX_REPORTS_PER_MINUTE) {
    return { status: 'rate_limited' }
  }

  let body: CspReport
  try {
    body = await readBody(event)
  } catch {
    return { status: 'invalid' }
  }

  const report = body?.['csp-report']
  if (!report) {
    return { status: 'no_report' }
  }

  // Filter out known noise (browser extensions, analytics)
  const blockedUri = report['blocked-uri'] || ''
  const knownNoise = [
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    'about:',
    'data:',
    'blob:',
  ]
  if (knownNoise.some((prefix) => blockedUri.startsWith(prefix))) {
    return { status: 'filtered' }
  }

  // Log the violation
  const violatedDirective = report['violated-directive'] || 'unknown'
  logger.warn('[CSP-Violation]', {
    documentUri: report['document-uri'],
    violatedDirective,
    blockedUri: report['blocked-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
    disposition: report.disposition,
    timestamp: new Date().toISOString(),
  })

  // Threshold alerting: same directive repeated >5 times/min may indicate active attack
  const prevCount = directiveCounts.get(violatedDirective) ?? 0
  directiveCounts.set(violatedDirective, prevCount + 1)
  if (prevCount + 1 === ALERT_THRESHOLD) {
    logger.error('[CSP-ALERT] Repeated violation — possible XSS or misconfiguration', {
      violatedDirective,
      blockedUri: report['blocked-uri'],
      documentUri: report['document-uri'],
      count: prevCount + 1,
      windowMs: 60_000,
      timestamp: new Date().toISOString(),
    })
  }

  // Optionally store in DB for dashboard (if infra_metrics or csp_reports table exists)
  try {
    const rest = useSupabaseRestHeaders()
    if (rest) {
      await $fetch(`${rest.url}/rest/v1/infra_metrics`, {
        method: 'POST',
        headers: { ...rest.headers, Prefer: 'return=minimal' },
        body: {
          metric_type: 'csp_violation',
          value: 1,
          metadata: {
            violated_directive: report['violated-directive'],
            blocked_uri: report['blocked-uri'],
            document_uri: report['document-uri'],
            source_file: report['source-file'],
          },
        },
      })
    }
  } catch {
    // Best effort — don't fail if DB insert fails
  }

  return { status: 'received' }
})
