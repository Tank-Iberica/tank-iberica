/**
 * useOfflineSync — Offline-first sync for favorites and saved searches.
 *
 * Queues mutations (favorite toggles, search saves) in localStorage when offline.
 * Flushes the queue to Supabase when connection is restored.
 * State is lazily initialized to avoid import side effects.
 */

const QUEUE_KEY = 'tracciona_offline_queue'

export interface OfflineAction {
  id: string
  type: 'favorite_add' | 'favorite_remove' | 'search_save' | 'search_delete'
  payload: Record<string, unknown>
  createdAt: string
}

// Lazy-initialized state
let _isOnline: Ref<boolean> | null = null
let _queue: Ref<OfflineAction[]> | null = null
let _syncing: Ref<boolean> | null = null
let _listenersBound = false

function getIsOnline(): Ref<boolean> {
  _isOnline ??= ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  return _isOnline
}

function getQueue(): Ref<OfflineAction[]> {
  if (!_queue) {
    _queue = ref<OfflineAction[]>([])
    // Load persisted queue
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(QUEUE_KEY)
        if (raw) _queue.value = JSON.parse(raw)
      } catch {
        // ignore malformed data
      }
    }
  }
  return _queue
}

function getSyncing(): Ref<boolean> {
  _syncing ??= ref(false)
  return _syncing
}

function persistQueue(queue: OfflineAction[]): void {
  if (import.meta.client) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch {
      // localStorage may be unavailable
    }
  }
}

/** Composable for offline sync. */
export function useOfflineSync() {
  const isOnline = getIsOnline()
  const queue = getQueue()
  const syncing = getSyncing()

  // Bind online/offline listeners once
  if (import.meta.client && !_listenersBound) {
    _listenersBound = true

    const handleOnline = () => {
      isOnline.value = true
      flushQueue()
    }
    const handleOffline = () => {
      isOnline.value = false
    }

    globalThis.addEventListener('online', handleOnline)
    globalThis.addEventListener('offline', handleOffline)
  }

  /**
   * Enqueue an action for offline processing.
   * If online, executes immediately via the provided executor.
   * If offline, queues for later sync.
   */
  async function enqueue(
    action: Omit<OfflineAction, 'id' | 'createdAt'>,
    executor?: (action: OfflineAction) => Promise<boolean>,
  ): Promise<void> {
    const fullAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    if (isOnline.value && executor) {
      const success = await executor(fullAction)
      if (success) return
    }

    // Queue for later
    queue.value = [...queue.value, fullAction]
    persistQueue(queue.value)
  }

  /**
   * Flush all queued actions.
   * Called automatically when coming back online.
   */
  async function flushQueue(
    executor?: (action: OfflineAction) => Promise<boolean>,
  ): Promise<{ processed: number; failed: number }> {
    if (syncing.value || queue.value.length === 0) {
      return { processed: 0, failed: 0 }
    }

    syncing.value = true
    let processed = 0
    let failed = 0
    const remaining: OfflineAction[] = []

    for (const action of queue.value) {
      if (executor) {
        try {
          const success = await executor(action)
          if (success) {
            processed++
          } else {
            failed++
            remaining.push(action)
          }
        } catch {
          failed++
          remaining.push(action)
        }
      } else {
        // No executor provided — keep in queue
        remaining.push(action)
      }
    }

    queue.value = remaining
    persistQueue(remaining)
    syncing.value = false

    return { processed, failed }
  }

  /**
   * Clear the offline queue.
   */
  function clearQueue(): void {
    queue.value = []
    persistQueue([])
  }

  /**
   * Get the number of pending actions.
   */
  const pendingCount = computed(() => queue.value.length)

  return {
    isOnline: readonly(isOnline),
    syncing: readonly(syncing),
    pendingCount,
    queue: readonly(queue),
    enqueue,
    flushQueue,
    clearQueue,
  }
}
