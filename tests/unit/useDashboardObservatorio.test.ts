import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))

const mockDealerProfile = { value: null as { id: string } | null }
const mockLoadDealer = vi.fn()

vi.stubGlobal('useDealerDashboard', () => ({
  dealerProfile: mockDealerProfile,
  loadDealer: mockLoadDealer,
}))

const mockCurrentPlan = { value: 'premium' }
const mockFetchSubscription = vi.fn()

vi.stubGlobal('useSubscriptionPlan', () => ({
  currentPlan: mockCurrentPlan,
  fetchSubscription: mockFetchSubscription,
}))

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import {
  useDashboardObservatorio,
  STATUS_OPTIONS,
  type CompetitorVehicle,
  type CompetitorVehicleForm,
  type Platform,
  type DealerPlatform,
} from '../../app/composables/dashboard/useDashboardObservatorio'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<CompetitorVehicle> = {}): CompetitorVehicle {
  return {
    id: 'entry-1',
    dealer_id: 'dealer-1',
    platform_id: 'platform-1',
    url: 'https://example.com/listing',
    brand: 'Volvo',
    model: 'FH',
    year: 2020,
    price: 75000,
    location: 'Madrid',
    notes: 'Great deal',
    status: 'watching',
    created_at: '2026-01-01',
    updated_at: null,
    ...overrides,
  }
}

function makeForm(overrides: Partial<CompetitorVehicleForm> = {}): CompetitorVehicleForm {
  return {
    platform_id: 'platform-1',
    url: 'https://example.com',
    brand: 'Volvo',
    model: 'FH',
    year: '2020',
    price: '75000',
    location: 'Madrid',
    notes: 'Good truck',
    status: 'watching',
    ...overrides,
  }
}

function makePlatform(overrides: Partial<Platform> = {}): Platform {
  return {
    id: 'platform-1',
    name: 'Milanuncios',
    slug: 'milanuncios',
    is_default: true,
    ...overrides,
  }
}

function makeDealerPlatform(overrides: Partial<DealerPlatform> = {}): DealerPlatform {
  return {
    id: 'dp-1',
    dealer_id: 'dealer-1',
    platform_id: 'platform-1',
    custom_name: null,
    ...overrides,
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' } // set before composable creation
  mockLoadDealer.mockResolvedValue(null)
  mockCurrentPlan.value = 'premium'
  mockFetchSubscription.mockResolvedValue(undefined)
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
})

// ─── Exported constants ───────────────────────────────────────────────────

describe('STATUS_OPTIONS', () => {
  it('has 3 statuses: watching, sold, expired', () => {
    expect(STATUS_OPTIONS).toHaveLength(3)
    expect(STATUS_OPTIONS).toContain('watching')
    expect(STATUS_OPTIONS).toContain('sold')
    expect(STATUS_OPTIONS).toContain('expired')
  })
})

// ─── isPremium computed ───────────────────────────────────────────────────

describe('isPremium', () => {
  it('is true when plan is premium', () => {
    mockCurrentPlan.value = 'premium'
    const c = useDashboardObservatorio()
    expect(c.isPremium.value).toBe(true)
  })

  it('is true when plan is founding', () => {
    mockCurrentPlan.value = 'founding'
    const c = useDashboardObservatorio()
    expect(c.isPremium.value).toBe(true)
  })

  it('is false when plan is basic', () => {
    mockCurrentPlan.value = 'basic'
    const c = useDashboardObservatorio()
    expect(c.isPremium.value).toBe(false)
  })

  it('is false when plan is free', () => {
    mockCurrentPlan.value = 'free'
    const c = useDashboardObservatorio()
    expect(c.isPremium.value).toBe(false)
  })
})

// ─── Helper functions ─────────────────────────────────────────────────────

describe('getStatusClass', () => {
  it('returns status-watching for watching', () => {
    const c = useDashboardObservatorio()
    expect(c.getStatusClass('watching')).toBe('status-watching')
  })

  it('returns status-sold for sold', () => {
    const c = useDashboardObservatorio()
    expect(c.getStatusClass('sold')).toBe('status-sold')
  })

  it('returns status-expired for expired', () => {
    const c = useDashboardObservatorio()
    expect(c.getStatusClass('expired')).toBe('status-expired')
  })
})

describe('getPlatformColor', () => {
  it('returns grey for null platformId', () => {
    const c = useDashboardObservatorio()
    expect(c.getPlatformColor(null)).toBe('#94a3b8')
  })

  it('returns first color for platform at index 0', () => {
    const c = useDashboardObservatorio()
    c.platforms.value = [makePlatform({ id: 'p-1' })]
    const color = c.getPlatformColor('p-1')
    expect(color).toBe('#23424A')
  })

  it('returns grey for platform id not found in list', () => {
    const c = useDashboardObservatorio()
    c.platforms.value = []
    expect(c.getPlatformColor('nonexistent')).toBe('#94a3b8')
  })
})

// ─── Entry modal ──────────────────────────────────────────────────────────

describe('openAddEntry', () => {
  it('clears editingEntry and shows modal with empty form', () => {
    const c = useDashboardObservatorio()
    c.editingEntry.value = makeEntry()
    c.openAddEntry()
    expect(c.editingEntry.value).toBeNull()
    expect(c.showEntryModal.value).toBe(true)
    expect(c.entryForm.value.brand).toBe('')
    expect(c.entryForm.value.model).toBe('')
  })
})

describe('openEditEntry', () => {
  it('populates form from entry and shows modal', () => {
    const c = useDashboardObservatorio()
    const entry = makeEntry({
      brand: 'DAF', model: 'CF', year: 2019,
      price: 60000, location: 'Barcelona', notes: 'Clean', status: 'sold',
    })
    c.openEditEntry(entry)
    expect(c.editingEntry.value).toBe(entry)
    expect(c.showEntryModal.value).toBe(true)
    expect(c.entryForm.value.brand).toBe('DAF')
    expect(c.entryForm.value.model).toBe('CF')
    expect(c.entryForm.value.year).toBe('2019')
    expect(c.entryForm.value.price).toBe('60000')
    expect(c.entryForm.value.status).toBe('sold')
  })

  it('converts null optional fields to empty strings', () => {
    const c = useDashboardObservatorio()
    const entry = makeEntry({ platform_id: null, url: null, year: null, price: null, location: null, notes: null })
    c.openEditEntry(entry)
    expect(c.entryForm.value.platform_id).toBe('')
    expect(c.entryForm.value.url).toBe('')
    expect(c.entryForm.value.year).toBe('')
    expect(c.entryForm.value.price).toBe('')
    expect(c.entryForm.value.location).toBe('')
    expect(c.entryForm.value.notes).toBe('')
  })
})

describe('closeEntryModal', () => {
  it('hides modal and resets entryForm', () => {
    const c = useDashboardObservatorio()
    c.openAddEntry()
    c.closeEntryModal()
    expect(c.showEntryModal.value).toBe(false)
    expect(c.editingEntry.value).toBeNull()
    expect(c.entryForm.value.brand).toBe('')
  })
})

// ─── saveEntry ────────────────────────────────────────────────────────────

describe('saveEntry', () => {
  it('does nothing when brand is empty', async () => {
    const c = useDashboardObservatorio()
    c.entryForm.value = makeForm({ brand: '' })
    await c.saveEntry()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does nothing when model is empty', async () => {
    const c = useDashboardObservatorio()
    c.entryForm.value = makeForm({ model: '' })
    await c.saveEntry()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase insert when editingEntry is null', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardObservatorio()
    c.editingEntry.value = null
    c.entryForm.value = makeForm()
    await c.saveEntry()
    expect(mockFrom).toHaveBeenCalledWith('competitor_vehicles')
    expect(c.showEntryModal.value).toBe(false)
  })

  it('calls supabase update when editingEntry is set', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardObservatorio()
    c.editingEntry.value = makeEntry({ id: 'entry-edit' })
    c.entryForm.value = makeForm({ brand: 'MAN' })
    await c.saveEntry()
    expect(c.showEntryModal.value).toBe(false)
  })

  it('does not close modal on save error', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: new Error('Save failed') }))
    const c = useDashboardObservatorio()
    c.editingEntry.value = null
    c.entryForm.value = makeForm()
    c.showEntryModal.value = true
    await c.saveEntry()
    expect(c.showEntryModal.value).toBe(true) // stays open on failure
    expect(c.error.value).toBeTruthy()
  })
})

// ─── handleDelete (double-confirm pattern) ────────────────────────────────

describe('handleDelete', () => {
  it('sets confirmDeleteId on first call', async () => {
    vi.useFakeTimers()
    const c = useDashboardObservatorio()
    await c.handleDelete('entry-1')
    expect(c.confirmDeleteId.value).toBe('entry-1')
    vi.useRealTimers()
  })

  it('deletes entry on second call with same id', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardObservatorio()
    c.entries.value = [makeEntry({ id: 'entry-1' })]
    c.confirmDeleteId.value = 'entry-1' // simulate first click already done
    await c.handleDelete('entry-1')
    expect(c.entries.value).toHaveLength(0)
    expect(c.confirmDeleteId.value).toBeNull()
  })

  it('clears confirmDeleteId after 3s timeout', async () => {
    vi.useFakeTimers()
    const c = useDashboardObservatorio()
    await c.handleDelete('entry-99')
    expect(c.confirmDeleteId.value).toBe('entry-99')
    vi.advanceTimersByTime(3001)
    expect(c.confirmDeleteId.value).toBeNull()
    vi.useRealTimers()
  })
})

// ─── Platform modal ───────────────────────────────────────────────────────

describe('platform modal', () => {
  it('openPlatformSettings shows modal', () => {
    const c = useDashboardObservatorio()
    c.openPlatformSettings()
    expect(c.showPlatformModal.value).toBe(true)
  })

  it('closePlatformSettings hides modal', () => {
    const c = useDashboardObservatorio()
    c.openPlatformSettings()
    c.closePlatformSettings()
    expect(c.showPlatformModal.value).toBe(false)
  })
})

// ─── togglePlatform ───────────────────────────────────────────────────────

describe('togglePlatform', () => {
  it('calls addPlatform (insert) when platform not active', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardObservatorio()
    // activePlatformIds computed is empty at creation
    await c.togglePlatform('platform-1')
    expect(mockFrom).toHaveBeenCalledWith('dealer_platforms')
  })

  it('calls removePlatform (delete) when platform is active', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardObservatorio()
    // Override activePlatformIds to include the platform
    c.activePlatformIds.value = new Set(['platform-1'])
    c.dealerPlatforms.value = [makeDealerPlatform({ platform_id: 'platform-1' })]
    await c.togglePlatform('platform-1')
    expect(mockFrom).toHaveBeenCalled()
    // After remove, local list should be filtered
    expect(c.dealerPlatforms.value).toHaveLength(0)
  })
})

// ─── Computed filter state ────────────────────────────────────────────────

describe('computed filter state', () => {
  it('platformMap is empty initially', () => {
    const c = useDashboardObservatorio()
    expect(c.platformMap.value.size).toBe(0)
  })

  it('activePlatformIds is empty initially', () => {
    const c = useDashboardObservatorio()
    expect(c.activePlatformIds.value.size).toBe(0)
  })

  it('selectablePlatforms is empty initially', () => {
    const c = useDashboardObservatorio()
    expect(c.selectablePlatforms.value).toEqual([])
  })

  it('filteredEntries is empty initially', () => {
    const c = useDashboardObservatorio()
    expect(c.filteredEntries.value).toEqual([])
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('returns early when no dealer', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue(null)
    const c = useDashboardObservatorio()
    await c.init()
    expect(mockFetchSubscription).not.toHaveBeenCalled()
  })

  it('fetches subscription when dealer is available', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockCurrentPlan.value = 'premium'
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardObservatorio()
    await c.init()
    expect(mockFetchSubscription).toHaveBeenCalledOnce()
  })

  it('does not call supabase when plan is not premium', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockCurrentPlan.value = 'free'
    const c = useDashboardObservatorio()
    await c.init()
    expect(mockFetchSubscription).toHaveBeenCalledOnce()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase when plan is premium (loads entries+platforms+dealerPlatforms)', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockCurrentPlan.value = 'premium'
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardObservatorio()
    await c.init()
    expect(mockFrom).toHaveBeenCalled()
  })

  it('uses loadDealer when dealerProfile is null', async () => {
    mockDealerProfile.value = null
    const dealer = { id: 'dealer-via-load' }
    mockLoadDealer.mockResolvedValue(dealer)
    mockCurrentPlan.value = 'free'
    const c = useDashboardObservatorio()
    await c.init()
    expect(mockLoadDealer).toHaveBeenCalled()
  })
})
