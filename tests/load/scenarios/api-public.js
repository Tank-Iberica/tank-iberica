/**
 * k6 scenario — Public API endpoints (JSON)
 *
 * Tests:
 *   - GET /api/v1/valuation    (SWR 1h — should be near-instant after first hit)
 *   - GET /api/health          (light, no DB, always fast)
 *   - GET /api/market-report   (SWR 6h)
 *   - GET /api/widget/:slug    (SWR 5min, dealer embed)
 *
 * Metrics to watch:
 *   - /api/health P99 < 50ms
 *   - /api/v1/valuation P95 < 200ms
 *   - Error rate < 0.1%
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { BASE_URL, thresholds, rampingStages, isCacheHit, apiHeaders } from '../k6.config.js'

const cacheHitRate = new Rate('cache_hit_rate')
const apiDuration = new Trend('api_duration')

export const options = {
  scenarios: {
    api_public: {
      executor: 'ramping-vus',
      stages: rampingStages,
    },
  },
  thresholds: {
    ...thresholds,
    api_duration: ['p(95)<200', 'p(99)<500'],
  },
  tags: { scenario: 'api_public' },
}

// Valuation requests — vary params to test cache diversity
const valuationRequests = [
  { brand: 'Volvo', model: 'FH', year: 2020, vertical: 'trucks' },
  { brand: 'Mercedes-Benz', model: 'Actros', year: 2019, vertical: 'trucks' },
  { brand: 'Schmitz Cargobull', model: 'S.KO', year: 2021, vertical: 'trailers' },
  { brand: 'DAF', model: 'XF', year: 2022, vertical: 'trucks' },
  { brand: 'Iveco', model: 'Stralis', year: 2018, vertical: 'trucks' },
  { brand: 'Renault', model: 'T', year: 2020, vertical: 'trucks' },
  { brand: 'MAN', model: 'TGX', year: 2019, vertical: 'trucks' },
]

// Replace with real dealer slugs
const dealerSlugs = [
  'demo-dealer',
  'transportes-ejemplo',
  'camiones-ibericos',
]

export default function () {
  const scenario = Math.random()

  if (scenario < 0.5) {
    // 50% — valuation API
    const params = valuationRequests[Math.floor(Math.random() * valuationRequests.length)]
    const url = `${BASE_URL}/api/v1/valuation?brand=${encodeURIComponent(params.brand)}&model=${encodeURIComponent(params.model)}&year=${params.year}&vertical=${params.vertical}`

    const res = http.get(url, {
      headers: apiHeaders,
      tags: { scenario: 'api_public', endpoint: 'valuation' },
    })

    cacheHitRate.add(isCacheHit(res))
    apiDuration.add(res.timings.duration)

    check(res, {
      'valuation: status 200': (r) => r.status === 200,
      'valuation: has JSON body': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body !== null
        } catch {
          return false
        }
      },
      'valuation: response < 2s': (r) => r.timings.duration < 2000,
    })
  } else if (scenario < 0.8) {
    // 30% — health check
    const res = http.get(`${BASE_URL}/api/health`, {
      headers: apiHeaders,
      tags: { scenario: 'health', endpoint: 'health_light' },
    })

    apiDuration.add(res.timings.duration)

    check(res, {
      'health: status 200': (r) => r.status === 200,
      'health: has status ok': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.status === 'ok'
        } catch {
          return false
        }
      },
      'health: response < 50ms': (r) => r.timings.duration < 50,
    })
  } else {
    // 20% — widget embed
    const slug = dealerSlugs[Math.floor(Math.random() * dealerSlugs.length)]
    const res = http.get(`${BASE_URL}/api/widget/${slug}`, {
      headers: apiHeaders,
      tags: { scenario: 'api_public', endpoint: 'widget' },
    })

    cacheHitRate.add(isCacheHit(res))
    apiDuration.add(res.timings.duration)

    check(res, {
      'widget: not 500': (r) => r.status < 500,
      'widget: response < 1s': (r) => r.timings.duration < 1000,
    })
  }

  sleep(Math.random() * 1 + 0.5) // 0.5-1.5s (API calls are faster than page views)
}
