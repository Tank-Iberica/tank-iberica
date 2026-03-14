/**
 * k6 stress test — Backlog #287
 *
 * Ramps from 100 → 5000 → 10000 VUs over 10 minutes.
 * Identifies breaking point and documents p50/p95/p99 latency.
 *
 * Usage:
 *   k6 run scripts/k6-stress-test.js
 *   k6 run --env BASE_URL=https://staging.tracciona.com scripts/k6-stress-test.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time', true)
const timeouts = new Counter('timeouts')

const BASE_URL = __ENV.BASE_URL || 'https://tracciona.com'

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },      // Baseline
        { duration: '60s', target: 1000 },     // Moderate load
        { duration: '60s', target: 3000 },     // Heavy load
        { duration: '60s', target: 5000 },     // Stress
        { duration: '120s', target: 10000 },   // Breaking point
        { duration: '60s', target: 5000 },     // Recovery
        { duration: '60s', target: 0 },        // Cool down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(50)<1000', 'p(95)<5000', 'p(99)<10000'],
    errors: ['rate<0.20'],                     // Allow up to 20% at peak
  },
}

export default function () {
  // Mix of pages (weighted toward catalog which is most cacheable)
  const r = Math.random()
  let url
  if (r < 0.5) {
    url = `${BASE_URL}/catalogo`
  } else if (r < 0.7) {
    url = `${BASE_URL}/`
  } else if (r < 0.85) {
    url = `${BASE_URL}/subastas`
  } else {
    url = `${BASE_URL}/noticias`
  }

  const res = http.get(url, {
    headers: {
      'Accept': 'text/html',
      'Accept-Encoding': 'gzip, br',
    },
    tags: { page: url.replace(BASE_URL, '') || '/' },
    timeout: '15s',
  })

  if (res.timings.duration > 10000) {
    timeouts.add(1)
  }

  const success = check(res, {
    'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
    'response time < 10s': (r) => r.timings.duration < 10000,
  })

  errorRate.add(!success)
  responseTime.add(res.timings.duration)

  sleep(Math.random() * 1.5 + 0.5) // 0.5-2s think time
}
