import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminProductForm } from '../../app/composables/admin/useAdminProductForm'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockCreateVehicle: ReturnType<typeof vi.fn>
let mockAddImage: ReturnType<typeof vi.fn>
let mockFetchTypes: ReturnType<typeof vi.fn>
let mockFetchSubcategories: ReturnType<typeof vi.fn>
let mockFetchFilters: ReturnType<typeof vi.fn>
let mockUpload: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useAdminVehicles', () => ({
  useAdminVehicles: () => ({
    saving: { value: false },
    error: { value: null },
    createVehicle: (...args: unknown[]) => mockCreateVehicle(...args),
    addImage: (...args: unknown[]) => mockAddImage(...args),
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
    upload: (...args: unknown[]) => mockUpload(...args),
    uploading: { value: false },
    progress: { value: 0 },
  }),
}))

vi.mock('~/utils/fileNaming', () => ({
  generateVehiclePublicId: () => 'public-id',
  generateCloudinaryContext: () => ({}),
  generateVehicleAltText: () => 'alt text',
  slugify: (s: string) => s.toLowerCase().replace(/\s+/g, '-'),
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (obj: Record<string, string>, lang: string) => obj?.[lang] ?? '',
}))

vi.mock('~/utils/parseLocation', () => ({
  parseLocationText: () => ({ country: null, province: null, region: null }),
  geocodeLocation: vi.fn().mockResolvedValue({ country: null, province: null, region: null }),
}))

vi.mock('~/utils/geoData', () => ({
  countryFlag: () => '',
}))

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of ['select', 'eq', 'order', 'limit']) {
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

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateVehicle = vi.fn().mockResolvedValue(null)
  mockAddImage = vi.fn().mockResolvedValue(true)
  mockFetchTypes = vi.fn().mockResolvedValue(undefined)
  mockFetchSubcategories = vi.fn().mockResolvedValue(undefined)
  mockFetchFilters = vi.fn().mockResolvedValue(undefined)
  mockUpload = vi.fn().mockResolvedValue(null)
  mockPush = vi.fn()
  mockToastWarning = vi.fn()
  mockToastInfo = vi.fn()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
  vi.stubGlobal('useRouter', () => ({ push: mockPush }))
  vi.stubGlobal('useToast', () => ({ warning: mockToastWarning, info: mockToastInfo }))
  vi.stubGlobal('useSupabaseClient', () => ({ from: (...args: unknown[]) => mockFrom(...args) }))
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn().mockReturnValue('blob:mock'),
    revokeObjectURL: vi.fn(),
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('formData.brand starts as empty string', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.brand).toBe('')
  })

  it('formData.model starts as empty string', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.model).toBe('')
  })

  it('formData.type_id starts as null', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.type_id).toBeNull()
  })

  it('formData.categories starts as empty array', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.categories).toEqual([])
  })

  it('formData.status starts as draft', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.status).toBe('draft')
  })

  it('formData.category starts as venta', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.category).toBe('venta')
  })

  it('formData.is_online starts as true', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.is_online).toBe(true)
  })

  it('formData.featured starts as false', () => {
    const c = useAdminProductForm()
    expect(c.formData.value.featured).toBe(false)
  })

  it('characteristics starts as empty array', () => {
    const c = useAdminProductForm()
    expect(c.characteristics.value).toEqual([])
  })

  it('documents starts as empty array', () => {
    const c = useAdminProductForm()
    expect(c.documents.value).toEqual([])
  })

  it('pendingImages starts as empty array', () => {
    const c = useAdminProductForm()
    expect(c.pendingImages.value).toEqual([])
  })

  it('selectedSubcategoryId starts as null', () => {
    const c = useAdminProductForm()
    expect(c.selectedSubcategoryId.value).toBeNull()
  })

  it('uploadingImages starts as false', () => {
    const c = useAdminProductForm()
    expect(c.uploadingImages.value).toBe(false)
  })

  it('sections.description starts as false', () => {
    const c = useAdminProductForm()
    expect(c.sections.description).toBe(false)
  })

  it('sections.filters starts as true', () => {
    const c = useAdminProductForm()
    expect(c.sections.filters).toBe(true)
  })

  it('sections.characteristics starts as false', () => {
    const c = useAdminProductForm()
    expect(c.sections.characteristics).toBe(false)
  })

  it('sections.financial starts as false', () => {
    const c = useAdminProductForm()
    expect(c.sections.financial).toBe(false)
  })

  it('isValid starts as falsy (empty brand short-circuits to "")', () => {
    const c = useAdminProductForm()
    expect(c.isValid.value).toBeFalsy()
  })

  it('totalMaint starts as 0', () => {
    const c = useAdminProductForm()
    expect(c.totalMaint.value).toBe(0)
  })

  it('totalRental starts as 0', () => {
    const c = useAdminProductForm()
    expect(c.totalRental.value).toBe(0)
  })

  it('totalCost starts as 0', () => {
    const c = useAdminProductForm()
    expect(c.totalCost.value).toBe(0)
  })

  it('publishedSubcategories starts as empty array', () => {
    const c = useAdminProductForm()
    expect(c.publishedSubcategories.value).toEqual([])
  })

  it('publishedTypes starts as empty array', () => {
    const c = useAdminProductForm()
    expect(c.publishedTypes.value).toEqual([])
  })

  it('dynamicFilters starts as empty array', () => {
    const c = useAdminProductForm()
    expect(c.dynamicFilters.value).toEqual([])
  })

  it('showRentalPrice starts as false', () => {
    const c = useAdminProductForm()
    expect(c.showRentalPrice.value).toBe(false)
  })
})

// ─── fmt ──────────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('returns "—" for null', () => {
    const c = useAdminProductForm()
    expect(c.fmt(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    const c = useAdminProductForm()
    expect(c.fmt(undefined)).toBe('—')
  })

  it('formats 0 as a currency string containing "0"', () => {
    const c = useAdminProductForm()
    const result = c.fmt(0)
    expect(result).toContain('0')
    expect(typeof result).toBe('string')
  })

  it('formats a positive number as EUR currency string', () => {
    const c = useAdminProductForm()
    const result = c.fmt(50000)
    expect(result).toContain('50')
    expect(typeof result).toBe('string')
  })
})

// ─── updateFilterValue / getFilterValue ───────────────────────────────────

describe('updateFilterValue / getFilterValue', () => {
  it('sets and gets a string filter value', () => {
    const c = useAdminProductForm()
    c.updateFilterValue('fuel_type', 'diesel')
    expect(c.getFilterValue('fuel_type')).toBe('diesel')
  })

  it('returns undefined for unset filter', () => {
    const c = useAdminProductForm()
    expect(c.getFilterValue('nonexistent')).toBeUndefined()
  })

  it('stores numeric filter value', () => {
    const c = useAdminProductForm()
    c.updateFilterValue('year', 2020)
    expect(c.getFilterValue('year')).toBe(2020)
  })

  it('stores boolean filter value', () => {
    const c = useAdminProductForm()
    c.updateFilterValue('has_ac', true)
    expect(c.getFilterValue('has_ac')).toBe(true)
  })

  it('overwrites existing filter value', () => {
    const c = useAdminProductForm()
    c.updateFilterValue('fuel_type', 'diesel')
    c.updateFilterValue('fuel_type', 'petrol')
    expect(c.getFilterValue('fuel_type')).toBe('petrol')
  })
})

// ─── toggleCategory / hasCat ──────────────────────────────────────────────

describe('toggleCategory / hasCat', () => {
  it('adds category when not present', () => {
    const c = useAdminProductForm()
    c.toggleCategory('alquiler')
    expect(c.hasCat('alquiler')).toBe(true)
  })

  it('removes category when already present', () => {
    const c = useAdminProductForm()
    c.toggleCategory('venta')
    c.toggleCategory('venta')
    expect(c.hasCat('venta')).toBe(false)
  })

  it('sets formData.category to first category after toggling', () => {
    const c = useAdminProductForm()
    c.toggleCategory('alquiler')
    expect(c.formData.value.category).toBe('alquiler')
  })

  it('hasCat returns false for non-existent category', () => {
    const c = useAdminProductForm()
    expect(c.hasCat('nonexistent')).toBe(false)
  })

  it('can have multiple categories simultaneously', () => {
    const c = useAdminProductForm()
    c.toggleCategory('venta')
    c.toggleCategory('alquiler')
    expect(c.formData.value.categories).toContain('venta')
    expect(c.formData.value.categories).toContain('alquiler')
  })
})

// ─── addCharacteristic / removeCharacteristic ─────────────────────────────

describe('addCharacteristic', () => {
  it('adds characteristic with empty key and values', () => {
    const c = useAdminProductForm()
    c.addCharacteristic()
    expect(c.characteristics.value).toHaveLength(1)
    expect(c.characteristics.value[0]).toMatchObject({ key: '', value_es: '', value_en: '' })
  })

  it('generates unique id for each characteristic', () => {
    const c = useAdminProductForm()
    c.addCharacteristic()
    c.addCharacteristic()
    const ids = c.characteristics.value.map((ch) => ch.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('can add multiple characteristics', () => {
    const c = useAdminProductForm()
    c.addCharacteristic()
    c.addCharacteristic()
    c.addCharacteristic()
    expect(c.characteristics.value).toHaveLength(3)
  })
})

describe('removeCharacteristic', () => {
  it('removes characteristic by id', () => {
    const c = useAdminProductForm()
    c.addCharacteristic()
    const id = c.characteristics.value[0]!.id
    c.removeCharacteristic(id)
    expect(c.characteristics.value).toHaveLength(0)
  })

  it('only removes the matching characteristic', () => {
    const c = useAdminProductForm()
    c.addCharacteristic()
    c.addCharacteristic()
    const firstId = c.characteristics.value[0]!.id
    c.removeCharacteristic(firstId)
    expect(c.characteristics.value).toHaveLength(1)
    expect(c.characteristics.value[0]!.id).not.toBe(firstId)
  })
})

// ─── removePendingImage ───────────────────────────────────────────────────

describe('removePendingImage', () => {
  it('removes pending image by id', () => {
    const c = useAdminProductForm()
    c.pendingImages.value.push({ id: 'img-1', file: {} as File, previewUrl: 'blob:url-1' })
    c.removePendingImage('img-1')
    expect(c.pendingImages.value).toHaveLength(0)
  })

  it('only removes the matching image', () => {
    const c = useAdminProductForm()
    c.pendingImages.value.push({ id: 'img-1', file: {} as File, previewUrl: 'blob:url-1' })
    c.pendingImages.value.push({ id: 'img-2', file: {} as File, previewUrl: 'blob:url-2' })
    c.removePendingImage('img-1')
    expect(c.pendingImages.value).toHaveLength(1)
    expect(c.pendingImages.value[0]!.id).toBe('img-2')
  })

  it('does nothing for unknown id', () => {
    const c = useAdminProductForm()
    c.pendingImages.value.push({ id: 'img-1', file: {} as File, previewUrl: 'blob:url-1' })
    c.removePendingImage('nonexistent')
    expect(c.pendingImages.value).toHaveLength(1)
  })
})

// ─── movePendingImage ─────────────────────────────────────────────────────

describe('movePendingImage', () => {
  it('moves image down', () => {
    const c = useAdminProductForm()
    c.pendingImages.value = [
      { id: 'img-1', file: {} as File, previewUrl: 'url-1' },
      { id: 'img-2', file: {} as File, previewUrl: 'url-2' },
    ]
    c.movePendingImage(0, 'down')
    expect(c.pendingImages.value[0]!.id).toBe('img-2')
    expect(c.pendingImages.value[1]!.id).toBe('img-1')
  })

  it('moves image up', () => {
    const c = useAdminProductForm()
    c.pendingImages.value = [
      { id: 'img-1', file: {} as File, previewUrl: 'url-1' },
      { id: 'img-2', file: {} as File, previewUrl: 'url-2' },
    ]
    c.movePendingImage(1, 'up')
    expect(c.pendingImages.value[0]!.id).toBe('img-2')
    expect(c.pendingImages.value[1]!.id).toBe('img-1')
  })

  it('does not move beyond start (index 0, up)', () => {
    const c = useAdminProductForm()
    c.pendingImages.value = [{ id: 'img-1', file: {} as File, previewUrl: 'url-1' }]
    c.movePendingImage(0, 'up')
    expect(c.pendingImages.value[0]!.id).toBe('img-1')
  })

  it('does not move beyond end', () => {
    const c = useAdminProductForm()
    c.pendingImages.value = [{ id: 'img-1', file: {} as File, previewUrl: 'url-1' }]
    c.movePendingImage(0, 'down')
    expect(c.pendingImages.value[0]!.id).toBe('img-1')
  })
})

// ─── removeDocument ───────────────────────────────────────────────────────

describe('removeDocument', () => {
  it('removes document by id', () => {
    const c = useAdminProductForm()
    c.documents.value.push({ id: 'doc-1', name: 'test.pdf', url: 'http://example.com' })
    c.removeDocument('doc-1')
    expect(c.documents.value).toHaveLength(0)
  })

  it('only removes matching document', () => {
    const c = useAdminProductForm()
    c.documents.value.push({ id: 'doc-1', name: 'a.pdf', url: 'url-1' })
    c.documents.value.push({ id: 'doc-2', name: 'b.pdf', url: 'url-2' })
    c.removeDocument('doc-1')
    expect(c.documents.value).toHaveLength(1)
    expect(c.documents.value[0]!.id).toBe('doc-2')
  })
})

// ─── addMaint / removeMaint / updateMaint ─────────────────────────────────

describe('addMaint', () => {
  it('adds a maintenance record', () => {
    const c = useAdminProductForm()
    c.addMaint()
    expect(c.formData.value.maintenance_records).toHaveLength(1)
  })

  it('sets initial cost to 0', () => {
    const c = useAdminProductForm()
    c.addMaint()
    expect(c.formData.value.maintenance_records![0]!.cost).toBe(0)
  })

  it('sets initial reason to empty string', () => {
    const c = useAdminProductForm()
    c.addMaint()
    expect(c.formData.value.maintenance_records![0]!.reason).toBe('')
  })

  it('generates unique id for each record', () => {
    const c = useAdminProductForm()
    c.addMaint()
    c.addMaint()
    const ids = c.formData.value.maintenance_records!.map((r) => r.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('removeMaint', () => {
  it('removes maintenance record by id', () => {
    const c = useAdminProductForm()
    c.addMaint()
    const id = c.formData.value.maintenance_records![0]!.id
    c.removeMaint(id)
    expect(c.formData.value.maintenance_records).toHaveLength(0)
  })

  it('only removes the matching record', () => {
    const c = useAdminProductForm()
    c.addMaint()
    c.addMaint()
    const firstId = c.formData.value.maintenance_records![0]!.id
    c.removeMaint(firstId)
    expect(c.formData.value.maintenance_records).toHaveLength(1)
  })
})

describe('updateMaint', () => {
  it('updates cost field', () => {
    const c = useAdminProductForm()
    c.addMaint()
    const id = c.formData.value.maintenance_records![0]!.id
    c.updateMaint(id, 'cost', 500)
    expect(c.formData.value.maintenance_records![0]!.cost).toBe(500)
  })

  it('updates reason field', () => {
    const c = useAdminProductForm()
    c.addMaint()
    const id = c.formData.value.maintenance_records![0]!.id
    c.updateMaint(id, 'reason', 'Oil change')
    expect(c.formData.value.maintenance_records![0]!.reason).toBe('Oil change')
  })
})

// ─── addRental / removeRental / updateRental ──────────────────────────────

describe('addRental', () => {
  it('adds a rental record', () => {
    const c = useAdminProductForm()
    c.addRental()
    expect(c.formData.value.rental_records).toHaveLength(1)
  })

  it('sets initial amount to 0', () => {
    const c = useAdminProductForm()
    c.addRental()
    expect(c.formData.value.rental_records![0]!.amount).toBe(0)
  })

  it('sets initial notes to empty string', () => {
    const c = useAdminProductForm()
    c.addRental()
    expect(c.formData.value.rental_records![0]!.notes).toBe('')
  })

  it('generates unique id for each record', () => {
    const c = useAdminProductForm()
    c.addRental()
    c.addRental()
    const ids = c.formData.value.rental_records!.map((r) => r.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('removeRental', () => {
  it('removes rental record by id', () => {
    const c = useAdminProductForm()
    c.addRental()
    const id = c.formData.value.rental_records![0]!.id
    c.removeRental(id)
    expect(c.formData.value.rental_records).toHaveLength(0)
  })

  it('only removes the matching record', () => {
    const c = useAdminProductForm()
    c.addRental()
    c.addRental()
    const firstId = c.formData.value.rental_records![0]!.id
    c.removeRental(firstId)
    expect(c.formData.value.rental_records).toHaveLength(1)
  })
})

describe('updateRental', () => {
  it('updates amount field', () => {
    const c = useAdminProductForm()
    c.addRental()
    const id = c.formData.value.rental_records![0]!.id
    c.updateRental(id, 'amount', 1200)
    expect(c.formData.value.rental_records![0]!.amount).toBe(1200)
  })

  it('updates notes field', () => {
    const c = useAdminProductForm()
    c.addRental()
    const id = c.formData.value.rental_records![0]!.id
    c.updateRental(id, 'notes', 'Monthly rental')
    expect(c.formData.value.rental_records![0]!.notes).toBe('Monthly rental')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchSubcategories', async () => {
    const c = useAdminProductForm()
    await c.init()
    expect(mockFetchSubcategories).toHaveBeenCalled()
  })

  it('calls fetchTypes', async () => {
    const c = useAdminProductForm()
    await c.init()
    expect(mockFetchTypes).toHaveBeenCalled()
  })

  it('calls fetchFilters', async () => {
    const c = useAdminProductForm()
    await c.init()
    expect(mockFetchFilters).toHaveBeenCalled()
  })

  it('queries subcategory_categories for type-subcategory links', async () => {
    const c = useAdminProductForm()
    await c.init()
    expect(mockFrom).toHaveBeenCalledWith('subcategory_categories')
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does not call createVehicle when isValid is false', async () => {
    const c = useAdminProductForm()
    await c.handleSave()
    expect(mockCreateVehicle).not.toHaveBeenCalled()
  })

  it('shows toast warning when isValid is false', async () => {
    const c = useAdminProductForm()
    await c.handleSave()
    expect(mockToastWarning).toHaveBeenCalled()
  })

  it('calls createVehicle when isValid is true', async () => {
    const c = useAdminProductForm()
    c.isValid.value = true
    await c.handleSave()
    expect(mockCreateVehicle).toHaveBeenCalled()
  })

  it('does not navigate when createVehicle returns null', async () => {
    mockCreateVehicle.mockResolvedValue(null)
    const c = useAdminProductForm()
    c.isValid.value = true
    await c.handleSave()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('navigates to /admin/productos on success with no images', async () => {
    mockCreateVehicle.mockResolvedValue('vehicle-id')
    const c = useAdminProductForm()
    c.isValid.value = true
    await c.handleSave()
    expect(mockPush).toHaveBeenCalledWith('/admin/productos')
  })

  it('uploads pending images when present', async () => {
    mockCreateVehicle.mockResolvedValue('vehicle-id')
    mockUpload.mockResolvedValue({ public_id: 'cld-id', secure_url: 'https://img.com/img.jpg' })
    const c = useAdminProductForm()
    c.isValid.value = true
    c.pendingImages.value = [{ id: 'img-1', file: {} as File, previewUrl: 'blob:url' }]
    await c.handleSave()
    expect(mockUpload).toHaveBeenCalled()
    expect(mockAddImage).toHaveBeenCalled()
  })

  it('navigates to /admin/productos after uploading images', async () => {
    mockCreateVehicle.mockResolvedValue('vehicle-id')
    mockUpload.mockResolvedValue({ public_id: 'cld-id', secure_url: 'https://img.com/img.jpg' })
    const c = useAdminProductForm()
    c.isValid.value = true
    c.pendingImages.value = [{ id: 'img-1', file: {} as File, previewUrl: 'blob:url' }]
    await c.handleSave()
    expect(mockPush).toHaveBeenCalledWith('/admin/productos')
  })

  it('skips addImage when upload returns null', async () => {
    mockCreateVehicle.mockResolvedValue('vehicle-id')
    mockUpload.mockResolvedValue(null)
    const c = useAdminProductForm()
    c.isValid.value = true
    c.pendingImages.value = [{ id: 'img-1', file: {} as File, previewUrl: 'blob:url' }]
    await c.handleSave()
    expect(mockAddImage).not.toHaveBeenCalled()
  })
})

// ─── handleCancel ─────────────────────────────────────────────────────────

describe('handleCancel', () => {
  it('navigates to /admin/productos', () => {
    const c = useAdminProductForm()
    c.handleCancel()
    expect(mockPush).toHaveBeenCalledWith('/admin/productos')
  })
})
