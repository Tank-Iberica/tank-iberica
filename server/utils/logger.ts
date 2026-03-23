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
interface Logger {
  info: (msg: string, data?: Record<string, unknown>) => void
  warn: (msg: string, data?: Record<string, unknown>) => void
  error: (msg: string, data?: Record<string, unknown>) => void
}

export function createLogger(event: H3Event): Logger {
  const reqId = event.context.requestId ?? 'no-id'
  const correlationId = event.context.correlationId ?? reqId
  const path = event.path || 'unknown'
  // Include Sentry trace ID when present for e2e correlation in Sentry dashboard
  const sentryTrace = event.context.sentryTrace

  const base = sentryTrace
    ? { level: 'info', reqId, correlationId, path, sentryTrace }
    : { level: 'info', reqId, correlationId, path }

  return {
    info: (msg: string, data?: Record<string, unknown>) =>
      console.info(JSON.stringify({ ...base, level: 'info', msg, ...data })),
    warn: (msg: string, data?: Record<string, unknown>) =>
      console.warn(JSON.stringify({ ...base, level: 'warn', msg, ...data })),
    error: (msg: string, data?: Record<string, unknown>) =>
      console.error(JSON.stringify({ ...base, level: 'error', msg, ...data })),
  }
}
