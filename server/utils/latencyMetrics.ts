/**
 * In-memory per-endpoint latency metrics store.
 *
 * Collects request durations per API path and provides p50/p95/p99 percentiles.
 * Uses a circular buffer to bound memory (max entries per endpoint).
 *
 * #140 Bloque 18 — Custom metrics req/s, p50/p95/p99 latency
 */

const MAX_ENTRIES_PER_ENDPOINT = 1000
const MAX_ENDPOINTS = 200

interface EndpointMetrics {
  durations: number[]
  pointer: number // circular buffer write position
  count: number // total requests ever (may exceed MAX_ENTRIES_PER_ENDPOINT)
  errors: number
  lastRecorded: number // timestamp ms
}

interface PercentileResult {
  p50: number
  p95: number
  p99: number
  avg: number
  min: number
  max: number
  count: number
  errors: number
  errorRate: number
  rps: number // requests in last 60s approximation
}

// Module-level store — persists across requests within the same process
const store = new Map<string, EndpointMetrics>()

/**
 * Normalize path to group dynamic segments: /api/vehicles/123 → /api/vehicles/:id
 */
function normalizePath(path: string): string {
  return path
    .replace(/\/\d+/g, '/:id') // numeric IDs
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid') // UUIDs
    .replace(/\?.*$/, '') // strip query params
}

/**
 * Record a request duration for a given path.
 */
export function recordLatency(path: string, durationMs: number, isError = false): void {
  const key = normalizePath(path)

  let entry = store.get(key)
  if (!entry) {
    // Evict oldest endpoint if at capacity
    if (store.size >= MAX_ENDPOINTS) {
      let oldestKey = ''
      let oldestTime = Infinity
      for (const [k, v] of store) {
        if (v.lastRecorded < oldestTime) {
          oldestTime = v.lastRecorded
          oldestKey = k
        }
      }
      if (oldestKey) store.delete(oldestKey)
    }

    entry = {
      durations: [],
      pointer: 0,
      count: 0,
      errors: 0,
      lastRecorded: Date.now(),
    }
    store.set(key, entry)
  }

  // Circular buffer write
  if (entry.durations.length < MAX_ENTRIES_PER_ENDPOINT) {
    entry.durations.push(durationMs)
  } else {
    entry.durations[entry.pointer % MAX_ENTRIES_PER_ENDPOINT] = durationMs
  }
  entry.pointer++
  entry.count++
  if (isError) entry.errors++
  entry.lastRecorded = Date.now()
}

/**
 * Calculate percentile from sorted array.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

/**
 * Get metrics for a specific endpoint.
 */
export function getEndpointMetrics(path: string): PercentileResult | null {
  const key = normalizePath(path)
  const entry = store.get(key)
  if (!entry || entry.durations.length === 0) return null

  const sorted = [...entry.durations].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)

  // Approximate RPS: count in last 60s (rough estimate using total count and time window)
  const windowMs = Math.max(1, Date.now() - entry.lastRecorded + 60_000)
  const rps = entry.count / (windowMs / 1000)

  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: entry.count,
    errors: entry.errors,
    errorRate: entry.count > 0 ? entry.errors / entry.count : 0,
    rps: Math.round(rps * 100) / 100,
  }
}

/**
 * Get metrics for all tracked endpoints, sorted by p95 descending.
 */
export function getAllEndpointMetrics(): Array<{ path: string } & PercentileResult> {
  const results: Array<{ path: string } & PercentileResult> = []

  for (const [path, entry] of store) {
    if (entry.durations.length === 0) continue

    const sorted = [...entry.durations].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    const windowMs = Math.max(1, Date.now() - entry.lastRecorded + 60_000)

    results.push({
      path,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      avg: Math.round(sum / sorted.length),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: entry.count,
      errors: entry.errors,
      errorRate: entry.count > 0 ? entry.errors / entry.count : 0,
      rps: Math.round((entry.count / (windowMs / 1000)) * 100) / 100,
    })
  }

  return results.sort((a, b) => b.p95 - a.p95)
}

/**
 * Get top N slowest endpoints by p95 latency.
 */
export function getTopSlowest(n = 10): Array<{ path: string } & PercentileResult> {
  return getAllEndpointMetrics().slice(0, n)
}

/**
 * Reset all metrics (useful for testing).
 */
export function resetMetrics(): void {
  store.clear()
}

/**
 * Get global aggregate across all endpoints.
 */
export function getGlobalMetrics(): PercentileResult & { endpointsTracked: number } {
  const allDurations: number[] = []
  let totalCount = 0
  let totalErrors = 0

  for (const entry of store.values()) {
    allDurations.push(...entry.durations)
    totalCount += entry.count
    totalErrors += entry.errors
  }

  if (allDurations.length === 0) {
    return {
      p50: 0,
      p95: 0,
      p99: 0,
      avg: 0,
      min: 0,
      max: 0,
      count: 0,
      errors: 0,
      errorRate: 0,
      rps: 0,
      endpointsTracked: 0,
    }
  }

  const sorted = allDurations.sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)

  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: totalCount,
    errors: totalErrors,
    errorRate: totalCount > 0 ? totalErrors / totalCount : 0,
    rps: 0, // global RPS needs external computation
    endpointsTracked: store.size,
  }
}
