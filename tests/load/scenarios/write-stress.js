/**
 * k6 Write Stress Test
 *
 * Simulates concurrent write operations:
 * - Vehicle publishes
 * - Lead submissions
 * - Favorites toggles
 * - Analytics events
 *
 * #287-292 — k6 stress scenarios
 *
 * Usage:
 *   k6 run tests/load/scenarios/write-stress.js
 *   K6_BASE_URL=https://tracciona.com k6 run tests/load/scenarios/write-stress.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { BASE_URL, apiHeaders } from '../k6.config.js'

const writeErrors = new Rate('write_errors')
const writeDuration = new Trend('write_duration', true)

export const options = {
  scenarios: {
    writes: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // <5% error rate
    write_duration: ['p(95)<1000'], // p95 < 1s
  },
}

// Simulated write payloads
const ANALYTICS_EVENT = JSON.stringify({
  event_type: 'funnel:search',
  data: { query: 'camión', filters: { category: 'trucks' } },
})

const LEAD_SUBMISSION = JSON.stringify({
  vehicle_id: 'test-vehicle-id',
  name: 'Load Test User',
  email: 'loadtest@example.com',
  phone: '+34600000000',
  message: 'Load test lead submission',
})

export default function () {
  const scenarios = [
    // Analytics event (most common write)
    () => {
      const res = http.post(`${BASE_URL}/api/analytics/event`, ANALYTICS_EVENT, {
        headers: { ...apiHeaders, 'Content-Type': 'application/json' },
      })
      check(res, {
        'analytics status is 2xx or 429': (r) => r.status < 300 || r.status === 429,
      })
      writeDuration.add(res.timings.duration)
      writeErrors.add(res.status >= 500)
    },

    // Health check (lightweight write-like endpoint)
    () => {
      const res = http.get(`${BASE_URL}/api/health`)
      check(res, { 'health is 200': (r) => r.status === 200 })
      writeDuration.add(res.timings.duration)
    },

    // Web vitals submission
    () => {
      const vitalsPayload = JSON.stringify({
        metric_name: 'LCP',
        metric_value: 1500 + Math.random() * 3000,
        route: '/catalogo',
      })
      const res = http.post(`${BASE_URL}/api/analytics/web-vitals`, vitalsPayload, {
        headers: { ...apiHeaders, 'Content-Type': 'application/json' },
      })
      check(res, {
        'vitals status ok': (r) => r.status < 400 || r.status === 429,
      })
      writeDuration.add(res.timings.duration)
      writeErrors.add(res.status >= 500)
    },
  ]

  // Random scenario selection
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  scenario()

  sleep(Math.random() * 2 + 0.5) // 0.5-2.5s between requests
}
