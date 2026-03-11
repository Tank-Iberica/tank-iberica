import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'admin-user-1' } }))

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import {
  useAdminAuctionDetail,
  type ModalType,
} from '../../app/composables/admin/useAdminAuctionDetail'
import type { AuctionStatus } from '../../app/composables/useAuction'
import type { RegistrationStatus, DepositStatus } from '../../app/composables/useAuctionRegistration'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'update', 'delete', 'insert', 'single']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeAuction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'auction-1',
    vehicle_id: 'v-1',
    status: 'active' as AuctionStatus,
    reserve_price_cents: 5000000,
    current_bid_cents: 6000000,
    winner_id: null,
    winning_bid_cents: null,
    vehicle: {
      id: 'v-1',
      slug: 'volvo-fh-2020',
      brand: 'Volvo',
      model: 'FH',
      year: 2020,
      price: 75000,
      location: 'Madrid',
      vehicle_images: [],
    },
    ...overrides,
  }
}

function makeBid(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bid-1',
    auction_id: 'auction-1',
    user_id: 'user-bidder-1',
    amount_cents: 6000000,
    is_winning: false,
    created_at: '2026-01-01T10:00:00Z',
    ...overrides,
  }
}

function makeRegistration(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reg-1',
    auction_id: 'auction-1',
    user_id: 'user-reg-1',
    status: 'pending' as RegistrationStatus,
    deposit_status: 'pending' as DepositStatus,
    deposit_amount_cents: 500000,
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    registered_at: '2026-01-01T09:00:00Z',
    ...overrides,
  }
}

function makeAuctionId(id = 'auction-1') {
  return { value: id }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
})

// ─── Pure formatting helpers ──────────────────────────────────────────────

describe('formatCents', () => {
  it('returns dash for null', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.formatCents(null)).toBe('-')
  })

  it('returns dash for undefined', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.formatCents(undefined as unknown as null)).toBe('-')
  })

  it('formats cents as EUR currency (divides by 100)', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    const result = c.formatCents(5000000)
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
    expect(result).toContain('50')
  })

  it('formats zero', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    const result = c.formatCents(0)
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })
})

describe('formatDate', () => {
  it('returns dash for null', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.formatDate(null)).toBe('-')
  })

  it('formats valid date string', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    const result = c.formatDate('2026-03-15T10:30:00Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })
})

describe('formatDateShort', () => {
  it('returns dash for null', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.formatDateShort(null)).toBe('-')
  })

  it('formats valid date string with time', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    const result = c.formatDateShort('2026-01-15T14:30:00Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })
})

describe('getStatusClass', () => {
  const statuses: Array<[AuctionStatus, string]> = [
    ['draft', 'status-draft'],
    ['scheduled', 'status-scheduled'],
    ['active', 'status-active'],
    ['ended', 'status-ended'],
    ['adjudicated', 'status-adjudicated'],
    ['cancelled', 'status-cancelled'],
    ['no_sale', 'status-no-sale'],
  ]

  it.each(statuses)('returns %s class for %s status', (status, expected) => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.getStatusClass(status)).toBe(expected)
  })

  it('returns empty string for unknown status', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.getStatusClass('unknown' as AuctionStatus)).toBe('')
  })
})

describe('getRegStatusClass', () => {
  it('returns reg-pending for pending', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.getRegStatusClass('pending')).toBe('reg-pending')
  })

  it('returns reg-approved for approved', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.getRegStatusClass('approved')).toBe('reg-approved')
  })

  it('returns reg-rejected for rejected', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.getRegStatusClass('rejected')).toBe('reg-rejected')
  })

  it('returns empty string for unknown status', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.getRegStatusClass('unknown' as RegistrationStatus)).toBe('')
  })
})

describe('getDepositStatusClass', () => {
  const statuses: Array<[DepositStatus, string]> = [
    ['pending', 'deposit-pending'],
    ['held', 'deposit-held'],
    ['captured', 'deposit-captured'],
    ['released', 'deposit-released'],
    ['forfeited', 'deposit-forfeited'],
  ]

  it.each(statuses)('returns correct class for %s', (status, expected) => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.getDepositStatusClass(status)).toBe(expected)
  })
})

// ─── getStatusLabel / getRegStatusLabel / getDepositStatusLabel ──────────

describe('i18n label helpers', () => {
  it('getStatusLabel returns translation key', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    const result = c.getStatusLabel('active')
    expect(result).toContain('active')
  })

  it('getRegStatusLabel returns translation key', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    const result = c.getRegStatusLabel('pending')
    expect(result).toContain('pending')
  })

  it('getDepositStatusLabel returns translation key', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    const result = c.getDepositStatusLabel('held')
    expect(result).toContain('held')
  })
})

// ─── getVehicleLabel ──────────────────────────────────────────────────────

describe('getVehicleLabel', () => {
  it('returns dash when no auction', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = null
    expect(c.getVehicleLabel()).toBe('-')
  })

  it('returns vehicle_id when no vehicle object', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = { ...makeAuction(), vehicle: null, vehicle_id: 'v-99' } as never
    expect(c.getVehicleLabel()).toBe('v-99')
  })

  it('returns brand model (year) when vehicle has all fields', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    expect(c.getVehicleLabel()).toBe('Volvo FH (2020)')
  })

  it('returns brand model without year when year is null', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...makeAuction(),
      vehicle: { ...makeAuction().vehicle, year: null },
    } as never
    expect(c.getVehicleLabel()).toBe('Volvo FH')
  })
})

// ─── getVehicleThumbnail ──────────────────────────────────────────────────

describe('getVehicleThumbnail', () => {
  it('returns null when no auction', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = null
    expect(c.getVehicleThumbnail()).toBeNull()
  })

  it('returns null when no vehicle images', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction({ vehicle: { ...makeAuction().vehicle, vehicle_images: [] } }) as never
    expect(c.getVehicleThumbnail()).toBeNull()
  })

  it('returns image with lowest position', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction({
      vehicle: {
        ...makeAuction().vehicle,
        vehicle_images: [
          { url: 'second.jpg', position: 1 },
          { url: 'first.jpg', position: 0 },
        ],
      },
    }) as never
    expect(c.getVehicleThumbnail()).toBe('first.jpg')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('auction starts null', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.auction.value).toBeNull()
  })

  it('bids starts empty', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.bids.value).toEqual([])
  })

  it('registrations starts empty', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.registrations.value).toEqual([])
  })

  it('loading starts false', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.loading.value).toBe(false)
  })

  it('actionLoading starts false', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.actionLoading.value).toBe(false)
  })

  it('activeModal starts null', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.activeModal.value).toBeNull()
  })

  it('cancelReason starts empty', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.cancelReason.value).toBe('')
  })

  it('rejectReason starts empty', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.rejectReason.value).toBe('')
  })
})

// ─── reserveMet / highestBid (one-shot computed) ──────────────────────────

describe('reserveMet', () => {
  it('starts false when auction is null (one-shot at creation)', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.reserveMet.value).toBe(false)
  })
})

describe('highestBid', () => {
  it('starts null when bids are empty', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    expect(c.highestBid.value).toBeNull()
  })
})

// ─── Modal operations ─────────────────────────────────────────────────────

describe('openCancelModal', () => {
  it('clears cancelReason and sets activeModal to cancel', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.cancelReason.value = 'old reason'
    c.openCancelModal()
    expect(c.cancelReason.value).toBe('')
    expect(c.activeModal.value).toBe('cancel')
  })
})

describe('openAdjudicateModal', () => {
  it('sets activeModal to adjudicate', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.openAdjudicateModal()
    expect(c.activeModal.value).toBe('adjudicate')
  })
})

describe('openRejectModal', () => {
  it('sets rejectRegId and clears reason, opens reject modal', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.rejectReason.value = 'prev reason'
    c.openRejectModal('reg-99')
    expect(c.activeModal.value).toBe('reject')
    expect(c.rejectReason.value).toBe('')
  })
})

describe('closeModal', () => {
  it('sets activeModal to null', () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.openCancelModal()
    c.closeModal()
    expect(c.activeModal.value).toBeNull()
  })
})

// ─── loadAuctionData ──────────────────────────────────────────────────────

describe('loadAuctionData', () => {
  it('loads auction data from supabase', async () => {
    const auctionData = makeAuction()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'auctions') return makeChain({ data: auctionData, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminAuctionDetail(makeAuctionId())
    await c.loadAuctionData()
    expect(mockFrom).toHaveBeenCalledWith('auctions')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on auction fetch failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: { message: 'Auction error' } }))
    const c = useAdminAuctionDetail(makeAuctionId())
    await c.loadAuctionData()
    expect(c.error.value).toBeTruthy() // fallback string used when thrown object is not Error instance
    expect(c.loading.value).toBe(false)
  })

  it('loads bids separately', async () => {
    const auctionData = makeAuction()
    const bidsData = [makeBid()]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'auctions') return makeChain({ data: auctionData, error: null })
      if (table === 'auction_bids') return makeChain({ data: bidsData, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminAuctionDetail(makeAuctionId())
    await c.loadAuctionData()
    expect(mockFrom).toHaveBeenCalledWith('auction_bids')
  })

  it('loads registrations separately', async () => {
    const auctionData = makeAuction()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'auctions') return makeChain({ data: auctionData, error: null })
      if (table === 'auction_registrations')
        return makeChain({ data: [makeRegistration()], error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useAdminAuctionDetail(makeAuctionId())
    await c.loadAuctionData()
    expect(mockFrom).toHaveBeenCalledWith('auction_registrations')
  })
})

// ─── Auction actions ──────────────────────────────────────────────────────

describe('startAuction', () => {
  it('does nothing when auction is null', async () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = null
    await c.startAuction()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('updates status to active on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: makeAuction({ status: 'active' }), error: null }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction({ status: 'draft' }) as never
    await c.startAuction()
    expect(mockFrom).toHaveBeenCalledWith('auctions')
    expect(c.actionLoading.value).toBe(false)
  })

  it('sets error on start failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Start failed' } }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    await c.startAuction()
    expect(c.error.value).toBeTruthy()
    expect(c.actionLoading.value).toBe(false)
  })
})

describe('endAuction', () => {
  it('does nothing when auction is null', async () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = null
    await c.endAuction()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('updates status to ended on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    await c.endAuction()
    expect(c.actionLoading.value).toBe(false)
  })
})

describe('confirmCancel', () => {
  it('does nothing when auction is null', async () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = null
    await c.confirmCancel()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('closes modal and reloads after cancel success', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    c.activeModal.value = 'cancel'
    await c.confirmCancel()
    expect(c.activeModal.value).toBeNull()
    expect(c.actionLoading.value).toBe(false)
  })

  it('sets error on cancel failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Cancel failed' } }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    await c.confirmCancel()
    expect(c.error.value).toBeTruthy()
  })
})

describe('markNoSale', () => {
  it('does nothing when auction is null', async () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = null
    await c.markNoSale()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('updates status to no_sale on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    await c.markNoSale()
    expect(c.actionLoading.value).toBe(false)
  })
})

describe('confirmAdjudicate', () => {
  it('does nothing when auction is null', async () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = null
    c.highestBid.value = makeBid() as never
    await c.confirmAdjudicate()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does nothing when highestBid is null', async () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    c.highestBid.value = null
    await c.confirmAdjudicate()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('adjudicates when both auction and highestBid are set', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    c.highestBid.value = makeBid() as never
    c.activeModal.value = 'adjudicate'
    await c.confirmAdjudicate()
    expect(mockFrom).toHaveBeenCalledWith('auctions')
    expect(c.activeModal.value).toBeNull()
    expect(c.actionLoading.value).toBe(false)
  })

  it('sets error on adjudicate failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Adj failed' } }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.auction.value = makeAuction() as never
    c.highestBid.value = makeBid() as never
    await c.confirmAdjudicate()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── Registration actions ─────────────────────────────────────────────────

describe('approveRegistration', () => {
  it('updates registration status to approved', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminAuctionDetail(makeAuctionId())
    await c.approveRegistration('reg-1')
    expect(mockFrom).toHaveBeenCalledWith('auction_registrations')
    expect(c.actionLoading.value).toBe(false)
  })

  it('sets error on approval failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Approve failed' } }))
    const c = useAdminAuctionDetail(makeAuctionId())
    await c.approveRegistration('reg-1')
    expect(c.error.value).toBeTruthy()
    expect(c.actionLoading.value).toBe(false)
  })
})

describe('confirmReject', () => {
  it('does nothing when rejectRegId is null', async () => {
    const c = useAdminAuctionDetail(makeAuctionId())
    // rejectRegId is internal — openRejectModal sets it; we cannot override it directly
    // so calling confirmReject without openRejectModal means internal rejectRegId is null
    await c.confirmReject()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('rejects registration and clears modal when rejectRegId is set', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.openRejectModal('reg-to-reject')
    await c.confirmReject()
    expect(mockFrom).toHaveBeenCalledWith('auction_registrations')
    expect(c.activeModal.value).toBeNull()
    expect(c.actionLoading.value).toBe(false)
  })

  it('sets error on reject failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Reject failed' } }))
    const c = useAdminAuctionDetail(makeAuctionId())
    c.openRejectModal('reg-to-reject')
    await c.confirmReject()
    expect(c.error.value).toBeTruthy()
  })
})
