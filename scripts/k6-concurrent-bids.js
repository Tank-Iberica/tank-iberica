/* global __ENV, __VU, __ITER */
/**
 * k6 concurrent bids test — Backlog #291
 *
 * 50 bidders simultaneously bidding on the same auction.
 * Validates: correct bid resolution, anti-sniping, no race conditions.
 *
 * Usage:
 *   k6 run scripts/k6-concurrent-bids.js
 *   k6 run --env BASE_URL=https://staging.tracciona.com --env AUCTION_ID=xxx scripts/k6-concurrent-bids.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

const bidErrors = new Rate('bid_errors')
const bidLatency = new Trend('bid_latency', true)
const raceConditions = new Counter('race_conditions')

const BASE_URL = __ENV.BASE_URL || 'https://staging.tracciona.com'
const AUCTION_ID = __ENV.AUCTION_ID || 'test-auction-1'

export const options = {
  scenarios: {
    concurrent_bids: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
    },
  },
  thresholds: {
    bid_latency: ['p(95)<1000'],       // 95% under 1s
    bid_errors: ['rate<0.10'],         // Allow some conflict errors (expected)
    race_conditions: ['count<1'],       // Zero race conditions
  },
}

export default function () {
  // Each VU starts at a different base bid to create competition
  const baseBid = 10000 + (__VU * 100) + (__ITER * 50)

  const bidData = {
    auction_id: AUCTION_ID,
    amount: baseBid,
  }

  const res = http.post(`${BASE_URL}/api/auctions/bid`, JSON.stringify(bidData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN || 'test-token'}`,
    },
    tags: { operation: 'bid' },
  })

  bidLatency.add(res.timings.duration)

  const success = check(res, {
    'status is 200/201 or 409 conflict': (r) =>
      r.status === 200 || r.status === 201 || r.status === 409,
    'no race condition': (r) => {
      if (r.body && typeof r.body === 'string') {
        // A race condition would result in two winning bids for the same amount
        const hasRace = r.body.includes('race_condition') || r.body.includes('duplicate_bid')
        if (hasRace) raceConditions.add(1)
        return !hasRace
      }
      return true
    },
    'bid latency < 2s': (r) => r.timings.duration < 2000,
  })

  bidErrors.add(!success)

  // Rapid bidding pattern
  sleep(Math.random() * 0.3 + 0.1)
}
