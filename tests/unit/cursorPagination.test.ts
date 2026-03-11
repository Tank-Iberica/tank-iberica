import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Stub Nuxt auto-imports with real Vue reactivity
vi.stubGlobal('ref', ref)

import { useCursorPagination } from '../../app/composables/shared/cursorPagination'

function createMockQuery(pages: any[][]) {
  let callIndex = 0
  return vi.fn().mockImplementation(() => {
    const data = pages[callIndex] || []
    callIndex++
    return Promise.resolve({ data, error: null })
  })
}

describe('useCursorPagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads first page', async () => {
    const items = [
      { id: '1', created_at: '2026-01-03' },
      { id: '2', created_at: '2026-01-02' },
      { id: '3', created_at: '2026-01-01' },
    ]
    const query = createMockQuery([items])
    const {
      loadFirst,
      items: result,
      hasMore,
    } = useCursorPagination({
      query,
      getCursor: (item: any) => item.created_at,
      pageSize: 3,
    })

    await loadFirst()
    expect(result.value).toHaveLength(3)
    expect(hasMore.value).toBe(true) // 3 items = pageSize, might be more
    expect(query).toHaveBeenCalledWith(null) // first page, no cursor
  })

  it('indicates no more when page is smaller than pageSize', async () => {
    const items = [{ id: '1', created_at: '2026-01-01' }]
    const query = createMockQuery([items])
    const { loadFirst, hasMore } = useCursorPagination({
      query,
      getCursor: (item: any) => item.created_at,
      pageSize: 20,
    })

    await loadFirst()
    expect(hasMore.value).toBe(false) // only 1 item, pageSize=20
  })

  it('loadMore appends items', async () => {
    const page1 = [
      { id: '1', created_at: '2026-01-03' },
      { id: '2', created_at: '2026-01-02' },
    ]
    const page2 = [{ id: '3', created_at: '2026-01-01' }]
    const query = createMockQuery([page1, page2])
    const {
      loadFirst,
      loadMore,
      items: result,
      hasMore,
    } = useCursorPagination({
      query,
      getCursor: (item: any) => item.created_at,
      pageSize: 2,
    })

    await loadFirst()
    expect(result.value).toHaveLength(2)
    expect(hasMore.value).toBe(true)

    await loadMore()
    expect(result.value).toHaveLength(3)
    expect(hasMore.value).toBe(false) // page2 had 1 item < pageSize=2
    // Second call should use cursor from last item of page1
    expect(query).toHaveBeenCalledWith('2026-01-02')
  })

  it('loadMore does nothing when hasMore is false', async () => {
    const query = createMockQuery([[]])
    const {
      loadFirst,
      loadMore,
      items: result,
    } = useCursorPagination({
      query,
      getCursor: (item: any) => item.id,
      pageSize: 20,
    })

    await loadFirst()
    expect(result.value).toHaveLength(0)
    await loadMore() // should be a no-op
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('handles query errors', async () => {
    const query = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const {
      loadFirst,
      error,
      items: result,
    } = useCursorPagination({
      query,
      getCursor: (item: any) => item.id,
    })

    await loadFirst()
    expect(error.value).toBe('DB error')
    expect(result.value).toHaveLength(0)
  })

  it('handles thrown errors', async () => {
    const query = vi.fn().mockRejectedValue(new Error('Network error'))
    const { loadFirst, error } = useCursorPagination({
      query,
      getCursor: (item: any) => item.id,
    })

    await loadFirst()
    expect(error.value).toBe('Network error')
  })

  it('reset clears all state', async () => {
    const items = [{ id: '1', created_at: '2026-01-01' }]
    const query = createMockQuery([items])
    const {
      loadFirst,
      reset,
      items: result,
      cursor,
      hasMore,
      isLoading,
      error,
    } = useCursorPagination({
      query,
      getCursor: (item: any) => item.created_at,
    })

    await loadFirst()
    expect(result.value).toHaveLength(1)

    reset()
    expect(result.value).toHaveLength(0)
    expect(cursor.value).toBeNull()
    expect(hasMore.value).toBe(true)
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('prevents concurrent loads', async () => {
    let resolveQuery: Function
    const query = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveQuery = resolve
        }),
    )
    const { loadFirst, isLoading } = useCursorPagination({
      query,
      getCursor: (item: any) => item.id,
    })

    const p1 = loadFirst()
    expect(isLoading.value).toBe(true)

    // Second call while loading should be no-op
    const p2 = loadFirst()
    expect(query).toHaveBeenCalledTimes(1)

    resolveQuery!({ data: [], error: null })
    await p1
    await p2
    expect(isLoading.value).toBe(false)
  })

  it('defaults pageSize to 20', async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ id: String(i), ts: String(i) }))
    const query = createMockQuery([items])
    const { loadFirst, hasMore } = useCursorPagination({
      query,
      getCursor: (item: any) => item.ts,
    })

    await loadFirst()
    expect(hasMore.value).toBe(true) // 20 = default pageSize, might be more
  })
})
