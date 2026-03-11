/**
 * k6 scenario — Vehicle detail pages
 *
 * Tests:
 *   - Ficha vehículo (SSR + SWR)
 *   - Verifica que el slug resuelve correctamente
 *   - Mide cache hit rate desde CDN
 *
 * Metrics to watch:
 *   - P95 < 100ms (cache-hit SLO from QUERY-BUDGET.md)
 *   - P95 < 300ms (cache-miss SLO)
 *   - Error rate < 1%
 *   - Cache hit rate > 80%
 *
 * SETUP: Replace VEHICLE_SLUGS with real slugs from your DB.
 *   SELECT slug FROM vehicles WHERE status = 'published' LIMIT 20;
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { BASE_URL, thresholds, rampingStages, isCacheHit, publicHeaders } from '../k6.config.js'

const cacheHitRate = new Rate('cache_hit_rate')
const vehicleDuration = new Trend('vehicle_page_duration')

export const options = {
  scenarios: {
    vehicle_detail: {
      executor: 'ramping-vus',
      stages: rampingStages,
    },
  },
  thresholds: {
    ...thresholds,
    vehicle_page_duration: ['p(95)<300', 'p(99)<1000'],
  },
  tags: { scenario: 'vehicle_detail' },
}

// ---------------------------------------------------------------------------
// Slugs loaded from env var K6_VEHICLE_SLUGS (comma-separated) when available.
// CI fetches them dynamically from Supabase REST API.
// Fallback: placeholder slugs (will return 404 — only 'no 5xx' check counts).
// ---------------------------------------------------------------------------
const VEHICLE_SLUGS = __ENV.K6_VEHICLE_SLUGS
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

const USING_REAL_SLUGS = !!__ENV.K6_VEHICLE_SLUGS

export default function () {
  const slug = VEHICLE_SLUGS[Math.floor(Math.random() * VEHICLE_SLUGS.length)]
  const url = `${BASE_URL}/vehiculo/${slug}`

  const res = http.get(url, {
    headers: publicHeaders,
    tags: { scenario: 'vehicle_detail', page_type: 'vehicle' },
  })

  const hit = isCacheHit(res)
  cacheHitRate.add(hit)
  vehicleDuration.add(res.timings.duration)

  check(res, {
    // Always checked — even placeholder slugs must not cause 5xx
    'vehicle: no server error': (r) => r.status < 500,
    'vehicle: response time < 500ms': (r) => r.timings.duration < 500,
    // Only checked when using real slugs fetched from DB
    ...(USING_REAL_SLUGS && {
      'vehicle: status 200': (r) => r.status === 200,
      'vehicle: has vehicle title': (r) => r.body && r.body.includes('vehiculo'),
    }),
  })

  if (__ITER < 5) {
    console.log(
      `[vehicle] ${slug} → ${res.status} | ${res.timings.duration.toFixed(0)}ms | cache: ${res.headers['Cf-Cache-Status'] || 'N/A'}`,
    )
  }

  sleep(Math.random() * 3 + 2) // 2-5s (vehicle pages have longer dwell time)
}
