/**
 * Concurrency Control & Backpressure Utilities
 *
 * - Semaphore: limits concurrent access to a resource
 * - Backpressure: rejects requests when too many are queued
 * - withConcurrency: wraps an async function with concurrency control
 */

// ---------------------------------------------------------------------------
// Semaphore — limits concurrent tasks
// ---------------------------------------------------------------------------

export class Semaphore {
  private permits: number
  private readonly queue: Array<() => void> = []

  constructor(maxConcurrency: number) {
    this.permits = maxConcurrency
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    } else {
      this.permits++
    }
  }

  get pending(): number {
    return this.queue.length
  }

  get available(): number {
    return this.permits
  }
}

// ---------------------------------------------------------------------------
// Backpressure — rejects when queue is too deep
// ---------------------------------------------------------------------------

export interface BackpressureConfig {
  /** Maximum concurrent executions */
  maxConcurrency: number
  /** Maximum queued requests before rejecting with 503 */
  maxQueue: number
}

const DEFAULT_CONFIG: BackpressureConfig = {
  maxConcurrency: 10,
  maxQueue: 50,
}

/** Module-level registries — one per named resource */
const semaphores = new Map<string, Semaphore>()
const queueDepths = new Map<string, number>()

/**
 * Wraps an async handler with concurrency control and backpressure.
 *
 * Usage in a server route:
 *   export default defineEventHandler(withBackpressure('heavy-task', { maxConcurrency: 5, maxQueue: 20 }, async (event) => { ... }))
 */
export function withBackpressure<T>(
  name: string,
  config: Partial<BackpressureConfig>,
  handler: () => Promise<T>,
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  if (!semaphores.has(name)) {
    semaphores.set(name, new Semaphore(cfg.maxConcurrency))
    queueDepths.set(name, 0)
  }

  const semaphore = semaphores.get(name)!
  const depth = queueDepths.get(name) ?? 0

  // Reject if queue is too deep (backpressure)
  if (depth >= cfg.maxQueue) {
    return Promise.reject(
      new Error(`Service overloaded: ${name} — ${depth} requests queued (max ${cfg.maxQueue})`),
    )
  }

  queueDepths.set(name, depth + 1)

  return (async () => {
    await semaphore.acquire()
    try {
      return await handler()
    } finally {
      semaphore.release()
      queueDepths.set(name, (queueDepths.get(name) ?? 1) - 1)
    }
  })()
}

/**
 * Helper for batch processing with controlled concurrency.
 * Processes items in parallel, up to `maxConcurrency` at a time.
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrency = 5,
): Promise<R[]> {
  const semaphore = new Semaphore(maxConcurrency)
  return Promise.all(
    items.map(async (item) => {
      await semaphore.acquire()
      try {
        return await processor(item)
      } finally {
        semaphore.release()
      }
    }),
  )
}

/**
 * Get current backpressure stats for monitoring.
 */
export function getBackpressureStats(): Record<
  string,
  { pending: number; available: number; queued: number }
> {
  const stats: Record<string, { pending: number; available: number; queued: number }> = {}
  for (const [name, semaphore] of semaphores) {
    stats[name] = {
      pending: semaphore.pending,
      available: semaphore.available,
      queued: queueDepths.get(name) ?? 0,
    }
  }
  return stats
}
