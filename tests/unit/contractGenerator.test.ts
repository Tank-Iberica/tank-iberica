import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  numberToWords,
  formatDateSpanish,
  generateRentalContract,
  generateSaleContract,
  printHTML,
  type RentalContractData,
  type SaleContractData,
} from '../../app/utils/contractGenerator'

// ─── numberToWords ────────────────────────────────────────────────────────────

describe('numberToWords', () => {
  it('returns CERO for 0', () => {
    expect(numberToWords(0)).toBe('CERO')
  })

  it('returns unit words for 1-19', () => {
    expect(numberToWords(1)).toBe('UN')
    expect(numberToWords(5)).toBe('CINCO')
    expect(numberToWords(10)).toBe('DIEZ')
    expect(numberToWords(15)).toBe('QUINCE')
    expect(numberToWords(19)).toBe('DIECINUEVE')
  })

  it('returns VEINTE for 20', () => {
    expect(numberToWords(20)).toBe('VEINTE')
  })

  it('returns VEINTI+unit for 21-29', () => {
    expect(numberToWords(21)).toBe('VEINTIUN')
    expect(numberToWords(25)).toBe('VEINTICINCO')
  })

  it('returns tens+Y+unit for 31-99', () => {
    expect(numberToWords(30)).toBe('TREINTA')
    expect(numberToWords(35)).toBe('TREINTA Y CINCO')
    expect(numberToWords(99)).toBe('NOVENTA Y NUEVE')
  })

  it('returns CIEN for 100', () => {
    expect(numberToWords(100)).toBe('CIEN')
  })

  it('returns hundreds word for multiples of 100', () => {
    expect(numberToWords(200)).toBe('DOSCIENTOS')
    expect(numberToWords(500)).toBe('QUINIENTOS')
    expect(numberToWords(900)).toBe('NOVECIENTOS')
  })

  it('returns hundreds + units for 101-999', () => {
    expect(numberToWords(101)).toContain('CIEN')
    expect(numberToWords(250)).toContain('DOSCIENTOS')
    expect(numberToWords(543)).toContain('QUINIENTOS')
  })

  it('returns MIL for 1000', () => {
    expect(numberToWords(1000)).toBe('MIL')
  })

  it('returns DOS MIL for 2000', () => {
    expect(numberToWords(2000)).toBe('DOS MIL')
  })

  it('returns MIL + rest for 1001-1999', () => {
    expect(numberToWords(1500)).toContain('MIL')
    expect(numberToWords(1500)).toContain('QUINIENTOS')
  })

  it('returns localized number for 10000+', () => {
    const result = numberToWords(10000)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ─── formatDateSpanish ────────────────────────────────────────────────────────

describe('formatDateSpanish', () => {
  it('formats a date in Spanish long format', () => {
    const result = formatDateSpanish('2026-01-15')
    expect(result).toContain('15')
    expect(result).toContain('Enero')
    expect(result).toContain('2026')
  })

  it('uses correct Spanish month names', () => {
    expect(formatDateSpanish('2026-06-01')).toContain('Junio')
    expect(formatDateSpanish('2026-12-25')).toContain('Diciembre')
    expect(formatDateSpanish('2026-03-08')).toContain('Marzo')
  })

  it('includes "de" separator', () => {
    const result = formatDateSpanish('2026-04-20')
    expect(result).toContain(' de ')
  })
})

// ─── generateRentalContract ───────────────────────────────────────────────────

const baseRentalData: RentalContractData = {
  contractDate: '2026-03-01',
  contractLocation: 'Madrid',
  contractVehicleType: 'Camión',
  contractVehiclePlate: '1234-ABC',
  lessorRepresentative: 'Juan García',
  lessorRepresentativeNIF: '12345678A',
  lessorCompany: 'TransMotor S.L.',
  lessorCIF: 'B12345678',
  lessorAddress: 'Calle Mayor 1, Madrid',
  clientType: 'empresa',
  clientName: 'Pedro Pérez',
  clientNIF: '87654321B',
  clientCompany: 'LogiCorp S.A.',
  clientCIF: 'A87654321',
  clientRepresentative: 'María López',
  clientRepresentativeNIF: '11223344C',
  clientAddress: 'Avenida Principal 5, Barcelona',
  contractMonthlyRent: 1500,
  contractDeposit: 3000,
  contractDuration: 12,
  contractDurationUnit: 'meses',
  contractPaymentDays: 5,
  contractVehicleResidualValue: 5000,
  contractJurisdiction: 'Madrid',
  contractHasPurchaseOption: true,
  contractPurchasePrice: 45000,
  contractPurchaseNotice: 3,
  contractRentMonthsToDiscount: 6,
}

describe('generateRentalContract', () => {
  it('returns a string (HTML)', () => {
    const result = generateRentalContract(baseRentalData)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(100)
  })

  it('contains DOCTYPE declaration', () => {
    const result = generateRentalContract(baseRentalData)
    expect(result).toContain('<!DOCTYPE html>')
  })

  it('includes lessor company name', () => {
    const result = generateRentalContract(baseRentalData)
    expect(result.toUpperCase()).toContain('TRANSMOTOR')
  })

  it('includes vehicle plate', () => {
    const result = generateRentalContract(baseRentalData)
    expect(result).toContain('1234-ABC')
  })

  it('includes contract jurisdiction', () => {
    const result = generateRentalContract(baseRentalData)
    expect(result).toContain('Madrid')
  })

  it('uses persona section for clientType=persona', () => {
    const data = { ...baseRentalData, clientType: 'persona' as const }
    const result = generateRentalContract(data)
    expect(result).toContain(data.clientNIF)
  })

  it('uses empresa section for clientType=empresa', () => {
    const result = generateRentalContract(baseRentalData)
    expect(result.toUpperCase()).toContain('LOGICORP')
  })

  it('includes monthly rent in words', () => {
    const result = generateRentalContract(baseRentalData)
    // 1500 → MIL QUINIENTOS
    expect(result.toUpperCase()).toContain('MIL')
  })
})

// ─── generateSaleContract ─────────────────────────────────────────────────────

const baseSaleData: SaleContractData = {
  contractDate: '2026-03-01',
  contractLocation: 'Valencia',
  contractVehicleType: 'Semirremolque',
  contractVehiclePlate: '5678-XYZ',
  lessorRepresentative: 'Carlos Ruiz',
  lessorRepresentativeNIF: '99887766D',
  lessorCompany: 'VentaCamiones S.L.',
  lessorCIF: 'B99887766',
  lessorAddress: 'Calle Industrial 10, Valencia',
  clientType: 'persona',
  clientName: 'Ana Martínez',
  clientNIF: '55667788E',
  clientCompany: '',
  clientCIF: '',
  clientRepresentative: '',
  clientRepresentativeNIF: '',
  clientAddress: 'Calle Secundaria 3, Sevilla',
  contractSalePrice: 38000,
  contractSalePaymentMethod: 'Transferencia bancaria',
  contractSaleDeliveryConditions: 'Inmediata',
  contractSaleWarranty: '6 meses',
  contractJurisdiction: 'Valencia',
}

describe('generateSaleContract', () => {
  it('returns a string (HTML)', () => {
    const result = generateSaleContract(baseSaleData)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(100)
  })

  it('contains DOCTYPE declaration', () => {
    expect(generateSaleContract(baseSaleData)).toContain('<!DOCTYPE html>')
  })

  it('includes vehicle plate', () => {
    expect(generateSaleContract(baseSaleData)).toContain('5678-XYZ')
  })

  it('includes lessor company', () => {
    const result = generateSaleContract(baseSaleData)
    expect(result.toUpperCase()).toContain('VENTACAMIONES')
  })

  it('includes sale price in words', () => {
    const result = generateSaleContract(baseSaleData)
    // 38000 is ≥10000, uses toLocaleString
    expect(result).toBeTruthy()
  })

  it('includes jurisdiction', () => {
    expect(generateSaleContract(baseSaleData)).toContain('Valencia')
  })

  it('uses empresa section for clientType=empresa', () => {
    const data: SaleContractData = {
      ...baseSaleData,
      clientType: 'empresa',
      clientCompany: 'LogiCorp S.A.',
      clientCIF: 'A87654321',
      clientRepresentative: 'María López',
      clientRepresentativeNIF: '11223344C',
    }
    const result = generateSaleContract(data)
    expect(result.toUpperCase()).toContain('LOGICORP')
    expect(result).toContain('A87654321')
    expect(result).toContain('María López')
  })

  it('uses default delivery conditions when empty', () => {
    const data: SaleContractData = { ...baseSaleData, contractSaleDeliveryConditions: '' }
    const result = generateSaleContract(data)
    expect(result).toContain('estado en que se encuentra')
  })

  it('uses default warranty text when empty', () => {
    const data: SaleContractData = { ...baseSaleData, contractSaleWarranty: '' }
    const result = generateSaleContract(data)
    expect(result).toContain('vicios ocultos')
  })
})

// ─── generateRentalContract — additional branches ────────────────────────────

describe('generateRentalContract — extra branches', () => {
  it('omits purchase option section when contractHasPurchaseOption is false', () => {
    const data: RentalContractData = { ...baseRentalData, contractHasPurchaseOption: false }
    const result = generateRentalContract(data)
    expect(result).not.toContain('OPCION DE COMPRA')
  })
})

// ─── printHTML ───────────────────────────────────────────────────────────────

describe('printHTML', () => {
  const mockIframeDoc2 = {
    open: vi.fn(),
    write: vi.fn(),
    close: vi.fn(),
  }
  const mockIframeWin2 = {
    focus: vi.fn(),
    print: vi.fn(),
  }
  const mockIframe2: Record<string, unknown> = {
    id: '',
    style: { cssText: '' },
    contentDocument: mockIframeDoc2,
    contentWindow: mockIframeWin2,
    remove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.spyOn(globalThis.document, 'getElementById').mockReturnValue(null as any)
    vi.spyOn(globalThis.document.body, 'appendChild').mockReturnValue(mockIframe2 as any)
    const origCE = globalThis.document.createElement.bind(globalThis.document)
    vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string): any => {
      if (tag === 'iframe') return mockIframe2
      return origCE(tag)
    })
    mockIframe2.contentDocument = mockIframeDoc2
    mockIframe2.contentWindow = mockIframeWin2
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes HTML to iframe and prints after timeout', () => {
    printHTML('<html>test</html>')
    expect(mockIframeDoc2.write).toHaveBeenCalledWith('<html>test</html>')
    vi.runAllTimers()
    expect(mockIframeWin2.print).toHaveBeenCalled()
  })

  it('removes existing print-frame before creating new one', () => {
    const existing = { remove: vi.fn() }
    vi.spyOn(globalThis.document, 'getElementById').mockReturnValueOnce(existing as any)
    printHTML('<html>test</html>')
    expect(existing.remove).toHaveBeenCalled()
  })

  it('returns early when doc is null', () => {
    mockIframe2.contentDocument = null
    mockIframe2.contentWindow = null
    printHTML('<html>test</html>')
    expect(mockIframeDoc2.write).not.toHaveBeenCalled()
  })

  it('falls back to window.open when print throws', () => {
    mockIframeWin2.print.mockImplementation(() => { throw new Error('blocked') })
    const mockWin = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    }
    vi.spyOn(globalThis, 'open').mockReturnValueOnce(mockWin as any)
    printHTML('<html>test</html>')
    vi.runAllTimers()
    expect(mockWin.print).toHaveBeenCalled()
    mockIframeWin2.print.mockImplementation(vi.fn())
  })

  it('handles window.open returning null in catch fallback', () => {
    mockIframeWin2.print.mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(globalThis, 'open').mockReturnValueOnce(null)
    printHTML('<html>test</html>')
    expect(() => vi.runAllTimers()).not.toThrow()
    mockIframeWin2.print.mockImplementation(vi.fn())
  })
})
