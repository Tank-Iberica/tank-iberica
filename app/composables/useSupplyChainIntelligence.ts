/**
 * Supply chain intelligence composable (#49).
 *
 * Analyzes transaction graph to provide insights on:
 * - Flows by vehicle category
 * - Top recurring buyers
 * - Seasonal patterns
 * - Company type distribution
 */

export type CompanyType = 'dealer' | 'fleet' | 'rental' | 'leasing' | 'export' | 'end_user'

export interface TransactionRecord {
  id: string
  seller_id: string
  buyer_id: string
  vehicle_id: string | null
  vehicle_category: string | null
  price_range: string | null
  transaction_date: string
}

export interface CategoryFlow {
  category: string
  count: number
  avgPriceRange: string
}

export interface TopBuyer {
  buyer_id: string
  count: number
  categories: string[]
  lastTransaction: string
}

export interface SeasonalPattern {
  month: number
  count: number
  label: string
}

export interface SupplyChainSummary {
  totalTransactions: number
  uniqueSellers: number
  uniqueBuyers: number
  categoryFlows: CategoryFlow[]
  topBuyers: TopBuyer[]
  seasonalPatterns: SeasonalPattern[]
}

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

/**
 * Compute category flows from transactions.
 */
export function computeCategoryFlows(transactions: TransactionRecord[]): CategoryFlow[] {
  const catMap = new Map<string, { count: number; priceRanges: string[] }>()

  for (const tx of transactions) {
    const cat = tx.vehicle_category || 'unknown'
    const existing = catMap.get(cat) || { count: 0, priceRanges: [] }
    existing.count++
    if (tx.price_range) existing.priceRanges.push(tx.price_range)
    catMap.set(cat, existing)
  }

  return Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgPriceRange: mostCommon(data.priceRanges) || 'unknown',
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Find top recurring buyers.
 */
export function computeTopBuyers(transactions: TransactionRecord[], limit = 10): TopBuyer[] {
  const buyerMap = new Map<
    string,
    {
      count: number
      categories: Set<string>
      lastTransaction: string
    }
  >()

  for (const tx of transactions) {
    const existing = buyerMap.get(tx.buyer_id) || {
      count: 0,
      categories: new Set<string>(),
      lastTransaction: '',
    }
    existing.count++
    if (tx.vehicle_category) existing.categories.add(tx.vehicle_category)
    if (tx.transaction_date > existing.lastTransaction) {
      existing.lastTransaction = tx.transaction_date
    }
    buyerMap.set(tx.buyer_id, existing)
  }

  return Array.from(buyerMap.entries())
    .map(([buyer_id, data]) => ({
      buyer_id,
      count: data.count,
      categories: Array.from(data.categories),
      lastTransaction: data.lastTransaction,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Detect seasonal patterns (transactions per month).
 */
export function computeSeasonalPatterns(transactions: TransactionRecord[]): SeasonalPattern[] {
  const monthCounts = Array.from({ length: 12 }).fill(0) as number[]

  for (const tx of transactions) {
    const date = new Date(tx.transaction_date)
    if (!Number.isNaN(date.getTime())) {
      monthCounts[date.getMonth()] = (monthCounts[date.getMonth()] ?? 0) + 1
    }
  }

  return monthCounts.map((count, i) => ({
    month: i + 1,
    count,
    label: MONTH_LABELS[i]!,
  }))
}

/**
 * Build full supply chain summary.
 */
export function buildSupplyChainSummary(transactions: TransactionRecord[]): SupplyChainSummary {
  const sellers = new Set(transactions.map((t) => t.seller_id))
  const buyers = new Set(transactions.map((t) => t.buyer_id))

  return {
    totalTransactions: transactions.length,
    uniqueSellers: sellers.size,
    uniqueBuyers: buyers.size,
    categoryFlows: computeCategoryFlows(transactions),
    topBuyers: computeTopBuyers(transactions),
    seasonalPatterns: computeSeasonalPatterns(transactions),
  }
}

/** Helper: most common value in array */
function mostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null
  const freq = new Map<string, number>()
  for (const v of arr) {
    freq.set(v, (freq.get(v) || 0) + 1)
  }
  let best = ''
  let bestCount = 0
  for (const [v, c] of freq) {
    if (c > bestCount) {
      best = v
      bestCount = c
    }
  }
  return best
}

export { mostCommon }

/**
 * Composable for supply chain intelligence.
 */
export function useSupplyChainIntelligence() {
  const supabase = useSupabaseClient()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const transactions = ref<TransactionRecord[]>([])
  const summary = ref<SupplyChainSummary | null>(null)

  /**
   * Fetch transactions with optional filters.
   */
  async function fetchTransactions(filters?: {
    category?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<TransactionRecord[]> {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('transaction_graph')
        .select(
          'id, seller_id, buyer_id, vehicle_id, vehicle_category, price_range, transaction_date',
        )
        .order('transaction_date', { ascending: false })

      if (filters?.category) {
        query = query.eq('vehicle_category', filters.category)
      }
      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo)
      }

      const { data, error: err } = await query

      if (err) throw err

      transactions.value = (data ?? []) as unknown as TransactionRecord[]
      summary.value = buildSupplyChainSummary(transactions.value)
      return transactions.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading transactions'
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error,
    transactions: readonly(transactions),
    summary: readonly(summary),
    fetchTransactions,
  }
}
