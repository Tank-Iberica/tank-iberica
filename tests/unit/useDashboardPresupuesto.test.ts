import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardPresupuesto } from '../../app/composables/dashboard/useDashboardPresupuesto'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1' } as unknown }

function makeChain(data: unknown = [], count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'insert'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error: null, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const sampleVehicle = {
  id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020, price: 50000,
  slug: 'volvo-fh-2020',
  vehicle_images: [{ url: 'https://cdn/img.jpg', position: 0 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain([sampleVehicle]),
  }))
  vi.stubGlobal('formatPrice', (n: number) => n.toLocaleString())
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as false', () => {
    const c = useDashboardPresupuesto()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useDashboardPresupuesto()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardPresupuesto()
    expect(c.error.value).toBeNull()
  })

  it('selectedVehicle starts as null', () => {
    const c = useDashboardPresupuesto()
    expect(c.selectedVehicle.value).toBeNull()
  })

  it('validityDays starts as 15', () => {
    const c = useDashboardPresupuesto()
    expect(c.validityDays.value).toBe(15)
  })

  it('optionalServices starts with 4 items', () => {
    const c = useDashboardPresupuesto()
    expect(c.optionalServices.value).toHaveLength(4)
  })

  it('vehicles starts as empty array', () => {
    const c = useDashboardPresupuesto()
    expect(c.vehicles.value).toHaveLength(0)
  })
})

// ─── vehiclePrice ─────────────────────────────────────────────────────────────

describe('vehiclePrice', () => {
  it('returns 0 when no vehicle selected', () => {
    const c = useDashboardPresupuesto()
    expect(c.vehiclePrice.value).toBe(0)
  })

  it('returns vehicle price when selected', () => {
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    expect(c.vehiclePrice.value).toBe(50000)
  })
})

// ─── selectedServicesTotal ────────────────────────────────────────────────────

describe('selectedServicesTotal', () => {
  it('returns 0 when no services enabled', () => {
    const c = useDashboardPresupuesto()
    expect(c.selectedServicesTotal.value).toBe(0)
  })

  it('sums amounts of enabled non-quoteOnly services', () => {
    const c = useDashboardPresupuesto()
    // transport=600, transfer=250 when enabled
    c.optionalServices.value[0].enabled = true  // transport 600
    c.optionalServices.value[1].enabled = true  // transfer 250
    expect(c.selectedServicesTotal.value).toBe(850)
  })

  it('excludes isQuoteOnly services from total', () => {
    const c = useDashboardPresupuesto()
    // insurance is isQuoteOnly
    const insurance = c.optionalServices.value.find((s) => s.key === 'insurance')!
    insurance.enabled = true
    insurance.amount = 500
    expect(c.selectedServicesTotal.value).toBe(0)
  })
})

// ─── totalAmount ──────────────────────────────────────────────────────────────

describe('totalAmount', () => {
  it('equals vehiclePrice + selectedServicesTotal', () => {
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.optionalServices.value[0].enabled = true // transport 600
    expect(c.totalAmount.value).toBe(50600)
  })
})

// ─── filteredVehicles ─────────────────────────────────────────────────────────

describe('filteredVehicles', () => {
  it('returns all vehicles when searchQuery is empty', () => {
    const c = useDashboardPresupuesto()
    c.vehicles.value = [sampleVehicle]
    expect(c.filteredVehicles.value).toHaveLength(1)
  })

  it('filters by brand', () => {
    const c = useDashboardPresupuesto()
    c.vehicles.value = [
      sampleVehicle,
      { ...sampleVehicle, id: 'v-2', brand: 'Mercedes', model: 'Actros' },
    ]
    c.searchQuery.value = 'volvo'
    expect(c.filteredVehicles.value).toHaveLength(1)
    expect(c.filteredVehicles.value[0].brand).toBe('Volvo')
  })

  it('filters by model', () => {
    const c = useDashboardPresupuesto()
    c.vehicles.value = [sampleVehicle]
    c.searchQuery.value = 'FH'
    expect(c.filteredVehicles.value).toHaveLength(1)
  })

  it('returns empty when no match', () => {
    const c = useDashboardPresupuesto()
    c.vehicles.value = [sampleVehicle]
    c.searchQuery.value = 'xyz123'
    expect(c.filteredVehicles.value).toHaveLength(0)
  })
})

// ─── vehicleThumbnail / vehicleTitle ─────────────────────────────────────────

describe('vehicleThumbnail', () => {
  it('returns null when no vehicle selected', () => {
    const c = useDashboardPresupuesto()
    expect(c.vehicleThumbnail.value).toBeNull()
  })

  it('returns first image url', () => {
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    expect(c.vehicleThumbnail.value).toBe('https://cdn/img.jpg')
  })
})

describe('vehicleTitle', () => {
  it('returns empty string when no vehicle selected', () => {
    const c = useDashboardPresupuesto()
    expect(c.vehicleTitle.value).toBe('')
  })

  it('returns brand + model + year string', () => {
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    expect(c.vehicleTitle.value).toContain('Volvo')
    expect(c.vehicleTitle.value).toContain('FH')
  })
})

// ─── selectVehicle / clearVehicle ────────────────────────────────────────────

describe('selectVehicle / clearVehicle', () => {
  it('selectVehicle sets selectedVehicle and sets search to vehicle name', () => {
    const c = useDashboardPresupuesto()
    c.selectVehicle(sampleVehicle)
    expect(c.selectedVehicle.value?.id).toBe('v-1')
    expect(c.searchQuery.value).toBe('Volvo FH')
  })

  it('clearVehicle resets selectedVehicle', () => {
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clearVehicle()
    expect(c.selectedVehicle.value).toBeNull()
  })
})

// ─── toggleService / updateServiceAmount ──────────────────────────────────────

describe('toggleService', () => {
  it('enables a service by key', () => {
    const c = useDashboardPresupuesto()
    c.toggleService('transport', true)
    const svc = c.optionalServices.value.find((s) => s.key === 'transport')
    expect(svc?.enabled).toBe(true)
  })

  it('disables a service by key', () => {
    const c = useDashboardPresupuesto()
    c.optionalServices.value[0].enabled = true
    c.toggleService('transport', false)
    expect(c.optionalServices.value[0].enabled).toBe(false)
  })

  it('does nothing for unknown key', () => {
    const c = useDashboardPresupuesto()
    expect(() => c.toggleService('unknown-key', true)).not.toThrow()
  })
})

describe('updateServiceAmount', () => {
  it('updates amount for a service', () => {
    const c = useDashboardPresupuesto()
    c.updateServiceAmount('transport', 750)
    const svc = c.optionalServices.value.find((s) => s.key === 'transport')
    expect(svc?.amount).toBe(750)
  })
})

// ─── saveQuote ────────────────────────────────────────────────────────────────

describe('saveQuote', () => {
  it('sets error when no vehicle selected', async () => {
    const c = useDashboardPresupuesto()
    await c.saveQuote()
    expect(c.error.value).toBeTruthy()
  })

  it('sets error when no client name', async () => {
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clientName.value = ''
    await c.saveQuote()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('loads vehicles', async () => {
    const c = useDashboardPresupuesto()
    await c.init()
    expect(c.vehicles.value).toHaveLength(1)
  })

  it('does not throw when no dealer', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardPresupuesto()
    await expect(c.init()).resolves.toBeUndefined()
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => {
        const chain: Record<string, unknown> = {}
        ;['eq', 'order', 'select', 'insert'].forEach((m) => { chain[m] = () => chain })
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'DB down' } }).then(resolve)
        chain.catch = (reject: (e: unknown) => void) => Promise.resolve({ data: null, error: { message: 'DB down' } }).catch(reject)
        return chain
      },
    }))
    const c = useDashboardPresupuesto()
    await c.init()
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('generates quote number P-YYYY-NNN', async () => {
    const c = useDashboardPresupuesto()
    await c.init()
    expect(c.quoteNumber.value).toMatch(/^P-\d{4}-\d{3}$/)
  })
})

// ─── saveQuote success path ──────────────────────────────────────────────────

describe('saveQuote — success path', () => {
  it('saves quote and sets success message', async () => {
    const insertFn = vi.fn(() => Promise.resolve({ data: null, error: null }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealer_quotes') {
          return {
            ...makeChain([], 0),
            insert: insertFn,
            select: () => makeChain([], 1),
          }
        }
        return makeChain([sampleVehicle])
      },
    }))
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clientName.value = 'Test Client'
    await c.saveQuote()
    expect(insertFn).toHaveBeenCalled()
    expect(c.successMessage.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('sets error when insert fails', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([], 0),
        insert: () => Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
      }),
    }))
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clientName.value = 'Test Client'
    await c.saveQuote()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('does nothing when dealer is null during save', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clientName.value = 'Test'
    await c.saveQuote()
    // No error thrown, saving should be false
    expect(c.saving.value).toBe(false)
  })
})

// ─── generatePdf ─────────────────────────────────────────────────────────────

describe('generatePdf', () => {
  it('sets error when no vehicle selected', async () => {
    const c = useDashboardPresupuesto()
    await c.generatePdf()
    expect(c.error.value).toBeTruthy()
  })

  it('sets error when no client name', async () => {
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clientName.value = ''
    await c.generatePdf()
    expect(c.error.value).toBeTruthy()
  })

  it('opens print window when vehicle and client set', async () => {
    const writeFn = vi.fn()
    const closeFn = vi.fn()
    const focusFn = vi.fn()
    const printFn = vi.fn()
    vi.stubGlobal('open', () => ({
      document: { write: writeFn, close: closeFn },
      focus: focusFn,
      print: printFn,
    }))
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clientName.value = 'Test Client'
    await c.generatePdf()
    expect(writeFn).toHaveBeenCalled()
    expect(closeFn).toHaveBeenCalled()
    expect(focusFn).toHaveBeenCalled()
    expect(c.generatingPdf.value).toBe(false)
  })

  it('does nothing when dealer is null', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardPresupuesto()
    c.selectedVehicle.value = sampleVehicle
    c.clientName.value = 'Test'
    await c.generatePdf()
    expect(c.generatingPdf.value).toBe(false)
  })
})

// ─── handleSearchFocus / handleSearchBlur ────────────────────────────────────

describe('handleSearchFocus / handleSearchBlur', () => {
  it('handleSearchFocus sets showDropdown to true', () => {
    const c = useDashboardPresupuesto()
    c.handleSearchFocus()
    expect(c.showDropdown.value).toBe(true)
  })

  it('handleSearchBlur eventually sets showDropdown to false', async () => {
    vi.useFakeTimers()
    const c = useDashboardPresupuesto()
    c.showDropdown.value = true
    c.handleSearchBlur()
    vi.advanceTimersByTime(300)
    expect(c.showDropdown.value).toBe(false)
    vi.useRealTimers()
  })
})
