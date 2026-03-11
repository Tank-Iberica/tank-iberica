import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminVehicleDetail, statusOptions, categoryOptions } from '../../app/composables/admin/useAdminVehicleDetail'

// ─── Hoisted mocks for useAdminVehicles ───────────────────────────────────────

const { mockFetchById, mockCreateVehicle, mockUpdateVehicle, mockArchiveVehicle } = vi.hoisted(() => ({
  mockFetchById: vi.fn().mockResolvedValue(null),
  mockCreateVehicle: vi.fn().mockResolvedValue('new-vehicle-id'),
  mockUpdateVehicle: vi.fn().mockResolvedValue(true),
  mockArchiveVehicle: vi.fn().mockResolvedValue(true),
}))

vi.mock('~/composables/admin/useAdminVehicles', () => ({
  useAdminVehicles: () => ({
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    fetchById: mockFetchById,
    createVehicle: mockCreateVehicle,
    updateVehicle: mockUpdateVehicle,
    archiveVehicle: mockArchiveVehicle,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:mock-url') })
})

// ─── Static exports ────────────────────────────────────────────────────────────

describe('statusOptions', () => {
  it('has 4 items', () => {
    expect(statusOptions).toHaveLength(4)
  })

  it('includes draft', () => {
    expect(statusOptions.map(o => o.value)).toContain('draft')
  })

  it('includes published', () => {
    expect(statusOptions.map(o => o.value)).toContain('published')
  })

  it('includes rented', () => {
    expect(statusOptions.map(o => o.value)).toContain('rented')
  })

  it('includes workshop', () => {
    expect(statusOptions.map(o => o.value)).toContain('workshop')
  })
})

describe('categoryOptions', () => {
  it('has 3 items', () => {
    expect(categoryOptions).toHaveLength(3)
  })

  it('includes venta, alquiler, terceros', () => {
    const values = categoryOptions.map(o => o.value)
    expect(values).toContain('venta')
    expect(values).toContain('alquiler')
    expect(values).toContain('terceros')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as false', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.error.value).toBeNull()
  })

  it('isNew is false for a real vehicleId', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.isNew.value).toBe(false)
  })

  it('isNew is true when vehicleId is "new"', () => {
    const c = useAdminVehicleDetail({ value: 'new' })
    expect(c.isNew.value).toBe(true)
  })

  it('form.brand starts as empty string', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.form.value.brand).toBe('')
  })

  it('form.category starts as "venta"', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.form.value.category).toBe('venta')
  })

  it('form.status starts as "draft"', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.form.value.status).toBe('draft')
  })

  it('form.is_online starts as true', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.form.value.is_online).toBe(true)
  })

  it('form.featured starts as false', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.form.value.featured).toBe(false)
  })

  it('formImages starts as empty array', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.formImages.value).toHaveLength(0)
  })

  it('showTransactionModal starts as false', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.showTransactionModal.value).toBe(false)
  })

  it('txTab starts as "venta"', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.txTab.value).toBe('venta')
  })

  it('sellForm.sale_price starts as 0', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.sellForm.value.sale_price).toBe(0)
  })

  it('rentalForm.monthly_price starts as 0', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.rentalForm.value.monthly_price).toBe(0)
  })

  it('subcategories starts as empty array', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.subcategories.value).toHaveLength(0)
  })

  it('activeFilters starts as empty array (no type_id)', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.activeFilters.value).toHaveLength(0)
  })
})

// ─── openTransactionModal ──────────────────────────────────────────────────────

describe('openTransactionModal', () => {
  it('sets txTab to "venta"', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.openTransactionModal('venta')
    expect(c.txTab.value).toBe('venta')
  })

  it('sets txTab to "alquiler"', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.openTransactionModal('alquiler')
    expect(c.txTab.value).toBe('alquiler')
  })

  it('sets showTransactionModal to true', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.openTransactionModal('venta')
    expect(c.showTransactionModal.value).toBe(true)
  })

  it('pre-fills sale_price from form.price when tab is venta', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.price = 45000
    c.openTransactionModal('venta')
    expect(c.sellForm.value.sale_price).toBe(45000)
  })

  it('pre-fills monthly_price from form.rental_price when tab is alquiler', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.rental_price = 1500
    c.openTransactionModal('alquiler')
    expect(c.rentalForm.value.monthly_price).toBe(1500)
  })

  it('does not pre-fill sale_price when form.price is null', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.price = null
    c.openTransactionModal('venta')
    expect(c.sellForm.value.sale_price).toBe(0)
  })

  it('does not pre-fill monthly_price when form.rental_price is null', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.rental_price = null
    c.openTransactionModal('alquiler')
    expect(c.rentalForm.value.monthly_price).toBe(0)
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('returns early when brand is empty', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.brand = ''
    c.form.value.model = 'FH16'
    await c.handleSave()
    expect(mockUpdateVehicle).not.toHaveBeenCalled()
  })

  it('returns early when model is empty', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.brand = 'Volvo'
    c.form.value.model = ''
    await c.handleSave()
    expect(mockUpdateVehicle).not.toHaveBeenCalled()
  })

  it('calls createVehicle when isNew', async () => {
    const c = useAdminVehicleDetail({ value: 'new' })
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH16'
    await c.handleSave()
    expect(mockCreateVehicle).toHaveBeenCalled()
  })

  it('calls updateVehicle with vehicleId when not isNew', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH16'
    await c.handleSave()
    expect(mockUpdateVehicle).toHaveBeenCalledWith('vehicle-1', expect.any(Object))
  })

  it('does not call updateVehicle when isNew', async () => {
    const c = useAdminVehicleDetail({ value: 'new' })
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH16'
    await c.handleSave()
    expect(mockUpdateVehicle).not.toHaveBeenCalled()
  })

  it('does not call createVehicle when not isNew', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.form.value.brand = 'Volvo'
    c.form.value.model = 'FH16'
    await c.handleSave()
    expect(mockCreateVehicle).not.toHaveBeenCalled()
  })
})

// ─── handleSell ───────────────────────────────────────────────────────────────

describe('handleSell', () => {
  it('returns early when vehicleId is "new" (no archiveVehicle call)', async () => {
    const c = useAdminVehicleDetail({ value: 'new' })
    await c.handleSell()
    expect(mockArchiveVehicle).not.toHaveBeenCalled()
  })

  it('calls archiveVehicle with vehicleId', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    await c.handleSell()
    expect(mockArchiveVehicle).toHaveBeenCalledWith('vehicle-1', expect.any(Object))
  })

  it('passes sellForm data to archiveVehicle', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.sellForm.value.sale_price = 50000
    c.sellForm.value.buyer_name = 'Comprador SA'
    await c.handleSell()
    expect(mockArchiveVehicle).toHaveBeenCalledWith(
      'vehicle-1',
      expect.objectContaining({ sale_price: 50000, buyer_name: 'Comprador SA' }),
    )
  })

  it('closes modal after successful sell', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.showTransactionModal.value = true
    await c.handleSell()
    expect(c.showTransactionModal.value).toBe(false)
  })

  it('does not close modal when archiveVehicle returns false', async () => {
    mockArchiveVehicle.mockResolvedValueOnce(false)
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.showTransactionModal.value = true
    await c.handleSell()
    expect(c.showTransactionModal.value).toBe(true)
  })
})

// ─── handleRent ───────────────────────────────────────────────────────────────

describe('handleRent', () => {
  it('returns early when vehicleId is "new"', async () => {
    const c = useAdminVehicleDetail({ value: 'new' })
    // No supabase call should be made — just a no-op
    await c.handleRent()
    expect(c.showTransactionModal.value).toBe(false)
  })

  it('closes modal after successful rent', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.showTransactionModal.value = true
    await c.handleRent()
    expect(c.showTransactionModal.value).toBe(false)
  })

  it('sets form.status to "rented" after successful rent', async () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    await c.handleRent()
    expect(c.form.value.status).toBe('rented')
  })

  it('modal stays open when update fails', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'DB error' } }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        select: () => ({ eq: () => ({ order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }) }) }),
      }),
    }))
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.showTransactionModal.value = true
    await c.handleRent()
    expect(c.showTransactionModal.value).toBe(true)
  })
})

// ─── handleImageUpload ────────────────────────────────────────────────────────

describe('handleImageUpload', () => {
  function makeUploadEvent(files: File[]) {
    return { target: { files, value: '' } } as unknown as Event
  }

  it('does nothing when no files', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    const event = { target: { files: null, value: '' } } as unknown as Event
    c.handleImageUpload(event)
    expect(c.formImages.value).toHaveLength(0)
  })

  it('adds uploaded file to formImages', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
    c.handleImageUpload(makeUploadEvent([file]))
    expect(c.formImages.value).toHaveLength(1)
  })

  it('sets image url from URL.createObjectURL', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
    c.handleImageUpload(makeUploadEvent([file]))
    expect(c.formImages.value[0]!.url).toBe('blob:mock-url')
  })

  it('adds multiple files', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    const files = [
      new File(['a'], 'a.jpg'),
      new File(['b'], 'b.jpg'),
      new File(['c'], 'c.jpg'),
    ]
    c.handleImageUpload(makeUploadEvent(files))
    expect(c.formImages.value).toHaveLength(3)
  })

  it('stops at 10 images maximum', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    // Pre-fill with 9 images
    for (let i = 0; i < 9; i++) {
      c.formImages.value.push({ id: `img-${i}`, url: `url-${i}` })
    }
    // Try to add 3 more — only 1 should fit
    const files = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg'), new File(['c'], 'c.jpg')]
    c.handleImageUpload(makeUploadEvent(files))
    expect(c.formImages.value).toHaveLength(10)
  })
})

// ─── removeImage ──────────────────────────────────────────────────────────────

describe('removeImage', () => {
  it('removes image at given index', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.formImages.value = [{ id: 'img1', url: 'url1' }, { id: 'img2', url: 'url2' }]
    c.removeImage(0)
    expect(c.formImages.value).toHaveLength(1)
    expect(c.formImages.value[0]!.id).toBe('img2')
  })

  it('removes last image', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.formImages.value = [{ id: 'img1', url: 'url1' }]
    c.removeImage(0)
    expect(c.formImages.value).toHaveLength(0)
  })

  it('removes image in the middle', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.formImages.value = [
      { id: 'img1', url: 'url1' },
      { id: 'img2', url: 'url2' },
      { id: 'img3', url: 'url3' },
    ]
    c.removeImage(1)
    expect(c.formImages.value).toHaveLength(2)
    expect(c.formImages.value[0]!.id).toBe('img1')
    expect(c.formImages.value[1]!.id).toBe('img3')
  })
})

// ─── handleDragStart / handleDrop ─────────────────────────────────────────────

describe('handleDragStart and handleDrop', () => {
  it('moves dragged image to target index', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.formImages.value = [
      { id: 'img1', url: 'url1' },
      { id: 'img2', url: 'url2' },
      { id: 'img3', url: 'url3' },
    ]
    c.handleDragStart(0)
    c.handleDrop(2)
    expect(c.formImages.value[2]!.id).toBe('img1')
  })

  it('does nothing when same index', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.formImages.value = [{ id: 'img1', url: 'url1' }, { id: 'img2', url: 'url2' }]
    c.handleDragStart(0)
    c.handleDrop(0)
    expect(c.formImages.value[0]!.id).toBe('img1')
  })

  it('does nothing when handleDrop called without prior handleDragStart', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    c.formImages.value = [{ id: 'img1', url: 'url1' }, { id: 'img2', url: 'url2' }]
    c.handleDrop(1) // draggedIndex is null
    expect(c.formImages.value[0]!.id).toBe('img1')
  })
})

// ─── getSliderMin / getSliderMax ──────────────────────────────────────────────

describe('getSliderMin', () => {
  it('returns min from object options', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.getSliderMin({ min: 0, max: 500000 })).toBe(0)
  })

  it('returns undefined for array options', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.getSliderMin(['a', 'b'])).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.getSliderMin(undefined)).toBeUndefined()
  })
})

describe('getSliderMax', () => {
  it('returns max from object options', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.getSliderMax({ min: 0, max: 500000 })).toBe(500000)
  })

  it('returns undefined for array options', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.getSliderMax(['a', 'b'])).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.getSliderMax(undefined)).toBeUndefined()
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats number as EUR currency', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    const result = c.formatCurrency(50000)
    expect(result).toContain('50')
    expect(result).toContain('€')
  })

  it('formats 0', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    const result = c.formatCurrency(0)
    expect(result).toContain('€')
  })

  it('formats without decimal places', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    const result = c.formatCurrency(1000)
    expect(result).not.toContain(',00')
    expect(result).not.toContain('.00')
  })
})

// ─── calcBeneficio ────────────────────────────────────────────────────────────

describe('calcBeneficio', () => {
  it('returns em-dash for null cost', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.calcBeneficio(50000, null)).toBe('\u2014')
  })

  it('returns em-dash for 0 cost', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.calcBeneficio(50000, 0)).toBe('\u2014')
  })

  it('returns em-dash for undefined cost', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.calcBeneficio(50000, undefined)).toBe('\u2014')
  })

  it('returns positive percentage with + sign', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.calcBeneficio(10000, 8000)).toBe('+25%')
  })

  it('returns negative percentage without + sign', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.calcBeneficio(8000, 10000)).toBe('-20%')
  })

  it('returns 0% for equal sale price and cost', () => {
    const c = useAdminVehicleDetail({ value: 'vehicle-1' })
    expect(c.calcBeneficio(10000, 10000)).toBe('0%')
  })
})
