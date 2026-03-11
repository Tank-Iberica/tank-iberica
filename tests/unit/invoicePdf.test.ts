/**
 * Tests for app/utils/invoicePdf.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── DOM mocks for printHTML ────────────────────────────────────────────────────

const mockIframeDoc = {
  open: vi.fn(),
  write: vi.fn(),
  close: vi.fn(),
}

const mockIframeWindow = {
  focus: vi.fn(),
  print: vi.fn(),
}

const mockIframe = {
  id: '',
  style: { cssText: '' },
  contentDocument: mockIframeDoc,
  contentWindow: mockIframeWindow,
  remove: vi.fn(),
}

vi.spyOn(globalThis.document, 'getElementById').mockReturnValue(null as any)
vi.spyOn(globalThis.document.body, 'appendChild').mockReturnValue(mockIframe as any)

const origCreateElement = globalThis.document.createElement.bind(globalThis.document)
vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string): any => {
  if (tag === 'iframe') return mockIframe
  return origCreateElement(tag)
})

// ── Static import ─────────────────────────────────────────────────────────────

import { generateInvoicePDF } from '../../app/utils/invoicePdf'
import type { InvoiceLine } from '../../app/utils/invoiceTypes'

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseInvoiceData = {
  invoiceNumber: 'INV-2024-001',
  invoiceDate: '2024-01-15',
  invoiceLanguage: 'es' as const,
  invoiceConditions: '30 días neto',
  invoiceLines: [
    {
      id: 1,
      tipo: 'Venta' as const,
      concepto: 'Vehículo Volvo FH16',
      cantidad: 1,
      precioUd: 50000,
      iva: 21,
    },
  ] as InvoiceLine[],
  invoiceSubtotal: 50000,
  invoiceTotalIva: 10500,
  invoiceTotal: 60500,
  companyName: 'Tracciona SL',
  companyTaxId: 'B12345678',
  companyAddress1: 'Calle Mayor 1',
  companyAddress2: '28001 Madrid',
  companyAddress3: 'España',
  companyPhone: '+34 600 000 000',
  companyEmail: 'info@tracciona.com',
  companyLogoUrl: '',
  companyWebsite: 'https://tracciona.com',
  clientName: 'Cliente SA',
  clientDocType: 'NIF',
  clientDocNumber: 'B98765432',
  clientAddress1: 'Avenida Principal 10',
  clientAddress2: '41001 Sevilla',
  clientAddress3: 'España',
}

function captureHtml(): string {
  return mockIframeDoc.write.mock.calls[0]?.[0] ?? ''
}

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('generateInvoicePDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes HTML to iframe document', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(mockIframeDoc.write).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'))
  })

  it('includes invoice number in generated HTML', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('INV-2024-001')
  })

  it('includes company name', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('Tracciona SL')
  })

  it('uses Spanish labels when invoiceLanguage is es', () => {
    generateInvoicePDF(baseInvoiceData)
    const html = captureHtml()
    expect(html).toContain('FACTURA')
    expect(html).toContain('Facturado a')
    expect(html).toContain('N Factura')
  })

  it('uses English labels when invoiceLanguage is en', () => {
    generateInvoicePDF({ ...baseInvoiceData, invoiceLanguage: 'en' as const })
    const html = captureHtml()
    expect(html).toContain('INVOICE')
    expect(html).toContain('Billed to')
    expect(html).toContain('Invoice No')
  })

  it('formats date as DD-MM-YYYY', () => {
    generateInvoicePDF({ ...baseInvoiceData, invoiceDate: '2024-01-15' })
    expect(captureHtml()).toContain('15-01-2024')
  })

  it('includes line item concept', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('Vehículo Volvo FH16')
  })

  it('includes client name', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('Cliente SA')
  })

  it('includes invoice total amount', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('60500.00')
  })

  it('calculates line importe (cantidad × precioUd) correctly', () => {
    generateInvoicePDF(baseInvoiceData)
    // cantidad=1, precioUd=50000 → importe=50000.00
    expect(captureHtml()).toContain('50000.00')
  })

  it('calculates line subtotal (importe + iva%) correctly', () => {
    generateInvoicePDF(baseInvoiceData)
    // importe=50000, iva=21% → subtotal=60500.00
    const html = captureHtml()
    expect(html).toContain('60500.00')
  })

  it('includes logo img tag when companyLogoUrl is provided', () => {
    generateInvoicePDF({ ...baseInvoiceData, companyLogoUrl: 'https://cdn/logo.png' })
    const html = captureHtml()
    expect(html).toContain('<img')
    expect(html).toContain('https://cdn/logo.png')
  })

  it('does not include img tag when companyLogoUrl is empty', () => {
    generateInvoicePDF(baseInvoiceData) // companyLogoUrl: ''
    expect(captureHtml()).not.toContain('<img')
  })

  it('uses Venta label in Spanish for Venta line type', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('<td>Venta</td>')
  })

  it('uses Sale label in English for Venta line type', () => {
    generateInvoicePDF({ ...baseInvoiceData, invoiceLanguage: 'en' as const })
    expect(captureHtml()).toContain('<td>Sale</td>')
  })

  it('uses Rental label in English for Alquiler line type', () => {
    const data = {
      ...baseInvoiceData,
      invoiceLanguage: 'en' as const,
      invoiceLines: [{ id: 1, tipo: 'Alquiler' as const, concepto: 'Rental', cantidad: 1, precioUd: 1000, iva: 21 }],
    }
    generateInvoicePDF(data)
    expect(captureHtml()).toContain('<td>Rental</td>')
  })

  it('uses unknown tipo label as-is when not in lineTypes', () => {
    const data = {
      ...baseInvoiceData,
      invoiceLines: [{ id: 1, tipo: 'Venta' as const, concepto: 'Test', cantidad: 1, precioUd: 100, iva: 0 }],
    }
    generateInvoicePDF(data)
    // Venta maps to 'Venta' in Spanish
    expect(captureHtml()).toContain('Venta')
  })

  it('removes existing print frame before creating new one', () => {
    const existingFrame = { remove: vi.fn() }
    vi.spyOn(globalThis.document, 'getElementById').mockReturnValueOnce(existingFrame as any)
    generateInvoicePDF(baseInvoiceData)
    expect(existingFrame.remove).toHaveBeenCalled()
  })

  it('triggers print via contentWindow after setTimeout', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(mockIframeWindow.print).not.toHaveBeenCalled() // not yet
    vi.runAllTimers()
    expect(mockIframeWindow.print).toHaveBeenCalled()
  })

  it('handles empty invoice lines without throwing', () => {
    expect(() => generateInvoicePDF({ ...baseInvoiceData, invoiceLines: [] })).not.toThrow()
    expect(captureHtml()).toContain('<!DOCTYPE html>')
  })

  it('includes payment conditions in HTML', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('30 días neto')
  })

  it('includes company tax ID when provided', () => {
    generateInvoicePDF(baseInvoiceData)
    expect(captureHtml()).toContain('B12345678')
  })

  it('returns empty string for empty invoiceDate via formatDateDMY', () => {
    generateInvoicePDF({ ...baseInvoiceData, invoiceDate: '' })
    const html = captureHtml()
    // Empty date → formatDateDMY returns '' → no date string rendered
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('falls back to window.open when contentDocument is null', () => {
    const mockWin = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    }
    vi.spyOn(globalThis, 'open').mockReturnValueOnce(mockWin as any)

    // Make iframe have no contentDocument
    const savedContentDoc = mockIframe.contentDocument
    const savedContentWin = mockIframe.contentWindow
    Object.defineProperty(mockIframe, 'contentDocument', { value: null, writable: true, configurable: true })
    Object.defineProperty(mockIframe, 'contentWindow', { value: null, writable: true, configurable: true })

    generateInvoicePDF(baseInvoiceData)

    expect(globalThis.open).toHaveBeenCalledWith('', '_blank')
    expect(mockWin.document.write).toHaveBeenCalled()
    expect(mockWin.print).toHaveBeenCalled()

    // Restore
    Object.defineProperty(mockIframe, 'contentDocument', { value: savedContentDoc, writable: true, configurable: true })
    Object.defineProperty(mockIframe, 'contentWindow', { value: savedContentWin, writable: true, configurable: true })
  })

  it('falls back to window.open when iframe print throws', () => {
    mockIframeWindow.print.mockImplementation(() => { throw new Error('print blocked') })
    const mockWin = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    }
    vi.spyOn(globalThis, 'open').mockReturnValueOnce(mockWin as any)

    generateInvoicePDF(baseInvoiceData)
    vi.runAllTimers()

    expect(globalThis.open).toHaveBeenCalledWith('', '_blank')
    expect(mockWin.print).toHaveBeenCalled()

    mockIframeWindow.print.mockImplementation(vi.fn())
  })

  it('handles window.open returning null in doc-null fallback', () => {
    const savedContentDoc = mockIframe.contentDocument
    const savedContentWin = mockIframe.contentWindow
    Object.defineProperty(mockIframe, 'contentDocument', { value: null, writable: true, configurable: true })
    Object.defineProperty(mockIframe, 'contentWindow', { value: null, writable: true, configurable: true })
    vi.spyOn(globalThis, 'open').mockReturnValueOnce(null)

    expect(() => generateInvoicePDF(baseInvoiceData)).not.toThrow()

    Object.defineProperty(mockIframe, 'contentDocument', { value: savedContentDoc, writable: true, configurable: true })
    Object.defineProperty(mockIframe, 'contentWindow', { value: savedContentWin, writable: true, configurable: true })
  })

  it('handles window.open returning null in print-catch fallback', () => {
    mockIframeWindow.print.mockImplementation(() => { throw new Error('print blocked') })
    vi.spyOn(globalThis, 'open').mockReturnValueOnce(null)

    generateInvoicePDF(baseInvoiceData)
    vi.runAllTimers()

    // Should not throw
    expect(mockIframeDoc.write).toHaveBeenCalled()
    mockIframeWindow.print.mockImplementation(vi.fn())
  })
})
