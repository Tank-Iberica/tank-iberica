import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminSubscriptions, SUBSCRIPTION_PREFS } from '../../app/composables/admin/useAdminSubscriptions'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'ilike', 'order', 'range', 'delete']

function makeChain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeSub(overrides: Record<string, unknown> = {}) {
  return {
    id: 's-1',
    email: 'user@example.com',
    pref_web: true,
    pref_press: false,
    pref_newsletter: true,
    pref_featured: false,
    pref_events: false,
    pref_csr: false,
    created_at: '2026-01-01',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── SUBSCRIPTION_PREFS constant ──────────────────────────────────────────

describe('SUBSCRIPTION_PREFS', () => {
  it('has 6 entries', () => {
    expect(SUBSCRIPTION_PREFS).toHaveLength(6)
  })

  it('contains pref keys for all preference types', () => {
    const keys = SUBSCRIPTION_PREFS.map((p) => p.key)
    expect(keys).toContain('pref_web')
    expect(keys).toContain('pref_newsletter')
    expect(keys).toContain('pref_events')
  })

  it('each entry has key, label, color', () => {
    for (const entry of SUBSCRIPTION_PREFS) {
      expect(entry).toHaveProperty('key')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('color')
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('subscriptions starts as empty array', () => {
    const c = useAdminSubscriptions()
    expect(c.subscriptions.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminSubscriptions()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminSubscriptions()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminSubscriptions()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminSubscriptions()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchSubscriptions ───────────────────────────────────────────────────

describe('fetchSubscriptions', () => {
  it('sets subscriptions and total on success', async () => {
    const sub = makeSub()
    mockFrom.mockReturnValue(makeChain({ data: [sub], error: null, count: 1 }))
    const c = useAdminSubscriptions()
    await c.fetchSubscriptions()
    expect(c.subscriptions.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error and empties subscriptions on failure (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' }, count: null }))
    const c = useAdminSubscriptions()
    await c.fetchSubscriptions()
    expect(c.error.value).toBe('Error fetching subscriptions')
    expect(c.subscriptions.value).toEqual([])
  })

  it('applies search filter (ilike)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminSubscriptions()
    await c.fetchSubscriptions({ search: 'gmail' })
    expect(chain.ilike).toHaveBeenCalledWith('email', '%gmail%')
  })

  it('defaults total to 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: null }))
    const c = useAdminSubscriptions()
    await c.fetchSubscriptions()
    expect(c.total.value).toBe(0)
  })
})

// ─── deleteSubscription ───────────────────────────────────────────────────

describe('deleteSubscription', () => {
  it('returns true and removes subscription from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminSubscriptions()
    c.subscriptions.value.push(makeSub({ id: 's-1' }) as never)
    c.subscriptions.value.push(makeSub({ id: 's-2' }) as never)
    c.total.value = 2
    const ok = await c.deleteSubscription('s-1')
    expect(ok).toBe(true)
    expect(c.subscriptions.value).toHaveLength(1)
    expect(c.subscriptions.value[0]!.id).toBe('s-2')
    expect(c.total.value).toBe(1)
  })

  it('returns false on error (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' } }))
    const c = useAdminSubscriptions()
    const ok = await c.deleteSubscription('s-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error deleting subscription')
  })

  it('saving is false after completion', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminSubscriptions()
    await c.deleteSubscription('s-1')
    expect(c.saving.value).toBe(false)
  })
})
