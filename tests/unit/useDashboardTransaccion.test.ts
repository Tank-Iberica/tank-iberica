import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardTransaccion } from '../../app/composables/dashboard/useDashboardTransaccion'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1' } as unknown }

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'update', 'single'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const sampleVehicle = {
  id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020, price: 50000,
  acquisition_cost: 40000, status: 'published', dealer_id: 'dealer-1',
  maintenance_records: [{ cost: 1000 }, { cost: 500 }],
  rental_records: [{ amount: 2000 }],
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
  vi.stubGlobal('useRouter', () => ({ push: vi.fn() }))
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain(sampleVehicle),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeTab starts as rent', () => {
    const c = useDashboardTransaccion('v-1')
    expect(c.activeTab.value).toBe('rent')
  })

  it('loading starts as true', () => {
    const c = useDashboardTransaccion('v-1')
    expect(c.loading.value).toBe(true)
  })

  it('submitting starts as false', () => {
    const c = useDashboardTransaccion('v-1')
    expect(c.submitting.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardTransaccion('v-1')
    expect(c.error.value).toBeNull()
  })

  it('vehicle starts as null', () => {
    const c = useDashboardTransaccion('v-1')
    expect(c.vehicle.value).toBeNull()
  })
})

// ─── vehicleTitle ─────────────────────────────────────────────────────────────

describe('vehicleTitle', () => {
  it('returns empty string when vehicle is null', () => {
    const c = useDashboardTransaccion('v-1')
    expect(c.vehicleTitle.value).toBe('')
  })

  it('returns brand + model when vehicle is loaded', () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = sampleVehicle as never
    expect(c.vehicleTitle.value).toBe('Volvo FH')
  })
})

// ─── totalCost ────────────────────────────────────────────────────────────────

describe('totalCost', () => {
  it('returns 0 when no vehicle', () => {
    const c = useDashboardTransaccion('v-1')
    expect(c.totalCost.value).toBe(0)
  })

  it('calculates acquisition + maintenance - rental income', () => {
    const c = useDashboardTransaccion('v-1')
    // acquisition=40000, maintenance=1000+500=1500, rental=2000
    // total = 40000 + 1500 - 2000 = 39500
    c.vehicle.value = sampleVehicle as never
    expect(c.totalCost.value).toBe(39500)
  })

  it('handles null maintenance_records', () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = { ...sampleVehicle, maintenance_records: null, rental_records: null } as never
    expect(c.totalCost.value).toBe(40000)
  })
})

// ─── estimatedBenefit ─────────────────────────────────────────────────────────

describe('estimatedBenefit', () => {
  it('returns 0 - totalCost when sale_price is 0', () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = sampleVehicle as never
    c.sellForm.value.sale_price = 0
    expect(c.estimatedBenefit.value).toBe(-39500)
  })

  it('returns profit when sale_price > totalCost', () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = sampleVehicle as never
    c.sellForm.value.sale_price = 50000
    // 50000 - 39500 = 10500
    expect(c.estimatedBenefit.value).toBe(10500)
  })
})

// ─── init (loadVehicle) ───────────────────────────────────────────────────────

describe('init', () => {
  it('loads vehicle and sets loading to false', async () => {
    const c = useDashboardTransaccion('v-1')
    await c.init()
    expect(c.loading.value).toBe(false)
    expect(c.vehicle.value).not.toBeNull()
  })

  it('sets error when vehicle not found', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, { message: 'not found' }),
    }))
    const c = useDashboardTransaccion('v-1')
    await c.init()
    expect(c.error.value).toBeTruthy()
  })

  it('sets error when no dealer profile', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardTransaccion('v-1')
    await c.init()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── submitRental validation ──────────────────────────────────────────────────

describe('submitRental validation', () => {
  it('does nothing when vehicle is null', async () => {
    const c = useDashboardTransaccion('v-1')
    await c.submitRental()
    expect(c.submitting.value).toBe(false)
  })

  it('sets error when dates are missing', async () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = sampleVehicle as never
    c.rentForm.value.from_date = ''
    c.rentForm.value.to_date = ''
    await c.submitRental()
    expect(c.error.value).toBeTruthy()
  })

  it('sets error when client_name is missing', async () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = sampleVehicle as never
    c.rentForm.value.from_date = '2025-01-01'
    c.rentForm.value.to_date = '2025-01-10'
    c.rentForm.value.client_name = ''
    await c.submitRental()
    expect(c.error.value).toBeTruthy()
  })

  it('sets error when amount <= 0', async () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = sampleVehicle as never
    c.rentForm.value.from_date = '2025-01-01'
    c.rentForm.value.to_date = '2025-01-10'
    c.rentForm.value.client_name = 'Client A'
    c.rentForm.value.amount = 0
    await c.submitRental()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── submitSale validation ────────────────────────────────────────────────────

describe('submitSale validation', () => {
  it('does nothing when vehicle is null', async () => {
    const c = useDashboardTransaccion('v-1')
    await c.submitSale()
    expect(c.submitting.value).toBe(false)
  })

  it('sets error when sale_date is missing', async () => {
    const c = useDashboardTransaccion('v-1')
    c.vehicle.value = sampleVehicle as never
    c.sellForm.value.sale_date = ''
    await c.submitSale()
    expect(c.error.value).toBeTruthy()
  })
})
