/**
 * k6 Spike Test
 *
 * Simulates a sudden traffic spike (e.g., viral social media post).
 * Goes from 0 to 500 VUs instantly, then back to 0.
 *
 * #287-292 — k6 stress scenarios (spike)
 *
 * Usage: k6 run tests/load/scenarios/spike-test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { BASE_URL, publicHeaders, isCacheHit } from '../k6.config.js'

const errorRate = new Rate('errors')
const cacheHitRate = new Rate('cache_hit_rate')

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 }, // Instant spike
        { duration: '2m', target: 500 },  // Sustain peak
        { duration: '10s', target: 0 },   // Immediate drop
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'], // <10% error rate during spike
    http_req_duration: ['p(95)<3000'], // p95 < 3s (relaxed for spike)
  },
}

export default function () {
  // Mix of pages hit during a viral spike
  const urls = [
    '/',
    '/catalogo',
    '/api/health',
  ]

  const url = urls[Math.floor(Math.random() * urls.length)]
  const res = http.get(`${BASE_URL}${url}`, { headers: publicHeaders })

  check(res, {
    'status is ok': (r) => r.status < 500,
    'response time < 5s': (r) => r.timings.duration < 5000,
  })

  errorRate.add(res.status >= 500)
  cacheHitRate.add(isCacheHit(res))

  sleep(Math.random() * 0.5) // Very short sleep during spike
}
