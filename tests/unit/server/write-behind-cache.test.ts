import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWriteBehindCache } from '../../../server/utils/writeBehindCache'

describe('Write-behind cache (#244)', () => {
  function makeCache(overrides = {}) {
    return createWriteBehindCache<Record<string, unknown>>({
      tableName: 'leads',
      flushIntervalMs: 5000,
      maxRetries: 3,
      cacheTtlMs: 60_000,
      ...overrides,
    })
  }

  describe('write()', () => {
    it('returns a unique ID on write', () => {
      const cache = makeCache()
      const id1 = cache.write({ name: 'Lead 1' })
      const id2 = cache.write({ name: 'Lead 2' })
      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('stores data retrievable via get()', () => {
      const cache = makeCache()
      const id = cache.write({ name: 'Test Lead', email: 'a@b.com' })
      const entry = cache.get(id)
      expect(entry).toEqual({ name: 'Test Lead', email: 'a@b.com' })
    })

    it('increments pending count', () => {
      const cache = makeCache()
      expect(cache.stats().pending).toBe(0)
      cache.write({ name: 'A' })
      cache.write({ name: 'B' })
      expect(cache.stats().pending).toBe(2)
    })
  })

  describe('get()', () => {
    it('returns undefined for unknown IDs', () => {
      const cache = makeCache()
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('returns undefined for expired entries', () => {
      const cache = makeCache({ cacheTtlMs: 0 })
      const id = cache.write({ name: 'Expired' })
      expect(cache.get(id)).toBeUndefined()
    })
  })

  describe('getPending()', () => {
    it('returns only unsynced entries', () => {
      const cache = makeCache()
      cache.write({ name: 'A' })
      cache.write({ name: 'B' })
      expect(cache.getPending()).toHaveLength(2)
    })

    it('returns empty array when no pending', () => {
      const cache = makeCache()
      expect(cache.getPending()).toEqual([])
    })
  })

  describe('flush()', () => {
    it('sends all pending entries in batch', async () => {
      const cache = makeCache()
      cache.write({ name: 'A' })
      cache.write({ name: 'B' })
      cache.write({ name: 'C' })

      const insertFn = vi.fn().mockResolvedValue({ error: null })
      await cache.flush(insertFn)

      expect(insertFn).toHaveBeenCalledTimes(1)
      expect(insertFn).toHaveBeenCalledWith([
        { name: 'A' },
        { name: 'B' },
        { name: 'C' },
      ])
    })

    it('marks entries as synced on success', async () => {
      const cache = makeCache()
      cache.write({ name: 'A' })

      await cache.flush(vi.fn().mockResolvedValue({ error: null }))
      expect(cache.stats().synced).toBe(1)
      expect(cache.stats().pending).toBe(0)
    })

    it('does nothing when no pending entries', async () => {
      const cache = makeCache()
      const insertFn = vi.fn()
      await cache.flush(insertFn)
      expect(insertFn).not.toHaveBeenCalled()
    })

    it('retries on DB failure', async () => {
      const cache = makeCache()
      cache.write({ name: 'A' })

      // First call fails
      const failFn = vi.fn().mockResolvedValue({ error: new Error('DB down') })
      await cache.flush(failFn)

      // Entry should still be pending
      expect(cache.stats().pending).toBe(1)
      expect(cache.getPending()).toHaveLength(1)

      // Second attempt succeeds
      const successFn = vi.fn().mockResolvedValue({ error: null })
      await cache.flush(successFn)

      expect(cache.stats().synced).toBe(1)
      expect(cache.stats().pending).toBe(0)
    })

    it('gives up after maxRetries', async () => {
      const cache = makeCache({ maxRetries: 2 })
      cache.write({ name: 'Doomed' })

      const failFn = vi.fn().mockResolvedValue({ error: new Error('fail') })

      await cache.flush(failFn) // retry 1
      expect(cache.getPending()).toHaveLength(1)
      await cache.flush(failFn) // retry 2
      expect(cache.getPending()).toHaveLength(0) // exceeded maxRetries
    })
  })

  describe('stats()', () => {
    it('returns correct total/pending/synced', async () => {
      const cache = makeCache()
      cache.write({ name: 'A' })
      cache.write({ name: 'B' })

      expect(cache.stats()).toEqual({ total: 2, pending: 2, synced: 0 })

      await cache.flush(vi.fn().mockResolvedValue({ error: null }))
      expect(cache.stats()).toEqual({ total: 2, pending: 0, synced: 2 })
    })
  })

  describe('clear()', () => {
    it('removes all entries', () => {
      const cache = makeCache()
      cache.write({ name: 'A' })
      cache.write({ name: 'B' })
      cache.clear()
      expect(cache.stats().total).toBe(0)
    })
  })

  describe('shutdown()', () => {
    it('can be called without error', () => {
      const cache = makeCache()
      expect(() => cache.shutdown()).not.toThrow()
    })

    it('can be called multiple times', () => {
      const cache = makeCache()
      cache.shutdown()
      cache.shutdown()
      expect(cache.stats().total).toBe(0)
    })
  })
})
