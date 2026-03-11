import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must be before composable import) ─────────────────

vi.mock('~/utils/contractGenerator', () => ({
  generateRentalContract: vi.fn(() => '<html>rental</html>'),
  generateSaleContract: vi.fn(() => '<html>sale</html>'),
  printHTML: vi.fn(),
}))

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

// Supabase: factory so each test gets a fresh chain with configurable result
let supabaseFromResult: unknown = { data: [], error: null }
const mockSupabaseFrom = vi.fn()

vi.stubGlobal('useSupabaseClient', () => ({
  from: mockSupabaseFrom,
}))

vi.stubGlobal('useAuth', () => ({
  userId: { value: 'user-1' },
}))

const mockDealerProfile: { value: unknown } = { value: null }
const mockLoadDealer = vi.fn().mockResolvedValue(null)
vi.stubGlobal('useDealerDashboard', () => ({
  dealerProfile: mockDealerProfile,
  loadDealer: mockLoadDealer,
}))

const mockCurrentPlan = { value: 'basic' as string }
const mockFetchSubscription = vi.fn().mockResolvedValue(undefined)
vi.stubGlobal('useSubscriptionPlan', () => ({
  currentPlan: mockCurrentPlan,
  fetchSubscription: mockFetchSubscription,
}))

import { useDashboardContrato } from '../../app/composables/dashboard/useDashboardContrato'

// ─── Chain builder ─────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'insert', 'update']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  supabaseFromResult = { data: [], error: null }
  mockSupabaseFrom.mockImplementation(() => makeChain(supabaseFromResult))
  mockDealerProfile.value = null
  mockCurrentPlan.value = 'basic'
})

// ─── Initial state ────────────────────────────────────────────

describe('useDashboardContrato — initial state', () => {
  it('starts with loading=true and expected defaults', () => {
    const c = useDashboardContrato()
    expect(c.loading.value).toBe(true)
    expect(c.saving.value).toBe(false)
    expect(c.saveError.value).toBeNull()
    expect(c.saveSuccess.value).toBe(false)
    expect(c.contractType.value).toBe('arrendamiento')
    expect(c.clientType.value).toBe('persona')
    expect(c.contractMonthlyRent.value).toBe(1200)
    expect(c.contractDeposit.value).toBe(2400)
    expect(c.contractDuration.value).toBe(8)
    expect(c.contractDurationUnit.value).toBe('meses')
    expect(c.contractPaymentDays.value).toBe(10)
    expect(c.contractHasPurchaseOption.value).toBe(true)
    expect(c.contractPurchasePrice.value).toBe(10000)
    expect(c.contractPurchaseNotice.value).toBe(14)
    expect(c.contractRentMonthsToDiscount.value).toBe(3)
    expect(c.contractSalePrice.value).toBe(0)
    expect(c.contractSalePaymentMethod.value).toBe('Transferencia bancaria')
    expect(c.contractVehicleResidualValue.value).toBe(13000)
    expect(c.vehicleOptions.value).toEqual([])
    expect(c.contracts.value).toEqual([])
    expect(c.activeTab.value).toBe('nuevo')
  })

  it('exposes all expected functions', () => {
    const c = useDashboardContrato()
    expect(typeof c.generateContract).toBe('function')
    expect(typeof c.resetForm).toBe('function')
    expect(typeof c.init).toBe('function')
    expect(typeof c.showHistory).toBe('function')
    expect(typeof c.onContractVehicleSelected).toBe('function')
    expect(typeof c.updateContractStatus).toBe('function')
  })

  it('hasAccess is true for basic plan', () => {
    mockCurrentPlan.value = 'basic'
    const c = useDashboardContrato()
    expect(c.hasAccess.value).toBe(true)
  })

  it('hasAccess is true for premium plan', () => {
    mockCurrentPlan.value = 'premium'
    const c = useDashboardContrato()
    expect(c.hasAccess.value).toBe(true)
  })

  it('hasAccess is true for founding plan', () => {
    mockCurrentPlan.value = 'founding'
    const c = useDashboardContrato()
    expect(c.hasAccess.value).toBe(true)
  })

  it('hasAccess is false for free plan', () => {
    mockCurrentPlan.value = 'free'
    const c = useDashboardContrato()
    expect(c.hasAccess.value).toBe(false)
  })

  it('currentPlan is re-exported', () => {
    const c = useDashboardContrato()
    expect(c.currentPlan).toBe(mockCurrentPlan)
  })
})

// ─── resetForm ────────────────────────────────────────────────

describe('resetForm', () => {
  it('resets all fields to defaults', () => {
    const c = useDashboardContrato()
    // Mutate some fields
    c.contractType.value = 'compraventa'
    c.clientType.value = 'empresa'
    c.clientName.value = 'Test Client'
    c.contractMonthlyRent.value = 9999
    c.contractSalePrice.value = 50000
    c.saveError.value = 'some error'

    c.resetForm()

    expect(c.contractType.value).toBe('arrendamiento')
    expect(c.clientType.value).toBe('persona')
    expect(c.clientName.value).toBe('')
    expect(c.contractMonthlyRent.value).toBe(1200)
    expect(c.contractSalePrice.value).toBe(0)
    expect(c.saveError.value).toBeNull()
    expect(c.saveSuccess.value).toBe(false)
    expect(c.contractVehicle.value).toBe('')
    expect(c.contractVehiclePlate.value).toBe('')
    expect(c.contractVehicleType.value).toBe('vehiculo')
    expect(c.contractDeposit.value).toBe(2400)
    expect(c.contractDuration.value).toBe(8)
    expect(c.contractDurationUnit.value).toBe('meses')
    expect(c.contractPaymentDays.value).toBe(10)
    expect(c.contractHasPurchaseOption.value).toBe(true)
    expect(c.contractPurchasePrice.value).toBe(10000)
    expect(c.contractPurchaseNotice.value).toBe(14)
    expect(c.contractRentMonthsToDiscount.value).toBe(3)
    expect(c.contractVehicleResidualValue.value).toBe(13000)
    expect(c.contractSalePaymentMethod.value).toBe('Transferencia bancaria')
    expect(c.contractSaleDeliveryConditions.value).toBe('')
    expect(c.contractSaleWarranty.value).toBe('')
  })
})

// ─── showHistory ──────────────────────────────────────────────

describe('showHistory', () => {
  it('sets activeTab to historial', async () => {
    const c = useDashboardContrato()
    expect(c.activeTab.value).toBe('nuevo')
    c.showHistory()
    expect(c.activeTab.value).toBe('historial')
  })
})

// ─── prefillFromDealer (tested via init) ─────────────────────
// prefillFromDealer is an internal helper called by init().

describe('prefillFromDealer — via init', () => {
  it('does nothing when dealerProfile is null (fields stay empty)', async () => {
    mockDealerProfile.value = null
    const c = useDashboardContrato()
    await c.init()
    expect(c.lessorCompany.value).toBe('')
    expect(c.lessorCIF.value).toBe('')
  })

  it('fills lessor fields from dealer with legal_name', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      legal_name: 'Tank Ibérica SL',
      company_name: 'Tank',
      cif_nif: 'B12345678',
      location: 'León, España',
    }
    const c = useDashboardContrato()
    await c.init()
    expect(c.lessorCompany.value).toBe('Tank Ibérica SL')
    expect(c.lessorCIF.value).toBe('B12345678')
    expect(c.lessorAddress.value).toBe('León, España')
    expect(c.contractLocation.value).toBe('León, España')
    expect(c.contractJurisdiction.value).toBe('León, España')
  })

  it('falls back to company_name string when no legal_name', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: 'Tracciona Motors',
      cif_nif: 'B99999999',
      location: 'Madrid',
    }
    const c = useDashboardContrato()
    await c.init()
    expect(c.lessorCompany.value).toBe('Tracciona Motors')
  })

  it('falls back to company_name.es when company_name is object', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: { es: 'Motor Ibérico', en: 'Iberian Motor' },
      cif_nif: '',
      location: 'Sevilla',
    }
    const c = useDashboardContrato()
    await c.init()
    expect(c.lessorCompany.value).toBe('Motor Ibérico')
  })

  it('uses location_data.es when present', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: 'Test SL',
      location_data: { es: 'Barcelona, España', en: 'Barcelona, Spain' },
    }
    const c = useDashboardContrato()
    await c.init()
    expect(c.lessorAddress.value).toBe('Barcelona, España')
  })

  it('uses location_data.en when es is absent', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: 'Test SL',
      location_data: { en: 'Valencia, Spain' },
    }
    const c = useDashboardContrato()
    await c.init()
    expect(c.lessorAddress.value).toBe('Valencia, Spain')
  })
})

// ─── onContractVehicleSelected ────────────────────────────────

describe('onContractVehicleSelected', () => {
  it('does nothing when contractVehicle is empty', () => {
    const c = useDashboardContrato()
    c.contractVehicle.value = ''
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('')
  })

  it('sets plate and vehicleType from matching option', () => {
    const c = useDashboardContrato()
    c.vehicleOptions.value = [
      { id: 'v1', label: 'Volvo FH16', plate: '1234ABC', vehicleType: 'camion' },
      { id: 'v2', label: 'Cisterna X', plate: '5678DEF', vehicleType: 'semirremolque cisterna' },
    ]
    c.contractVehicle.value = 'v2'
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('5678DEF')
    expect(c.contractVehicleType.value).toBe('semirremolque cisterna')
  })

  it('does nothing when vehicleId not found in options', () => {
    const c = useDashboardContrato()
    c.vehicleOptions.value = [
      { id: 'v1', label: 'Volvo FH16', plate: '1234ABC', vehicleType: 'camion' },
    ]
    c.contractVehicle.value = 'unknown-id'
    c.contractVehiclePlate.value = 'ORIG'
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('ORIG')
  })
})

// ─── loadVehicleOptions ───────────────────────────────────────

describe('loadVehicleOptions', () => {
  it('returns early when no dealerProfile', async () => {
    mockDealerProfile.value = null
    const c = useDashboardContrato()
    await c.init() // calls loadVehicleOptions internally
    expect(c.vehicleOptions.value).toEqual([])
  })

  it('populates vehicleOptions from DB data', async () => {
    const vehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH16', plate: '1234ABC', year: 2020, subcategory_id: 'sc1' },
      { id: 'v2', brand: 'Camión Cisterna', model: 'M20', plate: '9999XYZ', year: 2019, subcategory_id: 'sc1' },
    ]
    supabaseFromResult = { data: vehicles, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()

    expect(c.vehicleOptions.value.length).toBe(2)
    expect(c.vehicleOptions.value[0]!.plate).toBe('1234ABC')
    // 'Camión Cisterna M20' contains 'cisterna' → detectVehicleType → 'semirremolque cisterna'
    expect(c.vehicleOptions.value[1]!.vehicleType).toBe('semirremolque cisterna')
  })

  it('detectVehicleType: cisterna → semirremolque cisterna', async () => {
    const vehicles = [
      { id: 'v1', brand: 'Cisterna X', model: '', plate: '1234', year: 2020, subcategory_id: 'sc1' },
    ]
    supabaseFromResult = { data: vehicles, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('semirremolque cisterna')
  })

  it('detectVehicleType: semirremolque → semirremolque', async () => {
    const vehicles = [
      { id: 'v1', brand: 'Semi Truck', model: 'semi', plate: 'ABC', year: 2020, subcategory_id: 'sc1' },
    ]
    supabaseFromResult = { data: vehicles, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('semirremolque')
  })

  it('detectVehicleType: trailer → trailer', async () => {
    const vehicles = [
      { id: 'v1', brand: 'Trailer X', model: '', plate: 'ABC', year: 2020, subcategory_id: 'sc1' },
    ]
    supabaseFromResult = { data: vehicles, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('trailer')
  })

  it('detectVehicleType: cabeza tractora → cabeza tractora', async () => {
    const vehicles = [
      { id: 'v1', brand: 'Tractora X', model: '', plate: 'ABC', year: 2020, subcategory_id: 'sc1' },
    ]
    supabaseFromResult = { data: vehicles, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('cabeza tractora')
  })

  it('detectVehicleType: furgon → furgon', async () => {
    const vehicles = [
      { id: 'v1', brand: 'Furgón Pro', model: '', plate: 'ABC', year: 2020, subcategory_id: 'sc1' },
    ]
    supabaseFromResult = { data: vehicles, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('furgon')
  })

  it('detectVehicleType: unknown → vehiculo', async () => {
    const vehicles = [
      { id: 'v1', brand: 'Unknown Brand', model: 'XYZ', plate: 'ABC', year: 2020, subcategory_id: 'sc1' },
    ]
    supabaseFromResult = { data: vehicles, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('vehiculo')
  })
})

// ─── loadContractHistory ──────────────────────────────────────

describe('loadContractHistory', () => {
  it('returns early when no dealerProfile', async () => {
    mockDealerProfile.value = null
    const c = useDashboardContrato()
    await c.init()
    expect(c.contracts.value).toEqual([])
  })

  it('populates contracts from DB', async () => {
    const rows = [
      {
        id: 'c1',
        dealer_id: 'dealer-1',
        contract_type: 'arrendamiento',
        contract_date: '2026-01-01',
        vehicle_id: 'v1',
        vehicle_plate: '1234ABC',
        vehicle_type: 'camion',
        client_name: 'Test Client',
        client_doc_number: '12345678A',
        client_address: 'Madrid',
        terms: {},
        pdf_url: null,
        status: 'draft',
        created_at: '2026-01-01',
        updated_at: null,
      },
    ]
    supabaseFromResult = { data: rows, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.contracts.value.length).toBe(1)
    expect(c.contracts.value[0]!.client_name).toBe('Test Client')
  })

  it('sets historyError on DB error', async () => {
    supabaseFromResult = { data: null, error: { message: 'DB error' } }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    expect(c.historyError.value).toBe('DB error')
  })
})

// ─── updateContractStatus ─────────────────────────────────────

describe('updateContractStatus', () => {
  it('updates contract status and reloads history', async () => {
    supabaseFromResult = { data: [], error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.updateContractStatus('c1', 'signed')
    // No error means success
    expect(c.historyError.value).toBeNull()
  })

  it('sets historyError on update failure', async () => {
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    // Make update fail
    const errorChain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'order', 'insert']
    methods.forEach((m) => { errorChain[m] = () => errorChain })
    // update returns error
    errorChain.update = () => errorChain
    errorChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ error: { message: 'Update failed' } })
    mockSupabaseFrom.mockImplementationOnce(() => errorChain)

    const c = useDashboardContrato()
    await c.updateContractStatus('c1', 'cancelled')
    expect(c.historyError.value).toBe('Update failed')
  })
})

// ─── generateContract ─────────────────────────────────────────

describe('generateContract', () => {
  it('generates rental contract and calls printHTML', async () => {
    supabaseFromResult = { data: null, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test SL' }
    const c = useDashboardContrato()
    c.contractType.value = 'arrendamiento'
    c.clientName.value = 'Juan García'

    await c.generateContract()

    // printHTML should have been called (mocked)
    const { printHTML: mockPrintHTML } = await import('../../app/utils/contractGenerator')
    expect(vi.mocked(mockPrintHTML)).toHaveBeenCalledWith('<html>rental</html>')
  })

  it('generates sale contract when contractType is compraventa', async () => {
    supabaseFromResult = { data: null, error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test SL' }
    const c = useDashboardContrato()
    c.contractType.value = 'compraventa'
    c.contractSalePrice.value = 50000
    c.clientName.value = 'María López'

    await c.generateContract()

    const { generateSaleContract: mockSale } = await import('../../app/utils/contractGenerator')
    expect(vi.mocked(mockSale)).toHaveBeenCalled()
  })

  it('sets saving=false after completion', async () => {
    supabaseFromResult = { error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test SL' }
    const c = useDashboardContrato()
    await c.generateContract()
    expect(c.saving.value).toBe(false)
  })

  it('sets saveError when DB insert fails', async () => {
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test SL' }
    // insert returns error
    const errorChain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'order', 'update']
    methods.forEach((m) => { errorChain[m] = () => errorChain })
    errorChain.insert = () => errorChain
    errorChain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ error: { message: 'Insert failed' } })
    mockSupabaseFrom.mockImplementation(() => errorChain)

    const c = useDashboardContrato()
    await c.generateContract()
    expect(c.saveError.value).toBe('Insert failed')
    expect(c.saving.value).toBe(false)
  })

  it('generates rental contract with empresa clientType', async () => {
    supabaseFromResult = { error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test SL' }
    const c = useDashboardContrato()
    c.contractType.value = 'arrendamiento'
    c.clientType.value = 'empresa'
    c.clientCompany.value = 'Empresa SL'
    c.clientCIF.value = 'B99999999'

    await c.generateContract()

    const { generateRentalContract: mockRental } = await import('../../app/utils/contractGenerator')
    expect(vi.mocked(mockRental)).toHaveBeenCalledWith(
      expect.objectContaining({ clientType: 'empresa' }),
    )
  })

  it('generates rental contract with purchase option disabled', async () => {
    supabaseFromResult = { error: null }
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test SL' }
    const c = useDashboardContrato()
    c.contractType.value = 'arrendamiento'
    c.contractHasPurchaseOption.value = false

    await c.generateContract()

    const { generateRentalContract: mockRental } = await import('../../app/utils/contractGenerator')
    expect(vi.mocked(mockRental)).toHaveBeenCalledWith(
      expect.objectContaining({ contractHasPurchaseOption: false }),
    )
  })

  it('does not save to DB when dealerProfile is null after print', async () => {
    mockDealerProfile.value = null
    const c = useDashboardContrato()
    await c.generateContract()
    // Should not throw, saving stays false
    expect(c.saving.value).toBe(false)
    expect(c.saveError.value).toBeNull()
  })
})

// ─── init ─────────────────────────────────────────────────────

describe('init', () => {
  it('sets loading=false after completing', async () => {
    mockDealerProfile.value = null
    const c = useDashboardContrato()
    await c.init()
    expect(c.loading.value).toBe(false)
  })

  it('calls loadDealer when dealerProfile is null', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue(null)
    const c = useDashboardContrato()
    await c.init()
    expect(mockLoadDealer).toHaveBeenCalled()
  })

  it('skips data loading when no access', async () => {
    mockCurrentPlan.value = 'free'
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    const c = useDashboardContrato()
    await c.init()
    // hasAccess is false → no vehicle/history loading
    expect(c.vehicleOptions.value).toEqual([])
    expect(c.loading.value).toBe(false)
  })
})
