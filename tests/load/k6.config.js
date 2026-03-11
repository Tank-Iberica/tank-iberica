/**
 * k6 shared config — Tracciona load tests
 *
 * Usage: import { BASE_URL, thresholds, rampingStages } from './k6.config.js'
 *
 * ENV vars:
 *   K6_BASE_URL   — target URL (default: http://localhost:3000)
 *   K6_SCENARIO   — 'smoke' | 'load' | 'stress' | 'soak' (default: load)
 */

export const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// Thresholds (aligned with QUERY-BUDGET.md SLOs)
// ---------------------------------------------------------------------------

export const thresholds = {
  // Global: ≤1% errors, P99 ≤ 2s
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(99)<2000'],

  // Catalog page (SSR + SWR): P95 cache-hit <100ms, cache-miss <300ms
  'http_req_duration{scenario:catalog}': ['p(95)<300'],

  // Vehicle detail: P95 <100ms
  'http_req_duration{scenario:vehicle_detail}': ['p(95)<100'],

  // API public (SWR): P95 <200ms
  'http_req_duration{scenario:api_public}': ['p(95)<200'],

  // Health check light: P99 <50ms
  'http_req_duration{scenario:health}': ['p(99)<50'],

  // Cache hit rate: ≥80% of requests should be cache hits (CF HIT or STALE)
  cache_hit_rate: ['rate>0.80'],
}

// ---------------------------------------------------------------------------
// Ramping stages per scenario type
// ---------------------------------------------------------------------------

const stages = {
  smoke: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 0 },
  ],
  load: [
    { duration: '1m', target: 50 },   // ramp up
    { duration: '3m', target: 100 },  // sustain
    { duration: '1m', target: 0 },    // ramp down
  ],
  stress: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '2m', target: 0 },
  ],
  soak: [
    { duration: '2m', target: 50 },
    { duration: '30m', target: 50 },  // sustain low load for 30 min
    { duration: '2m', target: 0 },
  ],
}

export const rampingStages = stages[__ENV.K6_SCENARIO || 'load']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if CF-Cache-Status header indicates a cache hit */
export function isCacheHit(res) {
  const status = res.headers['Cf-Cache-Status'] || res.headers['cf-cache-status'] || ''
  return status === 'HIT' || status === 'STALE'
}

/** Standard headers for public requests (no auth) */
export const publicHeaders = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent': 'k6-load-test/1.0 (Tracciona)',
}

/** Standard headers for JSON API requests */
export const apiHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}
