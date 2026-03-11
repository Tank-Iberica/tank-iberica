import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Cache-Aside Pattern', () => {
  beforeEach(() => {
    // Mock sessionStorage
    const store: Record<string, string> = {}
    global.sessionStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach(key => delete store[key]) },
    } as any
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('useCacheAside', () => {
    it('should fetch and cache data', async () => {
      const { useCacheAside } = await import('../../app/composables/useCacheAside')
      const fetcher = vi.fn().mockResolvedValue({ id: 1, name: 'test' })

      const { data, fetch } = useCacheAside('test-key', 300)
      await fetch(fetcher)

      expect(data.value).toEqual({ id: 1, name: 'test' })
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('should return cached data on second call', async () => {
      const { useCacheAside } = await import('../../app/composables/useCacheAside')
      const fetcher = vi.fn().mockResolvedValue({ id: 1 })

      const { fetch } = useCacheAside('test-key', 300)
      await fetch(fetcher)

      const { fetch: fetch2 } = useCacheAside('test-key', 300)
      const fetcher2 = vi.fn().mockResolvedValue({ id: 2 })
      await fetch2(fetcher2)

      // Second fetcher should not be called due to cache hit
      expect(fetcher2).not.toHaveBeenCalled()
    })

    it('should set cached flag correctly', async () => {
      const { useCacheAside } = await import('../../app/composables/useCacheAside')
      const fetcher = vi.fn().mockResolvedValue({ id: 1 })

      const { fetch, cached } = useCacheAside('test-key', 300)
      expect(cached.value).toBe(false)

      await fetch(fetcher)
      expect(cached.value).toBe(false) // First fetch is not cached

      const { fetch: fetch2, cached: cached2 } = useCacheAside('test-key', 300)
      await fetch2(vi.fn())
      expect(cached2.value).toBe(true) // Second call is cached
    })

    it('should invalidate cache', async () => {
      const { useCacheAside } = await import('../../app/composables/useCacheAside')
      const fetcher = vi.fn().mockResolvedValue({ id: 1 })

      const { fetch, invalidate, cached } = useCacheAside('test-key', 300)
      await fetch(fetcher)

      expect(cached.value).toBe(false)
      invalidate()
      expect(cached.value).toBe(false)

      // Data should be cleared from sessionStorage
      expect(sessionStorage.getItem('test-key')).toBeNull()
    })

    it('should handle fetch errors', async () => {
      const { useCacheAside } = await import('../../app/composables/useCacheAside')
      const error = new Error('Fetch failed')
      const fetcher = vi.fn().mockRejectedValue(error)

      const { data, error: errorRef, fetch } = useCacheAside('test-key', 300)
      await fetch(fetcher)

      expect(data.value).toBeNull()
      expect(errorRef.value).toEqual(error)
    })

    it('should respect TTL expiration', async () => {
      vi.useFakeTimers()
      const { useCacheAside } = await import('../../app/composables/useCacheAside')
      const fetcher = vi.fn().mockResolvedValue({ id: 1 })

      const { fetch, cached } = useCacheAside('test-key', 1) // 1 second TTL
      await fetch(fetcher)

      // Advance time past TTL
      vi.advanceTimersByTime(2000)

      const { fetch: fetch2, cached: cached2 } = useCacheAside('test-key', 1)
      const fetcher2 = vi.fn().mockResolvedValue({ id: 2 })
      await fetch2(fetcher2)

      // Should have fetched again (cache expired)
      expect(fetcher2).toHaveBeenCalled()
      expect(cached2.value).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('useCacheCategories', () => {
    it('should cache categories by vertical', async () => {
      const { useCacheCategories } = await import('../../app/composables/useCacheAside')
      const categories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ]

      // Mock $fetch
      global.$fetch = vi.fn().mockResolvedValue(categories)

      const { categories: catRef, fetch } = useCacheCategories('tracciona')
      await fetch()

      expect(catRef.value).toEqual(categories)
    })
  })

  describe('Server-side cache (server/utils/cache.ts)', () => {
    it('should cache and retrieve data', async () => {
      const { cacheAside, CACHE_KEYS, CACHE_TTL } = await import('../../server/utils/cache')
      const fetcher = vi.fn().mockResolvedValue([{ id: 1, name: 'cat' }])

      const result = await cacheAside(
        CACHE_KEYS.CATEGORIES,
        CACHE_TTL.LONG,
        fetcher
      )

      expect(result).toEqual([{ id: 1, name: 'cat' }])
      expect(fetcher).toHaveBeenCalledTimes(1)

      // Second call should use cache
      await cacheAside(CACHE_KEYS.CATEGORIES, CACHE_TTL.LONG, fetcher)
      expect(fetcher).toHaveBeenCalledTimes(1) // Still 1, not 2
    })

    it('should invalidate cache entries', async () => {
      const { cacheAside, invalidateCache, CACHE_KEYS, CACHE_TTL } =
        await import('../../server/utils/cache')
      const fetcher = vi.fn().mockResolvedValue({ id: 1 })

      await cacheAside(CACHE_KEYS.CATEGORIES, CACHE_TTL.LONG, fetcher)
      invalidateCache(CACHE_KEYS.CATEGORIES)

      // Next call should fetch again
      await cacheAside(CACHE_KEYS.CATEGORIES, CACHE_TTL.LONG, fetcher)
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })
})
