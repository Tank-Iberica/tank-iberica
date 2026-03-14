/**
 * k6 soak test — Backlog #289
 *
 * 500 users sustained for 2 hours.
 * Detects memory leaks, connection exhaustion, and stability issues.
 *
 * Usage:
 *   k6 run scripts/k6-soak-test.js
 *   k6 run --env BASE_URL=https://staging.tracciona.com scripts/k6-soak-test.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time', true)

const BASE_URL = __ENV.BASE_URL || 'https://tracciona.com'

export const options = {
  scenarios: {
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },       // Ramp up
        { duration: '116m', target: 500 },     // Sustain 500 users for ~2h
        { duration: '2m', target: 0 },         // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],      // 95% under 500ms throughout
    errors: ['rate<0.01'],                 // Less than 1% errors over 2h
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  // Simulate realistic user browsing pattern
  const journeys = [
    // Catalog browsing
    () => {
      http.get(`${BASE_URL}/catalogo`, { tags: { journey: 'catalog' } })
      sleep(2)
      http.get(`${BASE_URL}/catalogo?category=semirremolques`, { tags: { journey: 'catalog' } })
    },
    // Homepage
    () => {
      http.get(`${BASE_URL}/`, { tags: { journey: 'homepage' } })
    },
    // News
    () => {
      http.get(`${BASE_URL}/noticias`, { tags: { journey: 'news' } })
    },
    // Auctions
    () => {
      http.get(`${BASE_URL}/subastas`, { tags: { journey: 'auctions' } })
    },
    // Static pages
    () => {
      http.get(`${BASE_URL}/sobre-nosotros`, { tags: { journey: 'static' } })
    },
  ]

  const journey = journeys[Math.floor(Math.random() * journeys.length)]
  const res = http.get(`${BASE_URL}/`, {
    headers: {
      'Accept': 'text/html',
      'Accept-Encoding': 'gzip, br',
    },
  })

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  })

  errorRate.add(!success)
  responseTime.add(res.timings.duration)

  journey()

  sleep(Math.random() * 5 + 3) // 3-8s think time (realistic for soak)
}
