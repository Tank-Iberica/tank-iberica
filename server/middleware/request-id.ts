import { defineEventHandler, setResponseHeader } from 'h3'
import { randomUUID } from 'node:crypto'

/**
 * Assigns a unique request ID to every incoming request.
 * Available via event.context.requestId in all handlers.
 * Also sent back in X-Request-ID response header for debugging.
 */
export default defineEventHandler((event) => {
  const requestId = (event.node.req.headers['x-request-id'] as string) || randomUUID().slice(0, 8)
  event.context.requestId = requestId
  setResponseHeader(event, 'x-request-id', requestId)
})
