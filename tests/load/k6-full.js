/**
 * k6 full suite — Tracciona
 *
 * Runs all scenarios simultaneously with realistic traffic distribution:
 *   60% → catalog pages
 *   30% → vehicle detail pages
 *   10% → public API (valuation, health)
 *
 * Usage:
 *   k6 run tests/load/k6-full.js
 *   K6_BASE_URL=https://tracciona.com k6 run tests/load/k6-full.js
 *   K6_SCENARIO=smoke k6 run tests/load/k6-full.js
 *   K6_SCENARIO=stress k6 run tests/load/k6-full.js
 *
 * Output:
 *   k6 run tests/load/k6-full.js --out json=tests/load/results/$(date +%Y%m%d).json
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { BASE_URL, isCacheHit, publicHeaders, apiHeaders } from './k6.config.js'

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const cacheHitRate = new Rate('cache_hit_rate')
const catalogDuration = new Trend('catalog_page_duration', true)
const vehicleDuration = new Trend('vehicle_page_duration', true)
const apiDuration = new Trend('api_duration', true)

// ---------------------------------------------------------------------------
// Scenario config
// ---------------------------------------------------------------------------
const SCENARIO = __ENV.K6_SCENARIO || 'load'

const stageProfiles = {
  smoke: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 0 },
  ],
  load: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  stress: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 300 },
    { duration: '2m', target: 0 },
  ],
  soak: [
    { duration: '2m', target: 50 },
    { duration: '30m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  peak: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
}

export const options = {
  scenarios: {
    // 60% of VUs hit the catalog
    catalog: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stageProfiles[SCENARIO],
      gracefulRampDown: '30s',
      exec: 'catalogScenario',
    },
    // 30% hit vehicle detail
    vehicle_detail: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stageProfiles[SCENARIO].map((s) => ({ ...s, target: Math.ceil(s.target * 0.5) })),
      gracefulRampDown: '30s',
      exec: 'vehicleScenario',
    },
    // 10% hit public APIs
    api_public: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stageProfiles[SCENARIO].map((s) => ({ ...s, target: Math.ceil(s.target * 0.1) })),
      gracefulRampDown: '30s',
      exec: 'apiScenario',
    },
  },
  thresholds: {
    // Global — 0.5% error rate max, p99 under 2s
    http_req_failed: ['rate<0.005'],
    http_req_duration: ['p(99)<2000'],
    // Per scenario — p95 targets
    catalog_page_duration: ['p(95)<500'],
    vehicle_page_duration: ['p(95)<500'],
    api_duration: ['p(95)<200'],
    // Cache
    cache_hit_rate: ['rate>0.80'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
}

// ---------------------------------------------------------------------------
// Catalog URLs
// ---------------------------------------------------------------------------
const catalogUrls = [
  `${BASE_URL}/`,
  `${BASE_URL}/?page=2`,
  `${BASE_URL}/?listing_type=sale`,
  `${BASE_URL}/?listing_type=rent`,
  `${BASE_URL}/?location_country=ES`,
  `${BASE_URL}/?location_province=Madrid`,
  `${BASE_URL}/?price_min=10000&price_max=50000`,
  `${BASE_URL}/?year_min=2018`,
]

// ---------------------------------------------------------------------------
// Vehicle slugs — loaded from K6_VEHICLE_SLUGS env var when available.
// CI fetches them dynamically from Supabase REST API (see k6-readiness.yml).
// Fallback: placeholder slugs (will return 404 — only 'no 5xx' check counts).
// ---------------------------------------------------------------------------
const vehicleSlugs = __ENV.K6_VEHICLE_SLUGS
  ? __ENV.K6_VEHICLE_SLUGS.split(',').filter(Boolean)
  : [
      'volvo-fh-500-2020-frigorifica',
      'mercedes-actros-1845-2019-tractora',
      'schmitz-cargobull-semirremolque-2021',
      'iveco-stralis-460-2018-cisterna',
      'daf-xf-480-2022-frigorifico',
      'renault-t-480-2020-lona',
      'man-tgx-18-440-2019-tractora',
      'scania-r-450-2021-low-deck',
    ]

const usingRealSlugs = !!__ENV.K6_VEHICLE_SLUGS

// ---------------------------------------------------------------------------
// Scenario functions
// ---------------------------------------------------------------------------

export function catalogScenario() {
  const url = catalogUrls[Math.floor(Math.random() * catalogUrls.length)]
  const res = http.get(url, {
    headers: publicHeaders,
    tags: { scenario: 'catalog' },
  })

  cacheHitRate.add(isCacheHit(res))
  catalogDuration.add(res.timings.duration)

  check(res, {
    'catalog 200': (r) => r.status === 200,
    'catalog no 5xx': (r) => r.status < 500,
    'catalog <500ms': (r) => r.timings.duration < 500,
  })

  sleep(Math.random() * 2 + 1)
}

export function vehicleScenario() {
  const slug = vehicleSlugs[Math.floor(Math.random() * vehicleSlugs.length)]
  const res = http.get(`${BASE_URL}/vehiculo/${slug}`, {
    headers: publicHeaders,
    tags: { scenario: 'vehicle_detail' },
  })

  cacheHitRate.add(isCacheHit(res))
  vehicleDuration.add(res.timings.duration)

  check(res, {
    'vehicle no 5xx': (r) => r.status < 500,
    'vehicle <500ms': (r) => r.timings.duration < 500,
    ...(usingRealSlugs && { 'vehicle 200': (r) => r.status === 200 }),
  })

  sleep(Math.random() * 3 + 2)
}

export function apiScenario() {
  const pick = Math.random()

  if (pick < 0.7) {
    // Health check
    const res = http.get(`${BASE_URL}/api/health`, {
      headers: apiHeaders,
      tags: { scenario: 'health' },
    })
    apiDuration.add(res.timings.duration)
    check(res, {
      'health 200': (r) => r.status === 200,
      'health <50ms': (r) => r.timings.duration < 50,
    })
  } else {
    // Valuation API
    const brands = ['Volvo', 'Mercedes-Benz', 'DAF', 'MAN', 'Scania']
    const brand = brands[Math.floor(Math.random() * brands.length)]
    const year = 2015 + Math.floor(Math.random() * 8)
    const url = `${BASE_URL}/api/v1/valuation?brand=${encodeURIComponent(brand)}&model=FH&year=${year}&vertical=trucks`

    const res = http.get(url, {
      headers: apiHeaders,
      tags: { scenario: 'api_public' },
    })
    cacheHitRate.add(isCacheHit(res))
    apiDuration.add(res.timings.duration)
    check(res, {
      'valuation 200': (r) => r.status === 200,
      'valuation no 5xx': (r) => r.status < 500,
    })
  }

  sleep(Math.random() * 0.5 + 0.5)
}

// Default export required by k6 (runs if no scenario executor specifies exec)
export default function () {
  catalogScenario()
}
