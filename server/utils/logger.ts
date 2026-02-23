import type { H3Event } from 'h3'

/**
 * Structured logger that includes request ID for traceability.
 * Use instead of console.log/error/warn in server routes.
 */
export function createLogger(event: H3Event) {
  const reqId = (event.context.requestId as string) || 'no-id'
  const path = event.path || 'unknown'

  return {
    info: (msg: string, data?: Record<string, unknown>) =>
      console.info(JSON.stringify({ level: 'info', reqId, path, msg, ...data })),
    warn: (msg: string, data?: Record<string, unknown>) =>
      console.warn(JSON.stringify({ level: 'warn', reqId, path, msg, ...data })),
    error: (msg: string, data?: Record<string, unknown>) =>
      console.error(JSON.stringify({ level: 'error', reqId, path, msg, ...data })),
  }
}
