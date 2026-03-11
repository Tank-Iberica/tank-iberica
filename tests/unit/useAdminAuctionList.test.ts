import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminAuctionList,
  STATUS_TABS,
  STATUS_COLORS,
} from '../../app/composables/admin/useAdminAuctionList'

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useToast', () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }))
})

// ─── STATUS_TABS constant ─────────────────────────────────────────────────

describe('STATUS_TABS', () => {
  it('has 5 tabs', () => {
    expect(STATUS_TABS).toHaveLength(5)
  })

  it('includes "all" tab', () => {
    expect(STATUS_TABS.some((t) => t.value === 'all')).toBe(true)
  })

  it('includes "active" tab', () => {
    expect(STATUS_TABS.some((t) => t.value === 'active')).toBe(true)
  })

  it('includes "scheduled", "ended", "cancelled" tabs', () => {
    const values = STATUS_TABS.map((t) => t.value)
    expect(values).toContain('scheduled')
    expect(values).toContain('ended')
    expect(values).toContain('cancelled')
  })

  it('each tab has value and labelKey', () => {
    for (const tab of STATUS_TABS) {
      expect(tab).toHaveProperty('value')
      expect(tab).toHaveProperty('labelKey')
    }
  })
})

// ─── STATUS_COLORS constant ───────────────────────────────────────────────

describe('STATUS_COLORS', () => {
  it('has color for "active" (#16a34a)', () => {
    expect(STATUS_COLORS['active']).toBe('#16a34a')
  })

  it('has color for "draft" (#6b7280)', () => {
    expect(STATUS_COLORS['draft']).toBe('#6b7280')
  })

  it('has color for "cancelled" (#dc2626)', () => {
    expect(STATUS_COLORS['cancelled']).toBe('#dc2626')
  })

  it('has 7 status color entries', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(7)
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeFilter starts as "all"', () => {
    const c = useAdminAuctionList()
    expect(c.activeFilter.value).toBe('all')
  })

  it('auctions starts as empty array', () => {
    const c = useAdminAuctionList()
    expect(c.auctions.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminAuctionList()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminAuctionList()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as empty string', () => {
    const c = useAdminAuctionList()
    expect(c.error.value).toBe('')
  })

  it('auctionModal.show starts as false', () => {
    const c = useAdminAuctionList()
    expect(c.auctionModal.value.show).toBe(false)
  })

  it('auctionModal.editing starts as null', () => {
    const c = useAdminAuctionList()
    expect(c.auctionModal.value.editing).toBeNull()
  })

  it('cancelModal.show starts as false', () => {
    const c = useAdminAuctionList()
    expect(c.cancelModal.value.show).toBe(false)
  })

  it('filteredAuctions starts as empty (all auctions empty)', () => {
    const c = useAdminAuctionList()
    expect(c.filteredAuctions.value).toEqual([])
  })
})

// ─── openNewAuction / closeAuctionModal ───────────────────────────────────

describe('openNewAuction', () => {
  it('sets auctionModal.show to true', () => {
    const c = useAdminAuctionList()
    c.openNewAuction()
    expect(c.auctionModal.value.show).toBe(true)
  })

  it('sets editing to null', () => {
    const c = useAdminAuctionList()
    c.openNewAuction()
    expect(c.auctionModal.value.editing).toBeNull()
  })

  it('form.bid_increment_cents defaults to 10000', () => {
    const c = useAdminAuctionList()
    c.openNewAuction()
    expect(c.auctionModal.value.form.bid_increment_cents).toBe(10000)
  })

  it('form.anti_snipe_seconds defaults to 300', () => {
    const c = useAdminAuctionList()
    c.openNewAuction()
    expect(c.auctionModal.value.form.anti_snipe_seconds).toBe(300)
  })
})

describe('closeAuctionModal', () => {
  it('sets auctionModal.show to false', () => {
    const c = useAdminAuctionList()
    c.openNewAuction()
    c.closeAuctionModal()
    expect(c.auctionModal.value.show).toBe(false)
  })
})

// ─── openEditAuction ──────────────────────────────────────────────────────

describe('openEditAuction', () => {
  it('sets auctionModal.show to true', () => {
    const c = useAdminAuctionList()
    const auction = {
      id: 'a-1',
      vehicle_id: 'v-1',
      vertical: 'tracciona',
      title: 'Mi Subasta',
      start_price_cents: 100000,
      reserve_price_cents: null,
      current_bid_cents: 0,
      bid_count: 0,
      bid_increment_cents: 10000,
      deposit_cents: 50000,
      buyer_premium_pct: 5,
      starts_at: '2026-06-01T10:00:00Z',
      ends_at: '2026-06-15T10:00:00Z',
      anti_snipe_seconds: 300,
      status: 'scheduled' as const,
      created_at: '2026-01-01',
    }
    c.openEditAuction(auction as never)
    expect(c.auctionModal.value.show).toBe(true)
    expect(c.auctionModal.value.editing?.id).toBe('a-1')
  })
})

// ─── Cancel modal ─────────────────────────────────────────────────────────

describe('openCancelModal', () => {
  it('opens cancelModal with auction id', () => {
    const c = useAdminAuctionList()
    c.openCancelModal('a-99')
    expect(c.cancelModal.value.show).toBe(true)
    expect(c.cancelModal.value.auctionId).toBe('a-99')
  })
})

describe('closeCancelModal', () => {
  it('closes cancelModal', () => {
    const c = useAdminAuctionList()
    c.openCancelModal('a-1')
    c.closeCancelModal()
    expect(c.cancelModal.value.show).toBe(false)
    expect(c.cancelModal.value.auctionId).toBe('')
  })
})

// ─── closeRegistrationsPanel ──────────────────────────────────────────────

describe('closeRegistrationsPanel', () => {
  it('closes registrationsPanel', () => {
    const c = useAdminAuctionList()
    c.registrationsPanel.value.show = true
    c.closeRegistrationsPanel()
    expect(c.registrationsPanel.value.show).toBe(false)
    expect(c.registrationsPanel.value.auctionId).toBe('')
    expect(c.registrationsPanel.value.registrations).toEqual([])
  })
})

// ─── Helper functions ─────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns color for "active"', () => {
    const c = useAdminAuctionList()
    expect(c.getStatusColor('active')).toBe('#16a34a')
  })

  it('returns fallback for unknown status', () => {
    const c = useAdminAuctionList()
    expect(c.getStatusColor('unknown' as never)).toBe('#6b7280')
  })
})

describe('getStatusClass', () => {
  it('returns "status-active" for active', () => {
    const c = useAdminAuctionList()
    expect(c.getStatusClass('active')).toBe('status-active')
  })

  it('returns "status-cancelled" for cancelled', () => {
    const c = useAdminAuctionList()
    expect(c.getStatusClass('cancelled')).toBe('status-cancelled')
  })

  it('returns empty string for unknown', () => {
    const c = useAdminAuctionList()
    expect(c.getStatusClass('unknown' as never)).toBe('')
  })
})

describe('canEdit', () => {
  it('returns true for draft', () => {
    const c = useAdminAuctionList()
    expect(c.canEdit({ status: 'draft' } as never)).toBe(true)
  })

  it('returns true for scheduled', () => {
    const c = useAdminAuctionList()
    expect(c.canEdit({ status: 'scheduled' } as never)).toBe(true)
  })

  it('returns false for active', () => {
    const c = useAdminAuctionList()
    expect(c.canEdit({ status: 'active' } as never)).toBe(false)
  })

  it('returns false for ended', () => {
    const c = useAdminAuctionList()
    expect(c.canEdit({ status: 'ended' } as never)).toBe(false)
  })
})

describe('canCancel', () => {
  it('returns true for active', () => {
    const c = useAdminAuctionList()
    expect(c.canCancel({ status: 'active' } as never)).toBe(true)
  })

  it('returns false for cancelled', () => {
    const c = useAdminAuctionList()
    expect(c.canCancel({ status: 'cancelled' } as never)).toBe(false)
  })

  it('returns false for adjudicated', () => {
    const c = useAdminAuctionList()
    expect(c.canCancel({ status: 'adjudicated' } as never)).toBe(false)
  })

  it('returns false for no_sale', () => {
    const c = useAdminAuctionList()
    expect(c.canCancel({ status: 'no_sale' } as never)).toBe(false)
  })
})

describe('canAdjudicate', () => {
  it('returns true only for ended', () => {
    const c = useAdminAuctionList()
    expect(c.canAdjudicate({ status: 'ended' } as never)).toBe(true)
  })

  it('returns false for active', () => {
    const c = useAdminAuctionList()
    expect(c.canAdjudicate({ status: 'active' } as never)).toBe(false)
  })
})

describe('getVehicleTitle', () => {
  it('returns "brand model year" when vehicle is present', () => {
    const c = useAdminAuctionList()
    const auction = {
      vehicle_id: 'v-1',
      vehicle: { brand: 'Volvo', model: 'FH', year: 2022 },
    }
    expect(c.getVehicleTitle(auction as never)).toBe('Volvo FH 2022')
  })

  it('returns vehicle_id when no vehicle data', () => {
    const c = useAdminAuctionList()
    const auction = { vehicle_id: 'v-99', vehicle: undefined }
    expect(c.getVehicleTitle(auction as never)).toBe('v-99')
  })

  it('handles null year gracefully', () => {
    const c = useAdminAuctionList()
    const auction = {
      vehicle_id: 'v-1',
      vehicle: { brand: 'Scania', model: 'R', year: null },
    }
    const result = c.getVehicleTitle(auction as never)
    expect(result).toContain('Scania')
    expect(result).toContain('R')
  })
})

// ─── filteredAuctions computed ────────────────────────────────────────────

describe('filteredAuctions', () => {
  it('starts as empty array (initial auctions is empty)', () => {
    const c = useAdminAuctionList()
    expect(c.filteredAuctions.value).toEqual([])
  })
})

// ─── Supabase mock helpers ───────────────────────────────────────────────

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'order', 'select', 'limit', 'filter', 'in'].forEach((m) => { chain[m] = () => chain })
  chain.single = () => Promise.resolve({ data, error })
  chain.maybeSingle = () => Promise.resolve({ data, error })
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data, error }).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve({ data, error }).catch(reject)
  chain.update = () => chain
  chain.insert = () => chain
  chain.delete = () => chain
  return chain
}

function stubSupabase(overrides: Record<string, unknown> = {}) {
  const defaultAuctionChain = makeChain([], null)
  const defaultRegCountChain = { ...makeChain(null, null), count: 0 } as unknown
  const defaultVehicleChain = makeChain([], null)

  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => {
      if (overrides[table]) return overrides[table]
      if (table === 'auctions') return { select: () => defaultAuctionChain, update: () => defaultAuctionChain, insert: () => defaultAuctionChain }
      if (table === 'auction_registrations') return { select: () => ({ ...makeChain([], null), count: 0 }), update: () => makeChain(null, null) }
      if (table === 'auction_bids') return { select: () => makeChain(null, null), update: () => makeChain(null, null) }
      if (table === 'vehicles') return { select: () => defaultVehicleChain }
      return { select: () => makeChain() }
    },
  }))
}

// ─── formatDate ──────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "-" for null', () => {
    const c = useAdminAuctionList()
    expect(c.formatDate(null)).toBe('-')
  })

  it('formats a valid date string', () => {
    const c = useAdminAuctionList()
    const result = c.formatDate('2026-06-15T10:30:00Z')
    expect(result).toContain('15')
    expect(result).toContain('06')
    expect(result).toContain('2026')
  })

  it('returns "-" for empty string', () => {
    const c = useAdminAuctionList()
    // Empty string → new Date('') → Invalid Date → still calls toLocaleDateString
    const result = c.formatDate('')
    expect(result).toBe('-')
  })
})

// ─── getStatusLabel ──────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns i18n key for active', () => {
    const c = useAdminAuctionList()
    expect(c.getStatusLabel('active')).toBe('admin.subastas.status.active')
  })

  it('returns i18n key for cancelled', () => {
    const c = useAdminAuctionList()
    expect(c.getStatusLabel('cancelled')).toBe('admin.subastas.status.cancelled')
  })
})

// ─── fetchAuctions ───────────────────────────────────────────────────────

describe('fetchAuctions', () => {
  it('sets loading during fetch and resets after', async () => {
    stubSupabase()
    const c = useAdminAuctionList()
    const promise = c.fetchAuctions()
    // loading was set to true synchronously before await
    await promise
    expect(c.loading.value).toBe(false)
  })

  it('populates auctions on success', async () => {
    const auctionData = [
      { id: 'a-1', vehicle_id: 'v-1', status: 'active', title: 'Subasta 1' },
    ]
    const auctionChain = makeChain(auctionData, null)
    const regBase = makeChain(null, null)
    regBase.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null, count: 3 }).then(resolve)
    const regChain = regBase

    stubSupabase({
      auctions: { select: () => auctionChain },
      auction_registrations: { select: () => regChain },
    })
    const c = useAdminAuctionList()
    await c.fetchAuctions()
    expect(c.auctions.value).toHaveLength(1)
    expect(c.auctions.value[0]!.registrations_count).toBe(3)
  })

  it('sets error on DB failure', async () => {
    const errChain = makeChain(null, { message: 'DB error' })
    stubSupabase({
      auctions: { select: () => errChain },
    })
    const c = useAdminAuctionList()
    await c.fetchAuctions()
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })
})

// ─── fetchVehicles ───────────────────────────────────────────────────────

describe('fetchVehicles', () => {
  it('populates vehicles on success', async () => {
    const vehicleData = [
      { id: 'v-1', brand: 'Volvo', model: 'FH', year: 2022, slug: 'volvo-fh-2022' },
    ]
    stubSupabase({
      vehicles: { select: () => makeChain(vehicleData, null) },
    })
    const c = useAdminAuctionList()
    await c.fetchVehicles()
    expect(c.vehicles.value).toHaveLength(1)
    expect(c.vehiclesLoading.value).toBe(false)
  })

  it('stays empty on error (silent fail)', async () => {
    stubSupabase({
      vehicles: {
        select: () => {
          throw new Error('DB error')
        },
      },
    })
    const c = useAdminAuctionList()
    await c.fetchVehicles()
    expect(c.vehicles.value).toEqual([])
    expect(c.vehiclesLoading.value).toBe(false)
  })
})

// ─── saveAuction (create) ────────────────────────────────────────────────

describe('saveAuction', () => {
  it('creates new auction and closes modal on success', async () => {
    const insertChain = makeChain(null, null)
    const auctionChain = makeChain([], null)
    const regChain = Object.assign(makeChain(null, null), { count: 0 })

    stubSupabase({
      auctions: {
        select: () => auctionChain,
        insert: () => insertChain,
        update: () => makeChain(null, null),
      },
      auction_registrations: { select: () => regChain },
    })
    const c = useAdminAuctionList()
    c.openNewAuction()
    c.auctionModal.value.form.vehicle_id = 'v-1'
    c.auctionModal.value.form.title = 'New Auction'
    await c.saveAuction()
    expect(c.auctionModal.value.show).toBe(false)
    expect(c.saving.value).toBe(false)
  })

  it('updates existing auction when editing', async () => {
    const updateChain = makeChain(null, null)
    const auctionChain = makeChain([], null)
    const regChain = Object.assign(makeChain(null, null), { count: 0 })

    stubSupabase({
      auctions: {
        select: () => auctionChain,
        update: () => updateChain,
        insert: () => makeChain(null, null),
      },
      auction_registrations: { select: () => regChain },
    })
    const c = useAdminAuctionList()
    const auction = {
      id: 'a-1', vehicle_id: 'v-1', vertical: 'tracciona', title: 'Test',
      start_price_cents: 100000, reserve_price_cents: null, current_bid_cents: 0,
      bid_count: 0, bid_increment_cents: 10000, deposit_cents: 50000, buyer_premium_pct: 5,
      starts_at: '2026-06-01T10:00:00Z', ends_at: '2026-06-15T10:00:00Z',
      anti_snipe_seconds: 300, status: 'scheduled' as const, created_at: '2026-01-01',
    }
    c.openEditAuction(auction as never)
    await c.saveAuction()
    expect(c.auctionModal.value.show).toBe(false)
    expect(c.saving.value).toBe(false)
  })

  it('sets error on insert failure', async () => {
    const insertChain = makeChain(null, { message: 'Insert failed' })

    stubSupabase({
      auctions: {
        select: () => makeChain([], null),
        insert: () => insertChain,
      },
    })
    const c = useAdminAuctionList()
    c.openNewAuction()
    await c.saveAuction()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── confirmCancelAuction ────────────────────────────────────────────────

describe('confirmCancelAuction', () => {
  it('does nothing when auctionId is empty', async () => {
    stubSupabase()
    const c = useAdminAuctionList()
    await c.confirmCancelAuction()
    expect(c.saving.value).toBe(false)
  })

  it('cancels auction and closes modal on success', async () => {
    const updateChain = makeChain(null, null)
    const auctionChain = makeChain([], null)
    const regChain = Object.assign(makeChain(null, null), { count: 0 })

    stubSupabase({
      auctions: {
        select: () => auctionChain,
        update: () => updateChain,
      },
      auction_registrations: { select: () => regChain },
    })
    const c = useAdminAuctionList()
    c.openCancelModal('a-1')
    await c.confirmCancelAuction()
    expect(c.cancelModal.value.show).toBe(false)
    expect(c.saving.value).toBe(false)
  })

  it('sets error on update failure', async () => {
    const updateChain = makeChain(null, { message: 'Update failed' })

    stubSupabase({
      auctions: {
        update: () => updateChain,
        select: () => makeChain([], null),
      },
    })
    const c = useAdminAuctionList()
    c.openCancelModal('a-1')
    await c.confirmCancelAuction()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── cancelAuction ───────────────────────────────────────────────────────

describe('cancelAuction', () => {
  it('does nothing when confirm returns false', async () => {
    vi.stubGlobal('confirm', () => false)
    stubSupabase()
    const c = useAdminAuctionList()
    await c.cancelAuction('a-1')
    expect(c.saving.value).toBe(false)
  })

  it('cancels when confirm returns true', async () => {
    vi.stubGlobal('confirm', () => true)
    const updateChain = makeChain(null, null)
    const auctionChain = makeChain([], null)
    const regChain = Object.assign(makeChain(null, null), { count: 0 })

    stubSupabase({
      auctions: {
        select: () => auctionChain,
        update: () => updateChain,
      },
      auction_registrations: { select: () => regChain },
    })
    const c = useAdminAuctionList()
    await c.cancelAuction('a-1')
    expect(c.saving.value).toBe(false)
  })

  it('sets error on failure after confirm', async () => {
    vi.stubGlobal('confirm', () => true)
    const updateChain = makeChain(null, { message: 'Cancel failed' })

    stubSupabase({
      auctions: {
        update: () => updateChain,
        select: () => makeChain([], null),
      },
    })
    const c = useAdminAuctionList()
    await c.cancelAuction('a-1')
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── adjudicateAuction ───────────────────────────────────────────────────

describe('adjudicateAuction', () => {
  it('sets noBids error when no top bid found', async () => {
    stubSupabase({
      auction_bids: { select: () => makeChain(null, null) },
    })
    const c = useAdminAuctionList()
    await c.adjudicateAuction('a-1')
    expect(c.error.value).toBe('admin.subastas.errors.noBids')
    expect(c.saving.value).toBe(false)
  })

  it('adjudicates successfully with top bid', async () => {
    const topBid = { id: 'b-1', user_id: 'u-1', amount_cents: 200000 }
    const bidChain = makeChain(topBid, null)
    const updateChain = makeChain(null, null)
    const auctionChain = makeChain([], null)
    const regChain = Object.assign(makeChain(null, null), { count: 0 })

    stubSupabase({
      auction_bids: { select: () => bidChain, update: () => updateChain },
      auctions: { select: () => auctionChain, update: () => updateChain },
      auction_registrations: { select: () => regChain },
    })
    const c = useAdminAuctionList()
    await c.adjudicateAuction('a-1')
    expect(c.error.value).toBe('')
    expect(c.saving.value).toBe(false)
  })

  it('sets error on bid fetch failure', async () => {
    const bidChain = makeChain(null, { message: 'Bid fetch error' })

    stubSupabase({
      auction_bids: { select: () => bidChain },
    })
    const c = useAdminAuctionList()
    await c.adjudicateAuction('a-1')
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('sets error on auction update failure after bid found', async () => {
    const topBid = { id: 'b-1', user_id: 'u-1', amount_cents: 200000 }
    const bidChain = makeChain(topBid, null)
    const updateChain = makeChain(null, { message: 'Update failed' })

    stubSupabase({
      auction_bids: { select: () => bidChain, update: () => makeChain(null, null) },
      auctions: { update: () => updateChain, select: () => makeChain([], null) },
    })
    const c = useAdminAuctionList()
    await c.adjudicateAuction('a-1')
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── openRegistrationsPanel ──────────────────────────────────────────────

describe('openRegistrationsPanel', () => {
  it('sets panel to show and loads registrations', async () => {
    const regData = [
      { id: 'r-1', auction_id: 'a-1', user_id: 'u-1', status: 'pending', registered_at: '2026-06-01' },
    ]
    stubSupabase({
      auction_registrations: { select: () => makeChain(regData, null) },
    })
    const c = useAdminAuctionList()
    const auction = { id: 'a-1', vehicle_id: 'v-1', title: 'Test Auction' } as never
    await c.openRegistrationsPanel(auction)
    expect(c.registrationsPanel.value.show).toBe(true)
    expect(c.registrationsPanel.value.auctionId).toBe('a-1')
    expect(c.registrationsPanel.value.registrations).toHaveLength(1)
    expect(c.registrationsPanel.value.loading).toBe(false)
  })

  it('uses vehicle title when auction title is null', async () => {
    stubSupabase({
      auction_registrations: { select: () => makeChain([], null) },
    })
    const c = useAdminAuctionList()
    const auction = {
      id: 'a-2', vehicle_id: 'v-1', title: null,
      vehicle: { brand: 'Scania', model: 'R', year: 2023 },
    } as never
    await c.openRegistrationsPanel(auction)
    expect(c.registrationsPanel.value.auctionTitle).toContain('Scania')
  })

  it('handles error silently', async () => {
    stubSupabase({
      auction_registrations: {
        select: () => { throw new Error('DB error') },
      },
    })
    const c = useAdminAuctionList()
    const auction = { id: 'a-1', vehicle_id: 'v-1', title: 'Test' } as never
    await c.openRegistrationsPanel(auction)
    expect(c.registrationsPanel.value.loading).toBe(false)
  })
})

// ─── approveRegistration ─────────────────────────────────────────────────

describe('approveRegistration', () => {
  it('updates registration status locally on success', async () => {
    stubSupabase({
      auction_registrations: { update: () => makeChain(null, null) },
    })
    const c = useAdminAuctionList()
    c.registrationsPanel.value.registrations = [
      { id: 'r-1', status: 'pending' } as never,
    ]
    await c.approveRegistration('r-1')
    expect(c.registrationsPanel.value.registrations[0]!.status).toBe('approved')
  })

  it('shows error toast on failure', async () => {
    const toastError = vi.fn()
    vi.stubGlobal('useToast', () => ({
      success: vi.fn(), error: toastError, warning: vi.fn(), info: vi.fn(),
    }))
    stubSupabase({
      auction_registrations: { update: () => makeChain(null, { message: 'Failed' }) },
    })
    const c = useAdminAuctionList()
    await c.approveRegistration('r-1')
    expect(toastError).toHaveBeenCalled()
  })
})

// ─── rejectRegistration ──────────────────────────────────────────────────

describe('rejectRegistration', () => {
  it('does nothing when prompt returns null', async () => {
    vi.stubGlobal('prompt', () => null)
    stubSupabase()
    const c = useAdminAuctionList()
    c.registrationsPanel.value.registrations = [
      { id: 'r-1', status: 'pending' } as never,
    ]
    await c.rejectRegistration('r-1')
    expect(c.registrationsPanel.value.registrations[0]!.status).toBe('pending')
  })

  it('updates registration status locally on success', async () => {
    vi.stubGlobal('prompt', () => 'Bad docs')
    stubSupabase({
      auction_registrations: { update: () => makeChain(null, null) },
    })
    const c = useAdminAuctionList()
    c.registrationsPanel.value.registrations = [
      { id: 'r-1', status: 'pending' } as never,
    ]
    await c.rejectRegistration('r-1')
    expect(c.registrationsPanel.value.registrations[0]!.status).toBe('rejected')
  })

  it('shows error toast on failure', async () => {
    vi.stubGlobal('prompt', () => 'Reason')
    const toastError = vi.fn()
    vi.stubGlobal('useToast', () => ({
      success: vi.fn(), error: toastError, warning: vi.fn(), info: vi.fn(),
    }))
    stubSupabase({
      auction_registrations: { update: () => makeChain(null, { message: 'Failed' }) },
    })
    const c = useAdminAuctionList()
    await c.rejectRegistration('r-1')
    expect(toastError).toHaveBeenCalled()
  })
})

// ─── filteredAuctions with reactive stubs ────────────────────────────────

describe('filteredAuctions with data', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('returns all auctions when filter is "all"', () => {
    const c = useAdminAuctionList()
    c.auctions.value = [
      { id: 'a-1', status: 'active' },
      { id: 'a-2', status: 'ended' },
      { id: 'a-3', status: 'cancelled' },
    ] as never
    c.activeFilter.value = 'all'
    expect(c.filteredAuctions.value).toHaveLength(3)
  })

  it('filters only active when filter is "active"', () => {
    const c = useAdminAuctionList()
    c.auctions.value = [
      { id: 'a-1', status: 'active' },
      { id: 'a-2', status: 'ended' },
      { id: 'a-3', status: 'cancelled' },
    ] as never
    c.activeFilter.value = 'active'
    expect(c.filteredAuctions.value).toHaveLength(1)
    expect((c.filteredAuctions.value[0] as { id: string }).id).toBe('a-1')
  })

  it('ended filter includes adjudicated and no_sale', () => {
    const c = useAdminAuctionList()
    c.auctions.value = [
      { id: 'a-1', status: 'ended' },
      { id: 'a-2', status: 'adjudicated' },
      { id: 'a-3', status: 'no_sale' },
      { id: 'a-4', status: 'active' },
    ] as never
    c.activeFilter.value = 'ended'
    expect(c.filteredAuctions.value).toHaveLength(3)
  })

  it('filters scheduled correctly', () => {
    const c = useAdminAuctionList()
    c.auctions.value = [
      { id: 'a-1', status: 'scheduled' },
      { id: 'a-2', status: 'active' },
    ] as never
    c.activeFilter.value = 'scheduled'
    expect(c.filteredAuctions.value).toHaveLength(1)
  })
})
