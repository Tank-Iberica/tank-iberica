/**
 * Tests for app/components/ui/ExportModal.vue
 *
 * Covers: rendering, props, v-if/v-show branches, emits, methods (selectAll,
 * deselectAll, toggleColumn, close, handleBackdropClick, handleExport),
 * computed properties, format selection, and export generation.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ref, computed, watch } from 'vue'

// ---------- mock vue-i18n BEFORE component import ----------
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('es'),
  }),
}))

// ---------- mock dynamic imports ----------

const mockAddRow = vi.fn()
const mockGetRow = vi.fn().mockReturnValue({ font: {}, fill: {} })
const mockWriteBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))
const mockAddWorksheet = vi.fn().mockReturnValue({
  columns: [],
  addRow: mockAddRow,
  getRow: mockGetRow,
})

// Use real class syntax so `new Workbook()` works
vi.mock('exceljs', () => {
  class MockWorkbook {
    addWorksheet = mockAddWorksheet
    xlsx = { writeBuffer: mockWriteBuffer }
  }
  return { Workbook: MockWorkbook }
})

const mockSave = vi.fn()
const mockText = vi.fn()
const mockSetFontSize = vi.fn()
const mockSetFont = vi.fn()
const mockSetTextColor = vi.fn()
const mockAutoTable = vi.fn()

vi.mock('jspdf', () => {
  class MockJsPDF {
    setFontSize = mockSetFontSize
    setFont = mockSetFont
    setTextColor = mockSetTextColor
    text = mockText
    save = mockSave
  }
  return { jsPDF: MockJsPDF }
})

vi.mock('jspdf-autotable', () => ({
  default: mockAutoTable,
}))

// ---------- stub globals ----------

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('useFocusTrap', () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }))
})

// ---------- component import (after mocks) ----------
import ExportModal from '../../../app/components/ui/ExportModal.vue'

// ---------- helpers ----------

interface ExportColumn {
  key: string
  label: string
  enabled: boolean
}

const sampleColumns: ExportColumn[] = [
  { key: 'name', label: 'Name', enabled: true },
  { key: 'price', label: 'Price', enabled: true },
  { key: 'year', label: 'Year', enabled: false },
]

const sampleData = [
  { name: 'Truck A', price: 50000, year: 2020 },
  { name: 'Truck B', price: 75000, year: 2021 },
]

/**
 * Factory that properly triggers the watch on modelValue so localColumns gets populated.
 * Mounts with modelValue=false then sets to true (unless overridden to stay false).
 */
async function factory(overrides: Record<string, unknown> = {}): Promise<VueWrapper> {
  const wantOpen = overrides.modelValue !== false
  const w = shallowMount(ExportModal, {
    props: {
      modelValue: false,
      data: sampleData,
      columns: sampleColumns,
      ...overrides,
      // Always start closed to let the watch fire on open
      ...(wantOpen ? { modelValue: false } : {}),
    },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { Teleport: true, Transition: false },
    },
  })

  if (wantOpen) {
    await w.setProps({ modelValue: true })
    await w.vm.$nextTick()
  }

  return w
}

// ---------- tests ----------

describe('ExportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations that may have been cleared
    mockWriteBuffer.mockResolvedValue(new ArrayBuffer(8))
    mockGetRow.mockReturnValue({ font: {}, fill: {} })
    mockAddWorksheet.mockReturnValue({
      columns: [],
      addRow: mockAddRow,
      getRow: mockGetRow,
    })
    // Stub URL.createObjectURL / revokeObjectURL while keeping constructor intact
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock')
        static override revokeObjectURL = vi.fn()
      },
    )
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  // ====== Rendering ======

  describe('rendering', () => {
    it('renders the modal backdrop when modelValue is true', async () => {
      const w = await factory()
      expect(w.find('.export-backdrop').exists()).toBe(true)
    })

    it('does NOT render the backdrop when modelValue is false', async () => {
      const w = await factory({ modelValue: false })
      expect(w.find('.export-backdrop').exists()).toBe(false)
    })

    it('renders dialog with correct aria-label', async () => {
      const w = await factory({ title: 'My Export' })
      expect(w.find('[role="dialog"]').attributes('aria-label')).toBe('My Export')
    })

    it('falls back to i18n title when title prop is empty', async () => {
      const w = await factory({ title: '' })
      expect(w.find('[role="dialog"]').attributes('aria-label')).toBe('exportModal.title')
    })

    it('renders the close button', async () => {
      const w = await factory()
      expect(w.find('.export-close').exists()).toBe(true)
    })

    it('renders cancel and export buttons in footer', async () => {
      const w = await factory()
      const btns = w.findAll('.export-btn')
      expect(btns.length).toBe(2)
      expect(btns[0].text()).toBe('common.cancel')
      expect(btns[1].text()).toBe('exportModal.export')
    })
  })

  // ====== Columns ======

  describe('column selection', () => {
    it('renders checkboxes for each column', async () => {
      const w = await factory()
      const checkboxes = w.findAll('.export-checkbox')
      expect(checkboxes).toHaveLength(sampleColumns.length)
    })

    it('renders column labels', async () => {
      const w = await factory()
      const labels = w.findAll('.export-column-label')
      expect(labels[0].text()).toBe('Name')
      expect(labels[1].text()).toBe('Price')
      expect(labels[2].text()).toBe('Year')
    })

    it('reflects enabled state in checkboxes', async () => {
      const w = await factory()
      const checkboxes = w.findAll('.export-checkbox')
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
    })

    it('toggles column on checkbox change', async () => {
      const w = await factory()
      const checkboxes = w.findAll('.export-checkbox')
      // toggle the third (disabled) checkbox
      await checkboxes[2].trigger('change')
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true)
    })

    it('selectAll button is disabled when all columns are enabled', async () => {
      const allEnabled = sampleColumns.map((c) => ({ ...c, enabled: true }))
      const w = await factory({ columns: allEnabled })
      const selectAllBtn = w.findAll('.export-link-btn')[0]
      expect(selectAllBtn.attributes('disabled')).toBeDefined()
    })

    it('deselectAll button is disabled when no columns are enabled', async () => {
      const noneEnabled = sampleColumns.map((c) => ({ ...c, enabled: false }))
      const w = await factory({ columns: noneEnabled })
      const deselectAllBtn = w.findAll('.export-link-btn')[1]
      expect(deselectAllBtn.attributes('disabled')).toBeDefined()
    })

    it('selectAll enables all columns on click', async () => {
      const mixed = [
        { key: 'a', label: 'A', enabled: false },
        { key: 'b', label: 'B', enabled: true },
      ]
      const w = await factory({ columns: mixed })
      const selectAllBtn = w.findAll('.export-link-btn')[0]
      await selectAllBtn.trigger('click')
      const checkboxes = w.findAll('.export-checkbox')
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
    })

    it('deselectAll disables all columns on click', async () => {
      const allOn = [
        { key: 'a', label: 'A', enabled: true },
        { key: 'b', label: 'B', enabled: true },
      ]
      const w = await factory({ columns: allOn })
      const deselectBtn = w.findAll('.export-link-btn')[1]
      await deselectBtn.trigger('click')
      const checkboxes = w.findAll('.export-checkbox')
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
    })

    it('shows warning when no columns are selected', async () => {
      const noneEnabled = sampleColumns.map((c) => ({ ...c, enabled: false }))
      const w = await factory({ columns: noneEnabled })
      expect(w.find('.export-warning').exists()).toBe(true)
      expect(w.find('.export-warning').text()).toBe('exportModal.noColumns')
    })

    it('hides warning when at least one column is selected', async () => {
      const w = await factory()
      expect(w.find('.export-warning').exists()).toBe(false)
    })
  })

  // ====== Format selection ======

  describe('format selection', () => {
    it('renders format radio buttons based on formats prop', async () => {
      const w = await factory({ formats: ['excel', 'pdf'] })
      const radios = w.findAll('.export-radio')
      expect(radios).toHaveLength(2)
    })

    it('renders only excel format when formats prop has one item', async () => {
      const w = await factory({ formats: ['excel'] })
      const radios = w.findAll('.export-radio')
      expect(radios).toHaveLength(1)
    })

    it('shows excel icon for excel format', async () => {
      const w = await factory({ formats: ['excel'] })
      expect(w.find('.export-format-icon').exists()).toBe(true)
    })

    it('shows format label text', async () => {
      const w = await factory({ formats: ['excel', 'pdf'] })
      const labels = w.findAll('.export-format-label')
      expect(labels[0].text()).toBe('Excel (.xlsx)')
      expect(labels[1].text()).toBe('PDF (.pdf)')
    })

    it('selects first format by default', async () => {
      const w = await factory({ formats: ['pdf', 'excel'] })
      const radios = w.findAll('.export-radio')
      expect((radios[0].element as HTMLInputElement).checked).toBe(true)
    })

    it('applies selected class to chosen format', async () => {
      const w = await factory({ formats: ['excel', 'pdf'] })
      const options = w.findAll('.export-format-option')
      expect(options[0].classes()).toContain('export-format-selected')
    })
  })

  // ====== Close / emits ======

  describe('close behavior', () => {
    it('emits update:modelValue false when close button clicked', async () => {
      const w = await factory()
      await w.find('.export-close').trigger('click')
      expect(w.emitted('update:modelValue')).toBeTruthy()
      expect(w.emitted('update:modelValue')![0]).toEqual([false])
    })

    it('emits update:modelValue false when cancel button clicked', async () => {
      const w = await factory()
      await w.find('.export-btn-secondary').trigger('click')
      expect(w.emitted('update:modelValue')![0]).toEqual([false])
    })

    it('closes on backdrop click (target === currentTarget)', async () => {
      const w = await factory()
      const backdrop = w.find('.export-backdrop')
      await backdrop.trigger('click')
      expect(w.emitted('update:modelValue')).toBeTruthy()
    })
  })

  // ====== Export button state ======

  describe('export button state', () => {
    it('export button is disabled when no columns selected', async () => {
      const noneEnabled = sampleColumns.map((c) => ({ ...c, enabled: false }))
      const w = await factory({ columns: noneEnabled })
      const exportBtn = w.find('.export-btn-primary')
      expect(exportBtn.attributes('disabled')).toBeDefined()
    })

    it('export button is NOT disabled when columns are selected', async () => {
      const w = await factory()
      const exportBtn = w.find('.export-btn-primary')
      // The disabled attribute is either undefined or not present
      expect(exportBtn.element.hasAttribute('disabled')).toBe(false)
    })
  })

  // ====== handleExport — Excel ======

  describe('handleExport — excel', () => {
    it('calls generateExcel and emits export event', async () => {
      const w = await factory({ formats: ['excel'] })
      const exportBtn = w.find('.export-btn-primary')
      await exportBtn.trigger('click')
      // Allow async dynamic imports to resolve — use multiple flushes for CI/full-suite stability
      await new Promise((r) => setTimeout(r, 250))
      await w.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      expect(w.emitted('export')).toBeTruthy()
      const payload = w.emitted('export')![0][0] as { format: string; columns: string[] }
      expect(payload.format).toBe('excel')
      expect(payload.columns).toContain('name')
      expect(payload.columns).toContain('price')
    })

    it('does not export when noneSelected', async () => {
      const noneEnabled = sampleColumns.map((c) => ({ ...c, enabled: false }))
      const w = await factory({ columns: noneEnabled })
      const exportBtn = w.find('.export-btn-primary')
      await exportBtn.trigger('click')
      await new Promise((r) => setTimeout(r, 250))
      expect(w.emitted('export')).toBeFalsy()
    })
  })

  // ====== handleExport — PDF ======

  describe('handleExport — pdf', () => {
    it('calls generatePdf and emits export event with pdf format', async () => {
      const w = await factory({ formats: ['pdf'] })
      const exportBtn = w.find('.export-btn-primary')
      await exportBtn.trigger('click')
      await new Promise((r) => setTimeout(r, 250))
      await w.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      expect(w.emitted('export')).toBeTruthy()
      const payload = w.emitted('export')![0][0] as { format: string; columns: string[] }
      expect(payload.format).toBe('pdf')
    })
  })

  // ====== Props defaults ======

  describe('props defaults', () => {
    it('uses default formats ["excel", "pdf"]', async () => {
      const w = await factory()
      const radios = w.findAll('.export-radio')
      expect(radios).toHaveLength(2)
    })

    it('accepts custom title prop', async () => {
      const w = await factory({ title: 'Custom Title' })
      expect(w.find('.export-title').text()).toBe('Custom Title')
    })
  })

  // ====== Watch behavior ======

  describe('watch modelValue', () => {
    it('sets body overflow hidden when opened', async () => {
      document.body.style.overflow = ''
      const w = await factory({ modelValue: false })
      await w.setProps({ modelValue: true })
      await w.vm.$nextTick()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body overflow when closed', async () => {
      document.body.style.overflow = ''
      const w = await factory()
      await w.setProps({ modelValue: false })
      await w.vm.$nextTick()
      expect(document.body.style.overflow).toBe('')
    })
  })

  // ====== Column count after selectAll/deselectAll ======

  describe('column count in export payload', () => {
    it('includes only enabled columns in export payload', async () => {
      // Only 2 of 3 columns are enabled by default
      const w = await factory({ formats: ['excel'] })
      const exportBtn = w.find('.export-btn-primary')
      await exportBtn.trigger('click')
      await new Promise((r) => setTimeout(r, 250))
      await w.vm.$nextTick()
      await new Promise((r) => setTimeout(r, 50))

      const payload = w.emitted('export')![0][0] as { format: string; columns: string[] }
      expect(payload.columns).toHaveLength(2)
      expect(payload.columns).not.toContain('year')
    })
  })
})
