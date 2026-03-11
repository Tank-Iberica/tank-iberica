import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePrebid } from '../../app/composables/usePrebid'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'select'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset floor price cache between tests (module-level variable)
  vi.resetModules()
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { prebidEnabled: false, prebidTimeout: 1500 },
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain([]),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  }))
  vi.stubGlobal('useRoute', () => ({ fullPath: '/vehiculo/test' }))
  // pbjs not defined in test env
  delete (globalThis as Record<string, unknown>).pbjs
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('prebidWon starts as false', () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    expect(c.prebidWon.value).toBe(false)
  })

  it('winningBid starts as null', () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    expect(c.winningBid.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    expect(c.loading.value).toBe(false)
  })
})

// ─── isEnabled ────────────────────────────────────────────────────────────────

describe('isEnabled', () => {
  it('returns false when prebidEnabled is false', () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    expect(c.isEnabled.value).toBe(false)
  })

  it('returns true when prebidEnabled is true', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { prebidEnabled: true, prebidTimeout: 1500 },
    }))
    const c = usePrebid('listing_top', 'ad-slot-1')
    expect(c.isEnabled.value).toBe(true)
  })
})

// ─── requestBids ──────────────────────────────────────────────────────────────

describe('requestBids', () => {
  it('resolves with null when Prebid is disabled', async () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    const result = await c.requestBids()
    expect(result).toBeNull()
  })

  it('sets loading to false after disabled early return', async () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    await c.requestBids()
    expect(c.loading.value).toBe(false)
  })
})

// ─── renderWinningAd ──────────────────────────────────────────────────────────

describe('renderWinningAd', () => {
  it('does nothing when no winning bid', () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    const mockDoc = {} as Document
    expect(() => c.renderWinningAd(mockDoc)).not.toThrow()
  })
})

// ─── logRevenue ───────────────────────────────────────────────────────────────

describe('logRevenue', () => {
  it('does not throw when insert succeeds', async () => {
    const c = usePrebid('listing_top', 'ad-slot-1')
    await expect(c.logRevenue('adsense', null, 150)).resolves.toBeUndefined()
  })

  it('does not throw on insert failure (fire and forget)', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: () => Promise.reject(new Error('DB error')),
      }),
    }))
    const c = usePrebid('listing_top', 'ad-slot-1')
    await expect(c.logRevenue('adsense', 'bidder1', 200)).resolves.toBeUndefined()
  })

  it('inserts with null bidder when bidder is null', async () => {
    const insertFn = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: insertFn,
      }),
    }))
    const c = usePrebid('listing_top', 'ad-slot-1')
    await c.logRevenue('adsense', null, 150)
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({
      bidder: null,
      cpm_cents: 150,
      source: 'adsense',
      position: 'listing_top',
    }))
  })
})

// ─── requestBids — with pbjs mock ───────────────────────────────────────────

function setupPbjsMock(bids: Record<string, { bids: Array<{ adId: string; cpm: number; bidder: string; width: number; height: number; ad: string; statusMessage: string }> }> = {}) {
  const queCallbacks: Array<() => void> = []
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { prebidEnabled: true, prebidTimeout: 1500 },
  }))
  vi.stubGlobal('pbjs', {
    que: {
      push: (cb: () => void) => {
        queCallbacks.push(cb)
        // Execute immediately to simulate pbjs behavior
        cb()
      },
    },
    removeAdUnit: vi.fn(),
    addAdUnits: vi.fn(),
    requestBids: vi.fn().mockImplementation((opts: { bidsBackHandler: (r: unknown) => void }) => {
      opts.bidsBackHandler(bids)
    }),
    renderAd: vi.fn(),
  })
  return { queCallbacks }
}

describe('requestBids — with pbjs', () => {
  it('returns null when pbjs is not on globalThis', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { prebidEnabled: true, prebidTimeout: 1500 },
    }))
    delete (globalThis as Record<string, unknown>).pbjs
    const c = usePrebid('listing_top', 'ad-slot-1')
    const result = await c.requestBids()
    expect(result).toBeNull()
  })

  it('returns winning bid when bids are present', async () => {
    setupPbjsMock({
      'ad-slot-1': {
        bids: [
          { adId: 'ad-1', cpm: 2.50, bidder: 'appnexus', width: 300, height: 250, ad: '<ad/>', statusMessage: 'ok' },
          { adId: 'ad-2', cpm: 1.50, bidder: 'rubicon', width: 300, height: 250, ad: '<ad2/>', statusMessage: 'ok' },
        ],
      },
    })
    const c = usePrebid('listing_top', 'ad-slot-1')
    const result = await c.requestBids()
    expect(result).not.toBeNull()
    expect(result!.cpm).toBe(2.50) // highest CPM wins
    expect(result!.bidder).toBe('appnexus')
    expect(c.prebidWon.value).toBe(true)
    expect(c.winningBid.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('returns null when no bids for the slot', async () => {
    setupPbjsMock({ 'ad-slot-1': { bids: [] } })
    const c = usePrebid('listing_top', 'ad-slot-1')
    const result = await c.requestBids()
    expect(result).toBeNull()
    expect(c.prebidWon.value).toBe(false)
    expect(c.loading.value).toBe(false)
  })

  it('returns bid (floor price cache shared across tests, floor=0 fallback)', async () => {
    // floorPriceCache is module-level; once cached it persists.
    // When no floor row matches the position, floor defaults to 0 → all bids pass.
    setupPbjsMock({
      'ad-slot-1': {
        bids: [
          { adId: 'ad-1', cpm: 2.50, bidder: 'appnexus', width: 300, height: 250, ad: '<ad/>', statusMessage: 'ok' },
        ],
      },
    })
    const c = usePrebid('listing_top', 'ad-slot-1')
    const result = await c.requestBids()
    expect(result).not.toBeNull()
    expect(result!.cpm).toBe(2.50)
  })

  it('returns null when bid response has no matching element', async () => {
    setupPbjsMock({
      'other-slot': {
        bids: [
          { adId: 'ad-1', cpm: 2.50, bidder: 'appnexus', width: 300, height: 250, ad: '<ad/>', statusMessage: 'ok' },
        ],
      },
    })
    const c = usePrebid('listing_top', 'ad-slot-1')
    const result = await c.requestBids()
    expect(result).toBeNull()
  })
})

// ─── renderWinningAd — with bid ─────────────────────────────────────────────

describe('renderWinningAd — with bid', () => {
  it('calls pbjs.renderAd when winning bid exists', () => {
    setupPbjsMock()
    const c = usePrebid('listing_top', 'ad-slot-1')
    c.winningBid.value = { adId: 'ad-1', cpm: 2.50, bidder: 'appnexus', width: 300, height: 250, ad: '<ad/>', statusMessage: 'ok' }
    const mockDoc = {} as Document
    c.renderWinningAd(mockDoc)
    expect(globalThis.pbjs!.renderAd).toHaveBeenCalledWith(mockDoc, 'ad-1')
  })

  it('does not call renderAd when no winning bid', () => {
    setupPbjsMock()
    const c = usePrebid('listing_top', 'ad-slot-1')
    const mockDoc = {} as Document
    c.renderWinningAd(mockDoc)
    expect(globalThis.pbjs!.renderAd).not.toHaveBeenCalled()
  })
})

// ─── format sizes ───────────────────────────────────────────────────────────

describe('ad format sizing', () => {
  it('horizontal format uses correct sizes', async () => {
    setupPbjsMock({ 'ad-h': { bids: [] } })
    const c = usePrebid('listing_top', 'ad-h', 'horizontal')
    await c.requestBids()
    // Verify addAdUnits was called with horizontal sizes
    const addedUnits = (globalThis.pbjs!.addAdUnits as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(addedUnits[0].mediaTypes.banner.sizes).toContainEqual([728, 90])
  })

  it('vertical format uses correct sizes', async () => {
    setupPbjsMock({ 'ad-v': { bids: [] } })
    const c = usePrebid('listing_top', 'ad-v', 'vertical')
    await c.requestBids()
    const addedUnits = (globalThis.pbjs!.addAdUnits as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(addedUnits[0].mediaTypes.banner.sizes).toContainEqual([160, 600])
  })

  it('in-feed format uses correct sizes', async () => {
    setupPbjsMock({ 'ad-f': { bids: [] } })
    const c = usePrebid('listing_top', 'ad-f', 'in-feed')
    await c.requestBids()
    const addedUnits = (globalThis.pbjs!.addAdUnits as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(addedUnits[0].mediaTypes.banner.sizes).toContainEqual([300, 250])
    expect(addedUnits[0].mediaTypes.banner.sizes).toContainEqual([1, 1])
  })

  it('rectangle format uses default sizes', async () => {
    setupPbjsMock({ 'ad-r': { bids: [] } })
    const c = usePrebid('listing_top', 'ad-r', 'rectangle')
    await c.requestBids()
    const addedUnits = (globalThis.pbjs!.addAdUnits as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(addedUnits[0].mediaTypes.banner.sizes).toContainEqual([300, 250])
    expect(addedUnits[0].mediaTypes.banner.sizes).toContainEqual([336, 280])
  })
})

// ─── getFloorPrices — caching ───────────────────────────────────────────────

describe('getFloorPrices — edge cases', () => {
  it('handles DB error gracefully (returns empty map)', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    setupPbjsMock({ 'ad-slot-1': { bids: [] } })
    const c = usePrebid('listing_top', 'ad-slot-1')
    // requestBids internally calls getFloorPrices
    const result = await c.requestBids()
    // Should not throw, floor = 0 fallback
    expect(result).toBeNull() // no bids
  })
})
