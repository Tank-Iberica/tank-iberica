import { describe, it, expect, vi } from 'vitest'
import { useInvoiceGenerator } from '../../app/composables/admin/useInvoiceGenerator'
import type { VehicleOption, InvoiceLine } from '../../app/composables/admin/useInvoiceGenerator'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockVehicleOptions: VehicleOption[] = [
  { id: 'dealer-1-v1', label: 'Volvo FH16 2022 1234ABC', source: 'vehicles' },
  { id: 'dealer-2-v2', label: 'Renault T520 2020 5678DEF', source: 'vehicles' },
]

function getVehicleOptions() {
  return mockVehicleOptions
}

function makeLine(overrides: Partial<InvoiceLine> = {}): InvoiceLine {
  return {
    id: 1,
    tipo: 'Venta',
    concepto: 'Test item',
    cantidad: 2,
    precioUd: 500,
    iva: 21,
    ...overrides,
  }
}

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('invoiceConditions starts as "Pago a 30 días"', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceConditions.value).toBe('Pago a 30 días')
  })

  it('invoiceInEnglish starts as false', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceInEnglish.value).toBe(false)
  })

  it('invoiceNumber starts as empty string (onMounted is no-op)', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceNumber.value).toBe('')
  })

  it('numVehicles starts as 1', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.numVehicles.value).toBe(1)
  })

  it('selectedVehicles starts with one empty string', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.selectedVehicles.value).toEqual([''])
  })

  it('invoiceLines starts empty (onMounted is no-op)', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceLines.value).toHaveLength(0)
  })

  it('clientName starts as empty string', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.clientName.value).toBe('')
  })

  it('clientDocType starts as "NIF"', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.clientDocType.value).toBe('NIF')
  })

  it('companyName starts as "TRACCIONA S.L."', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.companyName.value).toBe('TRACCIONA S.L.')
  })

  it('invoiceDate starts as a valid date string', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceDate.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('invoiceSubtotal starts as 0', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceSubtotal.value).toBe(0)
  })

  it('invoiceTotalIva starts as 0', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceTotalIva.value).toBe(0)
  })

  it('invoiceTotal starts as 0', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceTotal.value).toBe(0)
  })
})

// ─── addInvoiceLine ────────────────────────────────────────────────────────────

describe('addInvoiceLine', () => {
  it('adds a line to invoiceLines', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    expect(c.invoiceLines.value).toHaveLength(1)
  })

  it('new line has tipo "Venta"', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    expect(c.invoiceLines.value[0]!.tipo).toBe('Venta')
  })

  it('new line has cantidad 1', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    expect(c.invoiceLines.value[0]!.cantidad).toBe(1)
  })

  it('new line has precioUd 0 and iva 21', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    expect(c.invoiceLines.value[0]!.precioUd).toBe(0)
    expect(c.invoiceLines.value[0]!.iva).toBe(21)
  })

  it('new line has empty concepto', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    expect(c.invoiceLines.value[0]!.concepto).toBe('')
  })

  it('each line gets a unique id', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.addInvoiceLine()
    const ids = c.invoiceLines.value.map((l) => l.id)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('adds multiple lines sequentially', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.addInvoiceLine()
    c.addInvoiceLine()
    expect(c.invoiceLines.value).toHaveLength(3)
  })
})

// ─── removeInvoiceLine ────────────────────────────────────────────────────────

describe('removeInvoiceLine', () => {
  it('removes the line with the given id', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.addInvoiceLine()
    const idToRemove = c.invoiceLines.value[0]!.id
    c.removeInvoiceLine(idToRemove)
    expect(c.invoiceLines.value.some((l) => l.id === idToRemove)).toBe(false)
  })

  it('leaves other lines intact', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.addInvoiceLine()
    const secondId = c.invoiceLines.value[1]!.id
    c.removeInvoiceLine(c.invoiceLines.value[0]!.id)
    expect(c.invoiceLines.value).toHaveLength(1)
    expect(c.invoiceLines.value[0]!.id).toBe(secondId)
  })

  it('does nothing when id does not exist', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.removeInvoiceLine(9999)
    expect(c.invoiceLines.value).toHaveLength(1)
  })
})

// ─── onNumVehiclesChange ──────────────────────────────────────────────────────

describe('onNumVehiclesChange', () => {
  it('adds empty string entries when numVehicles increases', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.numVehicles.value = 3
    c.onNumVehiclesChange()
    expect(c.selectedVehicles.value).toHaveLength(3)
  })

  it('removes entries when numVehicles decreases', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.numVehicles.value = 3
    c.onNumVehiclesChange()
    c.numVehicles.value = 1
    c.onNumVehiclesChange()
    expect(c.selectedVehicles.value).toHaveLength(1)
  })

  it('adds invoice lines equal to numVehicles when invoiceLines is empty', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(c.invoiceLines.value).toHaveLength(0)
    c.numVehicles.value = 2
    c.onNumVehiclesChange()
    expect(c.invoiceLines.value).toHaveLength(2)
  })

  it('does not add lines when invoiceLines already has items', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.numVehicles.value = 3
    c.onNumVehiclesChange()
    expect(c.invoiceLines.value).toHaveLength(1)
  })

  it('updates invoiceNumber after change', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.numVehicles.value = 1
    c.onNumVehiclesChange()
    expect(c.invoiceNumber.value).toMatch(/^\d{4}\//)
  })
})

// ─── onVehicleSelected ────────────────────────────────────────────────────────

describe('onVehicleSelected', () => {
  it('returns early when selectedVehicles[index] is empty', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.selectedVehicles.value[0] = ''
    c.onVehicleSelected(0)
    expect(c.invoiceLines.value[0]!.concepto).toBe('')
  })

  it('sets concepto from vehicle label', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.selectedVehicles.value[0] = 'dealer-1-v1'
    c.onVehicleSelected(0)
    expect(c.invoiceLines.value[0]!.concepto).toBe('Volvo FH16 2022 1234ABC')
  })

  it('does not throw when vehicle id is not in options', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.selectedVehicles.value[0] = 'nonexistent-id'
    expect(() => c.onVehicleSelected(0)).not.toThrow()
  })

  it('updates invoiceNumber using vehicle id split', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.selectedVehicles.value[0] = 'dealer-1-v1'
    c.onVehicleSelected(0)
    // 'dealer-1-v1'.split('-')[1] = '1' → invoiceNumber includes '1'
    expect(c.invoiceNumber.value).toContain('1')
  })
})

// ─── getLineImporte ───────────────────────────────────────────────────────────

describe('getLineImporte', () => {
  it('returns cantidad * precioUd', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    const line = makeLine({ cantidad: 3, precioUd: 1000 })
    expect(c.getLineImporte(line)).toBe(3000)
  })

  it('returns 0 when precioUd is 0', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    const line = makeLine({ cantidad: 5, precioUd: 0 })
    expect(c.getLineImporte(line)).toBe(0)
  })

  it('handles decimal precioUd', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    const line = makeLine({ cantidad: 2, precioUd: 9.99 })
    expect(c.getLineImporte(line)).toBeCloseTo(19.98)
  })
})

// ─── getLineSubtotal ──────────────────────────────────────────────────────────

describe('getLineSubtotal', () => {
  it('returns importe + iva amount', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    const line = makeLine({ cantidad: 1, precioUd: 1000, iva: 21 })
    expect(c.getLineSubtotal(line)).toBe(1210)
  })

  it('returns 0 for zero-priced line', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    const line = makeLine({ cantidad: 1, precioUd: 0, iva: 21 })
    expect(c.getLineSubtotal(line)).toBe(0)
  })

  it('returns importe when iva is 0', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    const line = makeLine({ cantidad: 1, precioUd: 500, iva: 0 })
    expect(c.getLineSubtotal(line)).toBe(500)
  })
})

// ─── resetForm ────────────────────────────────────────────────────────────────

describe('resetForm', () => {
  it('resets invoiceConditions to "Pago a 30 días"', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.invoiceConditions.value = 'Al contado'
    c.resetForm()
    expect(c.invoiceConditions.value).toBe('Pago a 30 días')
  })

  it('resets invoiceInEnglish to false', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.invoiceInEnglish.value = true
    c.resetForm()
    expect(c.invoiceInEnglish.value).toBe(false)
  })

  it('resets numVehicles to 1', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.numVehicles.value = 5
    c.resetForm()
    expect(c.numVehicles.value).toBe(1)
  })

  it('resets selectedVehicles to one empty string', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.selectedVehicles.value = ['v1', 'v2', 'v3']
    c.resetForm()
    expect(c.selectedVehicles.value).toEqual([''])
  })

  it('resets clientName to empty string', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.clientName.value = 'Empresa Acme SL'
    c.resetForm()
    expect(c.clientName.value).toBe('')
  })

  it('resets clientDocType to "NIF"', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.clientDocType.value = 'CIF'
    c.resetForm()
    expect(c.clientDocType.value).toBe('NIF')
  })

  it('leaves exactly one invoice line after reset', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.addInvoiceLine()
    c.addInvoiceLine()
    c.resetForm()
    expect(c.invoiceLines.value).toHaveLength(1)
  })

  it('updates invoiceNumber with year/000 format', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.resetForm()
    expect(c.invoiceNumber.value).toMatch(/^\d{4}\/000$/)
  })

  it('resets clientAddress1 to empty string', () => {
    const c = useInvoiceGenerator(getVehicleOptions)
    c.clientAddress1.value = 'Calle Mayor 1'
    c.resetForm()
    expect(c.clientAddress1.value).toBe('')
  })
})

// ─── generateInvoicePDF ───────────────────────────────────────────────────────

describe('generateInvoicePDF', () => {
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

  it('does not throw with default state', () => {
    setupDocumentStub()
    const c = useInvoiceGenerator(getVehicleOptions)
    expect(() => c.generateInvoicePDF()).not.toThrow()
  })

  it('generates HTML with Spanish labels when invoiceInEnglish is false', () => {
    const htmlCapture: string[] = []
    setupDocumentStub(htmlCapture)
    const c = useInvoiceGenerator(getVehicleOptions)
    c.invoiceInEnglish.value = false
    c.generateInvoicePDF()
    expect(htmlCapture.join('')).toContain('FACTURA')
  })

  it('generates HTML with English labels when invoiceInEnglish is true', () => {
    const htmlCapture: string[] = []
    setupDocumentStub(htmlCapture)
    const c = useInvoiceGenerator(getVehicleOptions)
    c.invoiceInEnglish.value = true
    c.generateInvoicePDF()
    expect(htmlCapture.join('')).toContain('INVOICE')
  })

  it('includes company name in generated HTML', () => {
    const htmlCapture: string[] = []
    setupDocumentStub(htmlCapture)
    const c = useInvoiceGenerator(getVehicleOptions)
    c.generateInvoicePDF()
    expect(htmlCapture.join('')).toContain('TRACCIONA S.L.')
  })

  it('includes invoice lines in generated HTML', () => {
    const htmlCapture: string[] = []
    setupDocumentStub(htmlCapture)
    const c = useInvoiceGenerator(getVehicleOptions)
    c.addInvoiceLine()
    c.invoiceLines.value[0]!.concepto = 'Camion Volvo FH16'
    c.generateInvoicePDF()
    expect(htmlCapture.join('')).toContain('Camion Volvo FH16')
  })
})
