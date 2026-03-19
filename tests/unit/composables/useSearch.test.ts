import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

// ── $fetch mock ──────────────────────────────────────────────────────────────

let mockFetchResult: unknown

vi.stubGlobal(
  '$fetch',
  vi.fn(async () => mockFetchResult),
)

import { useSearch } from '~/composables/useSearch'

// ── Test data ────────────────────────────────────────────────────────────────

const mockSearchResponse = {
  results: [
    {
      id: 'v-1',
      slug: 'volvo-fh-2024',
      brand: 'Volvo',
      model: 'FH 500',
      year: 2024,
      price: 85000,
      location: 'Madrid',
      location_province: 'Madrid',
      location_country: 'ES',
      category_id: 'cat-1',
      dealer_id: 'dealer-1',
      created_at: '2026-01-01T00:00:00Z',
      rank: 1,
    },
  ],
  next_cursor: null,
  total_estimate: 1,
  query: 'volvo',
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useSearch (F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockFetchResult = mockSearchResponse
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with empty results', () => {
      const { results, query, loading, error } = useSearch()
      expect(results.value).toEqual([])
      expect(query.value).toBe('')
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('has correct default hasMore', () => {
      const { hasMore } = useSearch()
      expect(hasMore.value).toBe(false)
    })
  })

  describe('executeSearch', () => {
    it('fetches results from server', async () => {
      const { executeSearch, results, totalEstimate } = useSearch()
      await executeSearch()

      expect(results.value).toHaveLength(1)
      expect(results.value[0].brand).toBe('Volvo')
      expect(totalEstimate.value).toBe(1)
    })

    it('manages loading state', async () => {
      const { executeSearch, loading } = useSearch()
      expect(loading.value).toBe(false)

      const p = executeSearch()
      expect(loading.value).toBe(true)

      await p
      expect(loading.value).toBe(false)
    })

    it('sets error on failure', async () => {
      vi.mocked(globalThis.$fetch).mockRejectedValueOnce(new Error('Network error'))

      const { executeSearch, error, results } = useSearch()
      await executeSearch()

      expect(error.value).toBe('Network error')
      expect(results.value).toEqual([])
    })

    it('appends results when append=true', async () => {
      const { executeSearch, results } = useSearch()
      await executeSearch()
      expect(results.value).toHaveLength(1)

      mockFetchResult = {
        ...mockSearchResponse,
        results: [{ ...mockSearchResponse.results[0], id: 'v-2' }],
      }

      await executeSearch(true)
      expect(results.value).toHaveLength(2)
    })
  })

  describe('setQuery', () => {
    it('debounces search execution', async () => {
      const { setQuery } = useSearch({ debounceMs: 200 })

      setQuery('vol')
      setQuery('volv')
      setQuery('volvo')

      // Not yet executed
      expect(vi.mocked(globalThis.$fetch)).not.toHaveBeenCalled()

      // Advance past debounce
      await vi.advanceTimersByTimeAsync(200)

      expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledTimes(1)
    })

    it('updates query ref', () => {
      const { setQuery, query } = useSearch()
      setQuery('test')
      expect(query.value).toBe('test')
    })
  })

  describe('setFilters', () => {
    it('triggers immediate search with filters', async () => {
      const { setFilters } = useSearch()
      await setFilters({ category_id: 'cat-1', price_min: 5000 })

      expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledTimes(1)
      const url = vi.mocked(globalThis.$fetch).mock.calls[0][0] as string
      expect(url).toContain('category_id=cat-1')
      expect(url).toContain('price_min=5000')
    })

    it('merges with existing filters', async () => {
      const { setFilters, filters } = useSearch()
      await setFilters({ category_id: 'cat-1' })
      await setFilters({ price_min: 1000 })

      expect(filters.value.category_id).toBe('cat-1')
      expect(filters.value.price_min).toBe(1000)
    })
  })

  describe('loadMore', () => {
    it('appends when hasMore is true', async () => {
      mockFetchResult = { ...mockSearchResponse, next_cursor: 'cursor-123' }
      const { executeSearch, loadMore, hasMore } = useSearch()
      await executeSearch()

      expect(hasMore.value).toBe(true)

      mockFetchResult = { ...mockSearchResponse, next_cursor: null }
      await loadMore()

      expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledTimes(2)
    })

    it('does nothing when hasMore is false', async () => {
      const { executeSearch, loadMore } = useSearch()
      await executeSearch()

      await loadMore()
      // Only the initial search, loadMore didn't fire
      expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledTimes(1)
    })
  })

  describe('reset', () => {
    it('clears all state', async () => {
      const { executeSearch, reset, results, query, totalEstimate, error } = useSearch()
      await executeSearch()

      reset()

      expect(results.value).toEqual([])
      expect(query.value).toBe('')
      expect(totalEstimate.value).toBe(0)
      expect(error.value).toBeNull()
    })
  })
})
