import type { H3Event } from 'h3'

/**
 * Module-level singleton logger for utilities without an H3Event.
 * For request handlers, prefer createLogger(event) to include reqId and path.
 */
export const logger = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.info(JSON.stringify({ level: 'info', msg, ...data })),
  warn: (msg: string, data?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', msg, ...data })),
  error: (msg: string, data?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', msg, ...data })),
}

/**
 * Structured logger that includes request ID for traceability.
 * Use instead of console.log/error/warn in server routes.
 */
export function createLogger(event: H3Event) {
  const reqId = event.context.requestId ?? 'no-id'
  const correlationId = event.context.correlationId ?? reqId
  const path = event.path || 'unknown'

  return {
    info: (msg: string, data?: Record<string, unknown>) =>
      console.info(JSON.stringify({ level: 'info', reqId, correlationId, path, msg, ...data })),
    warn: (msg: string, data?: Record<string, unknown>) =>
      console.warn(JSON.stringify({ level: 'warn', reqId, correlationId, path, msg, ...data })),
    error: (msg: string, data?: Record<string, unknown>) =>
      console.error(JSON.stringify({ level: 'error', reqId, correlationId, path, msg, ...data })),
  }
}
