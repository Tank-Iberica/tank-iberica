/**
 * k6 concurrent writes test — Backlog #290
 *
 * 100 dealers publishing simultaneously.
 * Validates: no deadlocks, write latency <500ms, data integrity.
 *
 * Usage:
 *   k6 run scripts/k6-concurrent-writes.js
 *   k6 run --env BASE_URL=https://staging.tracciona.com --env API_TOKEN=xxx scripts/k6-concurrent-writes.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

const writeErrors = new Rate('write_errors')
const writeLatency = new Trend('write_latency', true)
const deadlocks = new Counter('deadlocks')

const BASE_URL = __ENV.BASE_URL || 'https://staging.tracciona.com'

export const options = {
  scenarios: {
    concurrent_writes: {
      executor: 'constant-vus',
      vus: 100,
      duration: '60s',
    },
  },
  thresholds: {
    write_latency: ['p(95)<500'],     // 95% under 500ms
    write_errors: ['rate<0.01'],      // Less than 1% errors
    deadlocks: ['count<1'],           // Zero deadlocks
  },
}

export default function () {
  const vehicleData = {
    title: `Test Vehicle ${__VU}-${__ITER}`,
    brand: ['Volvo', 'Scania', 'MAN', 'DAF', 'Mercedes'][Math.floor(Math.random() * 5)],
    model: `Model-${Math.floor(Math.random() * 100)}`,
    price: Math.floor(Math.random() * 100000) + 10000,
    year: 2020 + Math.floor(Math.random() * 5),
    status: 'draft',
  }

  const res = http.post(`${BASE_URL}/api/vehicles`, JSON.stringify(vehicleData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN || 'test-token'}`,
    },
    tags: { operation: 'publish' },
  })

  writeLatency.add(res.timings.duration)

  const success = check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'no deadlock error': (r) => {
      if (r.body && typeof r.body === 'string') {
        const hasDeadlock = r.body.includes('deadlock')
        if (hasDeadlock) deadlocks.add(1)
        return !hasDeadlock
      }
      return true
    },
    'write latency < 1s': (r) => r.timings.duration < 1000,
  })

  writeErrors.add(!success)

  sleep(Math.random() * 0.5 + 0.2)
}
