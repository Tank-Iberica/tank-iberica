import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRevenueMetrics } from '../../app/composables/useRevenueMetrics'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'gte', 'lte', 'select', 'order', 'limit'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(),
    }),
  }))
  vi.stubGlobal('useI18n', () => ({ locale: { value: 'es' } }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('channelRevenue starts as empty array', () => {
    const c = useRevenueMetrics()
    expect(c.channelRevenue.value).toHaveLength(0)
  })

  it('mrr starts as 0', () => {
    const c = useRevenueMetrics()
    expect(c.mrr.value).toBe(0)
  })

  it('arr starts as 0', () => {
    const c = useRevenueMetrics()
    expect(c.arr.value).toBe(0)
  })

  it('monthlyEvolution starts as empty array', () => {
    const c = useRevenueMetrics()
    expect(c.monthlyEvolution.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useRevenueMetrics()
    expect(c.loading.value).toBe(false)
  })

  it('leadMetrics starts with zero totals', () => {
    const c = useRevenueMetrics()
    expect(c.leadMetrics.value.totalLeads).toBe(0)
    expect(c.leadMetrics.value.totalValue).toBe(0)
  })

  it('exposes 5 channels', () => {
    const c = useRevenueMetrics()
    expect(c.channels).toHaveLength(5)
  })
})

// ─── channelLabel ─────────────────────────────────────────────────────────────

describe('channelLabel', () => {
  it('returns es label by default', () => {
    const c = useRevenueMetrics()
    const ch = { key: 'subscription', label_es: 'Suscripciones', label_en: 'Subscriptions' }
    expect(c.channelLabel(ch)).toBe('Suscripciones')
  })

  it('returns en label when locale is en', () => {
    vi.stubGlobal('useI18n', () => ({ locale: { value: 'en' } }))
    const c = useRevenueMetrics()
    const ch = { key: 'subscription', label_es: 'Suscripciones', label_en: 'Subscriptions' }
    expect(c.channelLabel(ch)).toBe('Subscriptions')
  })
})

// ─── fetchRevenueByChannel ────────────────────────────────────────────────────

describe('fetchRevenueByChannel', () => {
  it('sets channelRevenue from payment data', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([
          { type: 'subscription', amount_cents: 2900 },
          { type: 'subscription', amount_cents: 2900 },
          { type: 'ad', amount_cents: 5000 },
        ]),
      }),
    }))
    const c = useRevenueMetrics()
    await c.fetchRevenueByChannel('2026-01-01', '2026-01-31')
    expect(c.channelRevenue.value.length).toBeGreaterThan(0)
  })

  it('keeps channelRevenue with 5 channels even when no data', async () => {
    const c = useRevenueMetrics()
    await c.fetchRevenueByChannel('2026-01-01', '2026-01-31')
    // All 5 channels should be represented
    expect(c.channelRevenue.value).toHaveLength(5)
  })

  it('calculates 0 percentage when total is 0', async () => {
    const c = useRevenueMetrics()
    await c.fetchRevenueByChannel('2026-01-01', '2026-01-31')
    for (const ch of c.channelRevenue.value) {
      expect(ch.percentage).toBe(0)
    }
  })
})

// ─── fetchMRR ─────────────────────────────────────────────────────────────────

describe('fetchMRR', () => {
  it('sets mrr and arr from subscription data', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([
          { price_cents: 2900 },
          { price_cents: 7900 },
        ]),
      }),
    }))
    const c = useRevenueMetrics()
    await c.fetchMRR()
    expect(c.mrr.value).toBeGreaterThan(0)
    expect(c.arr.value).toBeGreaterThan(0)
  })
})

// ─── loadAll ──────────────────────────────────────────────────────────────────

describe('loadAll', () => {
  it('sets loading to false after completion', async () => {
    const c = useRevenueMetrics()
    await c.loadAll()
    expect(c.loading.value).toBe(false)
  })
})
