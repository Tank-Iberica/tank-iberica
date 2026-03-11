import { defineEventHandler, setResponseHeader } from 'h3'
import { randomUUID } from 'node:crypto'

/**
 * Assigns a unique request ID and correlation ID to every incoming request.
 *
 * - requestId: unique per request (short UUID)
 * - correlationId: passed from client via X-Correlation-ID header, or generated.
 *   Allows tracing a user flow across multiple requests, jobs, and logs.
 *
 * Available via event.context.requestId and event.context.correlationId.
 * Both sent back in response headers for debugging.
 */
export default defineEventHandler((event) => {
  const requestId = (event.node.req.headers['x-request-id'] as string) || randomUUID().slice(0, 8)
  const correlationId =
    (event.node.req.headers['x-correlation-id'] as string) || requestId

  event.context.requestId = requestId
  event.context.correlationId = correlationId

  setResponseHeader(event, 'x-request-id', requestId)
  setResponseHeader(event, 'x-correlation-id', correlationId)
})
