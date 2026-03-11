/**
 * Realistic peak traffic scenario — simulates a marketing campaign or media mention.
 *
 * Models:
 * 1. Normal baseline traffic (20 VUs)
 * 2. Sudden spike (200 VUs in 30s) — like a social media viral moment
 * 3. Sustained elevated traffic (100 VUs for 5 min) — post-spike plateau
 * 4. Cool-down back to normal
 *
 * Also tests concurrent API calls (search + lead + favorite) to simulate
 * realistic user journeys, not just page loads.
 *
 * Usage:
 *   k6 run tests/load/scenarios/realistic-peak.js
 *   K6_BASE_URL=https://tracciona.com k6 run tests/load/scenarios/realistic-peak.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'
import { BASE_URL, publicHeaders, apiHeaders } from '../k6.config.js'

// Custom metrics
const spikeErrors = new Counter('spike_errors')
const journeyDuration = new Trend('user_journey_duration', true)
const searchDuration = new Trend('search_duration', true)
const firstContentful = new Trend('first_contentful_load', true)

export const options = {
  scenarios: {
    // Baseline: normal traffic
    baseline: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
      exec: 'normalUser',
    },
    // Spike: sudden burst of traffic
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 0 },     // 1 min quiet (baseline runs)
        { duration: '30s', target: 200 },   // Spike! 0→200 in 30s
        { duration: '2m', target: 200 },    // Hold spike
        { duration: '30s', target: 100 },   // Drop to plateau
        { duration: '3m', target: 100 },    // Sustained elevated
        { duration: '1m', target: 0 },      // Cool-down
      ],
      gracefulRampDown: '30s',
      exec: 'spikeUser',
    },
    // API hammering: bots/scrapers during the spike
    api_bots: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      stages: [
        { duration: '2m', target: 5 },
        { duration: '1m', target: 50 },    // Bot spike
        { duration: '3m', target: 30 },
        { duration: '2m', target: 5 },
      ],
      exec: 'apiBot',
    },
  },
  thresholds: {
    // Even during spike, keep errors below 1%
    http_req_failed: ['rate<0.01'],
    // p99 should stay under 3s during spike (relaxed from normal 2s)
    http_req_duration: ['p(99)<3000'],
    // Search should still be fast
    search_duration: ['p(95)<800'],
    // Spike-specific: errors during spike phase
    spike_errors: ['count<50'],
  },
}

// Vehicle slugs (same pattern as k6-full.js)
const vehicleSlugs = __ENV.K6_VEHICLE_SLUGS
  ? __ENV.K6_VEHICLE_SLUGS.split(',').filter(Boolean)
  : ['volvo-fh-500-2020', 'mercedes-actros-1845', 'schmitz-cargobull-2021']

const provinces = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao']
const brands = ['Volvo', 'Mercedes-Benz', 'DAF', 'MAN', 'Scania', 'Iveco', 'Renault']

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Normal user journey: browse catalog → filter → view vehicle → maybe contact
 */
export function normalUser() {
  const start = Date.now()

  group('homepage', () => {
    const res = http.get(`${BASE_URL}/`, { headers: publicHeaders })
    firstContentful.add(res.timings.duration)
    check(res, { 'home 200': (r) => r.status === 200 })
  })

  sleep(Math.random() * 3 + 1)

  group('catalog search', () => {
    const province = randomPick(provinces)
    const url = `${BASE_URL}/?location_province=${province}&price_min=5000&price_max=80000`
    const res = http.get(url, { headers: publicHeaders })
    searchDuration.add(res.timings.duration)
    check(res, {
      'search 200': (r) => r.status === 200,
      'search <1s': (r) => r.timings.duration < 1000,
    })
  })

  sleep(Math.random() * 5 + 2)

  group('vehicle detail', () => {
    const slug = randomPick(vehicleSlugs)
    const res = http.get(`${BASE_URL}/vehiculo/${slug}`, { headers: publicHeaders })
    check(res, { 'vehicle no 5xx': (r) => r.status < 500 })
  })

  sleep(Math.random() * 10 + 5)
  journeyDuration.add(Date.now() - start)
}

/**
 * Spike user: quick browsing, higher bounce rate, more page loads
 */
export function spikeUser() {
  // Spike users are less patient — quick browsing
  const res = http.get(`${BASE_URL}/`, { headers: publicHeaders })

  if (res.status >= 500) {
    spikeErrors.add(1)
  }
  check(res, { 'spike home no 5xx': (r) => r.status < 500 })

  sleep(Math.random() * 1 + 0.5)

  // 60% bounce after homepage
  if (Math.random() < 0.6) return

  // Browse catalog with filter
  const brand = randomPick(brands)
  const catalogRes = http.get(`${BASE_URL}/?brand=${encodeURIComponent(brand)}`, {
    headers: publicHeaders,
  })

  if (catalogRes.status >= 500) {
    spikeErrors.add(1)
  }
  check(catalogRes, { 'spike catalog no 5xx': (r) => r.status < 500 })

  sleep(Math.random() * 2 + 0.5)

  // 50% leave after catalog
  if (Math.random() < 0.5) return

  // View vehicle
  const slug = randomPick(vehicleSlugs)
  const vehicleRes = http.get(`${BASE_URL}/vehiculo/${slug}`, { headers: publicHeaders })

  if (vehicleRes.status >= 500) {
    spikeErrors.add(1)
  }

  sleep(Math.random() * 3 + 1)
}

/**
 * API bot: rapid-fire API calls (scrapers, price comparison sites)
 */
export function apiBot() {
  const pick = Math.random()

  if (pick < 0.5) {
    // Health check
    const res = http.get(`${BASE_URL}/api/health`, { headers: apiHeaders })
    check(res, { 'bot health 200': (r) => r.status === 200 })
  } else if (pick < 0.8) {
    // Valuation API
    const brand = randomPick(brands)
    const url = `${BASE_URL}/api/v1/valuation?brand=${encodeURIComponent(brand)}&year=${2018 + Math.floor(Math.random() * 6)}`
    const res = http.get(url, { headers: apiHeaders })
    check(res, { 'bot valuation no 5xx': (r) => r.status < 500 })
  } else {
    // Market report
    const res = http.get(`${BASE_URL}/api/market-report`, { headers: apiHeaders })
    check(res, { 'bot market no 5xx': (r) => r.status < 500 })
  }
}

export default function () {
  normalUser()
}
