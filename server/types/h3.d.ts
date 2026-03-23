/**
 * Typed H3 Event Context
 *
 * Augments H3's H3EventContext with all properties injected by Tracciona
 * server middleware, giving full type safety throughout server routes.
 *
 * Properties are injected by:
 *   - request-id.ts      → requestId, correlationId
 *   - vertical-context.ts → vertical
 */
declare module 'h3' {
  interface H3EventContext {
    /** Unique request ID (short UUID), injected by request-id middleware */
    requestId?: string
    /** Correlation ID for tracing multi-step flows, injected by request-id middleware */
    correlationId?: string
    /** Active vertical slug (e.g. 'tracciona'), injected by vertical-context middleware */
    vertical?: string
    /** Sentry W3C trace header from client browserTracingIntegration, for e2e correlation */
    sentryTrace?: string
    /** W3C baggage header carrying Sentry trace metadata */
    baggage?: string
  }
}

export {}
