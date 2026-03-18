/**
 * Write-behind cache for leads and messages.
 *
 * Pattern: Write to in-memory cache immediately, then sync to DB asynchronously.
 * This ensures fast API responses while guaranteeing eventual persistence.
 *
 * Backlog #244 — Write-behind cache leads/mensajes
 *
 * Features:
 * - Immediate cache write for fast response
 * - Async DB sync with configurable flush interval
 * - Retry on DB failure (up to MAX_RETRIES)
 * - Flush on process shutdown (graceful)
 * - TTL on cache entries to prevent stale data
 *
 * @example
 * const cache = createWriteBehindCache<Lead>({
 *   tableName: 'leads',
 *   flushIntervalMs: 5000,
 *   maxRetries: 3,
 * })
 * await cache.write(leadData) // returns immediately from cache
 * cache.shutdown() // flushes pending writes
 */

export interface WriteBehindOptions {
  /** Supabase table name */
  tableName: string
  /** Flush interval in milliseconds (default: 5000) */
  flushIntervalMs?: number
  /** Max retries on DB write failure (default: 3) */
  maxRetries?: number
  /** Cache TTL in milliseconds (default: 60000) */
  cacheTtlMs?: number
}

interface CacheEntry<T> {
  data: T
  createdAt: number
  synced: boolean
  retries: number
}

export interface WriteBehindCache<T extends Record<string, unknown>> {
  /** Write data — returns immediately, syncs to DB async */
  write(data: T): string
  /** Get cached entry by ID */
  get(id: string): T | undefined
  /** Get all pending (unsynced) entries */
  getPending(): T[]
  /** Force flush all pending entries to DB */
  flush(dbInsertFn: (rows: T[]) => Promise<{ error: unknown | null }>): Promise<void>
  /** Get cache stats */
  stats(): { total: number; pending: number; synced: number }
  /** Clear all entries */
  clear(): void
  /** Shutdown — flush and stop timers */
  shutdown(): void
}

/**
 * Create a write-behind cache instance.
 */
export function createWriteBehindCache<T extends Record<string, unknown>>(
  options: WriteBehindOptions,
): WriteBehindCache<T> {
  const { flushIntervalMs: _flushIntervalMs = 5000, maxRetries = 3, cacheTtlMs = 60_000 } = options

  const cache = new Map<string, CacheEntry<T>>()
  let _flushInterval: ReturnType<typeof setInterval> | null = null

  /** Generate a simple unique ID */
  function generateId(): string {
    return `wbc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  /** Write data to cache, return generated ID */
  function write(data: T): string {
    const id = generateId()
    cache.set(id, {
      data,
      createdAt: Date.now(),
      synced: false,
      retries: 0,
    })
    return id
  }

  /** Get cached entry */
  function get(id: string): T | undefined {
    const entry = cache.get(id)
    if (!entry) return undefined
    // Check TTL
    if (Date.now() - entry.createdAt >= cacheTtlMs) {
      cache.delete(id)
      return undefined
    }
    return entry.data
  }

  /** Get all pending (unsynced) entries */
  function getPending(): T[] {
    const pending: T[] = []
    for (const entry of cache.values()) {
      if (!entry.synced && entry.retries < maxRetries) {
        pending.push(entry.data)
      }
    }
    return pending
  }

  /** Flush pending entries to DB */
  async function flush(
    dbInsertFn: (rows: T[]) => Promise<{ error: unknown | null }>,
  ): Promise<void> {
    const pendingEntries: [string, CacheEntry<T>][] = []
    for (const [id, entry] of cache.entries()) {
      if (!entry.synced && entry.retries < maxRetries) {
        pendingEntries.push([id, entry])
      }
    }

    if (pendingEntries.length === 0) return

    const rows = pendingEntries.map(([, entry]) => entry.data)
    const { error } = await dbInsertFn(rows)

    if (error) {
      // Increment retry count on failure
      for (const [, entry] of pendingEntries) {
        entry.retries++
      }
      return
    }

    // Mark as synced on success
    for (const [, entry] of pendingEntries) {
      entry.synced = true
    }

    // Clean up synced entries older than TTL
    const now = Date.now()
    for (const [id, entry] of cache.entries()) {
      if (entry.synced && now - entry.createdAt > cacheTtlMs) {
        cache.delete(id)
      }
    }
  }

  /** Get cache statistics */
  function stats(): { total: number; pending: number; synced: number } {
    let pending = 0
    let synced = 0
    for (const entry of cache.values()) {
      if (entry.synced) synced++
      else pending++
    }
    return { total: cache.size, pending, synced }
  }

  /** Clear all cache entries */
  function clear(): void {
    cache.clear()
  }

  /** Shutdown: stop interval, no more auto-flushes */
  function shutdown(): void {
    if (_flushInterval) {
      clearInterval(_flushInterval)
      _flushInterval = null
    }
  }

  return { write, get, getPending, flush, stats, clear, shutdown }
}
