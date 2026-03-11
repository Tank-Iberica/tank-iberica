import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWithRetry } from '../../../server/utils/fetchWithRetry'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetch(...responses: { status: number; ok: boolean }[]) {
  let call = 0
  vi.stubGlobal('fetch', vi.fn(async () => {
    const res = responses[Math.min(call++, responses.length - 1)]
    return res
  }))
}

function mockFetchError(errorMessage: string) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error(errorMessage))))
}

describe('fetchWithRetry', () => {
  it('returns response on first success', async () => {
    mockFetch({ status: 200, ok: true })
    const res = await fetchWithRetry('https://example.com', {}, { maxRetries: 3, baseDelayMs: 0 })
    expect(res.status).toBe(200)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 and succeeds on second attempt', async () => {
    mockFetch({ status: 500, ok: false }, { status: 200, ok: true })
    const res = await fetchWithRetry('https://example.com', {}, { maxRetries: 3, baseDelayMs: 0 })
    expect(res.status).toBe(200)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
  })

  it('retries on 429 (rate limit)', async () => {
    mockFetch({ status: 429, ok: false }, { status: 200, ok: true })
    const res = await fetchWithRetry('https://example.com', {}, { maxRetries: 3, baseDelayMs: 0 })
    expect(res.status).toBe(200)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry on 400 client errors', async () => {
    mockFetch({ status: 400, ok: false })
    const res = await fetchWithRetry('https://example.com', {}, { maxRetries: 3, baseDelayMs: 0 })
    expect(res.status).toBe(400)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry on 401', async () => {
    mockFetch({ status: 401, ok: false })
    const res = await fetchWithRetry('https://example.com', {}, { maxRetries: 3, baseDelayMs: 0 })
    expect(res.status).toBe(401)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry on 404', async () => {
    mockFetch({ status: 404, ok: false })
    const res = await fetchWithRetry('https://example.com', {}, { maxRetries: 3, baseDelayMs: 0 })
    expect(res.status).toBe(404)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it('exhausts retries on persistent 500 and returns last response', async () => {
    mockFetch(
      { status: 500, ok: false },
      { status: 500, ok: false },
      { status: 500, ok: false },
      { status: 500, ok: false },
    )
    const res = await fetchWithRetry('https://example.com', {}, { maxRetries: 3, baseDelayMs: 0 })
    expect(res.status).toBe(500)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4) // 1 original + 3 retries
  })

  it('retries on network error and eventually throws', async () => {
    mockFetchError('Network failure')
    await expect(
      fetchWithRetry('https://example.com', {}, { maxRetries: 2, baseDelayMs: 0 }),
    ).rejects.toThrow('Network failure')
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3) // 1 original + 2 retries
  })

  it('uses default options when none provided', async () => {
    mockFetch({ status: 200, ok: true })
    const res = await fetchWithRetry('https://example.com', {})
    expect(res.status).toBe(200)
  })
})
