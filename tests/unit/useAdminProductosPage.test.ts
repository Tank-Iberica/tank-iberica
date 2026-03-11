import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks (available inside vi.mock factories) ────────────────────

const mocks = vi.hoisted(() => {
  const vehicles = { value: [] as Record<string, unknown>[] }
  const types = { value: [] as Record<string, unknown>[] }
  const subcategories = { value: [] as Record<string, unknown>[] }
  const sortedVehicles = { value: [] as Record<string, unknown>[] }
  return {
    vehicles,
    types,
    subcategories,
    sortedVehicles,
    deleteVehicle: vi.fn().mockResolvedValue(true),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    fetchVehicles: vi.fn().mockResolvedValue(undefined),
    fetchSubcategories: vi.fn().mockResolvedValue(undefined),
    fetchTypes: vi.fn().mockResolvedValue(undefined),
    fetchAdminFilters: vi.fn().mockResolvedValue(undefined),
    loadConfig: vi.fn(),
    syncFilterColumns: vi.fn(),
    toggleSort: vi.fn(),
    connectDrive: vi.fn().mockResolvedValue(false),
    openVehicleFolder: vi.fn().mockResolvedValue(undefined),
  }
})

// ─── Module mocks ──────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminVehicles', () => ({
  useAdminVehicles: () => ({
    vehicles: mocks.vehicles,
    loading: { value: false },
    error: { value: null },
    total: { value: 0 },
    fetchVehicles: mocks.fetchVehicles,
    deleteVehicle: mocks.deleteVehicle,
    updateStatus: mocks.updateStatus,
  }),
}))

vi.mock('~/composables/admin/useAdminTypes', () => ({
  useAdminTypes: () => ({
    types: mocks.types,
    fetchTypes: mocks.fetchTypes,
  }),
}))

vi.mock('~/composables/admin/useAdminSubcategories', () => ({
  useAdminSubcategories: () => ({
    subcategories: mocks.subcategories,
    fetchSubcategories: mocks.fetchSubcategories,
  }),
}))

vi.mock('~/composables/admin/useAdminFilters', () => ({
  useAdminFilters: () => ({
    filters: { value: [] },
    fetchFilters: mocks.fetchAdminFilters,
  }),
}))

vi.mock('~/composables/admin/useGoogleDrive', () => ({
  useGoogleDrive: () => ({
    connected: { value: false },
    loading: { value: false },
    connect: mocks.connectDrive,
    openVehicleFolder: mocks.openVehicleFolder,
  }),
}))

vi.mock('~/composables/admin/useAdminProductosColumns', () => ({
  useAdminProductosColumns: () => ({
    loadConfig: mocks.loadConfig,
    syncFilterColumns: mocks.syncFilterColumns,
    columnGroups: { value: [] },
    visibleColumns: { value: [] },
    toggleColumn: vi.fn(),
    saveConfig: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminProductosSort', () => ({
  useAdminProductosSort: () => ({
    sortField: { value: 'created_at' },
    sortOrder: { value: 'desc' },
    toggleSort: mocks.toggleSort,
    sortedVehicles: mocks.sortedVehicles,
  }),
}))

vi.mock('~/utils/adminProductosExport', () => ({
  exportToExcel: vi.fn().mockResolvedValue(undefined),
  exportToPdf: vi.fn().mockResolvedValue(undefined),
  exportVehicleFicha: vi.fn().mockResolvedValue(undefined),
}))

// ─── Global stubs ──────────────────────────────────────────────────────────

const mockToastWarning = vi.fn()
vi.stubGlobal('useToast', () => ({
  warning: mockToastWarning,
  error: vi.fn(),
  success: vi.fn(),
}))

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import { useAdminProductosPage } from '../../app/composables/admin/useAdminProductosPage'
import { exportToExcel, exportToPdf } from '../../app/utils/adminProductosExport'

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeVehicle(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'v-1',
    brand: 'Volvo',
    model: 'FH',
    year: 2020,
    plate: '1234-ABC',
    internal_id: null,
    price: 80000,
    is_online: true,
    type_id: 'type-1',
    vehicle_images: [],
    attributes_json: null,
    ...overrides,
  }
}

// ─── Supabase chain for loadFavoriteCounts / fetchTypeSubcategoryLinks ─────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mocks.vehicles.value = []
  mocks.types.value = []
  mocks.subcategories.value = []
  mocks.sortedVehicles.value = []
  mocks.deleteVehicle.mockResolvedValue(true)
  mocks.updateStatus.mockResolvedValue(undefined)
  mocks.fetchVehicles.mockResolvedValue(undefined)
  mocks.fetchSubcategories.mockResolvedValue(undefined)
  mocks.fetchTypes.mockResolvedValue(undefined)
  mocks.fetchAdminFilters.mockResolvedValue(undefined)
  mocks.connectDrive.mockResolvedValue(false)
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('filters start with all nulls and empty search', () => {
    const c = useAdminProductosPage()
    expect(c.filters.value.status).toBeNull()
    expect(c.filters.value.category).toBeNull()
    expect(c.filters.value.type_id).toBeNull()
    expect(c.filters.value.subcategory_id).toBeNull()
    expect(c.filters.value.search).toBe('')
  })

  it('onlineFilter starts as "all"', () => {
    const c = useAdminProductosPage()
    expect(c.onlineFilter.value).toBe('all')
  })

  it('isFullscreen starts false', () => {
    const c = useAdminProductosPage()
    expect(c.isFullscreen.value).toBe(false)
  })

  it('selectedIds starts empty', () => {
    const c = useAdminProductosPage()
    expect(c.selectedIds.value.size).toBe(0)
  })

  it('activeModal starts null', () => {
    const c = useAdminProductosPage()
    expect(c.activeModal.value).toBeNull()
  })

  it('modalData starts as empty object', () => {
    const c = useAdminProductosPage()
    expect(c.modalData.value).toEqual({})
  })

  it('favCounts starts as empty object', () => {
    const c = useAdminProductosPage()
    expect(c.favCounts.value).toEqual({})
  })

  it('hasActiveFilters starts false', () => {
    const c = useAdminProductosPage()
    expect(c.hasActiveFilters.value).toBe(false)
  })
})

// ─── getStatusClass ────────────────────────────────────────────────────────

describe('getStatusClass', () => {
  it.each([
    ['published', 'status-published'],
    ['draft', 'status-draft'],
    ['rented', 'status-rented'],
    ['maintenance', 'status-maintenance'],
    ['sold', 'status-sold'],
  ])('returns "%s" for status "%s"', (status, expected) => {
    const c = useAdminProductosPage()
    expect(c.getStatusClass(status)).toBe(expected)
  })

  it('returns empty string for unknown status', () => {
    const c = useAdminProductosPage()
    expect(c.getStatusClass('unknown')).toBe('')
  })
})

// ─── getCategoryClass ──────────────────────────────────────────────────────

describe('getCategoryClass', () => {
  it.each([
    ['venta', 'cat-venta'],
    ['alquiler', 'cat-alquiler'],
    ['terceros', 'cat-terceros'],
  ])('returns "%s" for category "%s"', (cat, expected) => {
    const c = useAdminProductosPage()
    expect(c.getCategoryClass(cat)).toBe(expected)
  })

  it('returns empty string for unknown category', () => {
    const c = useAdminProductosPage()
    expect(c.getCategoryClass('unknown')).toBe('')
  })
})

// ─── getSubcategoryName ────────────────────────────────────────────────────

describe('getSubcategoryName', () => {
  it('returns "-" for null id', () => {
    const c = useAdminProductosPage()
    expect(c.getSubcategoryName(null)).toBe('-')
  })

  it('returns "-" for undefined id', () => {
    const c = useAdminProductosPage()
    expect(c.getSubcategoryName(undefined)).toBe('-')
  })

  it('returns name_es when type found', () => {
    mocks.types.value = [{ id: 'type-1', name_es: 'Camión articulado' }]
    const c = useAdminProductosPage()
    expect(c.getSubcategoryName('type-1')).toBe('Camión articulado')
  })

  it('returns "-" when type not found', () => {
    mocks.types.value = []
    const c = useAdminProductosPage()
    expect(c.getSubcategoryName('nonexistent')).toBe('-')
  })
})

// ─── getThumbnail ──────────────────────────────────────────────────────────

describe('getThumbnail', () => {
  it('returns null when vehicle_images is empty', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ vehicle_images: [] })
    expect(c.getThumbnail(v as never)).toBeNull()
  })

  it('returns null when vehicle_images is undefined', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ vehicle_images: undefined })
    expect(c.getThumbnail(v as never)).toBeNull()
  })

  it('returns url of image with lowest position', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({
      vehicle_images: [
        { url: 'https://example.com/b.jpg', position: 2 },
        { url: 'https://example.com/a.jpg', position: 0 },
      ],
    })
    expect(c.getThumbnail(v as never)).toBe('https://example.com/a.jpg')
  })
})

// ─── getFilterValue ────────────────────────────────────────────────────────

describe('getFilterValue', () => {
  it('returns "-" when attributes_json is null', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ attributes_json: null })
    expect(c.getFilterValue(v as never, 'fuel')).toBe('-')
  })

  it('returns "-" when key is missing', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ attributes_json: {} })
    expect(c.getFilterValue(v as never, 'fuel')).toBe('-')
  })

  it('returns "-" when value is null', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ attributes_json: { fuel: null } })
    expect(c.getFilterValue(v as never, 'fuel')).toBe('-')
  })

  it('returns string representation of primitive value', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ attributes_json: { fuel: 'diesel' } })
    expect(c.getFilterValue(v as never, 'fuel')).toBe('diesel')
  })

  it('returns .es for localized object value', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ attributes_json: { fuel: { es: 'Diésel', en: 'Diesel' } } })
    expect(c.getFilterValue(v as never, 'fuel')).toBe('Diésel')
  })

  it('returns .en when .es is missing', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ attributes_json: { fuel: { en: 'Diesel' } } })
    expect(c.getFilterValue(v as never, 'fuel')).toBe('Diesel')
  })
})

// ─── getSubcategoryForVehicle ──────────────────────────────────────────────

describe('getSubcategoryForVehicle', () => {
  it('returns "-" for null typeId', () => {
    const c = useAdminProductosPage()
    expect(c.getSubcategoryForVehicle(null)).toBe('-')
  })

  it('returns "-" for undefined typeId', () => {
    const c = useAdminProductosPage()
    expect(c.getSubcategoryForVehicle(undefined)).toBe('-')
  })

  it('returns "-" when no link found (typeSubcategoryLinks starts empty)', () => {
    const c = useAdminProductosPage()
    expect(c.getSubcategoryForVehicle('type-1')).toBe('-')
  })
})

// ─── clearFilters ──────────────────────────────────────────────────────────

describe('clearFilters', () => {
  it('resets all filter values to null/empty', () => {
    const c = useAdminProductosPage()
    c.filters.value.status = 'published'
    c.filters.value.search = 'volvo'
    c.onlineFilter.value = 'online'
    c.clearFilters()
    expect(c.filters.value.status).toBeNull()
    expect(c.filters.value.category).toBeNull()
    expect(c.filters.value.type_id).toBeNull()
    expect(c.filters.value.subcategory_id).toBeNull()
    expect(c.filters.value.search).toBe('')
    expect(c.onlineFilter.value).toBe('all')
  })
})

// ─── toggleFullscreen ──────────────────────────────────────────────────────

describe('toggleFullscreen', () => {
  it('toggles isFullscreen from false to true', () => {
    const c = useAdminProductosPage()
    c.toggleFullscreen()
    expect(c.isFullscreen.value).toBe(true)
  })

  it('toggles isFullscreen from true to false', () => {
    const c = useAdminProductosPage()
    c.isFullscreen.value = true
    c.toggleFullscreen()
    expect(c.isFullscreen.value).toBe(false)
  })

  it('sets document.body.style.overflow to "hidden" when entering fullscreen', () => {
    const c = useAdminProductosPage()
    c.toggleFullscreen()
    expect(document.body.style.overflow).toBe('hidden')
    // cleanup
    document.body.style.overflow = ''
  })

  it('clears document.body.style.overflow when exiting fullscreen', () => {
    const c = useAdminProductosPage()
    c.isFullscreen.value = true
    document.body.style.overflow = 'hidden'
    c.toggleFullscreen()
    expect(document.body.style.overflow).toBe('')
  })
})

// ─── toggleSelection ──────────────────────────────────────────────────────

describe('toggleSelection', () => {
  it('adds id to selectedIds when not present', () => {
    const c = useAdminProductosPage()
    c.toggleSelection('v-1')
    expect(c.selectedIds.value.has('v-1')).toBe(true)
  })

  it('removes id from selectedIds when already present', () => {
    const c = useAdminProductosPage()
    c.toggleSelection('v-1')
    c.toggleSelection('v-1')
    expect(c.selectedIds.value.has('v-1')).toBe(false)
  })

  it('handles multiple independent ids', () => {
    const c = useAdminProductosPage()
    c.toggleSelection('v-1')
    c.toggleSelection('v-2')
    expect(c.selectedIds.value.has('v-1')).toBe(true)
    expect(c.selectedIds.value.has('v-2')).toBe(true)
    expect(c.selectedIds.value.size).toBe(2)
  })
})

// ─── updateSelectAll ──────────────────────────────────────────────────────

describe('updateSelectAll', () => {
  it('clears selection when val is false', () => {
    const c = useAdminProductosPage()
    c.selectedIds.value = new Set(['v-1', 'v-2'])
    c.updateSelectAll(false)
    expect(c.selectedIds.value.size).toBe(0)
  })

  it('adds all sortedVehicle ids when val is true', () => {
    mocks.sortedVehicles.value = [{ id: 's-1' }, { id: 's-2' }]
    const c = useAdminProductosPage()
    c.updateSelectAll(true)
    expect(c.selectedIds.value.has('s-1')).toBe(true)
    expect(c.selectedIds.value.has('s-2')).toBe(true)
  })
})

// ─── Modal operations ─────────────────────────────────────────────────────

describe('openDeleteModal', () => {
  it('sets activeModal to "delete" and stores vehicle', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle()
    c.openDeleteModal(v as never)
    expect(c.activeModal.value).toBe('delete')
    expect(c.modalData.value.vehicle).toBe(v)
    expect(c.modalData.value.confirmText).toBe('')
  })
})

describe('openExportModal', () => {
  it('sets activeModal to "export" with scope "filtered" when nothing selected', () => {
    const c = useAdminProductosPage()
    c.openExportModal()
    expect(c.activeModal.value).toBe('export')
    expect(c.modalData.value.exportFormat).toBe('pdf')
    expect(c.modalData.value.exportScope).toBe('filtered')
  })

  it('sets exportScope to "selected" when there are selected ids', () => {
    const c = useAdminProductosPage()
    c.selectedIds.value = new Set(['v-1'])
    c.openExportModal()
    expect(c.modalData.value.exportScope).toBe('selected')
  })
})

describe('openTransactionModal', () => {
  it('sets activeModal to "transaction" with type "sell"', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ price: 50000 })
    c.openTransactionModal(v as never, 'sell')
    expect(c.activeModal.value).toBe('transaction')
    expect(c.modalData.value.transactionType).toBe('sell')
    expect(c.modalData.value.sellPrice).toBe('50000')
  })

  it('sets activeModal to "transaction" with type "rent"', () => {
    const c = useAdminProductosPage()
    const v = makeVehicle()
    c.openTransactionModal(v as never, 'rent')
    expect(c.modalData.value.transactionType).toBe('rent')
    expect(c.modalData.value.rentClient).toBe('')
  })
})

describe('openConfigModal', () => {
  it('sets activeModal to "config"', () => {
    const c = useAdminProductosPage()
    c.openConfigModal()
    expect(c.activeModal.value).toBe('config')
  })
})

describe('closeModal', () => {
  it('sets activeModal to null and clears modalData', () => {
    const c = useAdminProductosPage()
    c.openConfigModal()
    c.closeModal()
    expect(c.activeModal.value).toBeNull()
    expect(c.modalData.value).toEqual({})
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does nothing when vehicle is missing in modalData', async () => {
    const c = useAdminProductosPage()
    c.modalData.value = { confirmText: 'borrar' }
    await c.executeDelete()
    expect(mocks.deleteVehicle).not.toHaveBeenCalled()
  })

  it('does nothing when confirmText is not "borrar"', async () => {
    const c = useAdminProductosPage()
    c.modalData.value = { vehicle: makeVehicle() as never, confirmText: 'delete' }
    await c.executeDelete()
    expect(mocks.deleteVehicle).not.toHaveBeenCalled()
  })

  it('calls deleteVehicle and closes modal when confirmText is "borrar"', async () => {
    mocks.deleteVehicle.mockResolvedValue(true)
    const c = useAdminProductosPage()
    c.modalData.value = { vehicle: makeVehicle({ id: 'v-del' }) as never, confirmText: 'borrar' }
    await c.executeDelete()
    expect(mocks.deleteVehicle).toHaveBeenCalledWith('v-del')
    expect(c.activeModal.value).toBeNull()
  })

  it('does not close modal if delete fails', async () => {
    mocks.deleteVehicle.mockResolvedValue(false)
    const c = useAdminProductosPage()
    c.modalData.value = { vehicle: makeVehicle() as never, confirmText: 'borrar' }
    c.activeModal.value = 'delete'
    await c.executeDelete()
    expect(c.activeModal.value).toBe('delete')
  })
})

// ─── executeTransaction ────────────────────────────────────────────────────

describe('executeTransaction', () => {
  it('does nothing when vehicle is not set', async () => {
    const c = useAdminProductosPage()
    c.modalData.value = {}
    await c.executeTransaction()
    expect(mocks.updateStatus).not.toHaveBeenCalled()
  })

  it('calls updateStatus("rented") for rent transaction', async () => {
    const c = useAdminProductosPage()
    c.modalData.value = {
      vehicle: makeVehicle({ id: 'v-rent' }) as never,
      transactionType: 'rent',
    }
    await c.executeTransaction()
    expect(mocks.updateStatus).toHaveBeenCalledWith('v-rent', 'rented')
    expect(c.activeModal.value).toBeNull()
  })

  it('calls updateStatus("sold") for sell transaction', async () => {
    const c = useAdminProductosPage()
    c.modalData.value = {
      vehicle: makeVehicle({ id: 'v-sell' }) as never,
      transactionType: 'sell',
    }
    await c.executeTransaction()
    expect(mocks.updateStatus).toHaveBeenCalledWith('v-sell', 'sold')
    expect(c.activeModal.value).toBeNull()
  })
})

// ─── handleStatusChange ────────────────────────────────────────────────────

describe('handleStatusChange', () => {
  it('calls updateStatus with new status', async () => {
    const c = useAdminProductosPage()
    const v = makeVehicle({ id: 'v-status' })
    await c.handleStatusChange(v as never, 'published')
    expect(mocks.updateStatus).toHaveBeenCalledWith('v-status', 'published')
  })
})

// ─── executeExport ────────────────────────────────────────────────────────

describe('executeExport', () => {
  it('shows toast warning when there are no vehicles to export', async () => {
    mocks.sortedVehicles.value = []
    const c = useAdminProductosPage()
    c.modalData.value = { exportFormat: 'pdf', exportScope: 'filtered' }
    await c.executeExport()
    expect(mockToastWarning).toHaveBeenCalled()
  })

  it('calls exportToPdf for "pdf" format', async () => {
    mocks.sortedVehicles.value = [makeVehicle()]
    const c = useAdminProductosPage()
    c.modalData.value = { exportFormat: 'pdf', exportScope: 'filtered' }
    await c.executeExport()
    expect(exportToPdf).toHaveBeenCalled()
  })

  it('calls exportToExcel for "excel" format', async () => {
    mocks.sortedVehicles.value = [makeVehicle()]
    const c = useAdminProductosPage()
    c.modalData.value = { exportFormat: 'excel', exportScope: 'filtered' }
    await c.executeExport()
    expect(exportToExcel).toHaveBeenCalled()
  })

  it('uses all vehicles from vehicles.value when scope is "all"', async () => {
    mocks.vehicles.value = [makeVehicle()]
    mocks.sortedVehicles.value = []
    const c = useAdminProductosPage()
    c.modalData.value = { exportFormat: 'pdf', exportScope: 'all' }
    await c.executeExport()
    expect(exportToPdf).toHaveBeenCalled()
  })

  it('uses only selected vehicles when scope is "selected"', async () => {
    mocks.sortedVehicles.value = [makeVehicle({ id: 'sel-1' }), makeVehicle({ id: 'sel-2' })]
    const c = useAdminProductosPage()
    c.selectedIds.value = new Set(['sel-1'])
    c.modalData.value = { exportFormat: 'pdf', exportScope: 'selected' }
    await c.executeExport()
    expect(exportToPdf).toHaveBeenCalled()
  })

  it('closes modal after successful export', async () => {
    mocks.sortedVehicles.value = [makeVehicle()]
    const c = useAdminProductosPage()
    c.activeModal.value = 'export'
    c.modalData.value = { exportFormat: 'pdf', exportScope: 'filtered' }
    await c.executeExport()
    expect(c.activeModal.value).toBeNull()
  })
})

// ─── openDriveFolder ──────────────────────────────────────────────────────

describe('openDriveFolder', () => {
  it('tries to connect Drive when not connected and returns if fails', async () => {
    mocks.connectDrive.mockResolvedValue(false)
    const c = useAdminProductosPage()
    const v = makeVehicle()
    await c.openDriveFolder(v as never)
    expect(mocks.connectDrive).toHaveBeenCalled()
    expect(mocks.openVehicleFolder).not.toHaveBeenCalled()
  })
})

// ─── init / cleanup ───────────────────────────────────────────────────────

describe('init', () => {
  it('calls loadConfig and then syncFilterColumns', async () => {
    const c = useAdminProductosPage()
    await c.init()
    expect(mocks.loadConfig).toHaveBeenCalled()
    expect(mocks.syncFilterColumns).toHaveBeenCalled()
  })

  it('calls fetchSubcategories, fetchTypes, fetchAdminFilters', async () => {
    const c = useAdminProductosPage()
    await c.init()
    expect(mocks.fetchSubcategories).toHaveBeenCalled()
    expect(mocks.fetchTypes).toHaveBeenCalled()
    expect(mocks.fetchAdminFilters).toHaveBeenCalled()
  })
})

describe('cleanup', () => {
  it('clears document.body.style.overflow', () => {
    const c = useAdminProductosPage()
    document.body.style.overflow = 'hidden'
    c.cleanup()
    expect(document.body.style.overflow).toBe('')
  })
})
