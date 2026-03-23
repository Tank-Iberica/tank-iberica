import { defineEventHandler, setResponseHeader } from 'h3'
import { randomUUID } from 'node:crypto'

/**
 * Assigns a unique request ID and correlation ID to every incoming request.
 * Also extracts Sentry distributed trace headers (sentry-trace, baggage) for
 * end-to-end trace correlation between browser → edge → server → BD.
 *
 * - requestId: unique per request (short UUID)
 * - correlationId: passed from client via X-Correlation-ID header, or generated.
 * - sentryTrace: Sentry W3C trace header (from browserTracingIntegration)
 * - baggage: W3C baggage header carrying Sentry trace metadata
 *
 * Available via event.context.*. requestId and correlationId sent back in
 * response headers for debugging. sentryTrace logged for Sentry correlation.
 */
export default defineEventHandler((event) => {
  const requestId = (event.node.req.headers['x-request-id'] as string) || randomUUID().slice(0, 8)
  const correlationId = (event.node.req.headers['x-correlation-id'] as string) || requestId

  // Sentry distributed trace headers — injected by browserTracingIntegration on client
  const sentryTrace = (event.node.req.headers['sentry-trace'] as string) || undefined
  const baggage = (event.node.req.headers['baggage'] as string) || undefined

  event.context.requestId = requestId
  event.context.correlationId = correlationId
  event.context.sentryTrace = sentryTrace
  event.context.baggage = baggage

  setResponseHeader(event, 'x-request-id', requestId)
  setResponseHeader(event, 'x-correlation-id', correlationId)
})
