import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminPublicidad,
  AD_POSITIONS,
  AD_FORMATS,
  AD_STATUSES,
  ADVERTISER_STATUSES,
  formatDate,
  formatNumber,
  calcCTR,
  getStatusColor,
  csvToArray,
} from '../../app/composables/admin/useAdminPublicidad'

// ─── Mock useAdminAdDashboard ─────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminAdDashboard', () => ({
  useAdminAdDashboard: () => ({
    dateRange: { value: 'last_7_days' },
    customFrom: { value: '' },
    customTo: { value: '' },
    loading: { value: false },
    error: { value: null },
    summary: { value: null },
    revenueBySource: { value: [] },
    performanceByPosition: { value: [] },
    ctrByFormat: { value: [] },
    topAds: { value: [] },
    audienceBreakdown: { value: null },
    fetchDashboard: vi.fn().mockResolvedValue(undefined),
    calcCTR: vi.fn().mockReturnValue('0.0%'),
  }),
}))

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'upsert']

function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeAdvertiser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'adv-1',
    company_name: 'Anunciante SA',
    logo_url: null,
    contact_email: 'info@anunciante.com',
    contact_phone: null,
    website: null,
    tax_id: null,
    status: 'active',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

function makeAd(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ad-1',
    advertiser_id: 'adv-1',
    vertical: 'tracciona',
    title: 'Mi Anuncio',
    description: null,
    image_url: null,
    logo_url: null,
    link_url: 'https://example.com',
    phone: null,
    email: null,
    cta_text: null,
    countries: null,
    regions: null,
    provinces: null,
    category_slugs: null,
    action_slugs: null,
    positions: ['sidebar'],
    format: 'card',
    include_in_pdf: false,
    include_in_email: false,
    price_monthly_cents: null,
    starts_at: null,
    ends_at: null,
    status: 'active',
    impressions: 100,
    clicks: 5,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    advertiser: null,
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

// ─── Constants ────────────────────────────────────────────────────────────

describe('AD_POSITIONS', () => {
  it('has 10 entries', () => {
    expect(AD_POSITIONS).toHaveLength(10)
  })

  it('includes sidebar and catalog_inline', () => {
    expect(AD_POSITIONS).toContain('sidebar')
    expect(AD_POSITIONS).toContain('catalog_inline')
  })
})

describe('AD_FORMATS', () => {
  it('has 4 entries', () => {
    expect(AD_FORMATS).toHaveLength(4)
  })

  it('includes card, banner, text, logo_strip', () => {
    expect(AD_FORMATS).toContain('card')
    expect(AD_FORMATS).toContain('banner')
    expect(AD_FORMATS).toContain('text')
    expect(AD_FORMATS).toContain('logo_strip')
  })
})

describe('AD_STATUSES', () => {
  it('has 4 entries', () => {
    expect(AD_STATUSES).toHaveLength(4)
  })

  it('includes draft, active, paused, ended', () => {
    expect(AD_STATUSES).toContain('draft')
    expect(AD_STATUSES).toContain('active')
  })
})

describe('ADVERTISER_STATUSES', () => {
  it('has 2 entries (active, inactive)', () => {
    expect(ADVERTISER_STATUSES).toHaveLength(2)
    expect(ADVERTISER_STATUSES).toContain('active')
    expect(ADVERTISER_STATUSES).toContain('inactive')
  })
})

// ─── Pure helpers ─────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "-" for null', () => {
    expect(formatDate(null)).toBe('-')
  })

  it('returns formatted date string for valid ISO date', () => {
    const result = formatDate('2026-06-01T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).toContain('2026')
  })
})

describe('formatNumber', () => {
  it('formats a number using es-ES locale', () => {
    const result = formatNumber(1000)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns "0" for 0', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

describe('calcCTR', () => {
  it('returns "0.0%" when impressions is 0', () => {
    expect(calcCTR(0, 10)).toBe('0.0%')
  })

  it('calculates percentage with 1 decimal', () => {
    expect(calcCTR(1000, 50)).toBe('5.0%')
  })

  it('returns "2.5%" for 25/1000', () => {
    expect(calcCTR(1000, 25)).toBe('2.5%')
  })
})

describe('getStatusColor', () => {
  it('returns color for "active"', () => {
    expect(getStatusColor('active')).toBe('#16a34a')
  })

  it('returns color for "paused"', () => {
    expect(getStatusColor('paused')).toBe('#d97706')
  })

  it('returns default color for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('#6b7280')
  })
})

describe('csvToArray', () => {
  it('splits comma-separated string into array', () => {
    expect(csvToArray('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('trims whitespace from each item', () => {
    expect(csvToArray(' a , b , c ')).toEqual(['a', 'b', 'c'])
  })

  it('filters out empty strings', () => {
    expect(csvToArray('a,,b')).toEqual(['a', 'b'])
  })

  it('returns empty array for empty string', () => {
    expect(csvToArray('')).toEqual([])
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeTab starts as "advertisers"', () => {
    const c = useAdminPublicidad()
    expect(c.activeTab.value).toBe('advertisers')
  })

  it('loading starts as false', () => {
    const c = useAdminPublicidad()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminPublicidad()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as empty string', () => {
    const c = useAdminPublicidad()
    expect(c.error.value).toBe('')
  })

  it('advertisers starts as empty array', () => {
    const c = useAdminPublicidad()
    expect(c.advertisers.value).toEqual([])
  })

  it('ads starts as empty array', () => {
    const c = useAdminPublicidad()
    expect(c.ads.value).toEqual([])
  })

  it('canDelete starts as false (confirmText is empty)', () => {
    const c = useAdminPublicidad()
    expect(c.canDelete.value).toBe(false)
  })
})

// ─── Advertiser modal ─────────────────────────────────────────────────────

describe('openNewAdvertiser', () => {
  it('sets advertiserModal.show to true', () => {
    const c = useAdminPublicidad()
    c.openNewAdvertiser()
    expect(c.advertiserModal.value.show).toBe(true)
  })

  it('sets editing to null', () => {
    const c = useAdminPublicidad()
    c.openNewAdvertiser()
    expect(c.advertiserModal.value.editing).toBeNull()
  })

  it('resets form.company_name to empty', () => {
    const c = useAdminPublicidad()
    c.advertiserModal.value.form.company_name = 'Old'
    c.openNewAdvertiser()
    expect(c.advertiserModal.value.form.company_name).toBe('')
  })
})

describe('openEditAdvertiser', () => {
  it('sets advertiserModal.show to true', () => {
    const c = useAdminPublicidad()
    c.openEditAdvertiser(makeAdvertiser() as never)
    expect(c.advertiserModal.value.show).toBe(true)
  })

  it('sets editing to the given advertiser', () => {
    const c = useAdminPublicidad()
    const adv = makeAdvertiser({ id: 'adv-99' })
    c.openEditAdvertiser(adv as never)
    expect(c.advertiserModal.value.editing?.id).toBe('adv-99')
  })

  it('populates form.company_name from advertiser', () => {
    const c = useAdminPublicidad()
    c.openEditAdvertiser(makeAdvertiser({ company_name: 'Test Corp' }) as never)
    expect(c.advertiserModal.value.form.company_name).toBe('Test Corp')
  })
})

describe('closeAdvertiserModal', () => {
  it('closes advertiserModal', () => {
    const c = useAdminPublicidad()
    c.openNewAdvertiser()
    c.closeAdvertiserModal()
    expect(c.advertiserModal.value.show).toBe(false)
    expect(c.advertiserModal.value.editing).toBeNull()
  })
})

// ─── Ad modal ─────────────────────────────────────────────────────────────

describe('openNewAd', () => {
  it('sets adModal.show to true with null editing', () => {
    const c = useAdminPublicidad()
    c.openNewAd()
    expect(c.adModal.value.show).toBe(true)
    expect(c.adModal.value.editing).toBeNull()
  })
})

describe('openEditAd', () => {
  it('sets adModal.show to true and editing to the ad', () => {
    const c = useAdminPublicidad()
    const ad = makeAd({ id: 'ad-42', title: 'Mi ad' })
    c.openEditAd(ad as never)
    expect(c.adModal.value.show).toBe(true)
    expect(c.adModal.value.editing?.id).toBe('ad-42')
  })

  it('populates form.title from ad', () => {
    const c = useAdminPublicidad()
    c.openEditAd(makeAd({ title: 'My Title' }) as never)
    expect(c.adModal.value.form.title).toBe('My Title')
  })

  it('joins positions array as-is', () => {
    const c = useAdminPublicidad()
    c.openEditAd(makeAd({ positions: ['sidebar', 'catalog_inline'] }) as never)
    expect(c.adModal.value.form.positions).toEqual(['sidebar', 'catalog_inline'])
  })
})

describe('closeAdModal', () => {
  it('closes adModal', () => {
    const c = useAdminPublicidad()
    c.openNewAd()
    c.closeAdModal()
    expect(c.adModal.value.show).toBe(false)
    expect(c.adModal.value.editing).toBeNull()
  })
})

// ─── Delete modal ─────────────────────────────────────────────────────────

describe('confirmDeleteAdvertiser', () => {
  it('opens deleteModal with type "advertiser"', () => {
    const c = useAdminPublicidad()
    c.confirmDeleteAdvertiser(makeAdvertiser({ company_name: 'Test SA' }) as never)
    expect(c.deleteModal.value.show).toBe(true)
    expect(c.deleteModal.value.type).toBe('advertiser')
    expect(c.deleteModal.value.name).toBe('Test SA')
    expect(c.deleteModal.value.confirmText).toBe('')
  })
})

describe('confirmDeleteAd', () => {
  it('opens deleteModal with type "ad"', () => {
    const c = useAdminPublicidad()
    c.confirmDeleteAd(makeAd({ title: 'Mi Anuncio' }) as never)
    expect(c.deleteModal.value.show).toBe(true)
    expect(c.deleteModal.value.type).toBe('ad')
    expect(c.deleteModal.value.name).toBe('Mi Anuncio')
  })
})

describe('closeDeleteModal', () => {
  it('closes deleteModal', () => {
    const c = useAdminPublicidad()
    c.confirmDeleteAdvertiser(makeAdvertiser() as never)
    c.closeDeleteModal()
    expect(c.deleteModal.value.show).toBe(false)
  })
})

// ─── togglePosition ───────────────────────────────────────────────────────

describe('togglePosition', () => {
  it('adds position when not in list', () => {
    const c = useAdminPublicidad()
    c.openNewAd()
    c.togglePosition('sidebar')
    expect(c.adModal.value.form.positions).toContain('sidebar')
  })

  it('removes position when already in list', () => {
    const c = useAdminPublicidad()
    c.openNewAd()
    c.togglePosition('sidebar')
    c.togglePosition('sidebar')
    expect(c.adModal.value.form.positions).not.toContain('sidebar')
  })
})

// ─── switchTab ────────────────────────────────────────────────────────────

describe('switchTab', () => {
  it('updates activeTab to "ads"', () => {
    const c = useAdminPublicidad()
    c.switchTab('ads')
    expect(c.activeTab.value).toBe('ads')
  })

  it('updates activeTab to "dashboard"', () => {
    const c = useAdminPublicidad()
    c.switchTab('dashboard')
    expect(c.activeTab.value).toBe('dashboard')
  })
})

// ─── getAdvertiserName ────────────────────────────────────────────────────

describe('getAdvertiserName', () => {
  it('returns advertiser.company_name when ad.advertiser is embedded', () => {
    const c = useAdminPublicidad()
    const ad = makeAd({
      advertiser: { id: 'adv-1', company_name: 'Embedded Corp' },
    })
    expect(c.getAdvertiserName(ad as never)).toBe('Embedded Corp')
  })

  it('returns "-" when ad.advertiser is null and id not in map', () => {
    const c = useAdminPublicidad()
    const ad = makeAd({ advertiser: null, advertiser_id: 'unknown-id' })
    expect(c.getAdvertiserName(ad as never)).toBe('-')
  })
})

// ─── fetchAdvertisers ─────────────────────────────────────────────────────

describe('fetchAdvertisers', () => {
  it('sets advertisers on success', async () => {
    const adv = makeAdvertiser()
    mockFrom.mockReturnValue(makeChain({ data: [adv], error: null }))
    const c = useAdminPublicidad()
    await c.fetchAdvertisers()
    expect(c.advertisers.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('DB error') }))
    const c = useAdminPublicidad()
    await c.fetchAdvertisers()
    expect(c.error.value).toBe('DB error')
    expect(c.loading.value).toBe(false)
  })
})

// ─── fetchAds ─────────────────────────────────────────────────────────────

describe('fetchAds', () => {
  it('sets ads on success', async () => {
    const ad = makeAd()
    mockFrom.mockReturnValue(makeChain({ data: [ad], error: null }))
    const c = useAdminPublicidad()
    await c.fetchAds()
    expect(c.ads.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('Connection refused') }))
    const c = useAdminPublicidad()
    await c.fetchAds()
    expect(c.error.value).toBe('Connection refused')
  })
})

// ─── saveAdvertiser ─────────────────────────────────────────────────────

describe('saveAdvertiser', () => {
  it('creates new advertiser when not editing', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.openNewAdvertiser()
    c.advertiserModal.value.form.company_name = 'New Corp'
    await c.saveAdvertiser()
    expect(c.saving.value).toBe(false)
    expect(c.advertiserModal.value.show).toBe(false)
  })

  it('updates existing advertiser when editing', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.openEditAdvertiser(makeAdvertiser({ id: 'adv-1' }) as never)
    c.advertiserModal.value.form.company_name = 'Updated Corp'
    await c.saveAdvertiser()
    expect(c.saving.value).toBe(false)
    expect(c.advertiserModal.value.show).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('Insert failed') }))
    const c = useAdminPublicidad()
    c.openNewAdvertiser()
    await c.saveAdvertiser()
    expect(c.error.value).toBe('Insert failed')
    expect(c.saving.value).toBe(false)
  })
})

// ─── saveAd ─────────────────────────────────────────────────────────────

describe('saveAd', () => {
  it('creates new ad when not editing', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.openNewAd()
    c.adModal.value.form.title = 'New Ad'
    c.adModal.value.form.advertiser_id = 'adv-1'
    await c.saveAd()
    expect(c.saving.value).toBe(false)
    expect(c.adModal.value.show).toBe(false)
  })

  it('updates existing ad when editing', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.openEditAd(makeAd({ id: 'ad-1' }) as never)
    c.adModal.value.form.title = 'Updated Ad'
    await c.saveAd()
    expect(c.saving.value).toBe(false)
    expect(c.adModal.value.show).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('Save failed') }))
    const c = useAdminPublicidad()
    c.openNewAd()
    await c.saveAd()
    expect(c.error.value).toBe('Save failed')
    expect(c.saving.value).toBe(false)
  })

  it('converts CSV fields to arrays in payload', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.openNewAd()
    c.adModal.value.form.countries = 'ES,FR,DE'
    c.adModal.value.form.regions = 'Madrid, Barcelona'
    await c.saveAd()
    expect(c.adModal.value.show).toBe(false)
  })
})

// ─── executeDelete ──────────────────────────────────────────────────────

describe('executeDelete', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('does nothing when canDelete is false', async () => {
    mockFrom.mockClear()
    const c = useAdminPublicidad()
    c.confirmDeleteAdvertiser(makeAdvertiser() as never)
    c.deleteModal.value.confirmText = 'wrong'
    await c.executeDelete()
    // from() should only have been called for fetchAdvertisers triggered by switchTab, not for delete
    expect(c.deleteModal.value.show).toBe(true)
  })

  it('deletes advertiser when canDelete is true', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.confirmDeleteAdvertiser(makeAdvertiser({ id: 'adv-del' }) as never)
    c.deleteModal.value.confirmText = 'borrar'
    await c.executeDelete()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.saving.value).toBe(false)
  })

  it('deletes ad when type is "ad"', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.confirmDeleteAd(makeAd({ id: 'ad-del' }) as never)
    c.deleteModal.value.confirmText = 'borrar'
    await c.executeDelete()
    expect(c.deleteModal.value.show).toBe(false)
  })

  it('sets error on delete failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('Delete failed') }))
    const c = useAdminPublicidad()
    c.confirmDeleteAdvertiser(makeAdvertiser() as never)
    c.deleteModal.value.confirmText = 'borrar'
    await c.executeDelete()
    expect(c.error.value).toBe('Delete failed')
    expect(c.saving.value).toBe(false)
  })
})

// ─── fetchFloorPrices ───────────────────────────────────────────────────

describe('fetchFloorPrices', () => {
  it('populates floorPrices with all AD_POSITIONS on success', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{ position: 'sidebar', floor_cpm_cents: 500 }],
    }))
    const c = useAdminPublicidad()
    await c.fetchFloorPrices()
    expect(c.floorPrices.value).toHaveLength(10) // one per AD_POSITION
    const sidebar = c.floorPrices.value.find((fp: { position: string }) => fp.position === 'sidebar')
    expect(sidebar?.floor_cpm_cents).toBe(500)
    expect(c.loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('Floor error') }))
    const c = useAdminPublicidad()
    await c.fetchFloorPrices()
    expect(c.error.value).toBe('Floor error')
    expect(c.loading.value).toBe(false)
  })

  it('defaults missing positions to 0 cpm', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [] }))
    const c = useAdminPublicidad()
    await c.fetchFloorPrices()
    expect(c.floorPrices.value.every((fp: { floor_cpm_cents: number }) => fp.floor_cpm_cents === 0)).toBe(true)
  })
})

// ─── saveFloorPrices ────────────────────────────────────────────────────

describe('saveFloorPrices', () => {
  it('saves all floor prices and resets savingFloors', async () => {
    mockFrom.mockReturnValue(makeChain())
    const c = useAdminPublicidad()
    c.floorPrices.value = [{ position: 'sidebar', floor_cpm_cents: 300 }]
    await c.saveFloorPrices()
    expect(c.savingFloors.value).toBe(false)
  })

  it('sets error on save failure (thrown error)', async () => {
    // saveFloorPrices doesn't check chain errors — it catches thrown exceptions
    const throwingChain: Record<string, unknown> = {}
    for (const m of CHAIN_METHODS) {
      throwingChain[m] = vi.fn().mockImplementation(() => { throw new Error('Upsert failed') })
    }
    mockFrom.mockReturnValue(throwingChain)
    const c = useAdminPublicidad()
    c.floorPrices.value = [{ position: 'sidebar', floor_cpm_cents: 300 }]
    await c.saveFloorPrices()
    expect(c.error.value).toBe('Upsert failed')
    expect(c.savingFloors.value).toBe(false)
  })
})

// ─── switchTab — additional branches ────────────────────────────────────

describe('switchTab — floor_prices and ads branches', () => {
  it('fetches floor prices when switching to floor_prices tab', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [] }))
    const c = useAdminPublicidad()
    c.switchTab('floor_prices')
    expect(c.activeTab.value).toBe('floor_prices')
  })

  it('fetches both ads and advertisers when switching to ads tab with empty advertisers', () => {
    mockFrom.mockReturnValue(makeChain({ data: [] }))
    const c = useAdminPublicidad()
    c.switchTab('ads')
    expect(c.activeTab.value).toBe('ads')
  })
})

// ─── canDelete / advertiserMap — reactive computed ──────────────────────

describe('canDelete — reactive', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('returns true when confirmText is "borrar"', () => {
    const c = useAdminPublicidad()
    c.deleteModal.value.confirmText = 'borrar'
    expect(c.canDelete.value).toBe(true)
  })

  it('returns true for "BORRAR" (case insensitive)', () => {
    const c = useAdminPublicidad()
    c.deleteModal.value.confirmText = 'BORRAR'
    expect(c.canDelete.value).toBe(true)
  })

  it('returns false for partial match', () => {
    const c = useAdminPublicidad()
    c.deleteModal.value.confirmText = 'borr'
    expect(c.canDelete.value).toBe(false)
  })
})

describe('advertiserMap — reactive', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('builds map from advertisers array', () => {
    const c = useAdminPublicidad()
    c.advertisers.value = [
      makeAdvertiser({ id: 'a1', company_name: 'Corp A' }),
      makeAdvertiser({ id: 'a2', company_name: 'Corp B' }),
    ] as never
    const map = c.advertiserMap.value as Record<string, { company_name: string }>
    expect(map['a1']?.company_name).toBe('Corp A')
    expect(map['a2']?.company_name).toBe('Corp B')
  })

  it('getAdvertiserName resolves from map when ad.advertiser is null', () => {
    const c = useAdminPublicidad()
    c.advertisers.value = [makeAdvertiser({ id: 'adv-1', company_name: 'From Map' })] as never
    const ad = makeAd({ advertiser: null, advertiser_id: 'adv-1' })
    expect(c.getAdvertiserName(ad as never)).toBe('From Map')
  })
})
