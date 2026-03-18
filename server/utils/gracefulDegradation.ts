/**
 * Graceful Degradation Plan — Fallback strategies per external service.
 *
 * When an external service is down, the system degrades gracefully:
 *   - Cloudinary → use original image URLs (no transforms)
 *   - Stripe → queue payment for retry, show "processing" to user
 *   - Resend → queue email for retry via jobQueue
 *   - OpenAI/AI → return cached or default response
 *   - Supabase → return cached data if available
 *
 * Each service has a health status tracked in-memory with TTL.
 *
 * Roadmap: N31 — Graceful degradation plan por servicio externo
 */

// ── Service registry ──────────────────────────────────────────────────────────

export type ExternalService = 'cloudinary' | 'stripe' | 'resend' | 'ai' | 'supabase'

export type ServiceStatus = 'healthy' | 'degraded' | 'down'

export interface ServiceHealth {
  status: ServiceStatus
  lastCheck: number
  failureCount: number
  lastError?: string
}

export interface FallbackStrategy {
  service: ExternalService
  fallbackDescription: string
  retryable: boolean
  maxRetries: number
  retryDelayMs: number
}

// ── Fallback definitions ──────────────────────────────────────────────────────

export const FALLBACK_STRATEGIES: Record<ExternalService, FallbackStrategy> = {
  cloudinary: {
    service: 'cloudinary',
    fallbackDescription: 'Use original image URL without transforms',
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 5_000,
  },
  stripe: {
    service: 'stripe',
    fallbackDescription: 'Queue payment for retry, show processing status to user',
    retryable: true,
    maxRetries: 5,
    retryDelayMs: 30_000,
  },
  resend: {
    service: 'resend',
    fallbackDescription: 'Queue email via jobQueue for async retry',
    retryable: true,
    maxRetries: 10,
    retryDelayMs: 60_000,
  },
  ai: {
    service: 'ai',
    fallbackDescription: 'Return cached or default text, skip AI generation',
    retryable: true,
    maxRetries: 2,
    retryDelayMs: 10_000,
  },
  supabase: {
    service: 'supabase',
    fallbackDescription: 'Return cached data if available, show stale indicator',
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 5_000,
  },
}

// ── Health tracking ───────────────────────────────────────────────────────────

const HEALTH_TTL_MS = 60_000 // Re-check health every 60s
const FAILURE_THRESHOLD = 3 // Mark as degraded after 3 failures
const DOWN_THRESHOLD = 5 // Mark as down after 5 failures

const healthStore = new Map<ExternalService, ServiceHealth>()

/**
 * Report a successful call to a service (resets failure count).
 */
export function reportSuccess(service: ExternalService): void {
  healthStore.set(service, {
    status: 'healthy',
    lastCheck: Date.now(),
    failureCount: 0,
  })
}

/**
 * Report a failed call to a service.
 * Automatically updates status based on failure count thresholds.
 */
export function reportFailure(service: ExternalService, error?: string): ServiceStatus {
  const current = healthStore.get(service) || {
    status: 'healthy' as ServiceStatus,
    lastCheck: Date.now(),
    failureCount: 0,
  }

  const failureCount = current.failureCount + 1
  let status: ServiceStatus = 'healthy'

  if (failureCount >= DOWN_THRESHOLD) {
    status = 'down'
  } else if (failureCount >= FAILURE_THRESHOLD) {
    status = 'degraded'
  }

  healthStore.set(service, {
    status,
    lastCheck: Date.now(),
    failureCount,
    lastError: error,
  })

  return status
}

/**
 * Get current health status of a service.
 */
export function getServiceHealth(service: ExternalService): ServiceHealth {
  return healthStore.get(service) || {
    status: 'healthy',
    lastCheck: 0,
    failureCount: 0,
  }
}

/**
 * Check if a service is healthy enough to call directly (not down).
 */
export function isServiceAvailable(service: ExternalService): boolean {
  const health = getServiceHealth(service)
  if (health.lastCheck === 0) return true // Never checked = assume healthy
  if (Date.now() - health.lastCheck > HEALTH_TTL_MS) return true // Stale = retry
  return health.status !== 'down'
}

/**
 * Get the fallback strategy for a service.
 */
export function getFallbackStrategy(service: ExternalService): FallbackStrategy {
  return FALLBACK_STRATEGIES[service]
}

/**
 * Get a summary of all service health statuses.
 */
export function getAllServiceHealth(): Record<ExternalService, ServiceHealth> {
  const services: ExternalService[] = ['cloudinary', 'stripe', 'resend', 'ai', 'supabase']
  const result = {} as Record<ExternalService, ServiceHealth>
  for (const service of services) {
    result[service] = getServiceHealth(service)
  }
  return result
}

/**
 * Clear all health data (for testing).
 */
export function clearHealthStore(): void {
  healthStore.clear()
}

// ── Cloudinary fallback helper ────────────────────────────────────────────────

/**
 * Get image URL with Cloudinary fallback.
 * If Cloudinary is down, returns the original URL.
 */
export function getImageUrlWithFallback(
  originalUrl: string,
  cloudinaryTransformUrl: string | null,
): string {
  if (!cloudinaryTransformUrl) return originalUrl
  if (!isServiceAvailable('cloudinary')) return originalUrl
  return cloudinaryTransformUrl
}
