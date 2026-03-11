/**
 * k6 scenario — Catalog pages
 *
 * Tests:
 *   - Homepage (catálogo raíz)
 *   - Catálogo con filtros básicos (categoría, precio, año)
 *   - Catálogo paginado
 *   - SEO landing por slug de categoría
 *
 * Metrics to watch:
 *   - P95 < 300ms (cache-miss SWR target)
 *   - Cache hit rate > 80%
 *   - Error rate < 1%
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { BASE_URL, thresholds, rampingStages, isCacheHit, publicHeaders } from '../k6.config.js'

// Custom metrics
const cacheHitRate = new Rate('cache_hit_rate')
const catalogDuration = new Trend('catalog_page_duration')

export const options = {
  scenarios: {
    catalog: {
      executor: 'ramping-vus',
      stages: rampingStages,
    },
  },
  thresholds: {
    ...thresholds,
    catalog_page_duration: ['p(95)<300', 'p(99)<1000'],
  },
  tags: { scenario: 'catalog' },
}

// Catalog URLs to cycle through
// TODO: Replace slugs with real ones from your DB
const catalogUrls = [
  `${BASE_URL}/`,
  `${BASE_URL}/?page=2`,
  `${BASE_URL}/?page=3`,
  // Filter by listing type
  `${BASE_URL}/?listing_type=sale`,
  `${BASE_URL}/?listing_type=rent`,
  // Filter by location
  `${BASE_URL}/?location_country=ES`,
  `${BASE_URL}/?location_province=Madrid`,
  `${BASE_URL}/?location_province=Barcelona`,
  // Filter by price range
  `${BASE_URL}/?price_min=10000&price_max=50000`,
  `${BASE_URL}/?price_min=50000&price_max=150000`,
  // Filter by year
  `${BASE_URL}/?year_min=2018`,
  `${BASE_URL}/?year_min=2015&year_max=2020`,
]

export default function () {
  // Pick a random URL from the catalog list
  const url = catalogUrls[Math.floor(Math.random() * catalogUrls.length)]

  const res = http.get(url, {
    headers: publicHeaders,
    tags: { scenario: 'catalog', page_type: 'catalog' },
  })

  // Track cache hit
  const hit = isCacheHit(res)
  cacheHitRate.add(hit)

  // Track duration
  catalogDuration.add(res.timings.duration)

  check(res, {
    'catalog: status 200': (r) => r.status === 200,
    'catalog: has content': (r) => r.body && r.body.length > 1000,
    'catalog: no server error': (r) => r.status < 500,
  })

  // Log cache status for first few requests (debugging)
  if (__ITER < 5) {
    console.log(
      `[catalog] ${url} → ${res.status} | ${res.timings.duration.toFixed(0)}ms | cache: ${res.headers['Cf-Cache-Status'] || 'N/A'}`,
    )
  }

  // Think time between requests (simulate real user)
  sleep(Math.random() * 2 + 1) // 1-3s
}
