import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuction, formatCents } from '../../app/composables/useAuction'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'in', 'or', 'order', 'select', 'filter', 'gte', 'lte'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: Array.isArray(data) ? (data[0] ?? null) : data, error })
  chain.limit = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubClient({ data = [] as unknown[], insertError = null as unknown, updateError = null as unknown } = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: (_table: string) => ({
      select: () => makeChain(data),
      insert: () => Promise.resolve({ data: null, error: insertError }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: updateError }),
      }),
    }),
    channel: () => ({
      on: function (this: unknown) { return this },
      subscribe: () => ({}),
    }),
    removeChannel: vi.fn(),
  }))
}

/** Stub that records which methods were called on the query builder */
function stubClientWithSpy() {
  const selectSpy = vi.fn()
  const eqSpy = vi.fn()
  const inSpy = vi.fn()
  const orderSpy = vi.fn()

  const chain: Record<string, unknown> = {}
  ;['neq', 'or', 'filter', 'gte', 'lte'].forEach((m) => {
    chain[m] = () => chain
  })
  chain.eq = (...args: unknown[]) => { eqSpy(...args); return chain }
  chain.in = (...args: unknown[]) => { inSpy(...args); return chain }
  chain.order = (...args: unknown[]) => { orderSpy(...args); return chain }
  chain.select = (...args: unknown[]) => { selectSpy(...args); return chain }
  const resolved = { data: [], error: null, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.limit = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)

  const removeChannelSpy = vi.fn()

  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: (...args: unknown[]) => { selectSpy(...args); return chain },
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    channel: () => ({
      on: function (this: unknown) { return this },
      subscribe: () => ({}),
    }),
    removeChannel: removeChannelSpy,
  }))

  return { selectSpy, eqSpy, inSpy, orderSpy, removeChannelSpy }
}

const sampleAuction = {
  id: 'a1',
  vehicle_id: 'v1',
  vertical: 'tracciona',
  title: 'MAN TGX Auction',
  description: null,
  start_price_cents: 1000000,
  reserve_price_cents: 2000000,
  current_bid_cents: 1500000,
  bid_count: 3,
  bid_increment_cents: 100000,
  deposit_cents: 50000,
  buyer_premium_pct: 5,
  starts_at: '2026-01-01T10:00:00Z',
  ends_at: '2026-01-07T10:00:00Z',
  anti_snipe_seconds: 300,
  extended_until: null,
  status: 'active' as const,
  winner_id: null,
  winning_bid_cents: null,
  created_at: '2026-01-01T00:00:00Z',
}

const sampleBid = {
  id: 'bid-1',
  auction_id: 'a1',
  user_id: 'user-2',
  amount_cents: 1600000,
  is_winning: true,
  created_at: '2026-01-02T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  stubClient()
})

// ─── formatCents (exported pure function) ─────────────────────────────────────

describe('formatCents', () => {
  it('formats 100000 cents as 1000 EUR', () => {
    const result = formatCents(100000)
    expect(result).toContain('1')
    expect(result).toContain('€')
  })

  it('formats 0 cents', () => {
    const result = formatCents(0)
    expect(result).toContain('0')
  })

  it('formats 2500000 cents (25000 EUR)', () => {
    const result = formatCents(2500000)
    expect(result).toContain('25')
    expect(result).toContain('€')
  })

  it('formats negative cents', () => {
    const result = formatCents(-50000)
    expect(result).toContain('500')
    expect(result).toContain('€')
  })

  it('formats small amounts (1 cent = 0.01 EUR)', () => {
    const result = formatCents(1)
    expect(result).toContain('€')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('auctions starts as empty array', () => {
    const c = useAuction()
    expect(c.auctions.value).toHaveLength(0)
  })

  it('auction starts as null', () => {
    const c = useAuction()
    expect(c.auction.value).toBeNull()
  })

  it('bids starts as empty array', () => {
    const c = useAuction()
    expect(c.bids.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useAuction()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAuction()
    expect(c.error.value).toBeNull()
  })

  it('exposes formatCents on the returned object', () => {
    const c = useAuction()
    expect(c.formatCents).toBe(formatCents)
  })
})

// ─── getEffectiveEndTime ──────────────────────────────────────────────────────

describe('getEffectiveEndTime', () => {
  it('returns extended_until when set', () => {
    const c = useAuction()
    const auction = {
      ...sampleAuction,
      ends_at: '2026-01-07T10:00:00Z',
      extended_until: '2026-01-07T10:05:00Z',
    }
    const result = c.getEffectiveEndTime(auction)
    expect(result.toISOString()).toContain('2026-01-07T10:05')
  })

  it('returns ends_at when extended_until is null', () => {
    const c = useAuction()
    const auction = { ...sampleAuction, extended_until: null }
    const result = c.getEffectiveEndTime(auction)
    expect(result.toISOString()).toContain('2026-01-07T10:00')
  })
})

// ─── getMinimumBid ────────────────────────────────────────────────────────────

describe('getMinimumBid', () => {
  it('returns start_price_cents when no current bid', () => {
    const c = useAuction()
    const auction = { ...sampleAuction, current_bid_cents: 0 }
    expect(c.getMinimumBid(auction)).toBe(1000000)
  })

  it('returns current_bid + increment when there is a current bid', () => {
    const c = useAuction()
    // current_bid = 1500000, increment = 100000 → 1600000
    expect(c.getMinimumBid(sampleAuction)).toBe(1600000)
  })

  it('returns start_price when current_bid is negative (edge case)', () => {
    const c = useAuction()
    const auction = { ...sampleAuction, current_bid_cents: -1 }
    // -1 is not > 0, so should return start_price_cents
    expect(c.getMinimumBid(auction)).toBe(1000000)
  })
})

// ─── fetchAuctions ────────────────────────────────────────────────────────────

describe('fetchAuctions', () => {
  it('sets auctions from DB response', async () => {
    stubClient({ data: [sampleAuction] })
    const c = useAuction()
    await c.fetchAuctions()
    expect(c.auctions.value).toHaveLength(1)
  })

  it('sets loading to false after success', async () => {
    const c = useAuction()
    await c.fetchAuctions()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          const chain = makeChain(null, new Error('DB error'))
          return chain
        },
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctions()
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctions()
    expect(c.loading.value).toBe(false)
  })

  it('resets error before fetching', async () => {
    // Use a client that fails first call and succeeds second
    let callCount = 0
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          callCount++
          if (callCount === 1) return makeChain(null, new Error('DB error'))
          return makeChain([sampleAuction], null)
        },
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctions()
    expect(c.error.value).toBeTruthy()
    // Second call succeeds — error should be cleared
    await c.fetchAuctions()
    expect(c.error.value).toBeNull()
  })

  it('handles null data by defaulting to empty array', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctions()
    expect(c.auctions.value).toHaveLength(0)
  })

  it('applies single status filter', async () => {
    const spies = stubClientWithSpy()
    const c = useAuction()
    await c.fetchAuctions({ status: 'active' })
    expect(spies.eqSpy).toHaveBeenCalledWith('status', 'active')
  })

  it('applies status array filter', async () => {
    const spies = stubClientWithSpy()
    const c = useAuction()
    await c.fetchAuctions({ status: ['active', 'scheduled'] })
    expect(spies.inSpy).toHaveBeenCalledWith('status', ['active', 'scheduled'])
  })

  it('applies vertical filter', async () => {
    const spies = stubClientWithSpy()
    const c = useAuction()
    await c.fetchAuctions({ vertical: 'tracciona' })
    expect(spies.eqSpy).toHaveBeenCalledWith('vertical', 'tracciona')
  })

  it('handles non-Error thrown objects in catch', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, { message: 'object error' }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctions()
    // Non-Error objects should use fallback message
    expect(c.error.value).toBe('Error fetching auctions')
  })

  it('fetches multiple auctions', async () => {
    const a2 = { ...sampleAuction, id: 'a2', title: 'Second auction' }
    stubClient({ data: [sampleAuction, a2] })
    const c = useAuction()
    await c.fetchAuctions()
    expect(c.auctions.value).toHaveLength(2)
  })

  it('calls without filters', async () => {
    const spies = stubClientWithSpy()
    const c = useAuction()
    await c.fetchAuctions()
    // eq should NOT have been called with 'status' or 'vertical'
    expect(spies.eqSpy).not.toHaveBeenCalled()
    expect(spies.inSpy).not.toHaveBeenCalled()
  })
})

// ─── fetchAuctionById ─────────────────────────────────────────────────────────

describe('fetchAuctionById', () => {
  it('sets auction from DB response', async () => {
    stubClient({ data: [sampleAuction] })
    const c = useAuction()
    await c.fetchAuctionById('a1')
    expect(c.auction.value).toBeTruthy()
    expect(c.auction.value!.id).toBe('a1')
  })

  it('sets loading to true during fetch and false after', async () => {
    stubClient({ data: [sampleAuction] })
    const c = useAuction()
    await c.fetchAuctionById('a1')
    expect(c.loading.value).toBe(false)
  })

  it('fetches bids after fetching auction', async () => {
    const bidData = [sampleBid]
    // We need the first call (auction select) to return auction data
    // and the second call (bids select) to return bid data
    let callCount = 0
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'auctions') {
            return makeChain([sampleAuction])
          }
          // auction_bids
          return makeChain(bidData)
        },
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctionById('a1')
    expect(c.bids.value).toHaveLength(1)
    expect(c.bids.value[0].id).toBe('bid-1')
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('Not found')),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctionById('nonexistent')
    expect(c.error.value).toBe('Not found')
  })

  it('sets loading to false after error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('Fail')),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctionById('a1')
    expect(c.loading.value).toBe(false)
  })

  it('handles non-Error object in catch with fallback message', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, { code: '404' }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctionById('a1')
    expect(c.error.value).toBe('Error fetching auction')
  })

  it('resets error before fetching', async () => {
    let callCount = 0
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          callCount++
          if (callCount === 1) return makeChain(null, new Error('first error'))
          return makeChain([sampleAuction], null)
        },
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchAuctionById('a1')
    expect(c.error.value).toBeTruthy()
    // Second call succeeds — error should be cleared
    await c.fetchAuctionById('a1')
    expect(c.error.value).toBeNull()
  })
})

// ─── fetchBids ───────────────────────────────────────────────────────────────

describe('fetchBids', () => {
  it('fetches bids for an auction', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => makeChain(table === 'auction_bids' ? [sampleBid] : []),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchBids('a1')
    expect(c.bids.value).toHaveLength(1)
  })

  it('sets error on bid fetch failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, { message: 'Bids fetch failed' }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchBids('a1')
    expect(c.error.value).toBe('Bids fetch failed')
  })

  it('defaults to empty array when data is null', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchBids('a1')
    expect(c.bids.value).toHaveLength(0)
  })

  it('does not set error when fetch succeeds', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([sampleBid], null),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))
    const c = useAuction()
    await c.fetchBids('a1')
    expect(c.error.value).toBeNull()
  })
})

// ─── placeBid ─────────────────────────────────────────────────────────────────

describe('placeBid', () => {
  it('returns false when no user logged in', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useAuction()
    const result = await c.placeBid('a1', 1600000)
    expect(result).toBe(false)
  })

  it('sets error when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useAuction()
    await c.placeBid('a1', 1600000)
    expect(c.error.value).toBe('Debes iniciar sesión para pujar')
  })

  it('returns true on successful bid', async () => {
    const c = useAuction()
    const result = await c.placeBid('a1', 1600000)
    expect(result).toBe(true)
  })

  it('returns false on insert error', async () => {
    stubClient({ insertError: new Error('Insert failed') })
    const c = useAuction()
    const result = await c.placeBid('a1', 1600000)
    expect(result).toBe(false)
  })

  it('sets error on insert failure', async () => {
    stubClient({ insertError: new Error('Bid rejected') })
    const c = useAuction()
    await c.placeBid('a1', 1600000)
    expect(c.error.value).toBe('Bid rejected')
  })

  it('clears error before placing bid', async () => {
    const c = useAuction()
    // Trigger an error first
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    await c.placeBid('a1', 1600000)
    expect(c.error.value).toBeTruthy()
    // Now succeed
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    stubClient()
    await c.placeBid('a1', 1600000)
    expect(c.error.value).toBeNull()
  })

  it('handles non-Error thrown objects with fallback message', async () => {
    stubClient({ insertError: { code: 'PGRST301' } })
    const c = useAuction()
    await c.placeBid('a1', 1600000)
    expect(c.error.value).toBe('Error placing bid')
  })

  it('extends auction when bid is within anti-snipe window', async () => {
    const now = Date.now()
    // Auction ends in 2 minutes (120s), anti-snipe window is 300s
    // 120s < 300s → should trigger extension
    const endsAt = new Date(now + 120_000).toISOString()

    const updateEqSpy = vi.fn().mockResolvedValue({ data: null, error: null })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => makeChain([], null),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: updateEqSpy,
        }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    // Set auction.value directly so placeBid can check anti-snipe
    c.auction.value = {
      ...sampleAuction,
      ends_at: endsAt,
      extended_until: null,
      anti_snipe_seconds: 300,
    }

    await c.placeBid('a1', 1700000)
    // The update should have been called to extend
    expect(updateEqSpy).toHaveBeenCalledWith('id', 'a1')
    // Local state should reflect extension
    expect(c.auction.value!.extended_until).toBeTruthy()
  })

  it('does not extend auction when bid is outside anti-snipe window', async () => {
    const now = Date.now()
    // Auction ends in 10 minutes (600s), anti-snipe window is 300s
    // 600s > 300s → should NOT extend
    const endsAt = new Date(now + 600_000).toISOString()

    const updateEqSpy = vi.fn().mockResolvedValue({ data: null, error: null })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => makeChain([], null),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: updateEqSpy,
        }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.auction.value = {
      ...sampleAuction,
      ends_at: endsAt,
      extended_until: null,
      anti_snipe_seconds: 300,
    }

    await c.placeBid('a1', 1700000)
    // Update should NOT have been called
    expect(updateEqSpy).not.toHaveBeenCalled()
    expect(c.auction.value!.extended_until).toBeNull()
  })

  it('uses extended_until for effective end time in anti-snipe check', async () => {
    const now = Date.now()
    // ends_at is far in the future, but extended_until is within snipe window
    const endsAt = new Date(now + 600_000).toISOString()
    const extendedUntil = new Date(now + 120_000).toISOString()

    const updateEqSpy = vi.fn().mockResolvedValue({ data: null, error: null })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: updateEqSpy,
        }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.auction.value = {
      ...sampleAuction,
      ends_at: endsAt,
      extended_until: extendedUntil,
      anti_snipe_seconds: 300,
    }

    await c.placeBid('a1', 1700000)
    expect(updateEqSpy).toHaveBeenCalledWith('id', 'a1')
  })

  it('does not update local state when anti-snipe update fails', async () => {
    const now = Date.now()
    const endsAt = new Date(now + 120_000).toISOString()

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') }),
        }),
      }),
      channel: () => ({ on: function (this: unknown) { return this }, subscribe: () => ({}) }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.auction.value = {
      ...sampleAuction,
      ends_at: endsAt,
      extended_until: null,
      anti_snipe_seconds: 300,
    }

    const result = await c.placeBid('a1', 1700000)
    // Bid still succeeded
    expect(result).toBe(true)
    // But extension should not have been applied locally
    expect(c.auction.value!.extended_until).toBeNull()
  })

  it('skips anti-snipe logic when auction.value is null', async () => {
    const c = useAuction()
    // auction.value is null by default
    const result = await c.placeBid('a1', 1600000)
    expect(result).toBe(true)
  })
})

// ─── subscribeToAuction ─────────────────────────────────────────────────────

describe('subscribeToAuction', () => {
  it('subscribes to bid and auction channels', () => {
    const channelSpy = vi.fn().mockReturnValue({
      on: function (this: unknown) { return this },
      subscribe: vi.fn(),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: channelSpy,
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.subscribeToAuction('a1')
    expect(channelSpy).toHaveBeenCalledWith('auction-bids:a1')
    expect(channelSpy).toHaveBeenCalledWith('auction-status:a1')
    expect(channelSpy).toHaveBeenCalledTimes(2)
  })

  it('processes new bid from realtime and updates state', () => {
    let bidCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: (name: string) => ({
        on: function (this: unknown, _event: string, _opts: unknown, cb: (payload: { new: Record<string, unknown> }) => void) {
          if (name.startsWith('auction-bids:')) {
            bidCallback = cb
          }
          return this
        },
        subscribe: vi.fn(),
      }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.auction.value = { ...sampleAuction, current_bid_cents: 1500000, bid_count: 3 }
    c.subscribeToAuction('a1')

    // Simulate receiving a new bid
    expect(bidCallback).toBeTruthy()
    bidCallback!({
      new: {
        id: 'bid-new',
        auction_id: 'a1',
        user_id: 'user-2',
        amount_cents: 1700000,
        is_winning: true,
        created_at: '2026-01-02T14:00:00Z',
      },
    })

    // Bids should be updated
    expect(c.bids.value).toHaveLength(1)
    expect(c.bids.value[0].id).toBe('bid-new')
    // Auction current bid and count should update
    expect(c.auction.value!.current_bid_cents).toBe(1700000)
    expect(c.auction.value!.bid_count).toBe(4)
  })

  it('avoids duplicate bids in realtime', () => {
    let bidCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: (name: string) => ({
        on: function (this: unknown, _event: string, _opts: unknown, cb: (payload: { new: Record<string, unknown> }) => void) {
          if (name.startsWith('auction-bids:')) bidCallback = cb
          return this
        },
        subscribe: vi.fn(),
      }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.auction.value = { ...sampleAuction }
    c.subscribeToAuction('a1')

    const payload = {
      new: { id: 'bid-dup', auction_id: 'a1', user_id: 'user-2', amount_cents: 1800000, is_winning: true, created_at: '2026-01-02T15:00:00Z' },
    }

    // Send same bid twice
    bidCallback!(payload)
    bidCallback!(payload)

    // Should only have 1 bid
    expect(c.bids.value).toHaveLength(1)
  })

  it('processes auction status update from realtime', () => {
    let auctionCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: (name: string) => ({
        on: function (this: unknown, _event: string, _opts: unknown, cb: (payload: { new: Record<string, unknown> }) => void) {
          if (name.startsWith('auction-status:')) auctionCallback = cb
          return this
        },
        subscribe: vi.fn(),
      }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.auction.value = { ...sampleAuction, status: 'active' }
    c.subscribeToAuction('a1')

    expect(auctionCallback).toBeTruthy()
    auctionCallback!({
      new: {
        ...sampleAuction,
        status: 'ended',
        extended_until: '2026-01-07T11:00:00Z',
        current_bid_cents: 2000000,
        bid_count: 10,
        winner_id: 'user-2',
        winning_bid_cents: 2000000,
      },
    })

    expect(c.auction.value!.status).toBe('ended')
    expect(c.auction.value!.extended_until).toBe('2026-01-07T11:00:00Z')
    expect(c.auction.value!.current_bid_cents).toBe(2000000)
    expect(c.auction.value!.bid_count).toBe(10)
    expect(c.auction.value!.winner_id).toBe('user-2')
    expect(c.auction.value!.winning_bid_cents).toBe(2000000)
  })

  it('does not update auction fields when auction.value is null', () => {
    let auctionCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: (name: string) => ({
        on: function (this: unknown, _event: string, _opts: unknown, cb: (payload: { new: Record<string, unknown> }) => void) {
          if (name.startsWith('auction-status:')) auctionCallback = cb
          return this
        },
        subscribe: vi.fn(),
      }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    // auction is null
    c.subscribeToAuction('a1')

    // Should not throw
    auctionCallback!({ new: { ...sampleAuction, status: 'ended' } })
    expect(c.auction.value).toBeNull()
  })

  it('does not update auction fields when bid arrives but auction is null', () => {
    let bidCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: (name: string) => ({
        on: function (this: unknown, _event: string, _opts: unknown, cb: (payload: { new: Record<string, unknown> }) => void) {
          if (name.startsWith('auction-bids:')) bidCallback = cb
          return this
        },
        subscribe: vi.fn(),
      }),
      removeChannel: vi.fn(),
    }))

    const c = useAuction()
    c.subscribeToAuction('a1')

    // Should not throw when auction is null
    bidCallback!({
      new: { id: 'bid-x', auction_id: 'a1', user_id: 'u1', amount_cents: 2000000, is_winning: true, created_at: '' },
    })

    expect(c.bids.value).toHaveLength(1)
    expect(c.auction.value).toBeNull()
  })
})

// ─── unsubscribe ────────────────────────────────────────────────────────────

describe('unsubscribe', () => {
  it('removes channels when subscribed', () => {
    const removeChannelSpy = vi.fn()
    // subscribe() must return a truthy value (the channel itself) so bidChannel/auctionChannel are set
    const makeChannelObj = () => {
      const ch: Record<string, unknown> = {}
      ch.on = function (this: unknown) { return this }
      ch.subscribe = () => ch
      return ch
    }
    const channels: unknown[] = []
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => {
        const ch = makeChannelObj()
        channels.push(ch)
        return ch
      },
      removeChannel: removeChannelSpy,
    }))

    const c = useAuction()
    c.subscribeToAuction('a1')
    c.unsubscribe()
    expect(removeChannelSpy).toHaveBeenCalledTimes(2)
  })

  it('does nothing when not subscribed', () => {
    const removeChannelSpy = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => ({
        on: function (this: unknown) { return this },
        subscribe: vi.fn(),
      }),
      removeChannel: removeChannelSpy,
    }))

    const c = useAuction()
    c.unsubscribe()
    expect(removeChannelSpy).not.toHaveBeenCalled()
  })

  it('can be called multiple times safely', () => {
    const removeChannelSpy = vi.fn()
    const makeChannelObj = () => {
      const ch: Record<string, unknown> = {}
      ch.on = function (this: unknown) { return this }
      ch.subscribe = () => ch
      return ch
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      channel: () => makeChannelObj(),
      removeChannel: removeChannelSpy,
    }))

    const c = useAuction()
    c.subscribeToAuction('a1')
    c.unsubscribe()
    c.unsubscribe()
    // Only 2 calls from first unsubscribe (bid + auction channels)
    expect(removeChannelSpy).toHaveBeenCalledTimes(2)
  })
})
