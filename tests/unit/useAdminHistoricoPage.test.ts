import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminHistoricoPage } from '../../app/composables/admin/useAdminHistoricoPage'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  entriesRef,
  summaryRef,
  availableYearsRef,
  availableBrandsRef,
  mockFetchEntries,
  mockRestoreVehicle,
  mockDeleteEntry,
} = vi.hoisted(() => ({
  entriesRef: { value: [] as unknown[] },
  summaryRef: {
    value: {
      totalVentas: 0,
      totalIngresos: 0,
      totalBeneficio: 0,
      avgBeneficioPercent: 0,
      byCategory: {},
      byType: {},
    },
  },
  availableYearsRef: { value: [] as number[] },
  availableBrandsRef: { value: [] as string[] },
  mockFetchEntries: vi.fn().mockResolvedValue(undefined),
  mockRestoreVehicle: vi.fn().mockResolvedValue(true),
  mockDeleteEntry: vi.fn().mockResolvedValue(true),
}))

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminHistorico', () => ({
  useAdminHistorico: () => ({
    entries: entriesRef,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    total: { value: 0 },
    availableYears: availableYearsRef,
    availableBrands: availableBrandsRef,
    summary: summaryRef,
    fetchEntries: mockFetchEntries,
    restoreVehicle: mockRestoreVehicle,
    deleteEntry: mockDeleteEntry,
  }),
  SALE_CATEGORIES: {
    venta: 'Venta',
    terceros: 'Terceros',
    exportacion: 'Exportación',
  },
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  entriesRef.value = []
})

// ─── categoryOptions ──────────────────────────────────────────────────────

describe('categoryOptions', () => {
  it('has 3 category options', () => {
    const c = useAdminHistoricoPage()
    expect(c.categoryOptions).toHaveLength(3)
  })

  it('includes venta, terceros, exportacion', () => {
    const c = useAdminHistoricoPage()
    const keys = c.categoryOptions.map(([k]) => k)
    expect(keys).toContain('venta')
    expect(keys).toContain('terceros')
    expect(keys).toContain('exportacion')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('filters.year starts as null', () => {
    const c = useAdminHistoricoPage()
    expect(c.filters.year).toBeNull()
  })

  it('filters.search starts as empty string', () => {
    const c = useAdminHistoricoPage()
    expect(c.filters.search).toBe('')
  })

  it('filters.brand starts as null', () => {
    const c = useAdminHistoricoPage()
    expect(c.filters.brand).toBeNull()
  })

  it('filters.sale_category starts as null', () => {
    const c = useAdminHistoricoPage()
    expect(c.filters.sale_category).toBeNull()
  })

  it('showDocs starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.showDocs.value).toBe(false)
  })

  it('showTecnico starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.showTecnico.value).toBe(false)
  })

  it('showAlquiler starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.showAlquiler.value).toBe(false)
  })

  it('sortCol starts as "sale_date"', () => {
    const c = useAdminHistoricoPage()
    expect(c.sortCol.value).toBe('sale_date')
  })

  it('sortAsc starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.sortAsc.value).toBe(false)
  })

  it('isFullscreen starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.isFullscreen.value).toBe(false)
  })

  it('showRestoreModal starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.showRestoreModal.value).toBe(false)
  })

  it('restoreTarget starts as null', () => {
    const c = useAdminHistoricoPage()
    expect(c.restoreTarget.value).toBeNull()
  })

  it('restoreConfirm starts as empty string', () => {
    const c = useAdminHistoricoPage()
    expect(c.restoreConfirm.value).toBe('')
  })

  it('canRestore starts as false (empty restoreConfirm !== "restaurar")', () => {
    const c = useAdminHistoricoPage()
    expect(c.canRestore.value).toBe(false)
  })

  it('showDeleteModal starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.showDeleteModal.value).toBe(false)
  })

  it('deleteTarget starts as null', () => {
    const c = useAdminHistoricoPage()
    expect(c.deleteTarget.value).toBeNull()
  })

  it('deleteConfirm starts as empty string', () => {
    const c = useAdminHistoricoPage()
    expect(c.deleteConfirm.value).toBe('')
  })

  it('canDelete starts as false (empty deleteConfirm !== "borrar")', () => {
    const c = useAdminHistoricoPage()
    expect(c.canDelete.value).toBe(false)
  })

  it('showDetailModal starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.showDetailModal.value).toBe(false)
  })

  it('detailEntry starts as null', () => {
    const c = useAdminHistoricoPage()
    expect(c.detailEntry.value).toBeNull()
  })

  it('showExportModal starts as false', () => {
    const c = useAdminHistoricoPage()
    expect(c.showExportModal.value).toBe(false)
  })

  it('exportFormat starts as "excel"', () => {
    const c = useAdminHistoricoPage()
    expect(c.exportFormat.value).toBe('excel')
  })

  it('exportDataScope starts as "filtered"', () => {
    const c = useAdminHistoricoPage()
    expect(c.exportDataScope.value).toBe('filtered')
  })

  it('sortedEntries starts as empty (entries is empty)', () => {
    const c = useAdminHistoricoPage()
    expect(c.sortedEntries.value).toEqual([])
  })
})

// ─── clearFilters ─────────────────────────────────────────────────────────

describe('clearFilters', () => {
  it('resets year to null', () => {
    const c = useAdminHistoricoPage()
    c.filters.year = 2024
    c.clearFilters()
    expect(c.filters.year).toBeNull()
  })

  it('resets search to empty string', () => {
    const c = useAdminHistoricoPage()
    c.filters.search = 'Volvo'
    c.clearFilters()
    expect(c.filters.search).toBe('')
  })

  it('resets sale_category to null', () => {
    const c = useAdminHistoricoPage()
    c.filters.sale_category = 'venta'
    c.clearFilters()
    expect(c.filters.sale_category).toBeNull()
  })

  it('resets brand to null', () => {
    const c = useAdminHistoricoPage()
    c.filters.brand = 'Volvo'
    c.clearFilters()
    expect(c.filters.brand).toBeNull()
  })

  it('resets subcategory_id to null', () => {
    const c = useAdminHistoricoPage()
    c.filters.subcategory_id = 'sub-1'
    c.clearFilters()
    expect(c.filters.subcategory_id).toBeNull()
  })

  it('resets type_id to null', () => {
    const c = useAdminHistoricoPage()
    ;(c.filters as Record<string, unknown>).type_id = 'type-1'
    c.clearFilters()
    expect((c.filters as Record<string, unknown>).type_id).toBeNull()
  })
})

// ─── toggleSort ───────────────────────────────────────────────────────────

describe('toggleSort', () => {
  it('changes sortCol when different column clicked', () => {
    const c = useAdminHistoricoPage()
    c.toggleSort('sale_price')
    expect(c.sortCol.value).toBe('sale_price')
    expect(c.sortAsc.value).toBe(false)
  })

  it('toggles sortAsc when same column clicked', () => {
    const c = useAdminHistoricoPage()
    // sortCol = 'sale_date', sortAsc = false
    c.toggleSort('sale_date')
    expect(c.sortAsc.value).toBe(true)
  })

  it('toggles sortAsc back to false on second same-column click', () => {
    const c = useAdminHistoricoPage()
    c.toggleSort('sale_date')
    c.toggleSort('sale_date')
    expect(c.sortAsc.value).toBe(false)
  })

  it('sets sortAsc=false when switching columns', () => {
    const c = useAdminHistoricoPage()
    c.sortAsc.value = true
    c.toggleSort('brand')
    expect(c.sortAsc.value).toBe(false)
    expect(c.sortCol.value).toBe('brand')
  })
})

// ─── getSortIcon ──────────────────────────────────────────────────────────

describe('getSortIcon', () => {
  it('returns ↕ for inactive column', () => {
    const c = useAdminHistoricoPage()
    expect(c.getSortIcon('sale_price')).toBe('\u2195')
  })

  it('returns ↓ for active column with sortAsc=false', () => {
    const c = useAdminHistoricoPage()
    // sortCol=sale_date, sortAsc=false
    expect(c.getSortIcon('sale_date')).toBe('\u2193')
  })

  it('returns ↑ for active column with sortAsc=true', () => {
    const c = useAdminHistoricoPage()
    c.sortAsc.value = true
    expect(c.getSortIcon('sale_date')).toBe('\u2191')
  })

  it('returns ↕ after changing to different column', () => {
    const c = useAdminHistoricoPage()
    c.toggleSort('brand')
    // sortCol is now 'brand', so 'sale_date' should be ↕
    expect(c.getSortIcon('sale_date')).toBe('\u2195')
  })
})

// ─── openRestoreModal ─────────────────────────────────────────────────────

describe('openRestoreModal', () => {
  function makeEntry(overrides: Record<string, unknown> = {}) {
    return {
      id: 'e-1',
      brand: 'Volvo',
      model: 'FH',
      year: 2022,
      sale_price: 50000,
      sale_date: '2026-01-15',
      sale_category: 'venta',
      benefit: 5000,
      benefit_percent: 10,
      total_cost: 45000,
      archived_at: '2026-01-15',
      created_at: '2026-01-15',
      original_vehicle_id: null,
      category_id: null,
      original_price: null,
      buyer_name: null,
      buyer_contact: null,
      acquisition_cost: null,
      total_maintenance: null,
      total_rental_income: null,
      vehicle_data: null,
      maintenance_history: [],
      rental_history: [],
      ...overrides,
    }
  }

  it('sets showRestoreModal to true', () => {
    const c = useAdminHistoricoPage()
    c.openRestoreModal(makeEntry() as never)
    expect(c.showRestoreModal.value).toBe(true)
  })

  it('sets restoreTarget to the entry', () => {
    const c = useAdminHistoricoPage()
    const entry = makeEntry({ id: 'e-99' })
    c.openRestoreModal(entry as never)
    expect(c.restoreTarget.value?.id).toBe('e-99')
  })

  it('resets restoreConfirm to empty', () => {
    const c = useAdminHistoricoPage()
    c.restoreConfirm.value = 'restaurar'
    c.openRestoreModal(makeEntry() as never)
    expect(c.restoreConfirm.value).toBe('')
  })
})

// ─── handleRestore ────────────────────────────────────────────────────────

describe('handleRestore', () => {
  it('does nothing when restoreTarget is null', async () => {
    const c = useAdminHistoricoPage()
    await c.handleRestore()
    expect(mockRestoreVehicle).not.toHaveBeenCalled()
  })

  it('does nothing when canRestore is false (one-shot computed = always false)', async () => {
    const c = useAdminHistoricoPage()
    c.restoreTarget.value = { id: 'e-1' } as never
    await c.handleRestore()
    expect(mockRestoreVehicle).not.toHaveBeenCalled()
  })
})

// ─── openDeleteModal ──────────────────────────────────────────────────────

describe('openDeleteModal', () => {
  function makeEntry() {
    return {
      id: 'd-1', brand: 'Scania', model: 'R', year: 2020,
      sale_price: null, sale_date: null, sale_category: null, benefit: null,
      benefit_percent: null, total_cost: null, archived_at: '2026-01-01',
      created_at: '2026-01-01', original_vehicle_id: null, category_id: null,
      original_price: null, buyer_name: null, buyer_contact: null,
      acquisition_cost: null, total_maintenance: null, total_rental_income: null,
      vehicle_data: null, maintenance_history: [], rental_history: [],
    }
  }

  it('sets showDeleteModal to true', () => {
    const c = useAdminHistoricoPage()
    c.openDeleteModal(makeEntry() as never)
    expect(c.showDeleteModal.value).toBe(true)
  })

  it('sets deleteTarget to the entry', () => {
    const c = useAdminHistoricoPage()
    c.openDeleteModal(makeEntry() as never)
    expect(c.deleteTarget.value?.id).toBe('d-1')
  })

  it('resets deleteConfirm to empty', () => {
    const c = useAdminHistoricoPage()
    c.deleteConfirm.value = 'borrar'
    c.openDeleteModal(makeEntry() as never)
    expect(c.deleteConfirm.value).toBe('')
  })
})

// ─── handleDelete ─────────────────────────────────────────────────────────

describe('handleDelete', () => {
  it('does nothing when deleteTarget is null', async () => {
    const c = useAdminHistoricoPage()
    await c.handleDelete()
    expect(mockDeleteEntry).not.toHaveBeenCalled()
  })

  it('does nothing when canDelete is false (one-shot computed = always false)', async () => {
    const c = useAdminHistoricoPage()
    c.deleteTarget.value = { id: 'd-1' } as never
    await c.handleDelete()
    expect(mockDeleteEntry).not.toHaveBeenCalled()
  })
})

// ─── openDetailModal ──────────────────────────────────────────────────────

describe('openDetailModal', () => {
  it('sets showDetailModal to true', () => {
    const c = useAdminHistoricoPage()
    c.openDetailModal({ id: 'e-1' } as never)
    expect(c.showDetailModal.value).toBe(true)
  })

  it('sets detailEntry to the entry', () => {
    const c = useAdminHistoricoPage()
    c.openDetailModal({ id: 'e-42' } as never)
    expect(c.detailEntry.value?.id).toBe('e-42')
  })
})

// ─── fmt (currency formatter) ─────────────────────────────────────────────

describe('fmt', () => {
  it('returns "—" for null', () => {
    const c = useAdminHistoricoPage()
    expect(c.fmt(null)).toBe('\u2014')
  })

  it('returns "—" for undefined', () => {
    const c = useAdminHistoricoPage()
    expect(c.fmt(undefined)).toBe('\u2014')
  })

  it('returns formatted EUR string for a number', () => {
    const c = useAdminHistoricoPage()
    const result = c.fmt(1000)
    expect(result).toContain('1')
    expect(result).toContain('€')
  })

  it('returns EUR string for 0', () => {
    const c = useAdminHistoricoPage()
    const result = c.fmt(0)
    expect(result).toContain('€')
  })
})

// ─── fmtDate ──────────────────────────────────────────────────────────────

describe('fmtDate', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    const c = useAdminHistoricoPage()
    const result = c.fmtDate('2026-03-15')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/03|3/)
    expect(result).toMatch(/2026/)
  })

  it('returns a string', () => {
    const c = useAdminHistoricoPage()
    expect(typeof c.fmtDate('2025-01-01')).toBe('string')
  })
})

// ─── Column toggles ───────────────────────────────────────────────────────

describe('column toggles', () => {
  it('can toggle showDocs', () => {
    const c = useAdminHistoricoPage()
    c.showDocs.value = true
    expect(c.showDocs.value).toBe(true)
  })

  it('can toggle showTecnico', () => {
    const c = useAdminHistoricoPage()
    c.showTecnico.value = true
    expect(c.showTecnico.value).toBe(true)
  })

  it('can toggle showAlquiler', () => {
    const c = useAdminHistoricoPage()
    c.showAlquiler.value = true
    expect(c.showAlquiler.value).toBe(true)
  })
})

// ─── sortedEntries with reactive stubs ───────────────────────────────────

describe('sortedEntries — sorting logic', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
    entriesRef.value = [
      { id: 'e1', brand: 'Volvo', model: 'FH', sale_date: '2026-01-15', sale_price: 50000, benefit: 5000, year: 2022, sale_category: 'venta', benefit_percent: 10, total_cost: 45000 },
      { id: 'e2', brand: 'Scania', model: 'R', sale_date: '2026-03-01', sale_price: 80000, benefit: -2000, year: 2021, sale_category: 'terceros', benefit_percent: -2.5, total_cost: 82000 },
      { id: 'e3', brand: 'DAF', model: 'XF', sale_date: '2025-12-01', sale_price: 30000, benefit: 10000, year: 2020, sale_category: 'exportacion', benefit_percent: 33, total_cost: 20000 },
    ]
  })

  it('sorts by sale_date descending by default', () => {
    const c = useAdminHistoricoPage()
    const entries = c.sortedEntries.value as { id: string }[]
    expect(entries[0]?.id).toBe('e2') // latest date first
    expect(entries[2]?.id).toBe('e3') // earliest date last
  })

  it('sorts by sale_price when toggled', () => {
    const c = useAdminHistoricoPage()
    c.toggleSort('sale_price')
    const entries = c.sortedEntries.value as { id: string; sale_price: number }[]
    // default sortAsc=false → descending
    expect(entries[0]?.sale_price).toBe(80000)
    expect(entries[2]?.sale_price).toBe(30000)
  })

  it('sorts by brand alphabetically', () => {
    const c = useAdminHistoricoPage()
    c.toggleSort('brand')
    const entries = c.sortedEntries.value as { brand: string }[]
    // descending by default → Volvo, Scania, DAF
    expect(entries[0]?.brand).toBe('Volvo')
  })

  it('sorts ascending when toggling same column twice', () => {
    const c = useAdminHistoricoPage()
    c.toggleSort('sale_price')
    c.toggleSort('sale_price')
    const entries = c.sortedEntries.value as { sale_price: number }[]
    expect(entries[0]?.sale_price).toBe(30000) // ascending
  })

  it('sorts by benefit', () => {
    const c = useAdminHistoricoPage()
    c.toggleSort('benefit')
    const entries = c.sortedEntries.value as { benefit: number }[]
    // descending → 10000, 5000, -2000
    expect(entries[0]?.benefit).toBe(10000)
    expect(entries[2]?.benefit).toBe(-2000)
  })
})

// ─── handleRestore / handleDelete — reactive canRestore/canDelete ────────

describe('handleRestore — reactive', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('calls restoreVehicle when canRestore is true', async () => {
    const c = useAdminHistoricoPage()
    c.restoreTarget.value = { id: 'e-1' } as never
    c.restoreConfirm.value = 'restaurar'
    await c.handleRestore()
    expect(mockRestoreVehicle).toHaveBeenCalledWith('e-1')
  })

  it('closes modal on success', async () => {
    const c = useAdminHistoricoPage()
    c.restoreTarget.value = { id: 'e-1' } as never
    c.restoreConfirm.value = 'restaurar'
    await c.handleRestore()
    expect(c.showRestoreModal.value).toBe(false)
  })

  it('does not call restore when confirm text is wrong', async () => {
    const c = useAdminHistoricoPage()
    c.restoreTarget.value = { id: 'e-1' } as never
    c.restoreConfirm.value = 'wrong'
    await c.handleRestore()
    expect(mockRestoreVehicle).not.toHaveBeenCalled()
  })
})

describe('handleDelete — reactive', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('calls deleteEntry when canDelete is true', async () => {
    const c = useAdminHistoricoPage()
    c.deleteTarget.value = { id: 'd-1' } as never
    c.deleteConfirm.value = 'borrar'
    await c.handleDelete()
    expect(mockDeleteEntry).toHaveBeenCalledWith('d-1')
  })

  it('closes modal on success', async () => {
    const c = useAdminHistoricoPage()
    c.deleteTarget.value = { id: 'd-1' } as never
    c.deleteConfirm.value = 'borrar'
    await c.handleDelete()
    expect(c.showDeleteModal.value).toBe(false)
  })
})

// ─── exportHistorico — excel path ────────────────────────────────────────

describe('exportHistorico', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
    // Mock URL and document APIs
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:test'),
      revokeObjectURL: vi.fn(),
    })
    vi.stubGlobal('Blob', class MockBlob {
      constructor(public parts: unknown[], public opts: unknown) {}
    })
    vi.stubGlobal('document', {
      createElement: vi.fn().mockImplementation((tag: string) => {
        if (tag === 'iframe') {
          return {
            id: '',
            style: { cssText: '' },
            contentDocument: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
            contentWindow: { focus: vi.fn(), print: vi.fn(), document: { open: vi.fn(), write: vi.fn(), close: vi.fn() } },
            remove: vi.fn(),
          }
        }
        return { href: '', download: '', click: vi.fn() }
      }),
      getElementById: vi.fn().mockReturnValue(null),
      body: { appendChild: vi.fn() },
      fullscreenElement: null,
    })
    entriesRef.value = [
      { id: 'e1', brand: 'Volvo', model: 'FH', year: 2022, sale_category: 'venta', sale_date: '2026-01-15', sale_price: 50000, total_cost: 45000, benefit: 5000, benefit_percent: 10 },
    ]
  })

  it('exports to CSV format when exportFormat is excel', () => {
    const c = useAdminHistoricoPage()
    c.exportFormat.value = 'excel'
    c.exportDataScope.value = 'all'
    expect(() => c.exportHistorico()).not.toThrow()
    expect(c.showExportModal.value).toBe(false)
  })

  it('exports to PDF format when exportFormat is pdf', () => {
    const c = useAdminHistoricoPage()
    c.exportFormat.value = 'pdf'
    c.exportDataScope.value = 'filtered'
    expect(() => c.exportHistorico()).not.toThrow()
    expect(c.showExportModal.value).toBe(false)
  })
})

// ─── toggleFullscreen / onFullscreenChange ───────────────────────────────

describe('toggleFullscreen', () => {
  it('calls exitFullscreen when already in fullscreen', () => {
    const mockExit = vi.fn()
    vi.stubGlobal('document', { fullscreenElement: {}, exitFullscreen: mockExit })
    const c = useAdminHistoricoPage()
    c.toggleFullscreen()
    expect(mockExit).toHaveBeenCalled()
    expect(c.isFullscreen.value).toBe(false)
  })

  it('calls requestFullscreen when not in fullscreen', () => {
    const mockRequest = vi.fn()
    vi.stubGlobal('document', { fullscreenElement: null })
    const c = useAdminHistoricoPage()
    c.historicoSection.value = { requestFullscreen: mockRequest } as never
    c.toggleFullscreen()
    expect(mockRequest).toHaveBeenCalled()
    expect(c.isFullscreen.value).toBe(true)
  })
})

describe('onFullscreenChange', () => {
  it('sets isFullscreen based on document.fullscreenElement', () => {
    vi.stubGlobal('document', { fullscreenElement: {} })
    const c = useAdminHistoricoPage()
    c.onFullscreenChange()
    expect(c.isFullscreen.value).toBe(true)
  })

  it('sets isFullscreen to false when no fullscreen element', () => {
    vi.stubGlobal('document', { fullscreenElement: null })
    const c = useAdminHistoricoPage()
    c.onFullscreenChange()
    expect(c.isFullscreen.value).toBe(false)
  })
})
