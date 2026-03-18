/**
 * Composable for admin search analytics page.
 * Fetches search data from /api/admin/search-analytics and provides
 * filtering, pagination, and computed metrics.
 */

export interface ZeroResultEntry {
  query: string
  count: number
  lastSeen: string
  filters: unknown
}

export interface DailyTrend {
  date: string
  total: number
  zeroResults: number
}

export interface SearchAnalyticsSummary {
  totalSearches: number
  zeroResultSearches: number
  zeroResultRate: number
}

export interface SearchAnalyticsData {
  period: { days: number; since: string }
  summary: SearchAnalyticsSummary
  topZeroResults: ZeroResultEntry[]
  dailyTrend: DailyTrend[]
}

/** Composable for admin search analytics. */
export function useAdminSearchAnalytics() {
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<SearchAnalyticsData | null>(null)
  const days = ref(30)
  const limit = ref(20)

  // Pagination
  const page = ref(1)
  const pageSize = 10

  const summary = computed<SearchAnalyticsSummary>(() => {
    return data.value?.summary ?? { totalSearches: 0, zeroResultSearches: 0, zeroResultRate: 0 }
  })

  const topZeroResults = computed<ZeroResultEntry[]>(() => {
    return data.value?.topZeroResults ?? []
  })

  const paginatedZeroResults = computed<ZeroResultEntry[]>(() => {
    const start = (page.value - 1) * pageSize
    return topZeroResults.value.slice(start, start + pageSize)
  })

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(topZeroResults.value.length / pageSize))
  })

  const dailyTrend = computed<DailyTrend[]>(() => {
    return data.value?.dailyTrend ?? []
  })

  const periodLabel = computed(() => {
    if (!data.value) return ''
    const since = new Date(data.value.period.since)
    return `${since.toLocaleDateString()} — ${t('common.today', 'Hoy')}`
  })

  async function fetchAnalytics(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await $fetch<SearchAnalyticsData>('/api/admin/search-analytics', {
        params: { days: days.value, limit: limit.value },
      })
      data.value = result
      page.value = 1
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('common.error', 'Error')
    } finally {
      loading.value = false
    }
  }

  function setDays(newDays: number): void {
    days.value = Math.min(90, Math.max(1, newDays))
    fetchAnalytics()
  }

  function goToPage(p: number): void {
    page.value = Math.min(totalPages.value, Math.max(1, p))
  }

  return {
    // State
    loading,
    error,
    data,
    days,
    limit,
    page,
    pageSize,

    // Computed
    summary,
    topZeroResults,
    paginatedZeroResults,
    totalPages,
    dailyTrend,
    periodLabel,

    // Actions
    fetchAnalytics,
    setDays,
    goToPage,
  }
}
