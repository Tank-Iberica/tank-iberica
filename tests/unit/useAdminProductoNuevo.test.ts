import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminProductoNuevo } from '../../app/composables/admin/useAdminProductoNuevo'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockUpdateMaint: ReturnType<typeof vi.fn>
let mockUpdateRental: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useAdminProductForm', () => ({
  useAdminProductForm: () => ({
    saving: { value: false },
    error: { value: null },
    cloudinaryUploading: { value: false },
    cloudinaryProgress: { value: 0 },
    locale: { value: 'es' },
    selectedSubcategoryId: { value: null },
    formData: {
      value: {
        brand: '',
        model: '',
        type_id: null,
        categories: [],
        category: 'venta',
        status: 'draft',
        is_online: true,
        featured: false,
        price: null,
        rental_price: null,
        year: null,
        min_price: null,
        acquisition_cost: null,
        acquisition_date: null,
        maintenance_records: [],
        rental_records: [],
        attributes_json: {},
      },
    },
    characteristics: { value: [] },
    documents: { value: [] },
    pendingImages: { value: [] },
    uploadingImages: { value: false },
    sections: { description: false, filters: true, characteristics: false, documents: false, financial: false },
    dynamicFilters: { value: [] },
    publishedSubcategories: { value: [] },
    publishedTypes: { value: [] },
    showRentalPrice: { value: false },
    isValid: { value: false },
    totalMaint: { value: 0 },
    totalRental: { value: 0 },
    totalCost: { value: 0 },
    init: vi.fn().mockResolvedValue(undefined),
    updateFilterValue: vi.fn(),
    getFilterValue: vi.fn(),
    toggleCategory: vi.fn(),
    hasCat: vi.fn().mockReturnValue(false),
    addCharacteristic: vi.fn(),
    removeCharacteristic: vi.fn(),
    handleImageSelect: vi.fn(),
    removePendingImage: vi.fn(),
    movePendingImage: vi.fn(),
    handleDocUpload: vi.fn(),
    removeDocument: vi.fn(),
    addMaint: vi.fn(),
    removeMaint: vi.fn(),
    updateMaint: (...args: unknown[]) => mockUpdateMaint(...args),
    addRental: vi.fn(),
    removeRental: vi.fn(),
    updateRental: (...args: unknown[]) => mockUpdateRental(...args),
    handleSave: vi.fn().mockResolvedValue(undefined),
    handleCancel: vi.fn(),
    fmt: (v: number | null) => (v == null ? '—' : String(v)),
    localizedName: vi.fn(),
    countryFlag: vi.fn(),
  }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateMaint = vi.fn()
  mockUpdateRental = vi.fn()
})

// ─── Initial state (inherits from form) ───────────────────────────────────

describe('initial state', () => {
  it('exposes formData from underlying form', () => {
    const c = useAdminProductoNuevo()
    expect(c.formData.value.brand).toBe('')
  })

  it('exposes sections from underlying form', () => {
    const c = useAdminProductoNuevo()
    expect(c.sections.filters).toBe(true)
  })

  it('exposes saving state from underlying form', () => {
    const c = useAdminProductoNuevo()
    expect(c.saving.value).toBe(false)
  })
})

// ─── onUpdateMinPrice ─────────────────────────────────────────────────────

describe('onUpdateMinPrice', () => {
  it('sets formData.min_price to given value', () => {
    const c = useAdminProductoNuevo()
    c.onUpdateMinPrice(50000)
    expect(c.formData.value.min_price).toBe(50000)
  })

  it('sets formData.min_price to null', () => {
    const c = useAdminProductoNuevo()
    c.formData.value.min_price = 10000
    c.onUpdateMinPrice(null)
    expect(c.formData.value.min_price).toBeNull()
  })
})

// ─── onUpdateAcquisitionCost ──────────────────────────────────────────────

describe('onUpdateAcquisitionCost', () => {
  it('sets formData.acquisition_cost to given value', () => {
    const c = useAdminProductoNuevo()
    c.onUpdateAcquisitionCost(25000)
    expect(c.formData.value.acquisition_cost).toBe(25000)
  })

  it('sets formData.acquisition_cost to null', () => {
    const c = useAdminProductoNuevo()
    c.onUpdateAcquisitionCost(null)
    expect(c.formData.value.acquisition_cost).toBeNull()
  })
})

// ─── onUpdateAcquisitionDate ──────────────────────────────────────────────

describe('onUpdateAcquisitionDate', () => {
  it('sets formData.acquisition_date to given value', () => {
    const c = useAdminProductoNuevo()
    c.onUpdateAcquisitionDate('2026-03-01')
    expect(c.formData.value.acquisition_date).toBe('2026-03-01')
  })

  it('sets formData.acquisition_date to null', () => {
    const c = useAdminProductoNuevo()
    c.onUpdateAcquisitionDate(null)
    expect(c.formData.value.acquisition_date).toBeNull()
  })
})

// ─── onUpdateMaint ────────────────────────────────────────────────────────

describe('onUpdateMaint', () => {
  it('delegates to form.updateMaint with correct args', () => {
    const c = useAdminProductoNuevo()
    c.onUpdateMaint('maint-1', 'cost', 500)
    expect(mockUpdateMaint).toHaveBeenCalledWith('maint-1', 'cost', 500)
  })
})

// ─── onUpdateRental ───────────────────────────────────────────────────────

describe('onUpdateRental', () => {
  it('delegates to form.updateRental with correct args', () => {
    const c = useAdminProductoNuevo()
    c.onUpdateRental('rental-1', 'amount', 1200)
    expect(mockUpdateRental).toHaveBeenCalledWith('rental-1', 'amount', 1200)
  })
})
