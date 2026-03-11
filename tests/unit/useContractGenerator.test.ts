import { describe, it, expect, vi } from 'vitest'
import { useContractGenerator } from '../../app/composables/admin/useContractGenerator'
import type { VehicleOption } from '../../app/composables/admin/useContractGenerator'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockVehicleOptions: VehicleOption[] = [
  { id: 'v1', label: 'Volvo FH16 Cisterna (1234ABC)', source: 'vehicles' },
  { id: 'v2', label: 'Renault T520 Semirremolque (5678DEF)', source: 'vehicles' },
  { id: 'v3', label: 'DAF XF 105 Cabeza Tractora (9999GHI)', source: 'vehicles' },
  { id: 'v4', label: 'Schmitz Trailer Curtainsider (2222JKL)', source: 'vehicles' },
  { id: 'v5', label: 'Mercedes Actros (MMMM123)', source: 'vehicles' },
]

function getVehicleOptions() {
  return mockVehicleOptions
}

// ─── Document stub helper ─────────────────────────────────────────────────────

function setupDocumentStub(captureHtml?: string[]) {
  const mockIframe = {
    id: '',
    style: { cssText: '' },
    contentDocument: {
      open: vi.fn(),
      write: captureHtml ? (h: string) => captureHtml.push(h) : vi.fn(),
      close: vi.fn(),
    },
    contentWindow: null,
  }
  vi.stubGlobal('document', {
    getElementById: vi.fn().mockReturnValue(null),
    createElement: vi.fn().mockReturnValue(mockIframe),
    body: { appendChild: vi.fn() },
    head: { appendChild: vi.fn() },
  })
  return mockIframe
}

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('contractType starts as "arrendamiento"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractType.value).toBe('arrendamiento')
  })

  it('contractLocation starts as "León"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractLocation.value).toBe('León')
  })

  it('contractVehicle starts as empty string', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractVehicle.value).toBe('')
  })

  it('lessorCompany starts as "TRUCKTANKIBERICA SL"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.lessorCompany.value).toBe('TRUCKTANKIBERICA SL')
  })

  it('lesseeType starts as "persona"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.lesseeType.value).toBe('persona')
  })

  it('contractVehicleType starts as "semirremolque cisterna"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractVehicleType.value).toBe('semirremolque cisterna')
  })

  it('contractMonthlyRent starts as 1200', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractMonthlyRent.value).toBe(1200)
  })

  it('contractDeposit starts as 2400', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractDeposit.value).toBe(2400)
  })

  it('contractDuration starts as 8', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractDuration.value).toBe(8)
  })

  it('contractDurationUnit starts as "meses"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractDurationUnit.value).toBe('meses')
  })

  it('contractPaymentDays starts as 10', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractPaymentDays.value).toBe(10)
  })

  it('contractHasPurchaseOption starts as true', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractHasPurchaseOption.value).toBe(true)
  })

  it('contractPurchasePrice starts as 10000', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractPurchasePrice.value).toBe(10000)
  })

  it('contractPurchaseNotice starts as 14', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractPurchaseNotice.value).toBe(14)
  })

  it('contractRentMonthsToDiscount starts as 3', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractRentMonthsToDiscount.value).toBe(3)
  })

  it('contractSalePrice starts as 0', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractSalePrice.value).toBe(0)
  })

  it('contractSalePaymentMethod starts as "Transferencia bancaria"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractSalePaymentMethod.value).toBe('Transferencia bancaria')
  })

  it('contractJurisdiction starts as "León"', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractJurisdiction.value).toBe('León')
  })

  it('contractVehicleResidualValue starts as 13000', () => {
    const c = useContractGenerator(getVehicleOptions)
    expect(c.contractVehicleResidualValue.value).toBe(13000)
  })
})

// ─── onContractVehicleSelected ────────────────────────────────────────────────

describe('onContractVehicleSelected', () => {
  it('returns early when contractVehicle is empty', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = ''
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('')
  })

  it('extracts plate from parentheses in label', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'v1'
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('1234ABC')
  })

  it('detects "semirremolque cisterna" from label containing "cisterna"', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'v1'
    c.onContractVehicleSelected()
    expect(c.contractVehicleType.value).toBe('semirremolque cisterna')
  })

  it('detects "semirremolque" from label containing "semirremolque"', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'v2'
    c.onContractVehicleSelected()
    expect(c.contractVehicleType.value).toBe('semirremolque')
  })

  it('detects "cabeza tractora" from label containing "tractora"', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'v3'
    c.onContractVehicleSelected()
    expect(c.contractVehicleType.value).toBe('cabeza tractora')
  })

  it('detects "trailer" from label containing "trailer"', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'v4'
    c.onContractVehicleSelected()
    expect(c.contractVehicleType.value).toBe('trailer')
  })

  it('defaults to "vehículo" for unknown label', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'v5'
    c.onContractVehicleSelected()
    expect(c.contractVehicleType.value).toBe('vehículo')
  })

  it('does not set plate when label has no parentheses', () => {
    const opts = [{ id: 'v6', label: 'Volvo FH16 sin matricula', source: 'vehicles' as const }]
    const c = useContractGenerator(() => opts)
    c.contractVehicle.value = 'v6'
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('')
  })

  it('does nothing when vehicle id not in options', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'nonexistent'
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('')
  })
})

// ─── resetForm ────────────────────────────────────────────────────────────────

describe('resetForm', () => {
  it('resets contractType to "arrendamiento"', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractType.value = 'venta'
    c.resetForm()
    expect(c.contractType.value).toBe('arrendamiento')
  })

  it('resets contractVehicle to empty string', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehicle.value = 'v1'
    c.resetForm()
    expect(c.contractVehicle.value).toBe('')
  })

  it('resets contractVehiclePlate to empty string', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractVehiclePlate.value = '1234ABC'
    c.resetForm()
    expect(c.contractVehiclePlate.value).toBe('')
  })

  it('resets lesseeType to "persona"', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.lesseeType.value = 'empresa'
    c.resetForm()
    expect(c.lesseeType.value).toBe('persona')
  })

  it('resets lesseeName to empty string', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.lesseeName.value = 'Juan Pérez'
    c.resetForm()
    expect(c.lesseeName.value).toBe('')
  })

  it('resets contractMonthlyRent to 1200', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractMonthlyRent.value = 5000
    c.resetForm()
    expect(c.contractMonthlyRent.value).toBe(1200)
  })

  it('resets contractDeposit to 2400', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractDeposit.value = 10000
    c.resetForm()
    expect(c.contractDeposit.value).toBe(2400)
  })

  it('resets contractDuration to 8', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractDuration.value = 24
    c.resetForm()
    expect(c.contractDuration.value).toBe(8)
  })

  it('resets contractHasPurchaseOption to true', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractHasPurchaseOption.value = false
    c.resetForm()
    expect(c.contractHasPurchaseOption.value).toBe(true)
  })

  it('resets contractPurchasePrice to 10000', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractPurchasePrice.value = 50000
    c.resetForm()
    expect(c.contractPurchasePrice.value).toBe(10000)
  })

  it('resets contractSalePrice to 0', () => {
    const c = useContractGenerator(getVehicleOptions)
    c.contractSalePrice.value = 45000
    c.resetForm()
    expect(c.contractSalePrice.value).toBe(0)
  })

  it('does not reset lessor data', () => {
    const c = useContractGenerator(getVehicleOptions)
    const originalCompany = c.lessorCompany.value
    c.resetForm()
    expect(c.lessorCompany.value).toBe(originalCompany)
  })
})

// ─── generateContractPDF ──────────────────────────────────────────────────────

describe('generateContractPDF', () => {
  it('does not throw with default arrendamiento state', () => {
    setupDocumentStub()
    const c = useContractGenerator(getVehicleOptions)
    expect(() => c.generateContractPDF()).not.toThrow()
  })

  it('does not throw with venta state', () => {
    setupDocumentStub()
    const c = useContractGenerator(getVehicleOptions)
    c.contractType.value = 'venta'
    expect(() => c.generateContractPDF()).not.toThrow()
  })

  it('generates arrendamiento HTML for contractType "arrendamiento"', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractType.value = 'arrendamiento'
    c.generateContractPDF()
    expect(html.join('')).toContain('CONTRATO DE ARRENDAMIENTO')
  })

  it('generates compraventa HTML for contractType "venta"', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractType.value = 'venta'
    c.generateContractPDF()
    expect(html.join('')).toContain('CONTRATO DE COMPRAVENTA')
  })

  it('includes lessor company name in HTML', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.generateContractPDF()
    expect(html.join('')).toContain('TRUCKTANKIBERICA')
  })

  it('includes jurisdiction in rental HTML', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractJurisdiction.value = 'Madrid'
    c.generateContractPDF()
    expect(html.join('')).toContain('Madrid')
  })

  it('includes purchase option clause when contractHasPurchaseOption is true', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractHasPurchaseOption.value = true
    c.generateContractPDF()
    expect(html.join('')).toContain('OPCIÓN DE COMPRA')
  })

  it('does not include purchase option clause when contractHasPurchaseOption is false', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractHasPurchaseOption.value = false
    c.generateContractPDF()
    expect(html.join('')).not.toContain('OPCIÓN DE COMPRA')
  })
})

// ─── numberToWords (via generateContractPDF) ──────────────────────────────────

describe('numberToWords — indirect via generateContractPDF', () => {
  it('converts 0 to CERO', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractMonthlyRent.value = 0
    c.generateContractPDF()
    expect(html.join('')).toContain('CERO')
  })

  it('converts 1200 to MIL DOSCIENTOS', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractMonthlyRent.value = 1200
    c.generateContractPDF()
    expect(html.join('')).toContain('MIL DOSCIENTOS')
  })

  it('converts 2400 to DOS MIL CUATROCIENTOS (deposit)', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractDeposit.value = 2400
    c.generateContractPDF()
    expect(html.join('')).toContain('DOS MIL CUATROCIENTOS')
  })

  it('converts 10000 to DIEZ MIL (purchase price)', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractPurchasePrice.value = 10000
    c.generateContractPDF()
    // n >= 10000 → n.toLocaleString('es-ES') = '10.000'
    expect(html.join('')).toContain('10.000')
  })

  it('converts 0 sale price to CERO in venta contract', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.contractType.value = 'venta'
    c.contractSalePrice.value = 0
    c.generateContractPDF()
    expect(html.join('')).toContain('CERO')
  })
})

// ─── party section (persona vs empresa) via generateContractPDF ───────────────

describe('party section in generated HTML', () => {
  it('includes persona NIF for lesseeType="persona"', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.lesseeType.value = 'persona'
    c.lesseeName.value = 'Juan Pérez López'
    c.lesseeNIF.value = '12345678A'
    c.generateContractPDF()
    expect(html.join('')).toContain('12345678A')
  })

  it('includes empresa CIF for lesseeType="empresa"', () => {
    const html: string[] = []
    setupDocumentStub(html)
    const c = useContractGenerator(getVehicleOptions)
    c.lesseeType.value = 'empresa'
    c.lesseeCompany.value = 'Empresa Test SL'
    c.lesseeCIF.value = 'B99999999'
    c.generateContractPDF()
    expect(html.join('')).toContain('B99999999')
  })
})
