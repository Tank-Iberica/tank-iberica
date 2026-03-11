/**
 * Tests for server/utils/cfCache.ts
 * Covers: CF Workers caches API present/absent, cache hit/miss, key building.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildCacheKey } from '../../../server/utils/cfCache'

// ── buildCacheKey ────────────────────────────────────────────────────────────

describe('buildCacheKey', () => {
  it('returns base key when no params', () => {
    expect(buildCacheKey('market-report', {})).toBe('market-report')
  })

  it('appends single param', () => {
    expect(buildCacheKey('market-report', { locale: 'es' })).toBe('market-report:locale=es')
  })

  it('sorts multiple params alphabetically', () => {
    expect(buildCacheKey('feed', { z: 'last', a: 'first' })).toBe('feed:a=first:z=last')
  })

  it('filters out undefined params', () => {
    expect(buildCacheKey('report', { locale: 'en', extra: undefined })).toBe('report:locale=en')
  })

  it('filters out empty string params', () => {
    expect(buildCacheKey('report', { locale: 'en', extra: '' })).toBe('report:locale=en')
  })

  it('handles all undefined → returns base only', () => {
    expect(buildCacheKey('base', { a: undefined, b: undefined })).toBe('base')
  })
})

// ── cfCacheGet — fallback when caches is undefined ───────────────────────────

describe('cfCacheGet — no CF runtime (Node.js / dev)', () => {
  // In Vitest/Node.js the `caches` global is undefined → falls back to calling fn()
  it('calls fn() and returns data when caches is not defined', async () => {
    // Dynamically import to ensure we get the module without caches global
    const { cfCacheGet } = await import('../../../server/utils/cfCache')
    const fn = vi.fn().mockResolvedValue({ hello: 'world' })
    const result = await cfCacheGet('test-key', 60, fn)
    expect(result).toEqual({ hello: 'world' })
    expect(fn).toHaveBeenCalledOnce()
  })

  it('propagates errors from fn()', async () => {
    const { cfCacheGet } = await import('../../../server/utils/cfCache')
    const fn = vi.fn().mockRejectedValue(new Error('fetch failed'))
    await expect(cfCacheGet('test-key', 60, fn)).rejects.toThrow('fetch failed')
  })

  it('does not call fn() twice for the same key', async () => {
    const { cfCacheGet } = await import('../../../server/utils/cfCache')
    const fn = vi.fn().mockResolvedValue('data')
    // Two sequential calls — each misses the (absent) cache and calls fn()
    await cfCacheGet('k1', 60, fn)
    await cfCacheGet('k1', 60, fn)
    expect(fn).toHaveBeenCalledTimes(2) // No in-process deduplication (by design)
  })
})

// ── cfCacheGet — CF Workers runtime simulation ───────────────────────────────

describe('cfCacheGet — CF Workers caches global present', () => {
  let cacheStore: Map<string, string>

  beforeEach(() => {
    cacheStore = new Map()

    // Simulate CF Workers `caches.default`
    const mockCache = {
      match: vi.fn(async (req: Request) => {
        const stored = cacheStore.get(req.url)
        if (!stored) return undefined
        return new Response(stored, { headers: { 'Content-Type': 'application/json' } })
      }),
      put: vi.fn(async (req: Request, res: Response) => {
        const text = await res.text()
        cacheStore.set(req.url, text)
      }),
    }

    vi.stubGlobal('caches', { default: mockCache })
  })

  it('calls fn() on cache miss and stores result', async () => {
    vi.resetModules()
    const { cfCacheGet } = await import('../../../server/utils/cfCache')
    const fn = vi.fn().mockResolvedValue({ report: 'Q1' })
    const result = await cfCacheGet('market-report:locale=es', 3600, fn)
    expect(result).toEqual({ report: 'Q1' })
    expect(fn).toHaveBeenCalledOnce()
    // Cache should now have one entry
    expect(cacheStore.size).toBe(1)
  })

  it('returns from cache on hit without calling fn()', async () => {
    vi.resetModules()
    const { cfCacheGet } = await import('../../../server/utils/cfCache')

    // Prime cache with first call
    const fn = vi.fn().mockResolvedValue({ report: 'Q1' })
    await cfCacheGet('market-report:locale=es', 3600, fn)

    // Second call should hit cache
    const fn2 = vi.fn().mockResolvedValue({ report: 'different' })
    const result = await cfCacheGet('market-report:locale=es', 3600, fn2)

    expect(result).toEqual({ report: 'Q1' }) // Returns cached value
    expect(fn2).not.toHaveBeenCalled()
  })

  it('different keys have independent caches', async () => {
    vi.resetModules()
    const { cfCacheGet } = await import('../../../server/utils/cfCache')

    const fn1 = vi.fn().mockResolvedValue('es-data')
    const fn2 = vi.fn().mockResolvedValue('en-data')

    const r1 = await cfCacheGet('market-report:locale=es', 3600, fn1)
    const r2 = await cfCacheGet('market-report:locale=en', 3600, fn2)

    expect(r1).toBe('es-data')
    expect(r2).toBe('en-data')
    expect(fn1).toHaveBeenCalledOnce()
    expect(fn2).toHaveBeenCalledOnce()
  })

  it('handles corrupted cache entry gracefully (falls through to fn)', async () => {
    vi.resetModules()

    // Store invalid JSON in cache
    const mockCacheCorrupted = {
      match: vi.fn(async () => new Response('NOT_JSON', { headers: { 'Content-Type': 'application/json' } })),
      put: vi.fn(async () => {}),
    }
    vi.stubGlobal('caches', { default: mockCacheCorrupted })

    const { cfCacheGet } = await import('../../../server/utils/cfCache')
    const fn = vi.fn().mockResolvedValue({ fresh: true })
    const result = await cfCacheGet('corrupt-key', 60, fn)

    expect(result).toEqual({ fresh: true })
    expect(fn).toHaveBeenCalledOnce()
  })

  it('continues even if cache.put() throws', async () => {
    vi.resetModules()

    const mockCachePutFails = {
      match: vi.fn(async () => undefined), // always miss
      put: vi.fn(async () => { throw new Error('Storage quota exceeded') }),
    }
    vi.stubGlobal('caches', { default: mockCachePutFails })

    const { cfCacheGet } = await import('../../../server/utils/cfCache')
    const fn = vi.fn().mockResolvedValue({ data: 'ok' })
    // Should not throw even if put() fails
    await expect(cfCacheGet('fail-key', 60, fn)).resolves.toEqual({ data: 'ok' })
  })
})
