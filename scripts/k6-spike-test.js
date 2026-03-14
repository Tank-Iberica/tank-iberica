/**
 * k6 spike test — Backlog #288
 *
 * Simulates viral article: 0 → 10,000 users instantly.
 * Measures recovery time and edge cache absorption.
 *
 * Usage:
 *   k6 run scripts/k6-spike-test.js
 *   k6 run --env BASE_URL=https://staging.tracciona.com scripts/k6-spike-test.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time', true)

const BASE_URL = __ENV.BASE_URL || 'https://tracciona.com'

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },     // Warm up
        { duration: '5s', target: 10000 },     // Spike to 10K
        { duration: '30s', target: 10000 },    // Sustain spike
        { duration: '10s', target: 100 },      // Cool down
        { duration: '30s', target: 100 },      // Recovery observation
        { duration: '10s', target: 0 },        // Wind down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% under 3s even during spike
    errors: ['rate<0.10'],              // Less than 10% error rate
  },
}

export default function () {
  // Simulate typical user flow
  const pages = [
    `${BASE_URL}/`,
    `${BASE_URL}/catalogo`,
    `${BASE_URL}/subastas`,
    `${BASE_URL}/noticias`,
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
    'response time < 5s': (r) => r.timings.duration < 5000,
  })

  errorRate.add(!success)
  responseTime.add(res.timings.duration)

  sleep(Math.random() * 2 + 0.5) // 0.5-2.5s think time
}
