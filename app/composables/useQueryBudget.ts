/**
 * useQueryBudget — Tracks Supabase queries per page load and warns when exceeding budget.
 *
 * Helps identify pages making too many DB queries (N+1, redundant fetches).
 * Only active in development mode.
 *
 * Backlog #138 — Query budget enforcement
 *
 * @example
 * const { trackQuery, getQueryCount, checkBudget } = useQueryBudget()
 * trackQuery('vehicles.select')
 * checkBudget() // warns if > MAX_QUERIES
 */

const MAX_QUERIES_PER_PAGE = 5
const QUERY_LOG_KEY = '__query_budget_log'

interface QueryLogEntry {
  label: string
  timestamp: number
}

/** Composable for query budget. */
export function useQueryBudget() {
  const queries = useState<QueryLogEntry[]>(QUERY_LOG_KEY, () => [])

  /** Track a query with an optional label */
  function trackQuery(label: string = 'unknown'): void {
    if (!import.meta.dev) return
    queries.value.push({ label, timestamp: Date.now() })
  }

  /** Get current query count for this page load */
  function getQueryCount(): number {
    return queries.value.length
  }

  /** Get all tracked queries */
  function getQueries(): QueryLogEntry[] {
    return queries.value
  }

  /**
   * Check if query budget is exceeded.
   * Logs a warning in development if count > MAX_QUERIES_PER_PAGE.
   * Returns true if within budget, false if exceeded.
   */
  function checkBudget(): boolean {
    if (!import.meta.dev) return true

    const count = queries.value.length
    if (count > MAX_QUERIES_PER_PAGE) {
      console.warn(
        `[QueryBudget] Page exceeded budget: ${count}/${MAX_QUERIES_PER_PAGE} queries`,
        queries.value.map((q) => q.label),
      )
      return false
    }
    return true
  }

  /** Reset query counter (call on route change) */
  function resetBudget(): void {
    queries.value = []
  }

  return {
    trackQuery,
    getQueryCount,
    getQueries,
    checkBudget,
    resetBudget,
    MAX_QUERIES_PER_PAGE,
  }
}
