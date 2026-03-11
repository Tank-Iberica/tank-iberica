import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────

vi.mock('~/utils/invoicePdf', () => ({
  generateInvoicePDF: vi.fn(),
}))

vi.mock('~/utils/invoiceFormatters', () => ({
  formatDateDMY: vi.fn((d: string) => d),
  formatCurrency: vi.fn((n: number) => `${n}€`),
  formatHistoryDate: vi.fn((d: string) => d),
  getInvoiceStatusClass: vi.fn((s: string) => `status-${s}`),
}))

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

vi.stubGlobal('localizedField', (obj: Record<string, string>, locale: string) => {
  return obj[locale] || obj.es || obj.en || ''
})

// Supabase with configurable result + maybeSingle/single support
let supabaseResult: unknown = { data: null, error: null }
const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.stubGlobal('useSupabaseClient', () => ({
  from: mockFrom,
  rpc: mockRpc,
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

import { useInvoice } from '../../app/composables/dashboard/useInvoice'
import { generateInvoicePDF as mockBuildPDF } from '../../app/utils/invoicePdf'

// ─── Chain builder ─────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'insert', 'update', 'limit', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.maybeSingle = () => Promise.resolve(result)
  chain.single = () => Promise.resolve(result)
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  supabaseResult = { data: null, error: null }
  mockFrom.mockImplementation(() => makeChain(supabaseResult))
  mockRpc.mockResolvedValue({ data: null, error: { message: 'not found' } })
  mockDealerProfile.value = null
  mockCurrentPlan.value = 'basic'
})

// ─── Initial state ────────────────────────────────────────────

describe('useInvoice — initial state', () => {
  it('initializes with correct defaults', () => {
    const c = useInvoice()
    expect(c.activeTab.value).toBe('new')
    expect(c.saving.value).toBe(false)
    expect(c.loadingHistory.value).toBe(false)
    expect(c.loadingVehicles.value).toBe(false)
    expect(c.errorMessage.value).toBeNull()
    expect(c.successMessage.value).toBeNull()
    expect(c.invoiceLines.value).toEqual([])
    expect(c.vehicleOptions.value).toEqual([])
    expect(c.invoiceHistory.value).toEqual([])
    expect(c.companyName.value).toBe('')
    expect(c.companyTaxId.value).toBe('')
    expect(c.clientName.value).toBe('')
    expect(c.clientDocType.value).toBe('NIF')
    expect(c.invoiceConditions.value).toBe('Pago a 30 dias')
    expect(c.invoiceLanguage.value).toBe('es')
    expect(c.selectedVehicle.value).toBe('')
    expect(c.vehicleSearch.value).toBe('')
    expect(c.showVehicleDropdown.value).toBe(false)
  })

  it('isFreeUser is false for basic plan', () => {
    mockCurrentPlan.value = 'basic'
    const c = useInvoice()
    expect(c.isFreeUser.value).toBe(false)
  })

  it('isFreeUser is true for free plan', () => {
    mockCurrentPlan.value = 'free'
    const c = useInvoice()
    expect(c.isFreeUser.value).toBe(true)
  })

  it('exposes formatters', () => {
    const c = useInvoice()
    expect(typeof c.formatDateDMY).toBe('function')
    expect(typeof c.formatCurrency).toBe('function')
    expect(typeof c.formatHistoryDate).toBe('function')
    expect(typeof c.getStatusClass).toBe('function')
  })
})

// ─── Pure line helpers ────────────────────────────────────────

describe('getLineImporte / getLineSubtotal', () => {
  it('getLineImporte = cantidad * precioUd', () => {
    const c = useInvoice()
    const line = { id: 1, tipo: 'Venta', concepto: 'X', cantidad: 3, precioUd: 100, iva: 21 }
    expect(c.getLineImporte(line)).toBe(300)
  })

  it('getLineSubtotal includes IVA', () => {
    const c = useInvoice()
    const line = { id: 1, tipo: 'Venta', concepto: 'X', cantidad: 2, precioUd: 1000, iva: 21 }
    // importe = 2000, iva = 420, subtotal = 2420
    expect(c.getLineSubtotal(line)).toBe(2420)
  })

  it('getLineSubtotal with zero IVA', () => {
    const c = useInvoice()
    const line = { id: 1, tipo: 'Venta', concepto: 'X', cantidad: 1, precioUd: 500, iva: 0 }
    expect(c.getLineSubtotal(line)).toBe(500)
  })
})

// ─── addInvoiceLine / removeInvoiceLine ──────────────────────

describe('addInvoiceLine / removeInvoiceLine', () => {
  it('addInvoiceLine appends a line with defaults', () => {
    const c = useInvoice()
    c.addInvoiceLine()
    expect(c.invoiceLines.value.length).toBe(1)
    expect(c.invoiceLines.value[0]!.cantidad).toBe(1)
    expect(c.invoiceLines.value[0]!.precioUd).toBe(0)
    expect(c.invoiceLines.value[0]!.iva).toBe(21)
    expect(c.invoiceLines.value[0]!.tipo).toBe('Venta')
  })

  it('addInvoiceLine assigns incrementing ids', () => {
    const c = useInvoice()
    c.addInvoiceLine()
    c.addInvoiceLine()
    expect(c.invoiceLines.value[0]!.id).toBe(1)
    expect(c.invoiceLines.value[1]!.id).toBe(2)
  })

  it('removeInvoiceLine removes by id', () => {
    const c = useInvoice()
    c.addInvoiceLine()
    c.addInvoiceLine()
    const id0 = c.invoiceLines.value[0]!.id
    c.removeInvoiceLine(id0)
    expect(c.invoiceLines.value.length).toBe(1)
    expect(c.invoiceLines.value[0]!.id).not.toBe(id0)
  })

  it('removeInvoiceLine is no-op for non-existent id', () => {
    const c = useInvoice()
    c.addInvoiceLine()
    c.removeInvoiceLine(999)
    expect(c.invoiceLines.value.length).toBe(1)
  })
})

// ─── selectVehicle / clearVehicle ────────────────────────────

describe('selectVehicle / clearVehicle', () => {
  it('selectVehicle sets vehicle and fills empty line concepto', () => {
    const c = useInvoice()
    c.addInvoiceLine() // concepto is empty
    const vehicle = { id: 'v1', label: 'Volvo FH16 (1234ABC) - 2020' }
    c.selectVehicle(vehicle)
    expect(c.selectedVehicle.value).toBe('v1')
    expect(c.vehicleSearch.value).toBe('Volvo FH16 (1234ABC) - 2020')
    expect(c.showVehicleDropdown.value).toBe(false)
    expect(c.invoiceLines.value[0]!.concepto).toBe('Volvo FH16 (1234ABC) - 2020')
  })

  it('selectVehicle does not overwrite filled line concepto', () => {
    const c = useInvoice()
    c.addInvoiceLine()
    c.invoiceLines.value[0]!.concepto = 'Already set'
    c.selectVehicle({ id: 'v1', label: 'New vehicle' })
    expect(c.invoiceLines.value[0]!.concepto).toBe('Already set')
  })

  it('selectVehicle with no lines does not error', () => {
    const c = useInvoice()
    expect(() => c.selectVehicle({ id: 'v1', label: 'Volvo' })).not.toThrow()
  })

  it('clearVehicle resets selection', () => {
    const c = useInvoice()
    c.selectedVehicle.value = 'v1'
    c.vehicleSearch.value = 'Volvo'
    c.clearVehicle()
    expect(c.selectedVehicle.value).toBe('')
    expect(c.vehicleSearch.value).toBe('')
  })
})

// ─── resetForm ────────────────────────────────────────────────

describe('resetForm', () => {
  it('resets all client and invoice fields', () => {
    const c = useInvoice()
    c.clientName.value = 'Test Client'
    c.invoiceLanguage.value = 'en'
    c.selectedVehicle.value = 'v1'
    c.errorMessage.value = 'some error'
    c.invoiceLines.value = [{ id: 99, tipo: 'X', concepto: 'X', cantidad: 5, precioUd: 100, iva: 21 }]

    c.resetForm()

    expect(c.clientName.value).toBe('')
    expect(c.clientDocType.value).toBe('NIF')
    expect(c.clientDocNumber.value).toBe('')
    expect(c.clientAddress1.value).toBe('')
    expect(c.invoiceLanguage.value).toBe('es')
    expect(c.invoiceConditions.value).toBe('Pago a 30 dias')
    expect(c.selectedVehicle.value).toBe('')
    expect(c.vehicleSearch.value).toBe('')
    expect(c.errorMessage.value).toBeNull()
    expect(c.successMessage.value).toBeNull()
    // Adds one line after reset
    expect(c.invoiceLines.value.length).toBe(1)
  })
})

// ─── loadDealerData ───────────────────────────────────────────

describe('loadDealerData', () => {
  it('returns early when no dealer', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue(null)
    const c = useInvoice()
    await c.loadDealerData()
    expect(c.companyName.value).toBe('')
  })

  it('fills company data from string company_name', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: 'Transportes SL',
      phone: '600000000',
      email: 'info@transport.com',
      logo_url: 'https://logo.com/img.png',
      website: 'https://transport.com',
    }
    // maybeSingle returns no fiscal data, single returns no cif_nif
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useInvoice()
    await c.loadDealerData()
    expect(c.companyName.value).toBe('Transportes SL')
    expect(c.companyPhone.value).toBe('600000000')
    expect(c.companyEmail.value).toBe('info@transport.com')
    expect(c.companyLogoUrl.value).toBe('https://logo.com/img.png')
    expect(c.companyWebsite.value).toBe('https://transport.com')
  })

  it('fills company data from object company_name (es locale)', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: { es: 'Empresa SL', en: 'Company Ltd' },
      phone: null,
      email: null,
      logo_url: null,
      website: null,
    }
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useInvoice()
    await c.loadDealerData()
    expect(c.companyName.value).toBe('Empresa SL')
  })

  it('fills fiscal data when available', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: 'Test SL',
      phone: null, email: null, logo_url: null, website: null,
    }
    const fiscalData = { tax_id: 'B12345678', tax_address: 'Calle Test 1\nMadrid\n28001' }
    mockFrom.mockImplementation(() => makeChain({ data: fiscalData, error: null }))
    const c = useInvoice()
    await c.loadDealerData()
    expect(c.companyTaxId.value).toBe('B12345678')
    expect(c.companyAddress1.value).toBe('Calle Test 1')
    expect(c.companyAddress2.value).toBe('Madrid')
    expect(c.companyAddress3.value).toBe('28001')
  })

  it('falls back to cif_nif when no fiscal data', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: 'Test SL',
      phone: null, email: null, logo_url: null, website: null,
    }
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain({ data: null, error: null }) // fiscal data: null
      return makeChain({ data: { cif_nif: 'B99999999' }, error: null }) // dealers table
    })
    const c = useInvoice()
    await c.loadDealerData()
    expect(c.companyTaxId.value).toBe('B99999999')
  })
})

// ─── loadVehicleOptions ───────────────────────────────────────

describe('loadVehicleOptions', () => {
  it('returns early when no dealer', async () => {
    mockDealerProfile.value = null
    const c = useInvoice()
    await c.loadVehicleOptions()
    expect(c.vehicleOptions.value).toEqual([])
  })

  it('populates vehicle options', async () => {
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    supabaseResult = {
      data: [
        { id: 'v1', brand: 'Volvo', model: 'FH16', plate: '1234ABC', year: 2020 },
        { id: 'v2', brand: 'Scania', model: 'R500', plate: null, year: null },
      ],
      error: null,
    }
    const c = useInvoice()
    await c.loadVehicleOptions()
    expect(c.vehicleOptions.value.length).toBe(2)
    expect(c.vehicleOptions.value[0]!.id).toBe('v1')
    expect(c.vehicleOptions.value[0]!.label).toContain('Volvo')
    expect(c.vehicleOptions.value[0]!.label).toContain('1234ABC')
    expect(c.vehicleOptions.value[0]!.label).toContain('2020')
  })
})

// ─── generateInvoiceNumber ────────────────────────────────────

describe('generateInvoiceNumber', () => {
  it('returns early when no dealer', async () => {
    mockDealerProfile.value = null
    const c = useInvoice()
    await c.generateInvoiceNumber()
    expect(c.invoiceNumber.value).toBe('')
  })

  it('uses RPC result when available', async () => {
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    mockRpc.mockResolvedValue({ data: 'TEST-2026-0001', error: null })
    const c = useInvoice()
    await c.generateInvoiceNumber()
    expect(c.invoiceNumber.value).toBe('TEST-2026-0001')
  })

  it('falls back to prefix-year-seq on RPC error with string company_name', async () => {
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Empresa SL' }
    mockRpc.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const c = useInvoice()
    await c.generateInvoiceNumber()
    const year = new Date().getFullYear()
    expect(c.invoiceNumber.value).toBe(`EMP-${year}-0001`)
  })

  it('uses DLR prefix when company_name is too short', async () => {
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'AB' }
    mockRpc.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const c = useInvoice()
    await c.generateInvoiceNumber()
    const year = new Date().getFullYear()
    expect(c.invoiceNumber.value).toBe(`DLR-${year}-0001`)
  })

  it('falls back to DLR prefix on exception', async () => {
    mockDealerProfile.value = { id: 'dealer-1', company_name: 'Test' }
    mockRpc.mockRejectedValue(new Error('timeout'))
    const c = useInvoice()
    await c.generateInvoiceNumber()
    const year = new Date().getFullYear()
    expect(c.invoiceNumber.value).toBe(`DLR-${year}-0001`)
  })

  it('falls back to object company_name.es when company_name is object', async () => {
    mockDealerProfile.value = {
      id: 'dealer-1',
      company_name: { es: 'Empresa Test', en: 'Company Test' },
    }
    mockRpc.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const c = useInvoice()
    await c.generateInvoiceNumber()
    const year = new Date().getFullYear()
    expect(c.invoiceNumber.value).toBe(`EMP-${year}-0001`)
  })
})

// ─── loadInvoiceHistory ───────────────────────────────────────

describe('loadInvoiceHistory', () => {
  it('returns early when no dealer', async () => {
    mockDealerProfile.value = null
    const c = useInvoice()
    await c.loadInvoiceHistory()
    expect(c.invoiceHistory.value).toEqual([])
    expect(c.loadingHistory.value).toBe(false)
  })

  it('populates invoice history on success', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    supabaseResult = { data: [{ id: 'inv-1' }, { id: 'inv-2' }], error: null }
    const c = useInvoice()
    await c.loadInvoiceHistory()
    expect(c.invoiceHistory.value.length).toBe(2)
    expect(c.loadingHistory.value).toBe(false)
  })

  it('sets errorMessage on fetch error', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    supabaseResult = { data: null, error: { message: 'History error' } }
    const c = useInvoice()
    await c.loadInvoiceHistory()
    // fetchError is not an Error instance → falls back to i18n key
    expect(c.errorMessage.value).toBe('dashboard.tools.invoice.errorLoading')
  })
})

// ─── saveInvoice ──────────────────────────────────────────────

describe('saveInvoice', () => {
  it('returns early when no dealer', async () => {
    mockDealerProfile.value = null
    const c = useInvoice()
    await c.saveInvoice('draft')
    expect(c.saving.value).toBe(false)
  })

  it('sets error when clientName is empty', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    const c = useInvoice()
    c.clientName.value = '   '
    await c.saveInvoice('draft')
    expect(c.errorMessage.value).toBe('dashboard.tools.invoice.clientRequired')
  })

  it('sets error when no invoice lines', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    const c = useInvoice()
    c.clientName.value = 'Test Client'
    await c.saveInvoice('draft')
    expect(c.errorMessage.value).toBe('dashboard.tools.invoice.linesRequired')
  })

  it('saves draft successfully', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    supabaseResult = { data: null, error: null }
    const c = useInvoice()
    c.clientName.value = 'Juan García'
    c.addInvoiceLine()
    c.invoiceLines.value[0]!.precioUd = 50000
    await c.saveInvoice('draft')
    expect(c.successMessage.value).toBe('dashboard.tools.invoice.draftSaved')
    expect(c.saving.value).toBe(false)
  })

  it('saves sent successfully', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    supabaseResult = { data: null, error: null }
    const c = useInvoice()
    c.clientName.value = 'María López'
    c.addInvoiceLine()
    await c.saveInvoice('sent')
    expect(c.successMessage.value).toBe('dashboard.tools.invoice.invoiceSaved')
  })

  it('sets errorMessage on DB insert error', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    supabaseResult = { error: { message: 'Insert failed' } }
    const c = useInvoice()
    c.clientName.value = 'Client'
    c.addInvoiceLine()
    await c.saveInvoice('draft')
    // insertError is not an Error instance → falls back to i18n key
    expect(c.errorMessage.value).toBe('dashboard.tools.invoice.errorSaving')
    expect(c.saving.value).toBe(false)
  })

  it('includes vehicle_ids when vehicle selected', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    supabaseResult = { data: null, error: null }
    const c = useInvoice()
    c.clientName.value = 'Client'
    c.selectedVehicle.value = 'v1'
    c.addInvoiceLine()
    await c.saveInvoice('draft')
    expect(c.successMessage.value).toBe('dashboard.tools.invoice.draftSaved')
  })
})

// ─── handleGeneratePDF ────────────────────────────────────────

describe('handleGeneratePDF', () => {
  it('sets error when clientName is empty', async () => {
    const c = useInvoice()
    c.clientName.value = ''
    await c.handleGeneratePDF()
    expect(c.errorMessage.value).toBe('dashboard.tools.invoice.clientRequired')
    expect(vi.mocked(mockBuildPDF)).not.toHaveBeenCalled()
  })

  it('sets error when no lines', async () => {
    const c = useInvoice()
    c.clientName.value = 'Client'
    await c.handleGeneratePDF()
    expect(c.errorMessage.value).toBe('dashboard.tools.invoice.linesRequired')
  })

  it('calls buildInvoicePDF and saveInvoice on success', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    supabaseResult = { data: null, error: null }
    const c = useInvoice()
    c.clientName.value = 'Client'
    c.addInvoiceLine()
    await c.handleGeneratePDF()
    expect(vi.mocked(mockBuildPDF)).toHaveBeenCalledOnce()
    expect(c.successMessage.value).toBe('dashboard.tools.invoice.invoiceSaved')
  })
})

// ─── onVehicleBlur ────────────────────────────────────────────

describe('onVehicleBlur', () => {
  it('calls without error', () => {
    const c = useInvoice()
    c.showVehicleDropdown.value = true
    expect(() => c.onVehicleBlur()).not.toThrow()
  })
})

// ─── Computed: invoiceSubtotal / invoiceTotalIva / invoiceTotal ──

describe('computed invoice totals (initial empty lines)', () => {
  it('invoiceSubtotal starts at 0', () => {
    const c = useInvoice()
    expect(c.invoiceSubtotal.value).toBe(0)
  })

  it('invoiceTotalIva starts at 0', () => {
    const c = useInvoice()
    expect(c.invoiceTotalIva.value).toBe(0)
  })

  it('invoiceTotal starts at 0', () => {
    const c = useInvoice()
    expect(c.invoiceTotal.value).toBe(0)
  })
})
