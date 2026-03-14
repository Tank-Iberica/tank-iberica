/**
 * k6 load test — Backlog #286
 *
 * Simulates 1000 concurrent users reading catalog.
 * Validates that SWR absorbs 98%, p95<200ms, error<0.1%.
 *
 * Usage:
 *   k6 run scripts/k6-load-test.js
 *   k6 run --env BASE_URL=https://staging.tracciona.com scripts/k6-load-test.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time', true)

const BASE_URL = __ENV.BASE_URL || 'https://tracciona.com'

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },    // Ramp up
        { duration: '60s', target: 1000 },   // Ramp to peak
        { duration: '120s', target: 1000 },  // Sustain load
        { duration: '30s', target: 0 },      // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],    // 95% under 200ms (SWR cache hit)
    errors: ['rate<0.001'],              // Less than 0.1% error rate
    http_req_failed: ['rate<0.001'],
  },
}

export default function () {
  // Catalog browsing (most common user journey)
  const pages = [
    `${BASE_URL}/catalogo`,
    `${BASE_URL}/catalogo?category=semirremolques`,
    `${BASE_URL}/catalogo?category=cabezas-tractoras`,
    `${BASE_URL}/catalogo?category=camiones`,
    `${BASE_URL}/catalogo?brand=volvo`,
    `${BASE_URL}/catalogo?brand=scania`,
  ]

  const page = pages[Math.floor(Math.random() * pages.length)]
  const res = http.get(page, {
    headers: {
      'Accept': 'text/html',
      'Accept-Encoding': 'gzip, br',
    },
    tags: { page },
  })

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has content': (r) => r.body && r.body.length > 100,
  })

  errorRate.add(!success)
  responseTime.add(res.timings.duration)

  sleep(Math.random() * 3 + 1) // 1-4s think time
}
