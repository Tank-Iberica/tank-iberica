/**
 * Tests for app/utils/adminProductosExport.ts
 * Covers: getStatusLabel, exportToExcel, exportToPdf, exportVehicleFicha
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock formatPrice ─────────────────────────────────────────────────────────

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (n: number | null | undefined) => (n != null ? `${n} €` : '-'),
}))

// ── Mock jspdf ───────────────────────────────────────────────────────────────

const mockPdfDoc = {
  setFillColor: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  rect: vi.fn(),
  roundedRect: vi.fn(),
  line: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  getTextWidth: vi.fn().mockReturnValue(20),
  splitTextToSize: vi.fn((text: string) => [text]),
  save: vi.fn(),
  internal: {
    pageSize: {
      getWidth: vi.fn().mockReturnValue(210),
    },
  },
}

vi.mock('jspdf', () => {
  function JsPDFConstructor() { return mockPdfDoc }
  return { jsPDF: JsPDFConstructor }
})

// ── Mock jspdf-autotable ─────────────────────────────────────────────────────

const mockAutoTable = vi.fn()
vi.mock('jspdf-autotable', () => ({ default: mockAutoTable }))

// ── Mock exceljs ─────────────────────────────────────────────────────────────

const mockWorksheet = {
  columns: [],
  addRow: vi.fn(),
  getRow: vi.fn().mockReturnValue({ font: {}, fill: {} }),
}

const mockWorkbook = {
  addWorksheet: vi.fn().mockReturnValue(mockWorksheet),
  xlsx: {
    writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
  },
}

vi.mock('exceljs', () => {
  function WorkbookConstructor() { return mockWorkbook }
  return { Workbook: WorkbookConstructor }
})

// ── Mock DOM APIs ────────────────────────────────────────────────────────────

const mockLink = { href: '', download: '', click: vi.fn() }
const origCE = globalThis.document?.createElement?.bind(globalThis.document)
vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string): any => {
  if (tag === 'a') return mockLink
  return origCE?.(tag) ?? ({} as HTMLElement)
})
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

// ── Static imports ───────────────────────────────────────────────────────────

import {
  getStatusLabel,
  exportToExcel,
  exportToPdf,
  exportVehicleFicha,
} from '../../app/utils/adminProductosExport'
import type { AdminVehicle } from '../../app/composables/admin/useAdminVehicles'

// ── Helpers ──────────────────────────────────────────────────────────────────

const helpers = {
  getSubcategoryName: (id: string | null | undefined) => id ? `Type-${id}` : '-',
}

function makeVehicle(overrides: Partial<AdminVehicle> = {}): AdminVehicle {
  return {
    id: 'v1',
    slug: 'volvo-fh16-2020',
    brand: 'Volvo',
    model: 'FH16',
    year: 2020,
    price: 65000,
    status: 'published',
    is_online: true,
    category: 'camion',
    type_id: 'tipo-1',
    plate: '1234-ABC',
    location: 'Madrid',
    min_price: 55000,
    acquisition_cost: 50000,
    rental_price: 200,
    description_es: 'Camión en buen estado.',
    ...overrides,
  } as AdminVehicle
}

// ══ Tests ═════════════════════════════════════════════════════════════════════

// ─── getStatusLabel ──────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns "Publicado" for published', () => {
    expect(getStatusLabel('published')).toBe('Publicado')
  })

  it('returns raw status for unknown values', () => {
    expect(getStatusLabel('unknown')).toBe('unknown')
  })
})

// ─── exportToExcel ───────────────────────────────────────────────────────────

describe('exportToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(10))
  })

  it('creates a workbook with Productos worksheet', async () => {
    await exportToExcel([makeVehicle()], helpers)
    expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Productos')
  })

  it('adds one row per vehicle', async () => {
    const vehicles = [makeVehicle(), makeVehicle({ id: 'v2', brand: 'MAN' })]
    await exportToExcel(vehicles, helpers)
    expect(mockWorksheet.addRow).toHaveBeenCalledTimes(2)
  })

  it('sets header row to bold', async () => {
    await exportToExcel([makeVehicle()], helpers)
    expect(mockWorksheet.getRow).toHaveBeenCalledWith(1)
  })

  it('triggers download via link click', async () => {
    await exportToExcel([makeVehicle()], helpers)
    expect(mockLink.click).toHaveBeenCalled()
    expect(mockLink.download).toContain('productos_')
    expect(mockLink.download).toContain('.xlsx')
  })

  it('revokes object URL after download', async () => {
    await exportToExcel([makeVehicle()], helpers)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })

  it('maps vehicle fields correctly in row', async () => {
    await exportToExcel([makeVehicle()], helpers)
    const addedRow = mockWorksheet.addRow.mock.calls[0]![0]
    expect(addedRow.online).toBe('Online')
    expect(addedRow.brand).toBe('Volvo')
    expect(addedRow.status).toBe('Publicado')
    expect(addedRow.plate).toBe('1234-ABC')
  })

  it('maps offline vehicle correctly', async () => {
    await exportToExcel([makeVehicle({ is_online: false })], helpers)
    const addedRow = mockWorksheet.addRow.mock.calls[0]![0]
    expect(addedRow.online).toBe('Offline')
  })

  it('uses dash for missing plate', async () => {
    await exportToExcel([makeVehicle({ plate: null } as any)], helpers)
    const addedRow = mockWorksheet.addRow.mock.calls[0]![0]
    expect(addedRow.plate).toBe('-')
  })
})

// ─── exportToPdf ─────────────────────────────────────────────────────────────

describe('exportToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates landscape A4 PDF', async () => {
    await exportToPdf([makeVehicle()], helpers)
    expect(mockPdfDoc.text).toHaveBeenCalledWith(
      expect.stringContaining('Tracciona - Productos'),
      14,
      15,
    )
  })

  it('includes vehicle count in subtitle', async () => {
    await exportToPdf([makeVehicle(), makeVehicle({ id: 'v2' })], helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('2 productos'))).toBe(true)
  })

  it('calls autoTable with headers and rows', async () => {
    await exportToPdf([makeVehicle()], helpers)
    expect(mockAutoTable).toHaveBeenCalledWith(
      mockPdfDoc,
      expect.objectContaining({
        head: [expect.arrayContaining(['Marca', 'Modelo'])],
        body: expect.any(Array),
        startY: 28,
      }),
    )
  })

  it('saves PDF with date-based filename', async () => {
    await exportToPdf([makeVehicle()], helpers)
    expect(mockPdfDoc.save).toHaveBeenCalledWith(expect.stringContaining('productos_'))
  })

  it('maps ON/OFF status correctly', async () => {
    await exportToPdf([makeVehicle({ is_online: false })], helpers)
    const body = mockAutoTable.mock.calls[0]![1].body
    expect(body[0][0]).toBe('OFF')
  })

  it('uses dash for missing brand', async () => {
    await exportToPdf([makeVehicle({ brand: null } as any)], helpers)
    const body = mockAutoTable.mock.calls[0]![1].body
    expect(body[0][1]).toBe('-')
  })
})

// ─── exportVehicleFicha ──────────────────────────────────────────────────────

describe('exportVehicleFicha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates portrait A4 PDF with header', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    expect(mockPdfDoc.save).toHaveBeenCalled()
    // Header should render "Tracciona"
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('Tracciona')
  })

  it('includes vehicle brand and model in title', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('Volvo FH16')
  })

  it('renders year when provided', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('2020'))).toBe(true)
  })

  it('renders price box when price exists', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    expect(mockPdfDoc.roundedRect).toHaveBeenCalled()
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('65000'))).toBe(true)
  })

  it('skips price box when price is null', async () => {
    await exportVehicleFicha(makeVehicle({ price: null } as any), helpers)
    // roundedRect for price box is after header, check reduced calls
    expect(mockPdfDoc.save).toHaveBeenCalled()
  })

  it('includes location detail', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls).toContain('Madrid')
  })

  it('includes plate detail', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls).toContain('1234-ABC')
  })

  it('includes rental price when provided', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('200'))).toBe(true)
  })

  it('renders description section when description_es exists', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('Descripci'))).toBe(true)
  })

  it('skips description section when description_es is empty', async () => {
    await exportVehicleFicha(makeVehicle({ description_es: '' } as any), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('Descripci'))).toBe(false)
  })

  it('renders financial section when acquisition_cost exists', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('Financiera'))).toBe(true)
  })

  it('renders margin when both price and acquisition_cost exist', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    // Margin = 65000 - 50000 = 15000
    expect(textCalls.some(t => t.includes('Margen'))).toBe(true)
  })

  it('renders min_price in financial section', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('55000'))).toBe(true)
  })

  it('skips financial section when no cost data', async () => {
    await exportVehicleFicha(
      makeVehicle({ acquisition_cost: null, min_price: null } as any),
      helpers,
    )
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('Financiera'))).toBe(false)
  })

  it('saves with brand_model_year filename', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    expect(mockPdfDoc.save).toHaveBeenCalledWith('ficha_Volvo_FH16_2020.pdf')
  })

  it('handles missing year in filename', async () => {
    await exportVehicleFicha(makeVehicle({ year: null } as any), helpers)
    expect(mockPdfDoc.save).toHaveBeenCalledWith('ficha_Volvo_FH16_.pdf')
  })

  it('renders Online visibility for online vehicle', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('Online'))).toBe(true)
  })

  it('renders Offline visibility for offline vehicle', async () => {
    await exportVehicleFicha(makeVehicle({ is_online: false }), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('Offline'))).toBe(true)
  })

  it('includes generated date in footer', async () => {
    await exportVehicleFicha(makeVehicle(), helpers)
    const textCalls = mockPdfDoc.text.mock.calls.map((c: unknown[]) => String(c[0]))
    expect(textCalls.some(t => t.includes('Generado'))).toBe(true)
  })
})
