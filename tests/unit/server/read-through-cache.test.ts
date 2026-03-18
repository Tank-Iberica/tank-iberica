import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createReadThroughCache } from '../../../server/utils/readThroughCache'

describe('Read-through cache datos frecuentes (N68)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic cache behavior', () => {
    it('returns fetched data on cache miss', async () => {
      const cache = createReadThroughCache<string>()
      const result = await cache.get('key1', async () => 'value1')
      expect(result).toBe('value1')
    })

    it('returns cached data on cache hit', async () => {
      const cache = createReadThroughCache<string>()
      const fetcher = vi.fn(async () => 'value1')
      await cache.get('key1', fetcher)
      const result = await cache.get('key1', fetcher)
      expect(result).toBe('value1')
      expect(fetcher).toHaveBeenCalledTimes(1) // Only fetched once
    })

    it('has() returns true for cached key', async () => {
      const cache = createReadThroughCache<string>()
      await cache.get('key1', async () => 'value1')
      expect(cache.has('key1')).toBe(true)
    })

    it('has() returns false for missing key', () => {
      const cache = createReadThroughCache<string>()
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('size() returns number of entries', async () => {
      const cache = createReadThroughCache<string>()
      await cache.get('k1', async () => 'v1')
      await cache.get('k2', async () => 'v2')
      expect(cache.size()).toBe(2)
    })
  })

  describe('TTL expiration', () => {
    it('re-fetches after TTL expires', async () => {
      vi.useFakeTimers()
      const cache = createReadThroughCache<string>({ ttlMs: 1000 })
      const fetcher = vi.fn(async () => 'value')

      await cache.get('key1', fetcher)
      expect(fetcher).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1001)

      await cache.get('key1', fetcher)
      expect(fetcher).toHaveBeenCalledTimes(2)
    })

    it('has() returns false for expired entry', async () => {
      vi.useFakeTimers()
      const cache = createReadThroughCache<string>({ ttlMs: 500 })
      await cache.get('key1', async () => 'value')
      vi.advanceTimersByTime(600)
      expect(cache.has('key1')).toBe(false)
    })

    it('does not re-fetch before TTL expires', async () => {
      vi.useFakeTimers()
      const cache = createReadThroughCache<string>({ ttlMs: 5000 })
      const fetcher = vi.fn(async () => 'value')

      await cache.get('key1', fetcher)
      vi.advanceTimersByTime(4000)
      await cache.get('key1', fetcher)

      expect(fetcher).toHaveBeenCalledTimes(1)
    })
  })

  describe('Invalidation', () => {
    it('invalidate() removes a specific key', async () => {
      const cache = createReadThroughCache<string>()
      await cache.get('key1', async () => 'value1')
      expect(cache.invalidate('key1')).toBe(true)
      expect(cache.has('key1')).toBe(false)
    })

    it('invalidate() returns false for missing key', () => {
      const cache = createReadThroughCache<string>()
      expect(cache.invalidate('nonexistent')).toBe(false)
    })

    it('invalidateAll() clears all entries', async () => {
      const cache = createReadThroughCache<string>()
      await cache.get('k1', async () => 'v1')
      await cache.get('k2', async () => 'v2')
      cache.invalidateAll()
      expect(cache.size()).toBe(0)
    })

    it('after invalidation, fetcher is called again', async () => {
      const cache = createReadThroughCache<string>()
      const fetcher = vi.fn(async () => 'value')
      await cache.get('key1', fetcher)
      cache.invalidate('key1')
      await cache.get('key1', fetcher)
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('Max entries and eviction', () => {
    it('evicts oldest entry when maxEntries reached', async () => {
      const cache = createReadThroughCache<string>({ maxEntries: 2 })
      await cache.get('k1', async () => 'v1')
      await cache.get('k2', async () => 'v2')
      await cache.get('k3', async () => 'v3')
      expect(cache.size()).toBe(2)
      expect(cache.has('k1')).toBe(false) // Oldest evicted
      expect(cache.has('k2')).toBe(true)
      expect(cache.has('k3')).toBe(true)
    })

    it('eviction count tracked in stats', async () => {
      const cache = createReadThroughCache<string>({ maxEntries: 1 })
      await cache.get('k1', async () => 'v1')
      await cache.get('k2', async () => 'v2')
      expect(cache.stats().evictions).toBe(1)
    })
  })

  describe('Stats tracking', () => {
    it('tracks hits and misses', async () => {
      const cache = createReadThroughCache<string>()
      await cache.get('k1', async () => 'v1') // miss
      await cache.get('k1', async () => 'v1') // hit
      await cache.get('k2', async () => 'v2') // miss

      const stats = cache.stats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(2)
      expect(stats.entries).toBe(2)
    })

    it('stats reset after invalidateAll', async () => {
      const cache = createReadThroughCache<string>()
      await cache.get('k1', async () => 'v1')
      cache.invalidateAll()
      expect(cache.stats().entries).toBe(0)
    })
  })

  describe('Default configuration', () => {
    it('default TTL is 5 minutes', async () => {
      vi.useFakeTimers()
      const cache = createReadThroughCache<string>()
      const fetcher = vi.fn(async () => 'v')

      await cache.get('k', fetcher)
      vi.advanceTimersByTime(4 * 60 * 1000) // 4 min
      await cache.get('k', fetcher)
      expect(fetcher).toHaveBeenCalledTimes(1) // still cached

      vi.advanceTimersByTime(2 * 60 * 1000) // +2 min = 6 min total
      await cache.get('k', fetcher)
      expect(fetcher).toHaveBeenCalledTimes(2) // expired, re-fetched
    })

    it('default max entries is 100', async () => {
      const cache = createReadThroughCache<string>()
      for (let i = 0; i < 100; i++) {
        await cache.get(`k${i}`, async () => `v${i}`)
      }
      expect(cache.size()).toBe(100)
    })
  })
})
