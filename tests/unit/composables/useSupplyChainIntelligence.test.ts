import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

// ── Supabase mock ────────────────────────────────────────────────────────────

let mockQueryResult: { data: unknown[] | null; error: unknown }

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }
    chain.order.mockImplementation(() => Promise.resolve(mockQueryResult))
    return { from: vi.fn(() => chain) }
  }),
)

import {
  useSupplyChainIntelligence,
  computeCategoryFlows,
  computeTopBuyers,
  computeSeasonalPatterns,
  buildSupplyChainSummary,
  mostCommon,
  type TransactionRecord,
} from '~/composables/useSupplyChainIntelligence'

// ── Test data ────────────────────────────────────────────────────────────────

function makeTx(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: 'tx-1',
    seller_id: 'seller-1',
    buyer_id: 'buyer-1',
    vehicle_id: 'v-1',
    vehicle_category: 'tractora',
    price_range: '50k-100k',
    transaction_date: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

const sampleTransactions: TransactionRecord[] = [
  makeTx({
    id: 'tx-1',
    seller_id: 's1',
    buyer_id: 'b1',
    vehicle_category: 'tractora',
    price_range: '50k-100k',
    transaction_date: '2026-01-15T10:00:00Z',
  }),
  makeTx({
    id: 'tx-2',
    seller_id: 's1',
    buyer_id: 'b2',
    vehicle_category: 'tractora',
    price_range: '50k-100k',
    transaction_date: '2026-03-20T10:00:00Z',
  }),
  makeTx({
    id: 'tx-3',
    seller_id: 's2',
    buyer_id: 'b1',
    vehicle_category: 'semirremolque',
    price_range: '25k-50k',
    transaction_date: '2026-06-10T10:00:00Z',
  }),
  makeTx({
    id: 'tx-4',
    seller_id: 's2',
    buyer_id: 'b1',
    vehicle_category: 'tractora',
    price_range: '100k-250k',
    transaction_date: '2026-06-15T10:00:00Z',
  }),
  makeTx({
    id: 'tx-5',
    seller_id: 's3',
    buyer_id: 'b3',
    vehicle_category: 'furgoneta',
    price_range: '10k-25k',
    transaction_date: '2026-01-20T10:00:00Z',
  }),
  makeTx({
    id: 'tx-6',
    seller_id: 's1',
    buyer_id: 'b1',
    vehicle_category: 'tractora',
    price_range: '50k-100k',
    transaction_date: '2026-12-01T10:00:00Z',
  }),
]

// ── Unit tests for pure functions ────────────────────────────────────────────

describe('computeCategoryFlows', () => {
  it('groups transactions by category', () => {
    const flows = computeCategoryFlows(sampleTransactions)

    expect(flows[0].category).toBe('tractora')
    expect(flows[0].count).toBe(4)
    expect(flows[1].category).toBe('semirremolque')
    expect(flows[1].count).toBe(1)
    expect(flows[2].category).toBe('furgoneta')
    expect(flows[2].count).toBe(1)
  })

  it('returns empty for no transactions', () => {
    expect(computeCategoryFlows([])).toEqual([])
  })

  it('computes most common price range', () => {
    const flows = computeCategoryFlows(sampleTransactions)
    expect(flows[0].avgPriceRange).toBe('50k-100k') // 3 out of 4 tractora
  })

  it('handles unknown category', () => {
    const txs = [makeTx({ vehicle_category: null })]
    const flows = computeCategoryFlows(txs)
    expect(flows[0].category).toBe('unknown')
  })
})

describe('computeTopBuyers', () => {
  it('ranks buyers by transaction count', () => {
    const buyers = computeTopBuyers(sampleTransactions)

    expect(buyers[0].buyer_id).toBe('b1')
    expect(buyers[0].count).toBe(4) // b1 has 4 transactions (tx-1, tx-3, tx-4, tx-6)
    expect(buyers[1].buyer_id).toBe('b2')
    expect(buyers[1].count).toBe(1)
  })

  it('tracks categories per buyer', () => {
    const buyers = computeTopBuyers(sampleTransactions)
    expect(buyers[0].categories).toContain('tractora')
    expect(buyers[0].categories).toContain('semirremolque')
  })

  it('tracks last transaction date', () => {
    const buyers = computeTopBuyers(sampleTransactions)
    expect(buyers[0].lastTransaction).toBe('2026-12-01T10:00:00Z')
  })

  it('respects limit', () => {
    const buyers = computeTopBuyers(sampleTransactions, 2)
    expect(buyers).toHaveLength(2)
  })

  it('returns empty for no transactions', () => {
    expect(computeTopBuyers([])).toEqual([])
  })
})

describe('computeSeasonalPatterns', () => {
  it('counts transactions per month', () => {
    const patterns = computeSeasonalPatterns(sampleTransactions)

    expect(patterns).toHaveLength(12)
    expect(patterns[0].month).toBe(1) // January
    expect(patterns[0].count).toBe(2) // 2 January transactions
    expect(patterns[0].label).toBe('Ene')
    expect(patterns[2].count).toBe(1) // March
    expect(patterns[5].count).toBe(2) // June
    expect(patterns[11].count).toBe(1) // December
  })

  it('returns all zeros for empty', () => {
    const patterns = computeSeasonalPatterns([])
    expect(patterns.every((p) => p.count === 0)).toBe(true)
  })

  it('handles invalid dates gracefully', () => {
    const txs = [makeTx({ transaction_date: 'invalid' })]
    const patterns = computeSeasonalPatterns(txs)
    expect(patterns.every((p) => p.count === 0)).toBe(true)
  })
})

describe('buildSupplyChainSummary', () => {
  it('builds complete summary', () => {
    const summary = buildSupplyChainSummary(sampleTransactions)

    expect(summary.totalTransactions).toBe(6)
    expect(summary.uniqueSellers).toBe(3) // s1, s2, s3
    expect(summary.uniqueBuyers).toBe(3) // b1, b2, b3
    expect(summary.categoryFlows.length).toBeGreaterThan(0)
    expect(summary.topBuyers.length).toBeGreaterThan(0)
    expect(summary.seasonalPatterns).toHaveLength(12)
  })

  it('handles empty transactions', () => {
    const summary = buildSupplyChainSummary([])

    expect(summary.totalTransactions).toBe(0)
    expect(summary.uniqueSellers).toBe(0)
    expect(summary.uniqueBuyers).toBe(0)
    expect(summary.categoryFlows).toEqual([])
    expect(summary.topBuyers).toEqual([])
  })
})

describe('mostCommon', () => {
  it('finds most common value', () => {
    expect(mostCommon(['a', 'b', 'a', 'c', 'a'])).toBe('a')
  })

  it('returns null for empty array', () => {
    expect(mostCommon([])).toBeNull()
  })

  it('returns first max if tie', () => {
    const result = mostCommon(['a', 'b'])
    expect(['a', 'b']).toContain(result)
  })
})

// ── Composable tests ─────────────────────────────────────────────────────────

describe('useSupplyChainIntelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: sampleTransactions, error: null }
  })

  it('fetches transactions and builds summary', async () => {
    const { fetchTransactions, transactions, summary } = useSupplyChainIntelligence()
    await fetchTransactions()

    expect(transactions.value).toHaveLength(6)
    expect(summary.value).toBeTruthy()
    expect(summary.value!.totalTransactions).toBe(6)
  })

  it('manages loading state', async () => {
    const { fetchTransactions, loading } = useSupplyChainIntelligence()

    expect(loading.value).toBe(false)
    const p = fetchTransactions()
    expect(loading.value).toBe(true)
    await p
    expect(loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    mockQueryResult = { data: null, error: new Error('DB error') }
    const { fetchTransactions, error } = useSupplyChainIntelligence()
    await fetchTransactions()
    expect(error.value).toBe('DB error')
  })

  it('returns empty on null data', async () => {
    mockQueryResult = { data: null, error: null }
    const { fetchTransactions, transactions } = useSupplyChainIntelligence()
    await fetchTransactions()
    expect(transactions.value).toEqual([])
  })
})
