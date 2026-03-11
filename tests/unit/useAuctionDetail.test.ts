import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuctionDetail } from '../../app/composables/useAuctionDetail'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'in', 'or', 'order', 'select', 'filter', 'gte', 'lte'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data, error })
  chain.maybeSingle = () => Promise.resolve({ data, error })
  chain.limit = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubSupabase() {
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
}

const sampleAuction = {
  id: 'a1',
  title: 'MAN TGX Auction',
  description: 'Great truck',
  start_price_cents: 1000000,
  reserve_price_cents: 2000000,
  current_bid_cents: 1500000,
  bid_count: 3,
  bid_increment_cents: 100000,
  deposit_cents: 50000,
  buyer_premium_pct: 5,
  starts_at: '2026-01-01T10:00:00Z',
  ends_at: '2026-01-07T10:00:00Z',
  extended_until: null,
  anti_snipe_seconds: 300,
  status: 'active' as const,
  winner_id: null,
  winning_bid_cents: null,
  vehicle_id: 'v1',
  vehicle: {
    brand: 'MAN',
    model: 'TGX',
    vehicle_images: [
      { url: 'https://img.example.com/1.jpg', position: 0 },
      { url: 'https://img.example.com/2.jpg', position: 1 },
    ],
  },
  vertical: 'tracciona',
  created_at: '2026-01-01T00:00:00Z',
}

function makeAuctionId(id = 'a1') {
  return { value: id }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() { return fn() },
  }))
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => key, locale: { value: 'es' } }))
  vi.stubGlobal('useToast', () => ({ error: vi.fn(), success: vi.fn() }))
  vi.stubGlobal('useRoute', () => ({ fullPath: '/subastas/a1' }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { cloudinaryCloudName: 'demo', cloudinaryUploadPreset: 'unsigned' },
  }))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ clientSecret: 'secret' }))
  stubSupabase()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('auction starts as null', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.auction.value).toBeNull()
  })

  it('bids starts as empty array', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.bids.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.loading.value).toBe(false)
  })

  it('showRegForm starts as false', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.showRegForm.value).toBe(false)
  })

  it('selectedImageIdx starts at 0', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.selectedImageIdx.value).toBe(0)
  })

  it('regFormIdDocumentUrl starts as null', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.regFormIdDocumentUrl.value).toBeNull()
  })
})

// ─── vehicleTitle ─────────────────────────────────────────────────────────────

describe('vehicleTitle', () => {
  it('returns untitled key when no auction', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.vehicleTitle.value).toBe('auction.untitledAuction')
  })

  it('returns title when auction has title', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    expect(c.vehicleTitle.value).toBe('MAN TGX Auction')
  })

  it('returns brand+model when title is empty', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...sampleAuction,
      title: '',
      vehicle: { brand: 'VOLVO', model: 'FH', vehicle_images: [] },
    } as unknown as typeof c.auction.value
    expect(c.vehicleTitle.value).toBe('VOLVO FH')
  })
})

// ─── auctionTitle ─────────────────────────────────────────────────────────────

describe('auctionTitle', () => {
  it('returns pageTitle key when no auction', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.auctionTitle.value).toBe('auction.pageTitle')
  })

  it('returns title when auction has title', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    expect(c.auctionTitle.value).toBe('MAN TGX Auction')
  })
})

// ─── vehicleImages ────────────────────────────────────────────────────────────

describe('vehicleImages', () => {
  it('returns empty array when no auction', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.vehicleImages.value).toHaveLength(0)
  })

  it('returns empty array when vehicle has no images', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...sampleAuction,
      vehicle: { brand: 'MAN', model: 'TGX', vehicle_images: [] },
    } as unknown as typeof c.auction.value
    expect(c.vehicleImages.value).toHaveLength(0)
  })

  it('returns sorted images by position', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...sampleAuction,
      vehicle: {
        brand: 'MAN',
        model: 'TGX',
        vehicle_images: [
          { url: 'img2.jpg', position: 2 },
          { url: 'img0.jpg', position: 0 },
          { url: 'img1.jpg', position: 1 },
        ],
      },
    } as unknown as typeof c.auction.value
    const images = c.vehicleImages.value as Array<{ url: string; position: number }>
    expect(images[0]?.url).toBe('img0.jpg')
    expect(images[1]?.url).toBe('img1.jpg')
    expect(images[2]?.url).toBe('img2.jpg')
  })
})

// ─── primaryImage ─────────────────────────────────────────────────────────────

describe('primaryImage', () => {
  it('returns null when no images', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.primaryImage.value).toBeNull()
  })

  it('returns first image url at index 0', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    expect(c.primaryImage.value).toBe('https://img.example.com/1.jpg')
  })
})

// ─── seoTitle ─────────────────────────────────────────────────────────────────

describe('seoTitle', () => {
  it('returns generic seo key when no auction', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.seoTitle.value).toBe('auction.seoTitle')
  })

  it('returns detail title key when auction exists', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    expect(c.seoTitle.value).toBe('auction.seoDetailTitle')
  })
})

// ─── eventJsonLd ──────────────────────────────────────────────────────────────

describe('eventJsonLd', () => {
  it('returns null when no auction', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.eventJsonLd.value).toBeNull()
  })

  it('returns schema.org Event object when auction exists', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Event')
  })

  it('sets EventCompleted for ended status', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...sampleAuction,
      status: 'ended',
    } as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    expect(ld.eventStatus).toBe('https://schema.org/EventCompleted')
  })

  it('sets EventScheduled for non-ended status', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    expect(ld.eventStatus).toBe('https://schema.org/EventScheduled')
  })
})

// ─── getStatusLabel ───────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns translation key for draft', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.getStatusLabel('draft')).toBe('auction.draft')
  })

  it('returns translation key for scheduled', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.getStatusLabel('scheduled')).toBe('auction.scheduled')
  })

  it('returns translation key for active', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.getStatusLabel('active')).toBe('auction.live')
  })

  it('returns translation key for ended', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.getStatusLabel('ended')).toBe('auction.ended')
  })

  it('returns translation key for adjudicated', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.getStatusLabel('adjudicated')).toBe('auction.adjudicated')
  })

  it('returns translation key for cancelled', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.getStatusLabel('cancelled')).toBe('auction.cancelled')
  })

  it('returns translation key for no_sale', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.getStatusLabel('no_sale')).toBe('auction.noSaleTitle')
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns localized string', () => {
    const c = useAuctionDetail(makeAuctionId())
    const result = c.formatDate('2026-01-15T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes year in formatted date', () => {
    const c = useAuctionDetail(makeAuctionId())
    const result = c.formatDate('2026-01-15T10:00:00Z')
    expect(result).toContain('2026')
  })
})

// ─── selectImage ──────────────────────────────────────────────────────────────

describe('selectImage', () => {
  it('updates selectedImageIdx', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.selectImage(2)
    expect(c.selectedImageIdx.value).toBe(2)
  })

  it('changes primary image when index changes', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    c.selectImage(1)
    expect(c.primaryImage.value).toBe('https://img.example.com/2.jpg')
  })
})

// ─── handleRequestRegistration / closeRegForm ─────────────────────────────────

describe('showRegForm handlers', () => {
  it('handleRequestRegistration sets showRegForm to true', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.handleRequestRegistration()
    expect(c.showRegForm.value).toBe(true)
  })

  it('closeRegForm sets showRegForm to false', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.showRegForm.value = true
    c.closeRegForm()
    expect(c.showRegForm.value).toBe(false)
  })
})

// ─── currentPath ─────────────────────────────────────────────────────────────

describe('currentPath', () => {
  it('returns fullPath from route', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.currentPath.value).toBe('/subastas/a1')
  })
})

// ─── seoDescription ─────────────────────────────────────────────────────────

describe('seoDescription', () => {
  it('returns generic seo key when no auction', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.seoDescription.value).toBe('auction.seoDescription')
  })

  it('returns detail description key when auction exists', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    expect(c.seoDescription.value).toBe('auction.seoDetailDescription')
  })
})

// ─── eventJsonLd — extended scenarios ──────────────────────────────────────

describe('eventJsonLd — extended', () => {
  it('uses extended_until as endDate when present', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...sampleAuction,
      extended_until: '2026-01-08T10:00:00Z',
    } as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    expect(ld.endDate).toBe('2026-01-08T10:00:00Z')
  })

  it('uses ends_at as endDate when no extended_until', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    expect(ld.endDate).toBe('2026-01-07T10:00:00Z')
  })

  it('sets InStock availability for active auctions', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    const offers = ld.offers as Record<string, unknown>
    expect(offers.availability).toBe('https://schema.org/InStock')
  })

  it('sets OutOfStock availability for ended auctions', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = { ...sampleAuction, status: 'ended' } as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    const offers = ld.offers as Record<string, unknown>
    expect(offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('includes correct offer price from start_price_cents', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    const offers = ld.offers as Record<string, unknown>
    // 1000000 cents / 100 = 10000
    expect(offers.price).toBe('10000')
    expect(offers.priceCurrency).toBe('EUR')
  })

  it('location URL contains auction id', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = sampleAuction as unknown as typeof c.auction.value
    const ld = c.eventJsonLd.value as Record<string, unknown>
    const location = ld.location as Record<string, unknown>
    expect(location.url).toContain('a1')
  })
})

// ─── auctionTitle — brand+model fallback ─────────────────────────────────────

describe('auctionTitle fallback', () => {
  it('returns brand+model when title is empty', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...sampleAuction,
      title: '',
      vehicle: { brand: 'SCANIA', model: 'R500', vehicle_images: [] },
    } as unknown as typeof c.auction.value
    expect(c.auctionTitle.value).toBe('SCANIA R500')
  })

  it('returns trimmed string when vehicle brand/model are empty', () => {
    const c = useAuctionDetail(makeAuctionId())
    c.auction.value = {
      ...sampleAuction,
      title: '',
      vehicle: null,
    } as unknown as typeof c.auction.value
    expect(c.auctionTitle.value).toBe('')
  })
})

// ─── handlePlaceBid ──────────────────────────────────────────────────────────

describe('handlePlaceBid', () => {
  it('does not throw when called', async () => {
    const c = useAuctionDetail(makeAuctionId())
    await expect(c.handlePlaceBid(100000)).resolves.not.toThrow()
  })
})

// ─── handleIdDocUpload / handleTransportLicenseUpload ────────────────────────

describe('handleIdDocUpload', () => {
  it('does nothing when no files selected', async () => {
    const c = useAuctionDetail(makeAuctionId())
    const event = { target: { files: null } } as unknown as Event
    await c.handleIdDocUpload(event)
    expect(c.regFormIdDocumentUrl.value).toBeNull()
  })

  it('does nothing when files list is empty', async () => {
    const c = useAuctionDetail(makeAuctionId())
    const event = { target: { files: [] } } as unknown as Event
    await c.handleIdDocUpload(event)
    expect(c.regFormIdDocumentUrl.value).toBeNull()
  })
})

describe('handleTransportLicenseUpload', () => {
  it('does nothing when no files selected', async () => {
    const c = useAuctionDetail(makeAuctionId())
    const event = { target: { files: null } } as unknown as Event
    await c.handleTransportLicenseUpload(event)
    expect(c.regFormTransportLicenseUrl.value).toBeNull()
  })
})

// ─── handleSubmitRegistration ────────────────────────────────────────────────

describe('handleSubmitRegistration', () => {
  it('does nothing when id_number is empty', async () => {
    const c = useAuctionDetail(makeAuctionId())
    await c.handleSubmitRegistration({
      id_number: '',
      company_name: 'Test',
      id_document_url: null,
      transport_license_url: null,
    } as unknown as Parameters<typeof c.handleSubmitRegistration>[0])
    expect(c.showRegForm.value).toBe(false)
  })

  it('does nothing when id_number is whitespace', async () => {
    const c = useAuctionDetail(makeAuctionId())
    await c.handleSubmitRegistration({
      id_number: '   ',
      company_name: 'Test',
      id_document_url: null,
      transport_license_url: null,
    } as unknown as Parameters<typeof c.handleSubmitRegistration>[0])
    expect(c.showRegForm.value).toBe(false)
  })
})

// ─── formatDate — English locale ─────────────────────────────────────────────

describe('formatDate with English locale', () => {
  it('formats using en-GB when locale is en', () => {
    vi.stubGlobal('useI18n', () => ({ t: (key: string) => key, locale: { value: 'en' } }))
    const c = useAuctionDetail(makeAuctionId())
    const result = c.formatDate('2026-06-15T14:30:00Z')
    expect(result).toContain('2026')
    expect(typeof result).toBe('string')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls init without throwing', async () => {
    const c = useAuctionDetail(makeAuctionId())
    await expect(c.init()).resolves.not.toThrow()
  })
})

// ─── mutableBids ─────────────────────────────────────────────────────────────

describe('mutableBids', () => {
  it('returns empty array when no bids', () => {
    const c = useAuctionDetail(makeAuctionId())
    expect(c.mutableBids.value).toEqual([])
  })
})

// ─── getStatusLabel — unknown status fallback ────────────────────────────────

describe('getStatusLabel fallback', () => {
  it('returns status string for unknown status', () => {
    const c = useAuctionDetail(makeAuctionId())
    // @ts-expect-error - testing unknown status
    expect(c.getStatusLabel('future_status')).toBe('future_status')
  })
})
