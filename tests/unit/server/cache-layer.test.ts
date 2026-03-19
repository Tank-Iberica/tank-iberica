import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  UpstashRedisAdapter,
  InMemoryAdapter,
  createCacheAdapter,
  resetCacheAdapter,
  cacheGet,
  cacheSet,
  cacheInvalidate,
  cacheBatch,
  type CacheBatchOp,
} from '../../../server/utils/cacheLayer'

// ── Fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── UpstashRedisAdapter ──────────────────────────────────────────────────────

describe('UpstashRedisAdapter', () => {
  let adapter: UpstashRedisAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new UpstashRedisAdapter({
      url: 'https://test-redis.upstash.io',
      token: 'test-token',
    })
  })

  describe('isAvailable', () => {
    it('returns true when PING succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 'PONG' }),
      })
      expect(await adapter.isAvailable()).toBe(true)
    })

    it('returns false when no URL configured', async () => {
      adapter = new UpstashRedisAdapter({ url: '', token: 'x' })
      expect(await adapter.isAvailable()).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
      expect(await adapter.isAvailable()).toBe(false)
    })
  })

  describe('get', () => {
    it('returns parsed JSON value', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: '{"name":"test"}' }),
      })

      const result = await adapter.get('key-1')
      expect(result).toEqual({ name: 'test' })
    })

    it('returns null for missing key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: null }),
      })

      expect(await adapter.get('missing')).toBeNull()
    })

    it('returns raw value if not valid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 'plain-string' }),
      })

      const result = await adapter.get('key-2')
      expect(result).toBe('plain-string')
    })
  })

  describe('set', () => {
    it('sets value without TTL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 'OK' }),
      })

      await adapter.set('key-1', { data: true })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as string[]
      expect(body[0]).toBe('SET')
      expect(body[1]).toBe('key-1')
      expect(body[2]).toBe('{"data":true}')
      expect(body).toHaveLength(3) // no EX/TTL args
    })

    it('sets value with TTL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 'OK' }),
      })

      await adapter.set('key-1', 'value', 300)

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as string[]
      expect(body).toEqual(['SET', 'key-1', '"value"', 'EX', '300'])
    })

    it('throws on failed set', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(adapter.set('key', 'val')).rejects.toThrow('Upstash command failed')
    })
  })

  describe('invalidate', () => {
    it('sends DEL command', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 1 }),
      })

      await adapter.invalidate('key-1')

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as string[]
      expect(body).toEqual(['DEL', 'key-1'])
    })
  })

  describe('batch', () => {
    it('sends pipeline request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ result: '{"id":1}' }, { result: 'OK' }, { result: 1 }]),
      })

      const ops: CacheBatchOp[] = [
        { type: 'get', key: 'k1' },
        { type: 'set', key: 'k2', value: 'v2', ttlSeconds: 60 },
        { type: 'invalidate', key: 'k3' },
      ]

      const results = await adapter.batch(ops)
      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({ id: 1 }) // parsed JSON
      expect(results[1]).toBe('OK')
      expect(results[2]).toBe(1)
    })

    it('throws on pipeline error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(adapter.batch([{ type: 'get', key: 'k' }])).rejects.toThrow('pipeline failed')
    })
  })

  it('has name upstash', () => {
    expect(adapter.name).toBe('upstash')
  })
})

// ── InMemoryAdapter ──────────────────────────────────────────────────────────

describe('InMemoryAdapter', () => {
  let adapter: InMemoryAdapter

  beforeEach(() => {
    adapter = new InMemoryAdapter(100)
  })

  it('has name memory', () => {
    expect(adapter.name).toBe('memory')
  })

  it('is always available', async () => {
    expect(await adapter.isAvailable()).toBe(true)
  })

  describe('get/set', () => {
    it('returns null for missing key', async () => {
      expect(await adapter.get('missing')).toBeNull()
    })

    it('stores and retrieves values', async () => {
      await adapter.set('key1', { hello: 'world' })
      expect(await adapter.get('key1')).toEqual({ hello: 'world' })
    })

    it('stores strings', async () => {
      await adapter.set('str', 'value')
      expect(await adapter.get('str')).toBe('value')
    })

    it('stores numbers', async () => {
      await adapter.set('num', 42)
      expect(await adapter.get('num')).toBe(42)
    })

    it('stores arrays', async () => {
      await adapter.set('arr', [1, 2, 3])
      expect(await adapter.get('arr')).toEqual([1, 2, 3])
    })
  })

  describe('TTL', () => {
    it('expires entries after TTL', async () => {
      vi.useFakeTimers()
      await adapter.set('temp', 'data', 5)

      expect(await adapter.get('temp')).toBe('data')

      vi.advanceTimersByTime(6000)
      expect(await adapter.get('temp')).toBeNull()

      vi.useRealTimers()
    })

    it('entries without TTL do not expire', async () => {
      vi.useFakeTimers()
      await adapter.set('permanent', 'data')

      vi.advanceTimersByTime(1000000)
      expect(await adapter.get('permanent')).toBe('data')

      vi.useRealTimers()
    })
  })

  describe('invalidate', () => {
    it('removes a key', async () => {
      await adapter.set('key1', 'val')
      await adapter.invalidate('key1')
      expect(await adapter.get('key1')).toBeNull()
    })

    it('is a no-op for missing key', async () => {
      await expect(adapter.invalidate('missing')).resolves.not.toThrow()
    })
  })

  describe('batch', () => {
    it('executes multiple operations', async () => {
      await adapter.set('existing', { x: 1 })

      const results = await adapter.batch([
        { type: 'get', key: 'existing' },
        { type: 'set', key: 'new', value: 'hello', ttlSeconds: 60 },
        { type: 'get', key: 'missing' },
        { type: 'invalidate', key: 'existing' },
      ])

      expect(results[0]).toEqual({ x: 1 })
      expect(results[1]).toBe('OK')
      expect(results[2]).toBeNull()
      expect(results[3]).toBe(1)

      // Verify side effects
      expect(await adapter.get('new')).toBe('hello')
      expect(await adapter.get('existing')).toBeNull()
    })
  })

  describe('eviction', () => {
    it('evicts oldest entry when maxSize reached', async () => {
      const small = new InMemoryAdapter(3)
      await small.set('a', 1)
      await small.set('b', 2)
      await small.set('c', 3)
      expect(small.size).toBe(3)

      await small.set('d', 4) // should evict 'a'
      expect(small.size).toBe(3)
      expect(await small.get('a')).toBeNull()
      expect(await small.get('d')).toBe(4)
    })

    it('does not evict when updating existing key', async () => {
      const small = new InMemoryAdapter(2)
      await small.set('a', 1)
      await small.set('b', 2)
      await small.set('a', 10) // update, not new entry
      expect(small.size).toBe(2)
      expect(await small.get('a')).toBe(10)
      expect(await small.get('b')).toBe(2)
    })
  })

  describe('clear', () => {
    it('removes all entries', async () => {
      await adapter.set('a', 1)
      await adapter.set('b', 2)
      adapter.clear()
      expect(adapter.size).toBe(0)
      expect(await adapter.get('a')).toBeNull()
    })
  })
})

// ── createCacheAdapter factory ───────────────────────────────────────────────

describe('createCacheAdapter', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    resetCacheAdapter()
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    resetCacheAdapter()
  })

  it('returns memory adapter when no Upstash configured', async () => {
    delete process.env.UPSTASH_REDIS_URL
    delete process.env.CACHE_LAYER

    const adapter = await createCacheAdapter()
    expect(adapter.name).toBe('memory')
  })

  it('returns upstash when available', async () => {
    process.env.UPSTASH_REDIS_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_TOKEN = 'token'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ result: 'PONG' }),
    })

    const adapter = await createCacheAdapter()
    expect(adapter.name).toBe('upstash')
  })

  it('falls back to memory when upstash unavailable', async () => {
    process.env.UPSTASH_REDIS_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_TOKEN = 'token'

    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    const adapter = await createCacheAdapter()
    expect(adapter.name).toBe('memory')
  })

  it('caches adapter as singleton', async () => {
    delete process.env.UPSTASH_REDIS_URL

    const first = await createCacheAdapter()
    const second = await createCacheAdapter()
    expect(first).toBe(second)
  })

  it('explicit memory type skips upstash check', async () => {
    const adapter = await createCacheAdapter('memory')
    expect(adapter.name).toBe('memory')
  })
})

// ── Convenience functions ────────────────────────────────────────────────────

describe('convenience functions', () => {
  beforeEach(() => {
    resetCacheAdapter()
    delete process.env.UPSTASH_REDIS_URL
    delete process.env.CACHE_LAYER
  })

  afterEach(() => {
    resetCacheAdapter()
  })

  it('cacheGet retrieves value', async () => {
    await cacheSet('test-key', 'test-value')
    expect(await cacheGet('test-key')).toBe('test-value')
  })

  it('cacheSet stores value', async () => {
    await cacheSet('k', { data: 1 })
    expect(await cacheGet('k')).toEqual({ data: 1 })
  })

  it('cacheInvalidate removes value', async () => {
    await cacheSet('k', 'v')
    await cacheInvalidate('k')
    expect(await cacheGet('k')).toBeNull()
  })

  it('cacheBatch executes multiple ops', async () => {
    await cacheSet('exist', 42)

    const results = await cacheBatch([
      { type: 'get', key: 'exist' },
      { type: 'set', key: 'new', value: 'hi' },
    ])

    expect(results[0]).toBe(42)
    expect(results[1]).toBe('OK')
    expect(await cacheGet('new')).toBe('hi')
  })
})
