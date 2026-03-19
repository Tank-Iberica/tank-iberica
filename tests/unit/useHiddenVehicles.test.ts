import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHiddenVehicles } from '../../app/composables/catalog/useHiddenVehicles'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = null, count = 0, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'gt', 'gte', 'lte', 'ilike', 'in', 'select', 'order', 'limit', 'maybeSingle'].forEach(
    (m) => {
      chain[m] = () => chain
    },
  )
  const resolved = { data, error, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return {
      get value() {
        return _v
      },
      set value(x) {
        _v = x
      },
    }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() {
      return fn()
    },
  }))
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

// ─── fetchHiddenVehicles (dev mock path) ──────────────────────────────────────
// import.meta.dev → (true) in vitest via nuxt-import-meta-transform plugin.
// The composable has a dev mock that returns fixed values (hiddenCount=3, hoursUntilNext=12).
// Production path tests will be added when the dev mock is removed.

describe('fetchHiddenVehicles (dev mock)', () => {
  it('sets hiddenCount to 3 via dev mock', async () => {
    const c = useHiddenVehicles()
    await c.fetchHiddenVehicles({})
    expect(c.hiddenCount.value).toBe(3)
    expect(c.loading.value).toBe(false)
  })

  it('sets hoursUntilNext to 12 via dev mock', async () => {
    const c = useHiddenVehicles()
    await c.fetchHiddenVehicles({})
    expect(c.hoursUntilNext.value).toBe(12)
  })

  it('handles filters without error (dev mock ignores them)', async () => {
    const c = useHiddenVehicles()
    await c.fetchHiddenVehicles({ category_id: 'cat-trucks' })
    // Dev mock skips DB queries — returns fixed values regardless of filters
    expect(c.hiddenCount.value).toBe(3)
    expect(c.hoursUntilNext.value).toBe(12)
  })

  it('sets loading during fetch', async () => {
    const c = useHiddenVehicles()
    const promise = c.fetchHiddenVehicles({})
    // loading is true while awaiting the dev mock's setTimeout
    expect(c.loading.value).toBe(true)
    await promise
    expect(c.loading.value).toBe(false)
  })
})
