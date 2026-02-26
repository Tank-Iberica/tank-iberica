import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

let serverAvailable = false

beforeAll(async () => {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(3000) })
    serverAvailable = true
  } catch {
    serverAvailable = false
  }
})

describe('Rate limiting: endpoints sensibles limitan requests', () => {
  it('POST /api/generate-description x 20 rapidos → 429 o 401', async () => {
    if (!serverAvailable) return

    const results: number[] = []
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`${BASE}/api/generate-description`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand: 'Test', model: 'Test' }),
        })
        results.push(res.status)
      } catch {
        results.push(0)
      }
    }

    // At least some should be 429 (rate limited) or 401 (no auth)
    // If ALL are 200, there's no rate limiting
    const hasProtection = results.some((s) => s === 429 || s === 401)
    expect(hasProtection).toBe(true)
  })

  it('POST /api/stripe/webhook x 50 sin firma → no causa DoS', async () => {
    if (!serverAvailable) return

    const start = Date.now()
    const promises = Array.from({ length: 50 }, () =>
      fetch(`${BASE}/api/stripe/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' }),
      }).catch(() => null),
    )
    await Promise.all(promises)
    const elapsed = Date.now() - start
    // 50 requests should complete within 5s
    expect(elapsed).toBeLessThan(5000)
  })
})
