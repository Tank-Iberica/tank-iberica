/**
 * useQueryCostEstimation — Dev-mode query cost estimator.
 *
 * Wraps Supabase queries to warn about potentially expensive operations:
 * - Queries without filters on large tables
 * - Missing index hints (select * without eq/in/match)
 * - Large limit values
 *
 * Only active in development mode. Zero overhead in production.
 *
 * Backlog N69 — Query cost estimation dev mode
 *
 * @example
 * const { estimateCost, warnExpensiveQuery } = useQueryCostEstimation()
 * warnExpensiveQuery('vehicles', { hasFilter: false, limit: 1000 })
 */

const LARGE_TABLE_THRESHOLD = 10_000
const EXPENSIVE_LIMIT_THRESHOLD = 500

/** Tables known to be large (> 10K rows expected in production) */
const LARGE_TABLES = [
  'vehicles',
  'analytics_events',
  'search_logs',
  'leads',
  'messages',
  'web_vitals',
] as const

type LargeTable = (typeof LARGE_TABLES)[number]

interface QueryCostEstimate {
  table: string
  isLargeTable: boolean
  hasFilter: boolean
  limit: number
  estimatedCost: 'low' | 'medium' | 'high'
  warnings: string[]
}

/**
 * Dev-mode query cost estimator that warns about expensive operations.
 * @returns Methods to estimate query cost and check for expensive patterns
 */
export function useQueryCostEstimation() {
  /**
   * Estimate the cost of a query based on table size and query shape.
   */
  function estimateCost(
    table: string,
    options: { hasFilter?: boolean; limit?: number; hasIndex?: boolean } = {},
  ): QueryCostEstimate {
    const { hasFilter = true, limit = 100, hasIndex = true } = options

    const isLargeTable = LARGE_TABLES.includes(table as LargeTable)
    const warnings: string[] = []

    // Determine cost
    let estimatedCost: QueryCostEstimate['estimatedCost'] = 'low'

    if (isLargeTable && !hasFilter) {
      estimatedCost = 'high'
      warnings.push(`Seq Scan likely on "${table}" (${LARGE_TABLE_THRESHOLD}+ rows) — add a filter`)
    }

    if (limit > EXPENSIVE_LIMIT_THRESHOLD) {
      if (estimatedCost !== 'high') estimatedCost = 'medium'
      warnings.push(`Large LIMIT (${limit}) — consider pagination`)
    }

    if (isLargeTable && !hasIndex) {
      estimatedCost = 'high'
      warnings.push(`No index hint on large table "${table}" — consider adding .eq()/.in()/.match()`)
    }

    return { table, isLargeTable, hasFilter, limit, estimatedCost, warnings }
  }

  /**
   * Log a warning if a query looks expensive. Only runs in dev mode.
   */
  function warnExpensiveQuery(
    table: string,
    options: { hasFilter?: boolean; limit?: number; hasIndex?: boolean } = {},
  ): QueryCostEstimate {
    const estimate = estimateCost(table, options)

    if (import.meta.dev && estimate.warnings.length > 0) {
      console.warn(
        `[QueryCost] ⚠️ ${estimate.estimatedCost.toUpperCase()} cost query on "${table}":`,
        estimate.warnings.join('; '),
      )
    }

    return estimate
  }

  return {
    estimateCost,
    warnExpensiveQuery,
    LARGE_TABLES,
    LARGE_TABLE_THRESHOLD,
    EXPENSIVE_LIMIT_THRESHOLD,
  }
}
