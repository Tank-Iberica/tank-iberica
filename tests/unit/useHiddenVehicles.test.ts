import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHiddenVehicles } from '../../app/composables/catalog/useHiddenVehicles'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = null, count = 0, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'gt', 'gte', 'lte', 'ilike', 'in', 'select', 'order', 'limit', 'maybeSingle'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain(null, 0),
  }))
  // Override import.meta.dev to false so we test the real path
  Object.defineProperty(globalThis, 'import', {
    value: { meta: { dev: false } },
    writable: true,
    configurable: true,
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('hiddenCount starts as 0', () => {
    const c = useHiddenVehicles()
    expect(c.hiddenCount.value).toBe(0)
  })

  it('hoursUntilNext starts as null', () => {
    const c = useHiddenVehicles()
    expect(c.hoursUntilNext.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useHiddenVehicles()
    expect(c.loading.value).toBe(false)
  })

  it('showHidden starts as false (count=0)', () => {
    const c = useHiddenVehicles()
    expect(c.showHidden.value).toBe(false)
  })
})

// ─── showHidden computed ───────────────────────────────────────────────────────

describe('showHidden', () => {
  it('is true when hiddenCount > 0 and not loading', () => {
    const c = useHiddenVehicles()
    c.hiddenCount.value = 3
    c.loading.value = false
    expect(c.showHidden.value).toBe(true)
  })

  it('is false when loading even with hiddenCount > 0', () => {
    const c = useHiddenVehicles()
    c.hiddenCount.value = 3
    c.loading.value = true
    expect(c.showHidden.value).toBe(false)
  })

  it('is false when hiddenCount is 0', () => {
    const c = useHiddenVehicles()
    c.hiddenCount.value = 0
    expect(c.showHidden.value).toBe(false)
  })
})

// ─── fetchHiddenVehicles (production path) ────────────────────────────────────

describe('fetchHiddenVehicles in production mode', () => {
  it('sets hiddenCount from DB count', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, 5),
    }))
    const c = useHiddenVehicles()
    await c.fetchHiddenVehicles({})
    expect(c.hiddenCount.value).toBe(5)
    expect(c.loading.value).toBe(false)
  })

  it('sets hiddenCount to 0 on error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, 0, { message: 'DB error' }),
    }))
    const c = useHiddenVehicles()
    await c.fetchHiddenVehicles({})
    expect(c.hiddenCount.value).toBe(0)
    expect(c.loading.value).toBe(false)
  })

  it('sets hoursUntilNext from earliest visible_from', async () => {
    const futureDate = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    let callCount = 0
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => {
        callCount++
        // First call: count query returns 3
        if (callCount === 1) return makeChain(null, 3)
        // Second call: earliest visible_from query
        const chain: Record<string, unknown> = {}
        ;['eq', 'gt', 'gte', 'lte', 'ilike', 'in', 'select', 'order', 'limit'].forEach((m) => { chain[m] = () => chain })
        chain.maybeSingle = () => Promise.resolve({ data: { visible_from: futureDate }, error: null })
        return chain
      },
    }))
    const c = useHiddenVehicles()
    await c.fetchHiddenVehicles({})
    expect(c.hiddenCount.value).toBe(3)
    // hoursUntilNext should be approximately 12 (±1)
    expect(c.hoursUntilNext.value).toBeGreaterThanOrEqual(11)
    expect(c.hoursUntilNext.value).toBeLessThanOrEqual(13)
  })

  it('applies category_id filter', async () => {
    const eqMock = vi.fn().mockReturnThis()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => {
        const chain: Record<string, unknown> = {}
        chain.select = () => chain
        chain.eq = eqMock
        chain.gt = () => chain
        chain.gte = () => chain
        chain.lte = () => chain
        chain.ilike = () => chain
        chain.in = () => chain
        chain.order = () => chain
        chain.limit = () => chain
        chain.maybeSingle = () => Promise.resolve({ data: null, error: null })
        const resolved = { data: null, error: null, count: 0 }
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
        chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
        return chain
      },
    }))
    const c = useHiddenVehicles()
    await c.fetchHiddenVehicles({ category_id: 'cat-trucks' })
    expect(eqMock).toHaveBeenCalledWith('category_id', 'cat-trucks')
  })
})
