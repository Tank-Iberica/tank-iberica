import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref as vueRef, computed as vueComputed } from 'vue'
import type { SearchAnalyticsData } from '../../app/composables/admin/useAdminSearchAnalytics'

// ─── Override global stubs with real Vue reactivity ───────────────────────────

let originalRef: unknown
let originalComputed: unknown

beforeEach(() => {
  originalRef = globalThis.ref
  originalComputed = globalThis.computed
  vi.stubGlobal('ref', vueRef)
  vi.stubGlobal('computed', vueComputed)
})

afterEach(() => {
  vi.stubGlobal('ref', originalRef)
  vi.stubGlobal('computed', originalComputed)
})

// ─── Mock $fetch ──────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ─── Sample Data ──────────────────────────────────────────────────────────────

function sampleData(overrides?: Partial<SearchAnalyticsData>): SearchAnalyticsData {
  return {
    period: { days: 30, since: '2026-02-16T00:00:00Z' },
    summary: {
      totalSearches: 500,
      zeroResultSearches: 75,
      zeroResultRate: 15,
    },
    topZeroResults: Array.from({ length: 15 }, (_, i) => ({
      query: `query-${i + 1}`,
      count: 15 - i,
      lastSeen: `2026-03-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
      filters: null,
    })),
    dailyTrend: [
      { date: '2026-03-01', total: 20, zeroResults: 3 },
      { date: '2026-03-02', total: 25, zeroResults: 5 },
    ],
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// Must import AFTER stubs are set up
async function getComposable() {
  const mod = await import('../../app/composables/admin/useAdminSearchAnalytics')
  return mod.useAdminSearchAnalytics()
}

describe('useAdminSearchAnalytics', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(sampleData())
    vi.stubGlobal('ref', vueRef)
    vi.stubGlobal('computed', vueComputed)
  })

  // 1. Initial state
  it('starts with loading=false and no data', async () => {
    const c = await getComposable()
    expect(c.loading.value).toBe(false)
    expect(c.data.value).toBeNull()
    expect(c.error.value).toBeNull()
  })

  // 2. fetchAnalytics calls $fetch
  it('calls $fetch with correct endpoint and params', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/search-analytics', {
      params: { days: 30, limit: 20 },
    })
  })

  // 3. fetchAnalytics populates data
  it('populates data after successful fetch', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.data.value).not.toBeNull()
    expect(c.data.value!.summary.totalSearches).toBe(500)
  })

  // 4. summary defaults
  it('summary defaults to zeroes when no data', async () => {
    const c = await getComposable()
    expect(c.summary.value).toEqual({ totalSearches: 0, zeroResultSearches: 0, zeroResultRate: 0 })
  })

  // 5. summary reflects fetched data
  it('summary reflects fetched data', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.summary.value.totalSearches).toBe(500)
    expect(c.summary.value.zeroResultSearches).toBe(75)
    expect(c.summary.value.zeroResultRate).toBe(15)
  })

  // 6. topZeroResults
  it('topZeroResults returns all entries', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.topZeroResults.value).toHaveLength(15)
    expect(c.topZeroResults.value[0].query).toBe('query-1')
  })

  // 7. Pagination page 1
  it('paginatedZeroResults returns first page (10 items)', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.page.value).toBe(1)
    expect(c.paginatedZeroResults.value).toHaveLength(10)
    expect(c.paginatedZeroResults.value[0].query).toBe('query-1')
  })

  // 8. Pagination page 2
  it('paginatedZeroResults shows remaining items on page 2', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    c.goToPage(2)
    expect(c.paginatedZeroResults.value).toHaveLength(5)
    expect(c.paginatedZeroResults.value[0].query).toBe('query-11')
  })

  // 9. totalPages
  it('totalPages computes correctly', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.totalPages.value).toBe(2)
  })

  // 10. goToPage clamping
  it('goToPage clamps to valid range', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    c.goToPage(0)
    expect(c.page.value).toBe(1)
    c.goToPage(999)
    expect(c.page.value).toBe(2)
  })

  // 11. setDays
  it('setDays re-fetches with new day count', async () => {
    const c = await getComposable()
    c.setDays(7)
    expect(c.days.value).toBe(7)
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/search-analytics', {
      params: { days: 7, limit: 20 },
    })
  })

  // 12. setDays clamping
  it('setDays clamps to 1-90 range', async () => {
    const c = await getComposable()
    c.setDays(0)
    expect(c.days.value).toBe(1)
    c.setDays(200)
    expect(c.days.value).toBe(90)
  })

  // 13. dailyTrend
  it('dailyTrend returns daily data', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.dailyTrend.value).toHaveLength(2)
    expect(c.dailyTrend.value[0].date).toBe('2026-03-01')
  })

  // 14. Error handling
  it('captures error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.error.value).toBe('Network error')
    expect(c.loading.value).toBe(false)
  })

  // 15. fetchAnalytics resets page
  it('fetchAnalytics resets page to 1', async () => {
    const c = await getComposable()
    await c.fetchAnalytics()
    c.goToPage(2)
    expect(c.page.value).toBe(2)
    await c.fetchAnalytics()
    expect(c.page.value).toBe(1)
  })

  // 16. Empty list
  it('handles empty zero-result list', async () => {
    mockFetch.mockResolvedValue(sampleData({ topZeroResults: [] }))
    const c = await getComposable()
    await c.fetchAnalytics()
    expect(c.paginatedZeroResults.value).toHaveLength(0)
    expect(c.totalPages.value).toBe(1)
  })

  // 17. pageSize constant
  it('pageSize is 10', async () => {
    const c = await getComposable()
    expect(c.pageSize).toBe(10)
  })
})
