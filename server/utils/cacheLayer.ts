/**
 * Cache layer abstraction with adapter pattern (#132).
 *
 * Adapters: Upstash Redis primary → in-memory fallback.
 * Active adapter selected based on UPSTASH_REDIS_URL env var.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface CacheAdapter {
  readonly name: string
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>
  invalidate(key: string): Promise<void>
  batch(ops: CacheBatchOp[]): Promise<(unknown | null)[]>
  isAvailable(): Promise<boolean>
}

export interface CacheBatchOp {
  type: 'get' | 'set' | 'invalidate'
  key: string
  value?: unknown
  ttlSeconds?: number
}

// ── Upstash Redis Adapter ────────────────────────────────────────────────────

export class UpstashRedisAdapter implements CacheAdapter {
  readonly name = 'upstash'
  private url: string
  private token: string

  constructor(config?: { url?: string; token?: string }) {
    this.url = config?.url || process.env.UPSTASH_REDIS_URL || ''
    this.token = config?.token || process.env.UPSTASH_REDIS_TOKEN || ''
  }

  async isAvailable(): Promise<boolean> {
    if (!this.url || !this.token) return false
    try {
      const res = await this.command(['PING'])
      return res === 'PONG'
    } catch {
      return false
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const result = await this.command(['GET', key])
    if (result === null || result === undefined) return null
    try {
      return JSON.parse(String(result)) as T
    } catch {
      return result as T
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
      await this.command(['SET', key, serialized, 'EX', String(ttlSeconds)])
    } else {
      await this.command(['SET', key, serialized])
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.command(['DEL', key])
  }

  async batch(ops: CacheBatchOp[]): Promise<(unknown | null)[]> {
    const pipeline = ops.map((op) => {
      switch (op.type) {
        case 'get':
          return ['GET', op.key]
        case 'set': {
          const serialized = JSON.stringify(op.value)
          if (op.ttlSeconds && op.ttlSeconds > 0) {
            return ['SET', op.key, serialized, 'EX', String(op.ttlSeconds)]
          }
          return ['SET', op.key, serialized]
        }
        case 'invalidate':
          return ['DEL', op.key]
        default:
          return ['PING']
      }
    })

    const results = await this.pipelineCommand(pipeline)
    return results.map((r, i) => {
      if (ops[i]!.type === 'get' && r !== null && r !== undefined) {
        try {
          return JSON.parse(String(r))
        } catch {
          return r
        }
      }
      return r
    })
  }

  private async command(args: string[]): Promise<unknown> {
    const res = await fetch(`${this.url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })

    if (!res.ok) {
      throw new Error(`Upstash command failed: ${res.status}`)
    }

    const body = (await res.json()) as { result: unknown }
    return body.result
  }

  private async pipelineCommand(commands: string[][]): Promise<unknown[]> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    })

    if (!res.ok) {
      throw new Error(`Upstash pipeline failed: ${res.status}`)
    }

    const body = (await res.json()) as Array<{ result: unknown }>
    return body.map((r) => r.result)
  }
}

// ── In-Memory Adapter ────────────────────────────────────────────────────────

interface MemoryCacheEntry {
  value: unknown
  expiresAt: number | null
}

export class InMemoryAdapter implements CacheAdapter {
  readonly name = 'memory'
  private store: Map<string, MemoryCacheEntry>
  private maxSize: number

  constructor(maxSize = 10000) {
    this.store = new Map()
    this.maxSize = maxSize
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value
      if (firstKey !== undefined) this.store.delete(firstKey)
    }

    this.store.set(key, {
      value,
      expiresAt: ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key)
  }

  async batch(ops: CacheBatchOp[]): Promise<(unknown | null)[]> {
    const results: (unknown | null)[] = []
    for (const op of ops) {
      switch (op.type) {
        case 'get':
          results.push(await this.get(op.key))
          break
        case 'set':
          await this.set(op.key, op.value, op.ttlSeconds)
          results.push('OK')
          break
        case 'invalidate':
          await this.invalidate(op.key)
          results.push(1)
          break
        default:
          results.push(null)
      }
    }
    return results
  }

  /** Visible for testing */
  get size(): number {
    return this.store.size
  }

  /** Visible for testing — clear all entries */
  clear(): void {
    this.store.clear()
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

export type CacheLayerType = 'upstash' | 'memory'

let cachedAdapter: CacheAdapter | null = null

/**
 * Create or return singleton cache adapter.
 * Priority: Upstash Redis → in-memory fallback.
 */
export async function createCacheAdapter(type?: CacheLayerType): Promise<CacheAdapter> {
  if (cachedAdapter) return cachedAdapter

  const layerType = type || (process.env.CACHE_LAYER as CacheLayerType) || undefined

  if (layerType === 'upstash' || (!layerType && process.env.UPSTASH_REDIS_URL)) {
    const adapter = new UpstashRedisAdapter()
    if (await adapter.isAvailable()) {
      cachedAdapter = adapter
      return adapter
    }
    console.info('[cacheLayer] Upstash configured but not available, falling back to memory')
  }

  const memAdapter = new InMemoryAdapter()
  cachedAdapter = memAdapter
  return memAdapter
}

/**
 * Reset the singleton (for testing).
 */
export function resetCacheAdapter(): void {
  cachedAdapter = null
}

// ── Convenience functions ────────────────────────────────────────────────────

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const adapter = await createCacheAdapter()
  return adapter.get<T>(key)
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const adapter = await createCacheAdapter()
  return adapter.set(key, value, ttlSeconds)
}

export async function cacheInvalidate(key: string): Promise<void> {
  const adapter = await createCacheAdapter()
  return adapter.invalidate(key)
}

export async function cacheBatch(ops: CacheBatchOp[]): Promise<(unknown | null)[]> {
  const adapter = await createCacheAdapter()
  return adapter.batch(ops)
}
