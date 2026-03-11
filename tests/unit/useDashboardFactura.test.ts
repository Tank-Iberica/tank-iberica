import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Module mock ──────────────────────────────────────────────────────────────

const mockInvoice = vi.hoisted(() => {
  const makeRef = (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x: unknown) { _v = x } }
  }
  return {
    activeTab: makeRef('generator'),
    saving: makeRef(false),
    loadingHistory: makeRef(false),
    loadingVehicles: makeRef(false),
    invoiceHistory: makeRef([]),
    errorMessage: makeRef(null as string | null),
    successMessage: makeRef(null as string | null),
    companyName: makeRef(''),
    companyTaxId: makeRef(''),
    companyAddress1: makeRef(''),
    companyAddress2: makeRef(''),
    companyAddress3: makeRef(''),
    companyPhone: makeRef(''),
    companyEmail: makeRef(''),
    clientName: makeRef(''),
    clientDocType: makeRef('dni'),
    clientDocNumber: makeRef(''),
    clientAddress1: makeRef(''),
    clientAddress2: makeRef(''),
    clientAddress3: makeRef(''),
    invoiceDate: makeRef('2024-01-01'),
    invoiceNumber: makeRef(''),
    invoiceConditions: makeRef(''),
    invoiceLanguage: makeRef('es'),
    selectedVehicle: makeRef(null),
    invoiceLines: makeRef([]),
    vehicleSearch: makeRef(''),
    showVehicleDropdown: makeRef(false),
    filteredVehicles: { value: [] },
    isFreeUser: makeRef(false),
    invoiceSubtotal: { value: 0 },
    invoiceTotalIva: { value: 0 },
    invoiceTotal: { value: 0 },
    addInvoiceLine: vi.fn(),
    removeInvoiceLine: vi.fn(),
    selectVehicle: vi.fn(),
    clearVehicle: vi.fn(),
    formatCurrency: vi.fn((n: number) => `${n} €`),
    handleGeneratePDF: vi.fn().mockResolvedValue(undefined),
    saveInvoice: vi.fn().mockResolvedValue(undefined),
    resetForm: vi.fn(),
    onVehicleBlur: vi.fn(),
    loadDealerData: vi.fn().mockResolvedValue(undefined),
    loadVehicleOptions: vi.fn().mockResolvedValue(undefined),
    generateInvoiceNumber: vi.fn().mockResolvedValue(undefined),
    loadInvoiceHistory: vi.fn().mockResolvedValue(undefined),
    fetchSubscription: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('~/composables/dashboard/useInvoice', () => ({
  useInvoice: () => mockInvoice,
}))

import { useDashboardFactura } from '../../app/composables/dashboard/useDashboardFactura'

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockInvoice.errorMessage.value = null
  mockInvoice.successMessage.value = null
  mockInvoice.showVehicleDropdown.value = false
  mockInvoice.isFreeUser.value = false
  mockInvoice.invoiceLines.value = []
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('exposes activeTab from useInvoice', () => {
    const c = useDashboardFactura()
    expect(c.activeTab.value).toBe('generator')
  })

  it('exposes saving from useInvoice', () => {
    const c = useDashboardFactura()
    expect(c.saving.value).toBe(false)
  })

  it('exposes errorMessage starting as null', () => {
    const c = useDashboardFactura()
    expect(c.errorMessage.value).toBeNull()
  })

  it('exposes invoiceLines starting empty', () => {
    const c = useDashboardFactura()
    expect(c.invoiceLines.value).toHaveLength(0)
  })

  it('exposes showVehicleDropdown starting false', () => {
    const c = useDashboardFactura()
    expect(c.showVehicleDropdown.value).toBe(false)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls loadDealerData and fetchSubscription', async () => {
    const c = useDashboardFactura()
    await c.init()
    expect(mockInvoice.loadDealerData).toHaveBeenCalled()
    expect(mockInvoice.fetchSubscription).toHaveBeenCalled()
  })

  it('loads vehicle options when not free user', async () => {
    mockInvoice.isFreeUser.value = false
    const c = useDashboardFactura()
    await c.init()
    expect(mockInvoice.loadVehicleOptions).toHaveBeenCalled()
    expect(mockInvoice.generateInvoiceNumber).toHaveBeenCalled()
    expect(mockInvoice.loadInvoiceHistory).toHaveBeenCalled()
  })

  it('adds first invoice line when lines empty and not free user', async () => {
    mockInvoice.isFreeUser.value = false
    mockInvoice.invoiceLines.value = []
    const c = useDashboardFactura()
    await c.init()
    expect(mockInvoice.addInvoiceLine).toHaveBeenCalled()
  })

  it('does not add invoice line when lines already present', async () => {
    mockInvoice.isFreeUser.value = false
    mockInvoice.invoiceLines.value = [{ description: 'existing', qty: 1, price: 100, total: 100 }]
    const c = useDashboardFactura()
    await c.init()
    expect(mockInvoice.addInvoiceLine).not.toHaveBeenCalled()
  })

  it('skips vehicle options when free user', async () => {
    mockInvoice.isFreeUser.value = true
    const c = useDashboardFactura()
    await c.init()
    expect(mockInvoice.loadVehicleOptions).not.toHaveBeenCalled()
    expect(mockInvoice.generateInvoiceNumber).not.toHaveBeenCalled()
  })
})

// ─── updateDealerField ────────────────────────────────────────────────────────

describe('updateDealerField', () => {
  it('updates companyName', () => {
    const c = useDashboardFactura()
    c.updateDealerField('companyName', 'Acme Corp')
    expect(c.companyName.value).toBe('Acme Corp')
  })

  it('updates companyTaxId', () => {
    const c = useDashboardFactura()
    c.updateDealerField('companyTaxId', 'B12345678')
    expect(c.companyTaxId.value).toBe('B12345678')
  })

  it('updates companyEmail', () => {
    const c = useDashboardFactura()
    c.updateDealerField('companyEmail', 'info@acme.com')
    expect(c.companyEmail.value).toBe('info@acme.com')
  })

  it('updates companyPhone', () => {
    const c = useDashboardFactura()
    c.updateDealerField('companyPhone', '+34600000000')
    expect(c.companyPhone.value).toBe('+34600000000')
  })
})

// ─── updateClientField ────────────────────────────────────────────────────────

describe('updateClientField', () => {
  it('updates clientName', () => {
    const c = useDashboardFactura()
    c.updateClientField('clientName', 'Juan García')
    expect(c.clientName.value).toBe('Juan García')
  })

  it('updates clientDocNumber', () => {
    const c = useDashboardFactura()
    c.updateClientField('clientDocNumber', '12345678A')
    expect(c.clientDocNumber.value).toBe('12345678A')
  })

  it('updates clientAddress1', () => {
    const c = useDashboardFactura()
    c.updateClientField('clientAddress1', 'Calle Mayor 1')
    expect(c.clientAddress1.value).toBe('Calle Mayor 1')
  })
})

// ─── updateSettingsField ──────────────────────────────────────────────────────

describe('updateSettingsField', () => {
  it('updates invoiceNumber', () => {
    const c = useDashboardFactura()
    c.updateSettingsField('invoiceNumber', 'INV-001')
    expect(c.invoiceNumber.value).toBe('INV-001')
  })

  it('updates invoiceConditions', () => {
    const c = useDashboardFactura()
    c.updateSettingsField('invoiceConditions', 'Pago a 30 días')
    expect(c.invoiceConditions.value).toBe('Pago a 30 días')
  })

  it('updates vehicleSearch', () => {
    const c = useDashboardFactura()
    c.updateSettingsField('vehicleSearch', 'Volvo')
    expect(c.vehicleSearch.value).toBe('Volvo')
  })
})

// ─── openVehicleDropdown ──────────────────────────────────────────────────────

describe('openVehicleDropdown', () => {
  it('sets showVehicleDropdown to true', () => {
    const c = useDashboardFactura()
    expect(c.showVehicleDropdown.value).toBe(false)
    c.openVehicleDropdown()
    expect(c.showVehicleDropdown.value).toBe(true)
  })
})

// ─── dismissError / dismissSuccess ───────────────────────────────────────────

describe('dismissError', () => {
  it('clears errorMessage', () => {
    const c = useDashboardFactura()
    c.errorMessage.value = 'Something went wrong'
    c.dismissError()
    expect(c.errorMessage.value).toBeNull()
  })
})

describe('dismissSuccess', () => {
  it('clears successMessage', () => {
    const c = useDashboardFactura()
    c.successMessage.value = 'Invoice saved'
    c.dismissSuccess()
    expect(c.successMessage.value).toBeNull()
  })
})

// ─── selectVehicle proxy ──────────────────────────────────────────────────────

describe('selectVehicle proxy', () => {
  it('calls underlying selectVehicle with the vehicle', () => {
    const c = useDashboardFactura()
    const vehicle = { id: 'v-1', title: 'Volvo FH' }
    c.selectVehicle(vehicle as never)
    expect(mockInvoice.selectVehicle).toHaveBeenCalledWith(vehicle)
  })
})
