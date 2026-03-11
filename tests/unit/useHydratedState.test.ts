import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// Stub Nuxt auto-imports
const stateStore = new Map<string, any>()
vi.stubGlobal('useState', (key: string, init?: () => any) => {
  if (!stateStore.has(key)) {
    stateStore.set(key, ref(init ? init() : null))
  }
  return stateStore.get(key)!
})
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

import { useHydratedState } from '../../app/composables/shared/useHydratedState'

describe('useHydratedState', () => {
  beforeEach(() => {
    stateStore.clear()
    vi.clearAllMocks()
  })

  it('returns null data initially', () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b'])
    const { data } = useHydratedState('test', fetcher)
    expect(data.value).toBeNull()
  })

  it('ensureData fetches data', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b'])
    const { data, ensureData } = useHydratedState('test-ensure', fetcher)
    await ensureData()
    expect(data.value).toEqual(['a', 'b'])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('ensureData does not re-fetch if data is fresh', async () => {
    const fetcher = vi.fn().mockResolvedValue([1, 2])
    const { ensureData } = useHydratedState('test-fresh', fetcher, { ttl: 60_000 })
    await ensureData()
    await ensureData()
    expect(fetcher).toHaveBeenCalledTimes(1) // only once
  })

  it('refresh always re-fetches', async () => {
    const fetcher = vi.fn().mockResolvedValue('first')
    const { data, refresh } = useHydratedState('test-refresh', fetcher)
    await refresh()
    expect(data.value).toBe('first')

    fetcher.mockResolvedValue('second')
    await refresh()
    expect(data.value).toBe('second')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('handles fetch errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network fail'))
    const { error, ensureData } = useHydratedState('test-error', fetcher)
    await ensureData()
    expect(error.value).toBe('Network fail')
  })

  it('isStale is true when no data fetched', () => {
    const fetcher = vi.fn().mockResolvedValue(null)
    const { isStale } = useHydratedState('test-stale', fetcher)
    expect(isStale.value).toBe(true)
  })

  it('isStale is false after fresh fetch', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { isStale, ensureData } = useHydratedState('test-not-stale', fetcher, { ttl: 60_000 })
    await ensureData()
    expect(isStale.value).toBe(false)
  })

  it('shares state across multiple calls with same key', async () => {
    const fetcher = vi.fn().mockResolvedValue('shared')
    const a = useHydratedState('shared-key', fetcher)
    const b = useHydratedState('shared-key', fetcher)

    await a.ensureData()
    // b should see the same data without fetching again
    expect(b.data.value).toBe('shared')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
