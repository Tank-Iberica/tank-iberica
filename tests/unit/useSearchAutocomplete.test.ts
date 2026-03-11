import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))

vi.stubGlobal('$fetch', mockFetch)

// ── Import after mocks ─────────────────────────────────────────────────────────

import { useSearchAutocomplete } from '../../app/composables/useSearchAutocomplete'

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeResults(n = 2) {
  return Array.from({ length: n }, (_, i) => ({
    id: `v-${i}`,
    slug: `volvo-fh16-${i}`,
    brand: 'Volvo',
    model: 'FH16',
    year: 2020 + i,
    price: 45000 + i * 1000,
    location_province: 'Madrid',
    location_country: 'ES',
  }))
}

function makeApiResponse(n = 2) {
  return {
    results: makeResults(n),
    query: 'volvo',
    total_estimate: n,
    next_cursor: null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  mockFetch.mockResolvedValue(makeApiResponse())
})

afterEach(() => {
  vi.useRealTimers()
})

// ── Initial state ──────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('has empty query', () => {
    const { query } = useSearchAutocomplete()
    expect(query.value).toBe('')
  })

  it('has empty results', () => {
    const { results } = useSearchAutocomplete()
    expect(results.value).toEqual([])
  })

  it('is not loading', () => {
    const { isLoading } = useSearchAutocomplete()
    expect(isLoading.value).toBe(false)
  })

  it('is not open', () => {
    const { isOpen } = useSearchAutocomplete()
    expect(isOpen.value).toBe(false)
  })
})

// ── clear() ───────────────────────────────────────────────────────────────────

describe('clear()', () => {
  it('resets query, results, isOpen, isLoading', async () => {
    const { query, results, isOpen, isLoading, clear } = useSearchAutocomplete()
    query.value = 'test'
    results.value = makeResults(2)
    isOpen.value = true
    isLoading.value = true

    clear()

    expect(query.value).toBe('')
    expect(results.value).toEqual([])
    expect(isOpen.value).toBe(false)
    expect(isLoading.value).toBe(false)
  })
})

// ── close() ───────────────────────────────────────────────────────────────────

describe('close()', () => {
  it('sets isOpen to false', () => {
    const { isOpen, close } = useSearchAutocomplete()
    isOpen.value = true
    close()
    expect(isOpen.value).toBe(false)
  })

  it('does not affect query or results', () => {
    const { query, results, close } = useSearchAutocomplete()
    query.value = 'test'
    results.value = makeResults(1)
    close()
    expect(query.value).toBe('test')
    expect(results.value).toHaveLength(1)
  })
})

// ── Debounce behavior ─────────────────────────────────────────────────────────

describe('debounce behavior', () => {
  it('sets isLoading true immediately when query changes (length >= 2)', async () => {
    const { query, isLoading } = useSearchAutocomplete()

    query.value = 'vo'
    await nextTick() // flush Vue scheduler
    expect(isLoading.value).toBe(true)
    // Advance timer but don't resolve fetch yet
  })

  it('calls $fetch after 300ms debounce', async () => {
    const { query } = useSearchAutocomplete()

    query.value = 'volvo'
    await nextTick() // flush Vue scheduler

    expect(mockFetch).not.toHaveBeenCalled()

    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({ query: expect.objectContaining({ q: 'volvo' }) }),
    )
  })

  it('calls $fetch with limit=5', async () => {
    const { query } = useSearchAutocomplete()
    query.value = 'man'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({ query: expect.objectContaining({ limit: '5' }) }),
    )
  })

  it('does NOT call $fetch before debounce window', async () => {
    const { query } = useSearchAutocomplete()
    query.value = 'man'
    await nextTick()
    vi.advanceTimersByTime(299)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('trims whitespace before calling $fetch', async () => {
    const { query } = useSearchAutocomplete()
    query.value = '  volvo  '
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({ query: expect.objectContaining({ q: 'volvo' }) }),
    )
  })

  it('does NOT call $fetch for queries shorter than 2 chars', async () => {
    const { query } = useSearchAutocomplete()
    query.value = 'v'
    await nextTick()
    await vi.runAllTimersAsync()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('clears results and closes when query is too short', async () => {
    const { query, results, isOpen } = useSearchAutocomplete()
    results.value = makeResults(2)
    isOpen.value = true

    query.value = 'v'
    await nextTick()

    expect(results.value).toEqual([])
    expect(isOpen.value).toBe(false)
  })

  it('debounces rapid typing — only one fetch at end', async () => {
    const { query } = useSearchAutocomplete()

    query.value = 'v'
    await nextTick()
    vi.advanceTimersByTime(100)

    query.value = 'vo'
    await nextTick()
    vi.advanceTimersByTime(100)

    query.value = 'vol'
    await nextTick()
    vi.advanceTimersByTime(100)

    query.value = 'volvo'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// ── Successful fetch ───────────────────────────────────────────────────────────

describe('successful fetch', () => {
  it('populates results from API response', async () => {
    mockFetch.mockResolvedValue(makeApiResponse(3))
    const { query, results } = useSearchAutocomplete()

    query.value = 'volvo'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(results.value).toHaveLength(3)
    expect(results.value[0].brand).toBe('Volvo')
  })

  it('sets isOpen to true when results are returned', async () => {
    const { query, isOpen } = useSearchAutocomplete()

    query.value = 'volvo'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(isOpen.value).toBe(true)
  })

  it('sets isLoading to false after fetch', async () => {
    const { query, isLoading } = useSearchAutocomplete()

    query.value = 'volvo'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(isLoading.value).toBe(false)
  })

  it('truncates results to MAX 5 even if API returns more', async () => {
    mockFetch.mockResolvedValue(makeApiResponse(10))
    const { query, results } = useSearchAutocomplete()

    query.value = 'man'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(results.value).toHaveLength(5)
  })
})

// ── Failed fetch ───────────────────────────────────────────────────────────────

describe('failed fetch', () => {
  it('clears results and closes on $fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const { query, results, isOpen } = useSearchAutocomplete()

    query.value = 'volvo'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(results.value).toEqual([])
    expect(isOpen.value).toBe(false)
  })

  it('sets isLoading to false after error', async () => {
    mockFetch.mockRejectedValue(new Error('Timeout'))
    const { query, isLoading } = useSearchAutocomplete()

    query.value = 'volvo'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(isLoading.value).toBe(false)
  })

  it('sets isOpen to false when no results', async () => {
    mockFetch.mockResolvedValue({ results: [], query: '', total_estimate: 0, next_cursor: null })
    const { query, isOpen } = useSearchAutocomplete()

    query.value = 'xyznotfound'
    await nextTick()
    await vi.runAllTimersAsync()

    expect(isOpen.value).toBe(false)
  })
})
