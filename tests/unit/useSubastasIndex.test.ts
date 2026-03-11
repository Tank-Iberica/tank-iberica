import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSubastasIndex } from '../../app/composables/useSubastasIndex'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'in', 'or', 'order', 'select', 'filter', 'gte', 'lte'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.limit = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const NOW = new Date('2026-01-01T12:00:00Z').getTime()

function makeSampleAuction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    title: 'Test Auction',
    description: null,
    start_price_cents: 1000000,
    reserve_price_cents: 2000000,
    current_bid_cents: 0,
    bid_count: 0,
    bid_increment_cents: 100000,
    deposit_cents: 50000,
    buyer_premium_pct: 5,
    starts_at: '2026-01-01T10:00:00Z',
    ends_at: '2026-01-02T12:00:00Z',
    anti_snipe_seconds: 300,
    extended_until: null,
    status: 'active' as const,
    winner_id: null,
    winning_bid_cents: null,
    vehicle_id: 'v1',
    vehicle: null,
    vertical: 'tracciona',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() { return fn() },
  }))
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
  vi.stubGlobal('useRoute', () => ({ fullPath: '/subastas' }))
  vi.stubGlobal('usePageSeo', vi.fn())
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    channel: () => ({
      on: function (this: unknown) { return this },
      subscribe: () => ({}),
    }),
    removeChannel: vi.fn(),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeTab starts as live', () => {
    const c = useSubastasIndex()
    expect(c.activeTab.value).toBe('live')
  })

  it('auctions starts as empty array', () => {
    const c = useSubastasIndex()
    expect(c.auctions.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useSubastasIndex()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useSubastasIndex()
    expect(c.error.value).toBeNull()
  })
})

// ─── getVehicleTitle ──────────────────────────────────────────────────────────

describe('getVehicleTitle', () => {
  it('returns title when auction has title', () => {
    const c = useSubastasIndex()
    const auction = makeSampleAuction({ title: 'MAN TGX 2020' })
    expect(c.getVehicleTitle(auction)).toBe('MAN TGX 2020')
  })

  it('returns brand+model when no title but has vehicle', () => {
    const c = useSubastasIndex()
    const auction = makeSampleAuction({
      title: '',
      vehicle: { brand: 'VOLVO', model: 'FH', vehicle_images: [] },
    })
    expect(c.getVehicleTitle(auction)).toBe('VOLVO FH')
  })

  it('returns untitled key when no title and no vehicle', () => {
    const c = useSubastasIndex()
    const auction = makeSampleAuction({ title: '', vehicle: null })
    expect(c.getVehicleTitle(auction)).toBe('auction.untitledAuction')
  })
})

// ─── getStatusLabel ───────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns draft translation key', () => {
    const c = useSubastasIndex()
    expect(c.getStatusLabel('draft')).toBe('auction.draft')
  })

  it('returns live translation key for active', () => {
    const c = useSubastasIndex()
    expect(c.getStatusLabel('active')).toBe('auction.live')
  })

  it('returns ended translation key', () => {
    const c = useSubastasIndex()
    expect(c.getStatusLabel('ended')).toBe('auction.ended')
  })

  it('returns adjudicated translation key', () => {
    const c = useSubastasIndex()
    expect(c.getStatusLabel('adjudicated')).toBe('auction.adjudicated')
  })

  it('returns no_sale translation key', () => {
    const c = useSubastasIndex()
    expect(c.getStatusLabel('no_sale')).toBe('auction.noSaleTitle')
  })
})

// ─── getFirstImage ────────────────────────────────────────────────────────────

describe('getFirstImage', () => {
  it('returns null when no vehicle', () => {
    const c = useSubastasIndex()
    const auction = makeSampleAuction({ vehicle: null })
    expect(c.getFirstImage(auction)).toBeNull()
  })

  it('returns null when no images', () => {
    const c = useSubastasIndex()
    const auction = makeSampleAuction({ vehicle: { brand: 'MAN', model: 'TGX', vehicle_images: [] } })
    expect(c.getFirstImage(auction)).toBeNull()
  })

  it('returns first image sorted by position', () => {
    const c = useSubastasIndex()
    const auction = makeSampleAuction({
      vehicle: {
        brand: 'MAN',
        model: 'TGX',
        vehicle_images: [
          { url: 'img2.jpg', position: 2 },
          { url: 'img0.jpg', position: 0 },
          { url: 'img1.jpg', position: 1 },
        ],
      },
    })
    expect(c.getFirstImage(auction)).toBe('img0.jpg')
  })
})

// ─── getCardCountdown ─────────────────────────────────────────────────────────

describe('getCardCountdown', () => {
  it('returns ended key for ended status', () => {
    const c = useSubastasIndex()
    c.now.value = NOW
    const auction = makeSampleAuction({ status: 'ended' })
    expect(c.getCardCountdown(auction)).toBe('auction.ended')
  })

  it('returns HH:MM:SS for active auction ending within 24h', () => {
    const c = useSubastasIndex()
    // ends in 3h from NOW
    const endsAt = new Date(NOW + 3 * 3600000).toISOString()
    c.now.value = NOW
    const auction = makeSampleAuction({ status: 'active', ends_at: endsAt })
    const result = c.getCardCountdown(auction)
    expect(result).toMatch(/\d+:\d+:\d+/)
  })

  it('returns Xd HHh for active auction ending in days', () => {
    const c = useSubastasIndex()
    // ends in 25h from NOW (more than 1 day)
    const endsAt = new Date(NOW + 25 * 3600000).toISOString()
    c.now.value = NOW
    const auction = makeSampleAuction({ status: 'active', ends_at: endsAt })
    const result = c.getCardCountdown(auction)
    expect(result).toContain('d')
    expect(result).toContain('h')
  })

  it('returns ending key when active and diff is 0', () => {
    const c = useSubastasIndex()
    // already ended
    c.now.value = NOW
    const auction = makeSampleAuction({
      status: 'active',
      ends_at: new Date(NOW - 1000).toISOString(),
    })
    const result = c.getCardCountdown(auction)
    expect(result).toBe('auction.ending')
  })

  it('uses extended_until when set for active auction', () => {
    const c = useSubastasIndex()
    const extendedUntil = new Date(NOW + 5 * 60000).toISOString() // +5min
    c.now.value = NOW
    const auction = makeSampleAuction({
      status: 'active',
      ends_at: new Date(NOW - 1000).toISOString(), // already passed
      extended_until: extendedUntil,
    })
    const result = c.getCardCountdown(auction)
    // Should use extendedUntil (+5min), not ends_at (passed)
    expect(result).toMatch(/\d+:\d+:\d+/)
  })

  it('returns countdown for scheduled auction until starts_at', () => {
    const c = useSubastasIndex()
    const startsAt = new Date(NOW + 2 * 3600000).toISOString() // +2h
    c.now.value = NOW
    const auction = makeSampleAuction({ status: 'scheduled', starts_at: startsAt })
    const result = c.getCardCountdown(auction)
    expect(result).toMatch(/\d+:\d+:\d+/)
  })
})

// ─── emptyMessage ─────────────────────────────────────────────────────────────

describe('emptyMessage', () => {
  it('returns emptyLive for live tab', () => {
    const c = useSubastasIndex()
    c.activeTab.value = 'live'
    expect(c.emptyMessage.value).toBe('auction.emptyLive')
  })

  it('returns emptyScheduled for scheduled tab', () => {
    const c = useSubastasIndex()
    c.activeTab.value = 'scheduled'
    expect(c.emptyMessage.value).toBe('auction.emptyScheduled')
  })

  it('returns emptyEnded for ended tab', () => {
    const c = useSubastasIndex()
    c.activeTab.value = 'ended'
    expect(c.emptyMessage.value).toBe('auction.emptyEnded')
  })
})

// ─── destroy ──────────────────────────────────────────────────────────────────

describe('destroy', () => {
  it('clears interval on destroy (no error)', () => {
    const c = useSubastasIndex()
    // Calling destroy without init should not throw
    expect(() => c.destroy()).not.toThrow()
  })
})
