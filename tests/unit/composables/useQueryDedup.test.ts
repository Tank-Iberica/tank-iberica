import { describe, it, expect, vi, beforeEach } from 'vitest'

// Reset module state between tests
let useQueryDedup: typeof import('../../../app/composables/shared/useQueryDedup').useQueryDedup

describe('useQueryDedup', () => {
  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../../app/composables/shared/useQueryDedup')
    useQueryDedup = mod.useQueryDedup
  })

  it('returns data from fetcher', async () => {
    const { dedupedFetch } = useQueryDedup()
    const result = await dedupedFetch('test1', async () => 'hello')
    expect(result).toBe('hello')
  })

  it('deduplicates simultaneous requests for same key', async () => {
    const { dedupedFetch } = useQueryDedup()
    const fetcher = vi.fn(async () => {
      await new Promise(r => setTimeout(r, 50))
      return 'data'
    })

    // Fire two requests simultaneously
    const [r1, r2] = await Promise.all([
      dedupedFetch('dedup-test', fetcher),
      dedupedFetch('dedup-test', fetcher),
    ])

    expect(r1).toBe('data')
    expect(r2).toBe('data')
    // Only one actual fetch should happen
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('returns cached data within TTL', async () => {
    const { dedupedFetch } = useQueryDedup()
    const fetcher = vi.fn(async () => 'cached-data')

    await dedupedFetch('cache-test', fetcher, 5000)
    const result = await dedupedFetch('cache-test', fetcher, 5000)

    expect(result).toBe('cached-data')
    expect(fetcher).toHaveBeenCalledTimes(1) // cached, not re-fetched
  })

  it('different keys fetch independently', async () => {
    const { dedupedFetch } = useQueryDedup()
    const fetcher1 = vi.fn(async () => 'data1')
    const fetcher2 = vi.fn(async () => 'data2')

    const [r1, r2] = await Promise.all([
      dedupedFetch('key-a', fetcher1),
      dedupedFetch('key-b', fetcher2),
    ])

    expect(r1).toBe('data1')
    expect(r2).toBe('data2')
    expect(fetcher1).toHaveBeenCalledTimes(1)
    expect(fetcher2).toHaveBeenCalledTimes(1)
  })

  it('invalidate clears specific cache key', async () => {
    const { dedupedFetch, invalidate } = useQueryDedup()
    const fetcher = vi.fn(async () => 'data')

    await dedupedFetch('inv-test', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    invalidate('inv-test')
    await dedupedFetch('inv-test', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2) // re-fetched after invalidation
  })

  it('invalidatePrefix clears matching keys', async () => {
    const { dedupedFetch, invalidatePrefix } = useQueryDedup()
    const fetcher1 = vi.fn(async () => 'a')
    const fetcher2 = vi.fn(async () => 'b')

    await dedupedFetch('prefix:foo', fetcher1)
    await dedupedFetch('prefix:bar', fetcher2)

    invalidatePrefix('prefix:')

    await dedupedFetch('prefix:foo', fetcher1)
    await dedupedFetch('prefix:bar', fetcher2)

    expect(fetcher1).toHaveBeenCalledTimes(2)
    expect(fetcher2).toHaveBeenCalledTimes(2)
  })

  it('clearAll removes all cached data', async () => {
    const { dedupedFetch, clearAll } = useQueryDedup()
    const fetcher = vi.fn(async () => 'data')

    await dedupedFetch('clear-test', fetcher)
    clearAll()
    await dedupedFetch('clear-test', fetcher)

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('propagates errors from fetcher', async () => {
    const { dedupedFetch } = useQueryDedup()
    const fetcher = vi.fn(async () => { throw new Error('fail') })

    await expect(dedupedFetch('error-test', fetcher)).rejects.toThrow('fail')
  })
})
