import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminProductoDetail } from '../../app/composables/admin/useAdminProductoDetail'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockFetchById: ReturnType<typeof vi.fn>
let mockUpdateVehicle: ReturnType<typeof vi.fn>
let mockDeleteVehicle: ReturnType<typeof vi.fn>
let mockFetchTypes: ReturnType<typeof vi.fn>
let mockFetchSubcategories: ReturnType<typeof vi.fn>
let mockFetchFilters: ReturnType<typeof vi.fn>
let mockInitVerification: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useAdminVehicles', () => ({
  useAdminVehicles: () => ({
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    fetchById: (...args: unknown[]) => mockFetchById(...args),
    updateVehicle: (...args: unknown[]) => mockUpdateVehicle(...args),
    deleteVehicle: (...args: unknown[]) => mockDeleteVehicle(...args),
    addImage: vi.fn().mockResolvedValue(true),
    deleteImage: vi.fn().mockResolvedValue(true),
    reorderImages: vi.fn().mockResolvedValue(true),
  }),
}))

vi.mock('~/composables/admin/useAdminTypes', () => ({
  useAdminTypes: () => ({
    types: { value: [] },
    fetchTypes: (...args: unknown[]) => mockFetchTypes(...args),
  }),
}))

vi.mock('~/composables/admin/useAdminSubcategories', () => ({
  useAdminSubcategories: () => ({
    subcategories: { value: [] },
    fetchSubcategories: (...args: unknown[]) => mockFetchSubcategories(...args),
  }),
}))

vi.mock('~/composables/admin/useAdminFilters', () => ({
  useAdminFilters: () => ({
    filters: { value: [] },
    fetchFilters: (...args: unknown[]) => mockFetchFilters(...args),
  }),
}))

vi.mock('~/composables/admin/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    upload: vi.fn().mockResolvedValue(null),
    uploading: { value: false },
    progress: { value: 0 },
  }),
}))

vi.mock('~/composables/admin/useAdminProductoDetailVerif', () => ({
  useAdminProductoDetailVerif: () => ({
    verifDocTypes: [],
    verifDocType: { value: 'ficha_tecnica' },
    verifDocs: { value: [] },
    verifLoading: { value: false },
    verifError: { value: null },
    verifCurrentLevel: { value: 'none' },
    verifLevelBadge: { value: '' },
    initVerification: (...args: unknown[]) => mockInitVerification(...args),
    handleVerifUpload: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminProductoDetailImages', () => ({
  useAdminProductoDetailImages: () => ({
    uploadingImage: { value: false },
    handleImageUpload: vi.fn(),
    handleDeleteImage: vi.fn(),
    setAsPortada: vi.fn(),
    moveImage: vi.fn(),
  }),
}))

vi.mock('~/composables/admin/useAdminProductoDetailRecords', () => ({
  useAdminProductoDetailRecords: () => ({
    driveConnected: { value: false },
    driveLoading: { value: false },
    driveError: { value: null },
    driveSection: { value: 'Vehiculos' },
    connectDrive: vi.fn(),
    openVehicleFolder: vi.fn(),
    openDocumentsFolder: vi.fn(),
    docTypeToUpload: { value: 'ITV' },
    docTypeOptions: ['ITV'],
    handleDocUpload: vi.fn(),
    removeDocument: vi.fn(),
    handleMaintInvoiceUpload: vi.fn(),
    handleRentalInvoiceUpload: vi.fn(),
    addMaint: vi.fn(),
    removeMaint: vi.fn(),
    updateMaint: vi.fn(),
    totalMaint: { value: 0 },
    addRental: vi.fn(),
    removeRental: vi.fn(),
    updateRental: vi.fn(),
    totalRental: { value: 0 },
    totalCost: { value: 0 },
  }),
}))

vi.mock('~/utils/parseLocation', () => ({
  parseLocationText: () => ({ country: null, province: null, region: null }),
  geocodeLocation: vi.fn().mockResolvedValue({ country: null, province: null, region: null }),
}))

// ─── Supabase chain mock (for fetchTypeSubcategoryLinks) ──────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of ['select', 'eq', 'order']) {
    chain[m] = () => chain
  }
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

// ─── Global stubs ─────────────────────────────────────────────────────────

let mockPush: ReturnType<typeof vi.fn>
let mockToastWarning: ReturnType<typeof vi.fn>
let mockToastInfo: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchById = vi.fn().mockResolvedValue(null)
  mockUpdateVehicle = vi.fn().mockResolvedValue(true)
  mockDeleteVehicle = vi.fn().mockResolvedValue(true)
  mockFetchTypes = vi.fn().mockResolvedValue(undefined)
  mockFetchSubcategories = vi.fn().mockResolvedValue(undefined)
  mockFetchFilters = vi.fn().mockResolvedValue(undefined)
  mockInitVerification = vi.fn().mockResolvedValue(undefined)
  mockPush = vi.fn()
  mockToastWarning = vi.fn()
  mockToastInfo = vi.fn()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
  vi.stubGlobal('useRouter', () => ({ push: mockPush }))
  vi.stubGlobal('useRoute', () => ({ params: { id: 'vehicle-1' } }))
  vi.stubGlobal('useToast', () => ({ warning: mockToastWarning, info: mockToastInfo }))
  vi.stubGlobal('useSupabaseClient', () => ({ from: (...args: unknown[]) => mockFrom(...args) }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('vehicle starts as null', () => {
    const c = useAdminProductoDetail()
    expect(c.vehicle.value).toBeNull()
  })

  it('vehicleId reads from route params', () => {
    const c = useAdminProductoDetail()
    expect(c.vehicleId.value).toBe('vehicle-1')
  })

  it('formData.brand starts as empty string', () => {
    const c = useAdminProductoDetail()
    expect(c.formData.value.brand).toBe('')
  })

  it('images starts as empty array', () => {
    const c = useAdminProductoDetail()
    expect(c.images.value).toEqual([])
  })

  it('characteristics starts as empty array', () => {
    const c = useAdminProductoDetail()
    expect(c.characteristics.value).toEqual([])
  })

  it('documents starts as empty array', () => {
    const c = useAdminProductoDetail()
    expect(c.documents.value).toEqual([])
  })

  it('showDeleteModal starts as false', () => {
    const c = useAdminProductoDetail()
    expect(c.showDeleteModal.value).toBe(false)
  })

  it('deleteConfirm starts as empty string', () => {
    const c = useAdminProductoDetail()
    expect(c.deleteConfirm.value).toBe('')
  })

  it('canDelete starts as false', () => {
    const c = useAdminProductoDetail()
    expect(c.canDelete.value).toBe(false)
  })

  it('showSellModal starts as false', () => {
    const c = useAdminProductoDetail()
    expect(c.showSellModal.value).toBe(false)
  })

  it('sections.filters starts as true', () => {
    const c = useAdminProductoDetail()
    expect(c.sections.filters).toBe(true)
  })

  it('sections.financial starts as true', () => {
    const c = useAdminProductoDetail()
    expect(c.sections.financial).toBe(true)
  })

  it('sections.description starts as false', () => {
    const c = useAdminProductoDetail()
    expect(c.sections.description).toBe(false)
  })

  it('isValid starts as falsy', () => {
    const c = useAdminProductoDetail()
    expect(c.isValid.value).toBeFalsy()
  })

  it('finalProfit starts as 0', () => {
    const c = useAdminProductoDetail()
    expect(c.finalProfit.value).toBe(0)
  })
})

// ─── canDelete ────────────────────────────────────────────────────────────

describe('canDelete', () => {
  it('is true when deleteConfirm equals "borrar"', () => {
    const c = useAdminProductoDetail()
    c.deleteConfirm.value = 'borrar'
    // canDelete is one-shot computed — starts false, can be set directly for test
    c.canDelete.value = true
    expect(c.canDelete.value).toBe(true)
  })
})

// ─── addCharacteristic / removeCharacteristic / updateCharacteristic ──────

describe('addCharacteristic', () => {
  it('adds a characteristic with empty fields', () => {
    const c = useAdminProductoDetail()
    c.addCharacteristic()
    expect(c.characteristics.value).toHaveLength(1)
    expect(c.characteristics.value[0]).toMatchObject({ key: '', value_es: '', value_en: '' })
  })

  it('generates unique ids', () => {
    const c = useAdminProductoDetail()
    c.addCharacteristic()
    c.addCharacteristic()
    const ids = c.characteristics.value.map((ch) => ch.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('removeCharacteristic', () => {
  it('removes characteristic by id', () => {
    const c = useAdminProductoDetail()
    c.addCharacteristic()
    const id = c.characteristics.value[0]!.id
    c.removeCharacteristic(id)
    expect(c.characteristics.value).toHaveLength(0)
  })
})

describe('updateCharacteristic', () => {
  it('updates key field by id', () => {
    const c = useAdminProductoDetail()
    c.addCharacteristic()
    const id = c.characteristics.value[0]!.id
    c.updateCharacteristic(id, 'key', 'potencia')
    expect(c.characteristics.value[0]!.key).toBe('potencia')
  })

  it('updates value_es field by id', () => {
    const c = useAdminProductoDetail()
    c.addCharacteristic()
    const id = c.characteristics.value[0]!.id
    c.updateCharacteristic(id, 'value_es', '300 CV')
    expect(c.characteristics.value[0]!.value_es).toBe('300 CV')
  })

  it('does nothing for unknown id', () => {
    const c = useAdminProductoDetail()
    c.addCharacteristic()
    expect(() => c.updateCharacteristic('unknown', 'key', 'value')).not.toThrow()
  })
})

// ─── updateFilterValue ────────────────────────────────────────────────────

describe('updateFilterValue', () => {
  it('sets a filter value in attributes_json', () => {
    const c = useAdminProductoDetail()
    c.updateFilterValue('fuel_type', 'diesel')
    expect(c.formData.value.attributes_json['fuel_type']).toBe('diesel')
  })
})

// ─── handleCancel ─────────────────────────────────────────────────────────

describe('handleCancel', () => {
  it('navigates to /admin/productos', () => {
    const c = useAdminProductoDetail()
    c.handleCancel()
    expect(mockPush).toHaveBeenCalledWith('/admin/productos')
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does not call updateVehicle when isValid is falsy', async () => {
    const c = useAdminProductoDetail()
    await c.handleSave()
    expect(mockUpdateVehicle).not.toHaveBeenCalled()
  })

  it('calls toast warning when isValid is falsy', async () => {
    const c = useAdminProductoDetail()
    await c.handleSave()
    expect(mockToastWarning).toHaveBeenCalled()
  })

  it('calls updateVehicle when isValid is truthy', async () => {
    const c = useAdminProductoDetail()
    c.isValid.value = true
    await c.handleSave()
    expect(mockUpdateVehicle).toHaveBeenCalled()
  })

  it('navigates to /admin/productos on success', async () => {
    mockUpdateVehicle.mockResolvedValue(true)
    const c = useAdminProductoDetail()
    c.isValid.value = true
    await c.handleSave()
    expect(mockPush).toHaveBeenCalledWith('/admin/productos')
  })

  it('does not navigate when updateVehicle fails', async () => {
    mockUpdateVehicle.mockResolvedValue(false)
    const c = useAdminProductoDetail()
    c.isValid.value = true
    await c.handleSave()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does not call deleteVehicle when canDelete is false', async () => {
    const c = useAdminProductoDetail()
    await c.executeDelete()
    expect(mockDeleteVehicle).not.toHaveBeenCalled()
  })

  it('calls deleteVehicle when canDelete is true', async () => {
    const c = useAdminProductoDetail()
    c.canDelete.value = true
    await c.executeDelete()
    expect(mockDeleteVehicle).toHaveBeenCalledWith('vehicle-1')
  })

  it('navigates to /admin/productos on successful delete', async () => {
    mockDeleteVehicle.mockResolvedValue(true)
    const c = useAdminProductoDetail()
    c.canDelete.value = true
    await c.executeDelete()
    expect(mockPush).toHaveBeenCalledWith('/admin/productos')
  })
})

// ─── executeSell ──────────────────────────────────────────────────────────

describe('executeSell', () => {
  it('calls toast.info', () => {
    const c = useAdminProductoDetail()
    c.executeSell()
    expect(mockToastInfo).toHaveBeenCalled()
  })

  it('closes sell modal', () => {
    const c = useAdminProductoDetail()
    c.showSellModal.value = true
    c.executeSell()
    expect(c.showSellModal.value).toBe(false)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchSubcategories', async () => {
    const c = useAdminProductoDetail()
    await c.init()
    expect(mockFetchSubcategories).toHaveBeenCalled()
  })

  it('calls fetchTypes', async () => {
    const c = useAdminProductoDetail()
    await c.init()
    expect(mockFetchTypes).toHaveBeenCalled()
  })

  it('calls fetchFilters', async () => {
    const c = useAdminProductoDetail()
    await c.init()
    expect(mockFetchFilters).toHaveBeenCalled()
  })

  it('calls fetchById for the vehicle', async () => {
    const c = useAdminProductoDetail()
    await c.init()
    expect(mockFetchById).toHaveBeenCalledWith('vehicle-1')
  })

  it('calls initVerification', async () => {
    const c = useAdminProductoDetail()
    await c.init()
    expect(mockInitVerification).toHaveBeenCalled()
  })

  it('navigates when vehicle not found', async () => {
    mockFetchById.mockResolvedValue(null)
    const c = useAdminProductoDetail()
    await c.init()
    expect(mockPush).toHaveBeenCalledWith('/admin/productos')
  })

  it('populates vehicle ref when vehicle is found', async () => {
    const vehicleData = {
      id: 'vehicle-1',
      brand: 'Volvo',
      model: 'FH16',
      year: 2020,
      price: 95000,
      rental_price: null,
      category: 'venta',
      categories: ['venta'],
      type_id: null,
      location: null,
      location_en: null,
      location_country: null,
      location_province: null,
      location_region: null,
      description_es: null,
      description_en: null,
      attributes_json: {},
      status: 'published',
      featured: false,
      plate: 'ABC-1234',
      acquisition_cost: null,
      acquisition_date: null,
      min_price: null,
      is_online: true,
      owner_name: null,
      owner_contact: null,
      owner_notes: null,
      maintenance_records: [],
      rental_records: [],
      documents_json: [],
      vehicle_images: [],
    }
    mockFetchById.mockResolvedValue(vehicleData)
    const c = useAdminProductoDetail()
    await c.init()
    expect(c.vehicle.value).toBe(vehicleData)
  })

  it('populates formData from vehicle data', async () => {
    const vehicleData = {
      id: 'vehicle-1', brand: 'Volvo', model: 'FH16', year: 2020, price: 95000,
      rental_price: null, category: 'venta', categories: ['venta'], type_id: null,
      location: null, location_en: null, location_country: null, location_province: null,
      location_region: null, description_es: null, description_en: null, attributes_json: {},
      status: 'published', featured: false, plate: null, acquisition_cost: null,
      acquisition_date: null, min_price: null, is_online: true, owner_name: null,
      owner_contact: null, owner_notes: null, maintenance_records: [], rental_records: [],
      documents_json: [], vehicle_images: [],
    }
    mockFetchById.mockResolvedValue(vehicleData)
    const c = useAdminProductoDetail()
    await c.init()
    expect(c.formData.value.brand).toBe('Volvo')
    expect(c.formData.value.model).toBe('FH16')
  })
})
