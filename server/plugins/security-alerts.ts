/**
 * Nitro plugin — registers the centralized security alert handler on server start.
 *
 * Connects securityEvents.ts to the logger so that when any IP exceeds the
 * threat threshold (≥10 events in 5 minutes), an error-level log entry is
 * emitted for external monitoring (Cloudflare Logpush, Axiom, Datadog, etc.).
 */
import { setSecurityAlertHandler } from '~~/server/utils/securityEvents'
import { logger } from '~~/server/utils/logger'

export default defineNitroPlugin(() => {
  setSecurityAlertHandler((ip, events) => {
    logger.error('[SECURITY-ALERT] IP exceeded threat threshold', {
      ip,
      count: events.length,
      types: [...new Set(events.map((e) => e.type))],
      paths: [...new Set(events.map((e) => e.path).filter(Boolean))].slice(0, 5),
      firstEventAt: events[0] ? new Date(events[0].timestamp).toISOString() : null,
      lastEventAt: events[events.length - 1]
        ? new Date(events[events.length - 1]!.timestamp).toISOString()
        : null,
    })
  })

  console.info('[security-alerts] Threat alert handler registered')
})
