/**
 * Cursor-based pagination utility for Supabase queries.
 *
 * Instead of OFFSET (which re-scans skipped rows), this uses a cursor
 * based on a sort column (e.g. created_at, id) + direction.
 * More efficient for large datasets — O(1) vs O(n) for offset.
 *
 * Usage:
 *   const { items, loadMore, hasMore, isLoading, reset } = useCursorPagination({
 *     query: (cursor) => supabase.from('vehicles')
 *       .select('id, title, created_at')
 *       .eq('status', 'published')
 *       .order('created_at', { ascending: false })
 *       .lt('created_at', cursor || new Date().toISOString())
 *       .limit(20),
 *     getCursor: (item) => item.created_at,
 *     pageSize: 20,
 *   })
 */

export interface CursorPaginationOptions<T> {
  /** Function that builds the Supabase query with cursor applied. Null cursor = first page. */
  query: (
    cursor: string | null,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
  /** Extract cursor value from last item in page */
  getCursor: (item: T) => string
  /** Number of items per page */
  pageSize?: number
}

export interface CursorPaginationReturn<T> {
  items: Ref<T[]>
  cursor: Ref<string | null>
  hasMore: Ref<boolean>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  loadMore: () => Promise<void>
  reset: () => void
  loadFirst: () => Promise<void>
}

/** Cursor-based pagination for Supabase queries. */
export function useCursorPagination<T>(
  options: CursorPaginationOptions<T>,
): CursorPaginationReturn<T> {
  const pageSize = options.pageSize ?? 20

  const items = ref<T[]>([]) as Ref<T[]>
  const cursor = ref<string | null>(null)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadPage(isFirstPage: boolean) {
    if (isLoading.value) return
    isLoading.value = true
    error.value = null

    try {
      const result = await options.query(isFirstPage ? null : cursor.value)
      if (result.error) {
        error.value = result.error.message || 'Query error'
        return
      }

      const data = result.data ?? []

      if (isFirstPage) {
        items.value = data
      } else {
        items.value = [...items.value, ...data]
      }

      // If we got fewer items than pageSize, there are no more pages
      hasMore.value = data.length >= pageSize

      // Update cursor to the last item
      if (data.length) {
        cursor.value = options.getCursor(data.at(-1)!)
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Unexpected error'
    } finally {
      isLoading.value = false
    }
  }

  async function loadFirst() {
    cursor.value = null
    hasMore.value = true
    await loadPage(true)
  }

  async function loadMore() {
    if (!hasMore.value) return
    await loadPage(false)
  }

  function reset() {
    items.value = []
    cursor.value = null
    hasMore.value = true
    isLoading.value = false
    error.value = null
  }

  return {
    items,
    cursor,
    hasMore,
    isLoading,
    error,
    loadMore,
    reset,
    loadFirst,
  }
}
