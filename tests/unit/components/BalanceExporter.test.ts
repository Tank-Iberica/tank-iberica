/**
 * Tests for app/components/admin/utilidades/BalanceExporter.vue
 *
 * Covers:
 * - Rendering: structure, sections, labels, CSS classes
 * - Preview summary: values, formatting, conditional classes
 * - Filters: selects, options
 * - Export format: radio buttons, checkboxes
 * - Export functions (via vm): exportToExcel, exportToPDF, exportResumen,
 *   exportResumenExcel, exportResumenPDF, downloadFile
 * - Monthly breakdown computed
 * - Error handling in printExportHTML
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount, flushPromises, VueWrapper } from '@vue/test-utils'
import { ref, computed } from 'vue'

// ── Capture originals before any spies ─────────────────────────────────────────

const origCreateElement = document.createElement.bind(document)
const origBlob = globalThis.Blob

// ── Mock data ──────────────────────────────────────────────────────────────────

function makeEntries() {
  return [
    {
      id: '1', tipo: 'ingreso' as const, fecha: '2026-03-01', razon: 'venta' as const,
      detalle: 'Sale of truck', importe: 5000, estado: 'cobrado' as const, notas: 'Note A',
      factura_url: null, coste_asociado: null, vehicle_id: null, subcategory_id: null,
      created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z',
    },
    {
      id: '2', tipo: 'gasto' as const, fecha: '2026-02-15', razon: 'taller' as const,
      detalle: 'Repair', importe: 800, estado: 'pagado' as const, notas: null,
      factura_url: null, coste_asociado: null, vehicle_id: null, subcategory_id: null,
      created_at: '2026-02-15T00:00:00Z', updated_at: '2026-02-15T00:00:00Z',
    },
    {
      id: '3', tipo: 'ingreso' as const, fecha: '2026-02-10', razon: 'alquiler' as const,
      detalle: null, importe: 1200, estado: 'pendiente' as const, notas: null,
      factura_url: null, coste_asociado: null, vehicle_id: null, subcategory_id: null,
      created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z',
    },
  ]
}

const mockEntries = ref(makeEntries())
const mockLoading = ref(false)

const mockSummary = computed(() => ({
  totalIngresos: 6200,
  totalGastos: 800,
  balanceNeto: 5400,
  byReason: {
    venta: { ingresos: 5000, gastos: 0 },
    taller: { ingresos: 0, gastos: 800 },
    alquiler: { ingresos: 1200, gastos: 0 },
  } as Record<string, { ingresos: number; gastos: number }>,
  byType: {} as Record<string, { ingresos: number; gastos: number; coste: number; beneficio: number }>,
}))

const mockFetchEntries = vi.fn().mockResolvedValue(undefined)

// ── Mock composable ────────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminBalance', () => ({
  useAdminBalance: () => ({
    entries: mockEntries,
    loading: mockLoading,
    availableYears: ref([2026, 2025]),
    summary: mockSummary,
    fetchEntries: mockFetchEntries,
  }),
  BALANCE_REASONS: {
    venta: 'Venta', alquiler: 'Alquiler', exportacion: 'Exportaci\u00f3n', compra: 'Compra',
    taller: 'Taller', documentacion: 'Documentaci\u00f3n', servicios: 'Servicios',
    salario: 'Salario', seguro: 'Seguro', dividendos: 'Dividendos',
    almacenamiento: 'Almacenamiento', bancario: 'Bancario', efectivo: 'Efectivo', otros: 'Otros',
  },
  BALANCE_STATUS_LABELS: {
    pendiente: 'Pendiente', pagado: 'Pagado', cobrado: 'Cobrado',
  },
}))

// ── Mock useToast (auto-import) ────────────────────────────────────────────────

const mockToastError = vi.fn()
vi.stubGlobal('useToast', () => ({ error: mockToastError, success: vi.fn() }))

// ── Import component AFTER mocks ───────────────────────────────────────────────

import BalanceExporter from '../../../app/components/admin/utilidades/BalanceExporter.vue'

// ── Typed VM interface ─────────────────────────────────────────────────────────

interface BalanceExporterVM {
  filters: { year: number | null; tipo: string | null; razon: string | null; estado: string | null; subcategory_id: string | null; type_id: string | null; search: string }
  exportFormat: string
  exportColumns: Record<string, boolean>
  resumenOptions: Record<string, boolean>
  exportDataScope: string
  monthlyBreakdown: [string, { ingresos: number; gastos: number }][]
  fmt: (val: number) => string
  exportBalance: () => Promise<void>
  exportResumen: () => void
  exportToExcel: (data: unknown[]) => void
  exportToPDF: (data: unknown[]) => void
  exportResumenExcel: () => void
  exportResumenPDF: () => void
  downloadFile: (content: string, filename: string, type: string) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function factory() {
  return shallowMount(BalanceExporter, {
    global: { mocks: { $t: (key: string) => key } },
  })
}

function getVm(w: VueWrapper): BalanceExporterVM {
  return w.vm as unknown as BalanceExporterVM
}

/** Set up mocks for download/CSV capture */
function setupDownloadMocks() {
  let capturedContent = ''
  let capturedFilename = ''
  const clickSpy = vi.fn()

  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  globalThis.Blob = class {
    constructor(parts: string[]) { capturedContent = parts.join('') }
  } as unknown as typeof Blob

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      const el = { href: '', download: '', click: clickSpy }
      Object.defineProperty(el, 'download', {
        get() { return capturedFilename },
        set(val) { capturedFilename = val },
      })
      return el as unknown as HTMLElement
    }
    return origCreateElement(tag)
  })

  return {
    getContent: () => capturedContent,
    getFilename: () => capturedFilename,
    clickSpy,
  }
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('BalanceExporter', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockEntries.value = makeEntries()
    mockLoading.value = false
    document.querySelectorAll('#print-frame').forEach((el) => el.remove())
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
    globalThis.Blob = origBlob
    document.querySelectorAll('#print-frame').forEach((el) => el.remove())
  })

  // ── Rendering / structure ──────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the main container', () => {
      wrapper = factory()
      expect(wrapper.find('.tool-content').exists()).toBe(true)
    })

    it('renders the header with title', () => {
      wrapper = factory()
      expect(wrapper.find('.tool-header h2').text()).toContain('Exportar Balance')
    })

    it('renders three export sections', () => {
      wrapper = factory()
      expect(wrapper.findAll('.export-section').length).toBe(3)
    })

    it('renders section headings', () => {
      wrapper = factory()
      const headings = wrapper.findAll('.export-section h3')
      expect(headings[0].text()).toContain('Seleccionar Per\u00edodo')
      expect(headings[1].text()).toContain('Exportar Balance Completo')
      expect(headings[2].text()).toContain('Exportar Resumen')
    })

    it('renders section descriptions', () => {
      wrapper = factory()
      const descs = wrapper.findAll('.section-desc')
      expect(descs.length).toBe(2)
    })

    it('renders filter row with two selects', () => {
      wrapper = factory()
      expect(wrapper.findAll('.select-input').length).toBe(2)
    })

    it('renders radio buttons for format', () => {
      wrapper = factory()
      expect(wrapper.findAll('input[type="radio"]').length).toBe(2)
    })

    it('renders column checkboxes in grid', () => {
      wrapper = factory()
      expect(wrapper.find('.checkbox-grid').findAll('input[type="checkbox"]').length).toBe(7)
    })

    it('renders resumen checkboxes', () => {
      wrapper = factory()
      expect(wrapper.find('.checkbox-group').findAll('input[type="checkbox"]').length).toBe(3)
    })

    it('renders primary and secondary export buttons', () => {
      wrapper = factory()
      expect(wrapper.find('.btn-primary').exists()).toBe(true)
      expect(wrapper.find('.btn-secondary').exists()).toBe(true)
    })
  })

  // ── Preview summary ──────────────────────────────────────────────────────

  describe('preview summary', () => {
    it('renders five summary items', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item').length).toBe(5)
    })

    it('displays correct labels', () => {
      wrapper = factory()
      const labels = wrapper.findAll('.summary-item .label')
      expect(labels[0].text()).toBe('Per\u00edodo:')
      expect(labels[1].text()).toBe('Ingresos:')
      expect(labels[2].text()).toBe('Gastos:')
      expect(labels[3].text()).toBe('Balance:')
      expect(labels[4].text()).toBe('Transacciones:')
    })

    it('shows transactions count from entries', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[4].find('.value').text()).toBe('3')
    })

    it('shows 0 transactions when entries is empty', () => {
      mockEntries.value = []
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[4].find('.value').text()).toBe('0')
    })

    it('applies positive class on balance when >= 0', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[3].classes()).toContain('positive')
    })

    it('applies positive class on ingresos item', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[1].classes()).toContain('positive')
    })

    it('applies negative class on gastos item', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[2].classes()).toContain('negative')
    })

    it('renders formatted ingresos value', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[1].find('.value').text()).toMatch(/6[\.\,]?200/)
    })

    it('renders formatted gastos value', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[2].find('.value').text()).toContain('800')
    })

    it('renders formatted balance value', () => {
      wrapper = factory()
      expect(wrapper.findAll('.summary-item')[3].find('.value').text()).toMatch(/5[\.\,]?400/)
    })
  })

  // ── Filter section ───────────────────────────────────────────────────────

  describe('filter section', () => {
    it('renders year options from availableYears plus "all"', () => {
      wrapper = factory()
      const options = wrapper.findAll('.select-input')[0].findAll('option')
      expect(options.length).toBe(3)
      expect(options[0].text()).toBe('Todos los a\u00f1os')
    })

    it('renders tipo options', () => {
      wrapper = factory()
      const options = wrapper.findAll('.select-input')[1].findAll('option')
      expect(options.length).toBe(3)
      expect(options[1].text()).toBe('Solo Ingresos')
      expect(options[2].text()).toBe('Solo Gastos')
    })
  })

  // ── Column checkboxes defaults ───────────────────────────────────────────

  describe('column checkboxes', () => {
    it('has first six checked and notas unchecked', () => {
      wrapper = factory()
      const cbs = wrapper.find('.checkbox-grid').findAll('input[type="checkbox"]')
      for (let i = 0; i < 6; i++) expect((cbs[i].element as HTMLInputElement).checked).toBe(true)
      expect((cbs[6].element as HTMLInputElement).checked).toBe(false)
    })

    it('toggling a checkbox changes its state', async () => {
      wrapper = factory()
      const cbs = wrapper.find('.checkbox-grid').findAll('input[type="checkbox"]')
      await cbs[0].setValue(false)
      expect((cbs[0].element as HTMLInputElement).checked).toBe(false)
    })
  })

  // ── Resumen checkboxes defaults ──────────────────────────────────────────

  describe('resumen checkboxes', () => {
    it('all three are checked by default', () => {
      wrapper = factory()
      const cbs = wrapper.find('.checkbox-group').findAll('input[type="checkbox"]')
      for (let i = 0; i < 3; i++) expect((cbs[i].element as HTMLInputElement).checked).toBe(true)
    })

    it('toggling a resumen checkbox changes its state', async () => {
      wrapper = factory()
      const cbs = wrapper.find('.checkbox-group').findAll('input[type="checkbox"]')
      await cbs[0].setValue(false)
      expect((cbs[0].element as HTMLInputElement).checked).toBe(false)
    })
  })

  // ── Buttons ──────────────────────────────────────────────────────────────

  describe('export buttons', () => {
    it('buttons are not disabled when loading is false', () => {
      wrapper = factory()
      expect(wrapper.find('.btn-primary').attributes('disabled')).toBeUndefined()
      expect(wrapper.find('.btn-secondary').attributes('disabled')).toBeUndefined()
    })
  })

  // ── exportToExcel (via vm) ───────────────────────────────────────────────

  describe('exportToExcel (via vm)', () => {
    it('generates CSV with semicolon-separated headers', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      expect(getContent()).toContain('Tipo;Fecha;Raz\u00f3n;Detalle;Importe;Estado')
    })

    it('includes entry data with type labels', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      const csv = getContent()
      expect(csv).toContain('Ingreso')
      expect(csv).toContain('Gasto')
    })

    it('formats importe with sign prefix', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      const csv = getContent()
      expect(csv).toContain('+5000.00\u20AC')
      expect(csv).toContain('-800.00\u20AC')
    })

    it('maps razon to label via BALANCE_REASONS', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      const csv = getContent()
      expect(csv).toContain('Venta')
      expect(csv).toContain('Taller')
      expect(csv).toContain('Alquiler')
    })

    it('maps estado to label via BALANCE_STATUS_LABELS', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      const csv = getContent()
      expect(csv).toContain('Cobrado')
      expect(csv).toContain('Pagado')
      expect(csv).toContain('Pendiente')
    })

    it('shows empty string for null detalle', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      const csv = getContent()
      const line = csv.split('\n').find((l) => l.includes('Alquiler'))
      expect(line).toBeDefined()
      expect(line).toContain('Alquiler;;')
    })

    it('respects column selection — excludes unchecked column', async () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()

      // Uncheck razon
      const cbs = wrapper.find('.checkbox-grid').findAll('input[type="checkbox"]')
      await cbs[2].setValue(false)

      getVm(wrapper).exportToExcel(mockEntries.value)

      const headerLine = getContent().split('\n')[0]
      expect(headerLine).not.toContain('Raz\u00f3n')
      expect(headerLine).toContain('Tipo')
    })

    it('includes notas column when checked', async () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()

      const cbs = wrapper.find('.checkbox-grid').findAll('input[type="checkbox"]')
      await cbs[6].setValue(true)

      getVm(wrapper).exportToExcel(mockEntries.value)

      expect(getContent().split('\n')[0]).toContain('Notas')
    })

    it('uses year in CSV filename', () => {
      const { getFilename } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      expect(getFilename()).toMatch(/balance_\d{4}\.csv/)
    })

    it('produces headers only when data is empty', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel([])

      const lines = getContent().split('\n').filter((l) => l.trim() !== '')
      expect(lines.length).toBe(1)
      expect(lines[0]).toContain('Tipo')
    })

    it('triggers anchor click for download', () => {
      const { clickSpy } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportToExcel(mockEntries.value)

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  // ── exportToPDF (via vm) ─────────────────────────────────────────────────

  describe('exportToPDF (via vm)', () => {
    it('creates an iframe for printing', () => {
      const spy = vi.spyOn(document, 'createElement')
      wrapper = factory()
      getVm(wrapper).exportToPDF(mockEntries.value)

      expect(spy).toHaveBeenCalledWith('iframe')
    })
  })

  // ── exportResumenExcel (via vm) ──────────────────────────────────────────

  describe('exportResumenExcel (via vm)', () => {
    it('generates resumen CSV with header line', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      expect(getContent()).toContain('Concepto;Ingresos;Gastos;Neto')
    })

    it('includes totales section', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      expect(csv).toContain('TOTAL INGRESOS')
      expect(csv).toContain('TOTAL GASTOS')
      expect(csv).toContain('BALANCE NETO')
    })

    it('includes formatted totals', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      expect(csv).toContain('+6200.00\u20AC')
      expect(csv).toContain('-800.00\u20AC')
      expect(csv).toContain('5400.00\u20AC')
    })

    it('includes desglose section with reason labels', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      expect(csv).toContain('DESGLOSE POR RAZ\u00d3N')
      expect(csv).toContain('Venta')
      expect(csv).toContain('Taller')
      expect(csv).toContain('Alquiler')
    })

    it('includes mensual section with month keys', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      expect(csv).toContain('DESGLOSE MENSUAL')
      expect(csv).toContain('2026-03')
      expect(csv).toContain('2026-02')
    })

    it('sorts months descending', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      expect(csv.indexOf('2026-03')).toBeLessThan(csv.indexOf('2026-02'))
    })

    it('excludes totales when option is unchecked', async () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      await wrapper.find('.checkbox-group').findAll('input[type="checkbox"]')[0].setValue(false)
      getVm(wrapper).exportResumenExcel()

      expect(getContent()).not.toContain('TOTAL INGRESOS')
    })

    it('excludes desglose when option is unchecked', async () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      await wrapper.find('.checkbox-group').findAll('input[type="checkbox"]')[1].setValue(false)
      getVm(wrapper).exportResumenExcel()

      expect(getContent()).not.toContain('DESGLOSE POR RAZ\u00d3N')
    })

    it('excludes mensual when option is unchecked', async () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      await wrapper.find('.checkbox-group').findAll('input[type="checkbox"]')[2].setValue(false)
      getVm(wrapper).exportResumenExcel()

      expect(getContent()).not.toContain('DESGLOSE MENSUAL')
    })

    it('uses year in resumen CSV filename', () => {
      const { getFilename } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      expect(getFilename()).toMatch(/resumen_balance_\d{4}\.csv/)
    })

    it('triggers anchor click for download', () => {
      const { clickSpy } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  // ── exportResumenPDF (via vm) ────────────────────────────────────────────

  describe('exportResumenPDF (via vm)', () => {
    it('creates an iframe for printing resumen', () => {
      const spy = vi.spyOn(document, 'createElement')
      wrapper = factory()
      getVm(wrapper).exportResumenPDF()

      expect(spy).toHaveBeenCalledWith('iframe')
    })
  })

  // ── downloadFile (via vm) ────────────────────────────────────────────────

  describe('downloadFile (via vm)', () => {
    it('creates a Blob, anchor, triggers click, and revokes URL', () => {
      const mockUrl = 'blob:http://localhost/test'
      const createObjSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl)
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      let capturedDownload = ''
      const clickSpy = vi.fn()
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const el = { href: '', download: '', click: clickSpy }
          Object.defineProperty(el, 'download', {
            get() { return capturedDownload },
            set(val) { capturedDownload = val },
          })
          return el as unknown as HTMLElement
        }
        return origCreateElement(tag)
      })

      wrapper = factory()
      getVm(wrapper).downloadFile('test content', 'test.csv', 'text/csv')

      expect(createObjSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
      expect(capturedDownload).toBe('test.csv')
      expect(revokeSpy).toHaveBeenCalledWith(mockUrl)
    })
  })

  // ── fmt (via vm) ─────────────────────────────────────────────────────────

  describe('fmt (via vm)', () => {
    it('formats positive values as EUR currency', () => {
      wrapper = factory()
      const formatted = getVm(wrapper).fmt(1234.5)
      expect(formatted).toMatch(/1[\.\,]?234/)
    })

    it('formats zero', () => {
      wrapper = factory()
      expect(getVm(wrapper).fmt(0)).toContain('0')
    })

    it('formats negative values', () => {
      wrapper = factory()
      expect(getVm(wrapper).fmt(-500)).toContain('500')
    })
  })

  // ── monthlyBreakdown (tested via resumen Excel output) ───────────────────

  describe('monthlyBreakdown', () => {
    it('groups entries by two distinct months in mensual section', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()

      // Export with only mensual to isolate monthly data
      const cbs = wrapper.find('.checkbox-group').findAll('input[type="checkbox"]')
      // Keep only mensual (uncheck totales + desglose)
      cbs[0].setValue(false)
      cbs[1].setValue(false)

      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      const lines = csv.split('\n').filter((l) => l.startsWith('2026-'))
      expect(lines.length).toBe(2) // 2026-03 and 2026-02
    })

    it('produces no month lines when entries is empty', async () => {
      mockEntries.value = []
      const { getContent } = setupDownloadMocks()
      wrapper = factory()

      const cbs = wrapper.find('.checkbox-group').findAll('input[type="checkbox"]')
      await cbs[0].setValue(false)
      await cbs[1].setValue(false)

      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      const lines = csv.split('\n').filter((l) => l.startsWith('2026-'))
      expect(lines.length).toBe(0)
    })

    it('accumulates March: ingresos 5000, gastos 0', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      const marchLine = csv.split('\n').find((l) => l.startsWith('2026-03'))!
      expect(marchLine).toContain('+5000.00\u20AC')
      expect(marchLine).toContain('-0.00\u20AC')
    })

    it('accumulates February: ingresos 1200, gastos 800', () => {
      const { getContent } = setupDownloadMocks()
      wrapper = factory()
      getVm(wrapper).exportResumenExcel()

      const csv = getContent()
      const febLine = csv.split('\n').find((l) => l.startsWith('2026-02'))!
      expect(febLine).toContain('+1200.00\u20AC')
      expect(febLine).toContain('-800.00\u20AC')
    })
  })

  // ── printExportHTML error handling ────────────────────────────────────────

  describe('printExportHTML error handling', () => {
    it('calls toast.error when iframe contentDocument is null', () => {
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'iframe') {
          return {
            id: '', style: { cssText: '' },
            contentDocument: null, contentWindow: null,
            remove: vi.fn(),
          } as unknown as HTMLIFrameElement
        }
        return origCreateElement(tag)
      })
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node as Node)

      wrapper = factory()
      // Call exportToPDF which triggers printExportHTML
      getVm(wrapper).exportToPDF(mockEntries.value)

      expect(mockToastError).toHaveBeenCalledWith('toast.printFailed')
    })
  })

  // ── PDF click integration ────────────────────────────────────────────────

  describe('PDF export via button click', () => {
    it('primary button click triggers iframe creation', async () => {
      const spy = vi.spyOn(document, 'createElement')
      wrapper = factory()
      await wrapper.find('.btn-primary').trigger('click')
      await flushPromises()

      expect(spy).toHaveBeenCalledWith('iframe')
    })

    it('secondary button click triggers iframe creation', async () => {
      const spy = vi.spyOn(document, 'createElement')
      wrapper = factory()
      await wrapper.find('.btn-secondary').trigger('click')
      await flushPromises()

      expect(spy).toHaveBeenCalledWith('iframe')
    })
  })

  // ── Filters binding ──────────────────────────────────────────────────────

  describe('filters binding (via vm)', () => {
    it('has current year as default', () => {
      wrapper = factory()
      expect(getVm(wrapper).filters.year).toBe(new Date().getFullYear())
    })

    it('has null tipo by default', () => {
      wrapper = factory()
      expect(getVm(wrapper).filters.tipo).toBe(null)
    })

    it('has empty search by default', () => {
      wrapper = factory()
      expect(getVm(wrapper).filters.search).toBe('')
    })
  })

  // ── exportColumns binding ────────────────────────────────────────────────

  describe('exportColumns binding (via vm)', () => {
    it('has tipo, fecha, razon, detalle, importe, estado true by default', () => {
      wrapper = factory()
      const cols = getVm(wrapper).exportColumns
      expect(cols.tipo).toBe(true)
      expect(cols.fecha).toBe(true)
      expect(cols.razon).toBe(true)
      expect(cols.detalle).toBe(true)
      expect(cols.importe).toBe(true)
      expect(cols.estado).toBe(true)
    })

    it('has notas false by default', () => {
      wrapper = factory()
      expect(getVm(wrapper).exportColumns.notas).toBe(false)
    })
  })

  // ── resumenOptions binding ───────────────────────────────────────────────

  describe('resumenOptions binding (via vm)', () => {
    it('has all options true by default', () => {
      wrapper = factory()
      const opts = getVm(wrapper).resumenOptions
      expect(opts.totales).toBe(true)
      expect(opts.desglose).toBe(true)
      expect(opts.mensual).toBe(true)
    })
  })
})
