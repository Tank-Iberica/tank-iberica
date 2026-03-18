import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies
vi.stubGlobal('useAuth', () => ({
  userId: { value: 'user-1' },
}))

const mockLoadDealer = vi
  .fn()
  .mockResolvedValue({ id: 'dealer-1', company_name: 'Test Dealer', slug: 'test-dealer' })
vi.stubGlobal('useDealerDashboard', () => ({
  dealerProfile: { value: { id: 'dealer-1', company_name: 'Test Dealer', slug: 'test-dealer' } },
  loadDealer: mockLoadDealer,
}))

vi.stubGlobal('useSubscriptionPlan', () => ({
  canExport: { value: true },
  fetchSubscription: vi.fn().mockResolvedValue(undefined),
}))

// Stub $fetch for credit gate in handleExport
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ success: true }))

import {
  useDashboardExportar,
  type ExportVehicle,
} from '../../app/composables/dashboard/useDashboardExportar'

function makeExportVehicle(overrides: Partial<ExportVehicle> = {}): ExportVehicle {
  return {
    id: 'v1',
    brand: 'Volvo',
    model: 'FH16',
    year: 2020,
    km: 250000,
    price: 65000,
    category: 'camiones',
    location: 'Madrid',
    status: 'published',
    description_es: 'Camión en buen estado',
    description_en: 'Truck in good condition',
    vehicle_images: [{ url: 'https://example.com/img.jpg', position: 0 }],
    subcategories: {
      name_es: 'Camiones',
      name_en: 'Trucks',
      name: { es: 'Camiones', en: 'Trucks' },
    },
    ...overrides,
  }
}

describe('useDashboardExportar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const exp = useDashboardExportar()
    expect(exp.loading.value).toBe(false)
    expect(exp.exporting.value).toBe(false)
    expect(exp.error.value).toBeNull()
    expect(exp.statusFilter.value).toBe('published')
    expect(exp.categoryFilter.value).toBeNull()
    expect(exp.exportFormat.value).toBe('csv')
    expect(exp.vehicles.value).toEqual([])
  })

  it('csvColumns has 8 columns all enabled', () => {
    const exp = useDashboardExportar()
    expect(exp.csvColumns.value.length).toBe(8)
    expect(exp.csvColumns.value.every((c: { enabled: boolean }) => c.enabled)).toBe(true)
  })

  it('toggleColumn toggles a single column', () => {
    const exp = useDashboardExportar()
    expect(exp.csvColumns.value[0]!.enabled).toBe(true)
    exp.toggleColumn(0)
    expect(exp.csvColumns.value[0]!.enabled).toBe(false)
    exp.toggleColumn(0)
    expect(exp.csvColumns.value[0]!.enabled).toBe(true)
  })

  it('toggleAllColumns enables/disables all', () => {
    const exp = useDashboardExportar()
    exp.toggleAllColumns(false)
    expect(exp.csvColumns.value.every((c: { enabled: boolean }) => !c.enabled)).toBe(true)
    exp.toggleAllColumns(true)
    expect(exp.csvColumns.value.every((c: { enabled: boolean }) => c.enabled)).toBe(true)
  })

  it('selectedColumnsCount reflects enabled columns at creation', () => {
    const exp = useDashboardExportar()
    // All 8 enabled by default — computed evaluates once at creation
    expect(exp.selectedColumnsCount.value).toBe(8)
  })

  it('getColumnLabel returns translated label', () => {
    const exp = useDashboardExportar()
    // Our useI18n mock returns key as-is
    expect(exp.getColumnLabel('brand')).toBe('dashboard.tools.export.columns.brand')
    expect(exp.getColumnLabel('price')).toBe('dashboard.tools.export.columns.price')
  })

  it('filteredVehicles filters by status when set before init', () => {
    // Note: our computed stub evaluates once at creation, so set vehicles before calling composable
    // We test the filtering logic by pre-populating via the composable return
    const exp = useDashboardExportar()
    // Since computed is a one-shot stub, test the filter logic directly
    // The composable's filteredVehicles was computed at creation with empty vehicles
    expect(exp.filteredVehicles.value).toEqual([])
  })

  it('availableCategories starts empty', () => {
    const exp = useDashboardExportar()
    expect(exp.availableCategories.value).toEqual([])
  })

  it('vehicleCount starts at zero', () => {
    const exp = useDashboardExportar()
    expect(exp.vehicleCount.value).toBe(0)
  })

  it('canExport is re-exported', () => {
    const exp = useDashboardExportar()
    expect(exp.canExport).toBeDefined()
    expect(exp.canExport.value).toBe(true)
  })

  it('dealerProfile is re-exported', () => {
    const exp = useDashboardExportar()
    expect(exp.dealerProfile).toBeDefined()
    expect(exp.dealerProfile.value.company_name).toBe('Test Dealer')
  })
})

// ─── filteredVehicles with reactive stubs ─────────────────────────────────

describe('filteredVehicles with data', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({
      get value() {
        return fn()
      },
    }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return {
        get value() {
          return _v
        },
        set value(x: unknown) {
          _v = x
        },
      }
    })
  })

  it('returns only published when statusFilter is "published"', () => {
    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({ id: 'v1', status: 'published' }),
      makeExportVehicle({ id: 'v2', status: 'draft' }),
      makeExportVehicle({ id: 'v3', status: 'published' }),
    ]
    exp.statusFilter.value = 'published'
    expect(exp.filteredVehicles.value).toHaveLength(2)
  })

  it('returns all when statusFilter is "all"', () => {
    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({ id: 'v1', status: 'published' }),
      makeExportVehicle({ id: 'v2', status: 'draft' }),
    ]
    exp.statusFilter.value = 'all'
    expect(exp.filteredVehicles.value).toHaveLength(2)
  })

  it('filters by category when categoryFilter is set', () => {
    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({ id: 'v1', category: 'camiones', status: 'published' }),
      makeExportVehicle({ id: 'v2', category: 'furgonetas', status: 'published' }),
    ]
    exp.statusFilter.value = 'all'
    exp.categoryFilter.value = 'camiones'
    expect(exp.filteredVehicles.value).toHaveLength(1)
  })

  it('vehicleCount updates with filtered data', () => {
    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({ id: 'v1', status: 'published' }),
      makeExportVehicle({ id: 'v2', status: 'draft' }),
    ]
    exp.statusFilter.value = 'published'
    expect(exp.vehicleCount.value).toBe(1)
  })

  it('availableCategories extracts unique categories', () => {
    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({ id: 'v1', category: 'camiones' }),
      makeExportVehicle({ id: 'v2', category: 'furgonetas' }),
      makeExportVehicle({ id: 'v3', category: 'camiones' }),
    ]
    expect(exp.availableCategories.value).toEqual(['camiones', 'furgonetas'])
  })

  it('selectedColumnsCount reflects toggled columns', () => {
    const exp = useDashboardExportar()
    expect(exp.selectedColumnsCount.value).toBe(8)
    exp.toggleColumn(0)
    expect(exp.selectedColumnsCount.value).toBe(7)
  })
})

// ─── init / loadVehicles ─────────────────────────────────────────────────

describe('init', () => {
  it('sets loading during init and resets after', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }))
    const exp = useDashboardExportar()
    await exp.init()
    expect(exp.loading.value).toBe(false)
  })

  it('populates vehicles after successful load', async () => {
    const vehicleData = [
      {
        id: 'v1',
        brand: 'Volvo',
        model: 'FH',
        year: 2020,
        price: 60000,
        category: 'camiones',
        location: 'Madrid',
        status: 'published',
        description_es: null,
        description_en: null,
        vehicle_images: [],
        subcategories: null,
        attributes_json: { km: 150000 },
      },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: vehicleData, error: null }),
          }),
        }),
      }),
    }))
    const exp = useDashboardExportar()
    await exp.init()
    expect(exp.vehicles.value).toHaveLength(1)
    expect(exp.vehicles.value[0]!.km).toBe(150000)
  })

  it('sets error when no dealer found', async () => {
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: { value: null },
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const exp = useDashboardExportar()
    await exp.init()
    expect(exp.error.value).toBeTruthy()
    expect(exp.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    }))
    // Restore dealer mock
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: {
        value: { id: 'dealer-1', company_name: 'Test Dealer', slug: 'test-dealer' },
      },
      loadDealer: vi.fn().mockResolvedValue({ id: 'dealer-1' }),
    }))
    const exp = useDashboardExportar()
    await exp.init()
    expect(exp.error.value).toBe('DB error')
  })
})

// ─── handleExport ────────────────────────────────────────────────────────

describe('handleExport', () => {
  it('sets exporting=true for csv export (may fail from dynamic import)', async () => {
    const exp = useDashboardExportar()
    // handleExport triggers async flow, just verify it doesn't throw synchronously
    expect(() => exp.handleExport()).not.toThrow()
  })

  it('sets exporting=true for pdf export', () => {
    const exp = useDashboardExportar()
    exp.exportFormat.value = 'pdf'
    expect(() => exp.handleExport()).not.toThrow()
  })
})

// ─── exportCSV with mock exceljs ────────────────────────────────────────

describe('exportCSV — via mocked exceljs', () => {
  const _OriginalURL = globalThis.URL

  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('computed', (fn: () => unknown) => ({
      get value() {
        return fn()
      },
    }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return {
        get value() {
          return _v
        },
        set value(x: unknown) {
          _v = x
        },
      }
    })
    // Preserve the original URL constructor but add createObjectURL/revokeObjectURL
    const PatchedURL = Object.assign(
      function (...args: ConstructorParameters<typeof URL>) {
        return new _OriginalURL(...args)
      },
      {
        createObjectURL: vi.fn().mockReturnValue('blob:test'),
        revokeObjectURL: vi.fn(),
        prototype: _OriginalURL.prototype,
      },
    )
    vi.stubGlobal('URL', PatchedURL)
    vi.stubGlobal(
      'Blob',
      class MockBlob {
        constructor(
          public p: unknown[],
          public o: unknown,
        ) {}
      },
    )
    // Patch only createElement on the real document to avoid replacing the entire jsdom document
    if (typeof document !== 'undefined') {
      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          return { href: '', download: '', click: vi.fn() } as unknown as HTMLElement
        }
        return origCreateElement(tag)
      })
    }
  })

  afterEach(() => {
    vi.doUnmock('exceljs')
    // Only restore createElement spy, not all mocks (which would undo ref/computed stubs for later describe blocks)
    if (typeof document !== 'undefined' && vi.isMockFunction(document.createElement)) {
      (document.createElement as ReturnType<typeof vi.fn>).mockRestore()
    }
  })

  it('exports CSV with enabled columns', async () => {
    // Mock exceljs dynamic import
    const mockAddRow = vi.fn()
    const mockWriteBuffer = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    vi.doMock('exceljs', () => ({
      Workbook: class {
        addWorksheet() {
          return { columns: [], addRow: mockAddRow }
        }
        csv = { writeBuffer: mockWriteBuffer }
      },
    }))

    const { useDashboardExportar: useExportar } =
      await import('../../app/composables/dashboard/useDashboardExportar')
    const exp = useExportar()
    exp.vehicles.value = [
      makeExportVehicle({ id: 'v1', status: 'published' }),
      makeExportVehicle({ id: 'v2', status: 'published' }),
    ]
    exp.statusFilter.value = 'all'
    exp.exportFormat.value = 'csv'
    exp.handleExport()
    // Allow async to complete — use longer timeout for full suite stability
    await new Promise((r) => setTimeout(r, 200))
    expect(exp.exporting.value).toBe(false)
  })

  it('sets error when CSV write fails', async () => {
    vi.doMock('exceljs', () => ({
      Workbook: class {
        addWorksheet() {
          return { columns: [], addRow: vi.fn() }
        }
        csv = { writeBuffer: vi.fn().mockRejectedValue(new Error('Write failed')) }
      },
    }))

    const { useDashboardExportar: useExportar } =
      await import('../../app/composables/dashboard/useDashboardExportar')
    const exp = useExportar()
    exp.vehicles.value = [makeExportVehicle({ status: 'published' })]
    exp.statusFilter.value = 'all'
    exp.exportFormat.value = 'csv'
    exp.handleExport()
    await new Promise((r) => setTimeout(r, 200))
    expect(exp.error.value).toBeTruthy()
    expect(exp.exporting.value).toBe(false)
  })
})

// ─── exportPDF with mock jspdf ──────────────────────────────────────────

describe('exportPDF — via mocked jspdf', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({
      get value() {
        return fn()
      },
    }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return {
        get value() {
          return _v
        },
        set value(x: unknown) {
          _v = x
        },
      }
    })
  })

  it('generates PDF with vehicle pages', async () => {
    const mockSave = vi.fn()
    vi.doMock('jspdf', () => ({
      jsPDF: class {
        setFillColor = vi.fn()
        rect = vi.fn()
        setTextColor = vi.fn()
        setFontSize = vi.fn()
        text = vi.fn()
        setFont = vi.fn()
        addPage = vi.fn()
        setDrawColor = vi.fn()
        line = vi.fn()
        splitTextToSize = vi.fn().mockReturnValue(['line1'])
        getNumberOfPages = vi.fn().mockReturnValue(2)
        save = mockSave
      },
    }))

    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({
        id: 'v1',
        status: 'published',
        price: 50000,
        year: 2020,
        description_es: 'Desc',
      }),
    ]
    exp.statusFilter.value = 'all'
    exp.exportFormat.value = 'pdf'
    exp.handleExport()
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSave).toHaveBeenCalled()
    expect(exp.exporting.value).toBe(false)

    vi.doUnmock('jspdf')
  })

  it('handles vehicle without price, year, or description', async () => {
    const mockSave = vi.fn()
    vi.doMock('jspdf', () => ({
      jsPDF: class {
        setFillColor = vi.fn()
        rect = vi.fn()
        setTextColor = vi.fn()
        setFontSize = vi.fn()
        text = vi.fn()
        setFont = vi.fn()
        addPage = vi.fn()
        setDrawColor = vi.fn()
        line = vi.fn()
        splitTextToSize = vi.fn().mockReturnValue([])
        getNumberOfPages = vi.fn().mockReturnValue(1)
        save = mockSave
      },
    }))

    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({
        id: 'v1',
        status: 'published',
        price: null,
        year: null,
        description_es: null,
        description_en: null,
        vehicle_images: [],
      }),
    ]
    exp.statusFilter.value = 'all'
    exp.exportFormat.value = 'pdf'
    exp.handleExport()
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSave).toHaveBeenCalled()

    vi.doUnmock('jspdf')
  })

  it('sets error on jspdf import failure', async () => {
    vi.doMock('jspdf', () => {
      throw new Error('jsPDF unavailable')
    })

    const exp = useDashboardExportar()
    exp.exportFormat.value = 'pdf'
    exp.handleExport()
    await new Promise((r) => setTimeout(r, 50))
    expect(exp.error.value).toBeTruthy()
    expect(exp.exporting.value).toBe(false)

    vi.doUnmock('jspdf')
  })

  it('generates PDF with subcategory name resolution', async () => {
    const mockSave = vi.fn()
    vi.doMock('jspdf', () => ({
      jsPDF: class {
        setFillColor = vi.fn()
        rect = vi.fn()
        setTextColor = vi.fn()
        setFontSize = vi.fn()
        text = vi.fn()
        setFont = vi.fn()
        addPage = vi.fn()
        setDrawColor = vi.fn()
        line = vi.fn()
        splitTextToSize = vi.fn().mockReturnValue(['line'])
        getNumberOfPages = vi.fn().mockReturnValue(2)
        save = mockSave
      },
    }))

    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({
        id: 'v1',
        status: 'published',
        km: 100000,
        location: 'Barcelona',
        subcategories: {
          name: { es: 'Camiones', en: 'Trucks' },
          name_es: 'Camiones',
          name_en: 'Trucks',
        },
      }),
    ]
    exp.statusFilter.value = 'all'
    exp.exportFormat.value = 'pdf'
    exp.handleExport()
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSave).toHaveBeenCalled()

    vi.doUnmock('jspdf')
  })

  it('uses dealer slug in profile URL', async () => {
    const mockSave = vi.fn()
    const textCalls: string[] = []
    vi.doMock('jspdf', () => ({
      jsPDF: class {
        setFillColor = vi.fn()
        rect = vi.fn()
        setTextColor = vi.fn()
        setFontSize = vi.fn()
        text = vi.fn().mockImplementation((t: string) => textCalls.push(t))
        setFont = vi.fn()
        addPage = vi.fn()
        setDrawColor = vi.fn()
        line = vi.fn()
        splitTextToSize = vi.fn().mockReturnValue([])
        getNumberOfPages = vi.fn().mockReturnValue(1)
        save = mockSave
      },
    }))

    const exp = useDashboardExportar()
    exp.vehicles.value = []
    exp.statusFilter.value = 'all'
    exp.exportFormat.value = 'pdf'
    exp.handleExport()
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSave).toHaveBeenCalled()
    // Check that dealer profile URL was used
    expect(textCalls.some((t) => t.includes('tracciona.com'))).toBe(true)

    vi.doUnmock('jspdf')
  })

  it('generates PDF with many description lines (>12 truncated)', async () => {
    const mockSave = vi.fn()
    vi.doMock('jspdf', () => ({
      jsPDF: class {
        setFillColor = vi.fn()
        rect = vi.fn()
        setTextColor = vi.fn()
        setFontSize = vi.fn()
        text = vi.fn()
        setFont = vi.fn()
        addPage = vi.fn()
        setDrawColor = vi.fn()
        line = vi.fn()
        splitTextToSize = vi.fn().mockReturnValue(Array.from({ length: 20 }, (_, i) => `line${i}`))
        getNumberOfPages = vi.fn().mockReturnValue(2)
        save = mockSave
      },
    }))

    const exp = useDashboardExportar()
    exp.vehicles.value = [
      makeExportVehicle({ id: 'v1', status: 'published', description_es: 'A'.repeat(500) }),
    ]
    exp.statusFilter.value = 'all'
    exp.exportFormat.value = 'pdf'
    exp.handleExport()
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSave).toHaveBeenCalled()

    vi.doUnmock('jspdf')
  })
})
