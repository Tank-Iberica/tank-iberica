import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Module mock (hoisted) ────────────────────────────────────────────────────

const { mockLocalizedField } = vi.hoisted(() => ({
  mockLocalizedField: vi.fn((name: unknown, _locale: unknown) => (name as Record<string, string>)?.es || ''),
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedField: mockLocalizedField,
}))

import { useAdvertiseModal, CONTACT_PREFERENCES, MAX_PHOTOS, MIN_PHOTOS } from '../../app/composables/modals/useAdvertiseModal'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockOnClose = vi.fn()
const mockOnOpenAuth = vi.fn()
let mockIsOpen = false

const mockSelector = {
  categories: { value: [] },
  linkedSubcategories: { value: [] },
  attributes: { value: [] },
  selectedCategoryId: { value: null as string | null },
  selectedSubcategoryId: { value: null as string | null },
  filterValues: { value: {} },
  loading: { value: false },
  filtersLoading: { value: false },
  fetchInitialData: vi.fn().mockResolvedValue(undefined),
  selectCategory: vi.fn(),
  selectSubcategory: vi.fn().mockResolvedValue(undefined),
  setFilterValue: vi.fn(),
  getAttributesJson: vi.fn().mockReturnValue({}),
  getFilterLabel: vi.fn().mockReturnValue(''),
  getFilterOptions: vi.fn().mockReturnValue([]),
  getVehicleSubcategoryLabel: vi.fn().mockReturnValue('Camión'),
  reset: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockIsOpen = false

  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x: unknown) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('watch', vi.fn())

  vi.stubGlobal('useI18n', () => ({
    t: (k: string) => k,
    locale: { value: 'es' },
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useVehicleTypeSelector', () => mockSelector)
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))

  // Browser APIs
  Object.defineProperty(globalThis, 'URL', {
    value: {
      createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
      revokeObjectURL: vi.fn(),
    },
    writable: true,
    configurable: true,
  })
})

// ─── Constants ─────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('CONTACT_PREFERENCES has 3 options', () => {
    expect(CONTACT_PREFERENCES).toHaveLength(3)
  })

  it('CONTACT_PREFERENCES includes email, phone, whatsapp', () => {
    const values = CONTACT_PREFERENCES.map(p => p.value)
    expect(values).toContain('email')
    expect(values).toContain('phone')
    expect(values).toContain('whatsapp')
  })

  it('MAX_PHOTOS is 6', () => {
    expect(MAX_PHOTOS).toBe(6)
  })

  it('MIN_PHOTOS is 3', () => {
    expect(MIN_PHOTOS).toBe(3)
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('isSubmitting starts false', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.isSubmitting.value).toBe(false)
  })

  it('isSuccess starts false', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.isSuccess.value).toBe(false)
  })

  it('validationErrors starts empty', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(Object.keys(c.validationErrors.value)).toHaveLength(0)
  })

  it('photos starts empty', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.photos.value).toHaveLength(0)
  })

  it('formData.contactPreference starts as email', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.formData.value.contactPreference).toBe('email')
  })

  it('formData.termsAccepted starts as false', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.formData.value.termsAccepted).toBe(false)
  })

  it('isAuthenticated is true when user exists', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.isAuthenticated.value).toBe(true)
  })

  it('isAuthenticated is false when no user', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.isAuthenticated.value).toBe(false)
  })

  it('hasValidationErrors is false initially', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.hasValidationErrors.value).toBe(false)
  })
})

// ─── close / handleLoginClick ─────────────────────────────────────────────────

describe('close', () => {
  it('calls onClose', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.close()
    expect(mockOnClose).toHaveBeenCalled()
  })
})

describe('handleLoginClick', () => {
  it('calls onOpenAuth and closes', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.handleLoginClick()
    expect(mockOnOpenAuth).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })
})

describe('handleBackdropClick', () => {
  it('closes when clicking backdrop (target === currentTarget)', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const el = document.createElement('div')
    const e = { target: el, currentTarget: el } as unknown as MouseEvent
    c.handleBackdropClick(e)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('does not close when clicking inside element', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    const e = { target: inner, currentTarget: outer } as unknown as MouseEvent
    c.handleBackdropClick(e)
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})

// ─── validateForm ─────────────────────────────────────────────────────────────

describe('validateForm (via handleSubmit skipping when invalid)', () => {
  it('sets validationErrors when required fields empty', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    // handleSubmit calls validateForm internally
    await c.handleSubmit()
    expect(c.hasValidationErrors.value).toBe(true)
  })

  it('sets brand error when brand empty', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    await c.handleSubmit()
    expect(c.validationErrors.value.brand).toBeTruthy()
  })

  it('sets email error for invalid email', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.formData.value = {
      ...c.formData.value,
      brand: 'Volvo',
      model: 'FH',
      year: 2020,
      price: 50000,
      location: 'Madrid',
      description: 'Camión de prueba',
      contactName: 'Juan',
      contactEmail: 'invalid-email',
      contactPhone: '+34600000000',
      termsAccepted: true,
    }
    await c.handleSubmit()
    expect(c.validationErrors.value.contactEmail).toBeTruthy()
  })

  it('does not reach isSubmitting=true when not authenticated', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    // Even if form is valid, no user → guard exits early, isSubmitting never set
    await c.handleSubmit()
    expect(c.isSubmitting.value).toBe(false)
    expect(c.isSuccess.value).toBe(false)
  })
})

// ─── internal reset (triggered by handleSubmit on success, not exported directly) ──

// resetForm is internal — test its effects through the public API only

// ─── removePhoto ──────────────────────────────────────────────────────────────

describe('removePhoto', () => {
  it('removes photo and preview at given index', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.photos.value = [new File([], 'a.jpg'), new File([], 'b.jpg')]
    c.photoPreviews.value = ['blob:a', 'blob:b']
    c.removePhoto(0)
    expect(c.photos.value).toHaveLength(1)
    expect(c.photoPreviews.value).toHaveLength(1)
    expect(c.photoPreviews.value[0]).toBe('blob:b')
  })
})

// ─── removeTechSheet ──────────────────────────────────────────────────────────

describe('removeTechSheet', () => {
  it('clears techSheet and preview', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.techSheet.value = new File([], 'sheet.pdf')
    c.techSheetPreview.value = 'blob:sheet'
    c.removeTechSheet()
    expect(c.techSheet.value).toBeNull()
    expect(c.techSheetPreview.value).toBe('')
  })
})

// ─── handleCategoryChange ─────────────────────────────────────────────────────

describe('handleCategoryChange', () => {
  it('calls selectCategory with selected value', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const e = { target: { value: 'cat-1' } } as unknown as Event
    c.handleCategoryChange(e)
    expect(mockSelector.selectCategory).toHaveBeenCalledWith('cat-1')
  })

  it('passes null when empty value', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const e = { target: { value: '' } } as unknown as Event
    c.handleCategoryChange(e)
    expect(mockSelector.selectCategory).toHaveBeenCalledWith(null)
  })
})

// ─── handleSubcategoryChange ─────────────────────────────────────────────────

describe('handleSubcategoryChange', () => {
  it('calls selectSubcategory with value', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    await c.handleSubcategoryChange({ target: { value: 'sub-1' } } as unknown as Event)
    expect(mockSelector.selectSubcategory).toHaveBeenCalledWith('sub-1')
  })

  it('passes null when empty', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    await c.handleSubcategoryChange({ target: { value: '' } } as unknown as Event)
    expect(mockSelector.selectSubcategory).toHaveBeenCalledWith(null)
  })
})

// ─── handlePhotoSelect ───────────────────────────────────────────────────────

describe('handlePhotoSelect', () => {
  it('adds valid files and creates previews', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const file = new File(['x'], 'photo.jpg')
    Object.defineProperty(file, 'size', { value: 1024 })
    const input = { files: [file], value: 'C:\\photo.jpg' } as unknown as HTMLInputElement
    c.handlePhotoSelect({ target: input } as unknown as Event)
    expect(c.photos.value).toHaveLength(1)
    expect(c.photoPreviews.value[0]).toBe('blob:test-url')
    expect(input.value).toBe('')
  })

  it('skips files over 10MB', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const big = new File(['x'], 'big.jpg')
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    c.handlePhotoSelect({ target: { files: [big], value: '' } } as unknown as Event)
    expect(c.photos.value).toHaveLength(0)
  })

  it('clears photos validation when enough photos', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.validationErrors.value = { photos: 'required' }
    const files = Array.from({ length: 3 }, (_, i) => {
      const f = new File(['x'], `p${i}.jpg`)
      Object.defineProperty(f, 'size', { value: 1024 })
      return f
    })
    c.handlePhotoSelect({ target: { files, value: '' } } as unknown as Event)
    expect(c.validationErrors.value.photos).toBeUndefined()
  })

  it('returns early if no files', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.handlePhotoSelect({ target: { files: null, value: '' } } as unknown as Event)
    expect(c.photos.value).toHaveLength(0)
  })

  it('limits to MAX_PHOTOS', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const files = Array.from({ length: 10 }, (_, i) => {
      const f = new File(['x'], `p${i}.jpg`)
      Object.defineProperty(f, 'size', { value: 1024 })
      return f
    })
    c.handlePhotoSelect({ target: { files, value: '' } } as unknown as Event)
    expect(c.photos.value.length).toBeLessThanOrEqual(MAX_PHOTOS)
  })
})

// ─── handleTechSheetSelect ───────────────────────────────────────────────────

describe('handleTechSheetSelect', () => {
  it('sets techSheet and preview', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const file = new File(['sheet'], 'spec.pdf')
    Object.defineProperty(file, 'size', { value: 1024 })
    c.handleTechSheetSelect({ target: { files: [file], value: '' } } as unknown as Event)
    expect(c.techSheet.value).toBe(file)
    expect(c.techSheetPreview.value).toBe('blob:test-url')
  })

  it('skips file over 10MB', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    const big = new File(['x'], 'big.pdf')
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    c.handleTechSheetSelect({ target: { files: [big], value: '' } } as unknown as Event)
    expect(c.techSheet.value).toBeNull()
  })

  it('clears techSheet validation error', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.validationErrors.value = { techSheet: 'required' }
    const file = new File(['sheet'], 'spec.pdf')
    Object.defineProperty(file, 'size', { value: 1024 })
    c.handleTechSheetSelect({ target: { files: [file], value: '' } } as unknown as Event)
    expect(c.validationErrors.value.techSheet).toBeUndefined()
  })

  it('returns early if no files', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.handleTechSheetSelect({ target: { files: [], value: '' } } as unknown as Event)
    expect(c.techSheet.value).toBeNull()
  })

  it('revokes old preview when replacing', () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.techSheetPreview.value = 'blob:old'
    const file = new File(['new'], 'new.pdf')
    Object.defineProperty(file, 'size', { value: 1024 })
    c.handleTechSheetSelect({ target: { files: [file], value: '' } } as unknown as Event)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old')
  })
})

// ─── catName ─────────────────────────────────────────────────────────────────

describe('catName', () => {
  it('returns localized name from JSONB', () => {
    mockLocalizedField.mockReturnValueOnce('Camión')
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.catName({ name_es: 'Camión', name_en: 'Truck', name: { es: 'Camión', en: 'Truck' } })).toBe('Camión')
  })

  it('falls back to name_en when locale is en', () => {
    mockLocalizedField.mockReturnValueOnce('')
    vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'en' } }))
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.catName({ name_es: 'Camión', name_en: 'Truck', name: null })).toBe('Truck')
  })

  it('falls back to name_es', () => {
    mockLocalizedField.mockReturnValueOnce('')
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    expect(c.catName({ name_es: 'Camión', name_en: null, name: null })).toBe('Camión')
  })
})

// ─── handleSubmit ────────────────────────────────────────────────────────────

describe('handleSubmit', () => {
  function fillValidForm(c: ReturnType<typeof useAdvertiseModal>) {
    c.formData.value = {
      brand: 'Volvo', model: 'FH', year: 2020, kilometers: 50000,
      price: 50000, location: 'Madrid', description: 'Test truck',
      contactName: 'Juan', contactEmail: 'test@example.com',
      contactPhone: '+34600000000', contactPreference: 'email', termsAccepted: true,
    }
    c.photos.value = Array.from({ length: 3 }, (_, i) => new File([], `p${i}.jpg`))
    c.photoPreviews.value = ['blob:1', 'blob:2', 'blob:3']
    c.techSheet.value = new File([], 'sheet.pdf')
  }

  it('submits valid form successfully', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    fillValidForm(c)
    await c.handleSubmit()
    expect(c.isSuccess.value).toBe(true)
    expect(c.isSubmitting.value).toBe(false)
    expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledWith(
      '/api/advertisements',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('resets form after success', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    fillValidForm(c)
    await c.handleSubmit()
    expect(c.formData.value.brand).toBe('')
    expect(c.photos.value).toHaveLength(0)
  })

  it('handles fetch error', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network')))
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    fillValidForm(c)
    await c.handleSubmit()
    expect(c.isSuccess.value).toBe(false)
    expect(c.isSubmitting.value).toBe(false)
  })

  it('validates year required', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    c.formData.value.brand = 'Volvo'
    c.formData.value.model = 'FH'
    await c.handleSubmit()
    expect(c.validationErrors.value.year).toBeTruthy()
  })

  it('validates terms required', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    fillValidForm(c)
    c.formData.value.termsAccepted = false
    await c.handleSubmit()
    expect(c.validationErrors.value.termsAccepted).toBeTruthy()
  })

  it('validates photos minimum', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    fillValidForm(c)
    c.photos.value = [new File([], 'a.jpg')]
    await c.handleSubmit()
    expect(c.validationErrors.value.photos).toBeTruthy()
  })

  it('validates techSheet required', async () => {
    const c = useAdvertiseModal(() => mockIsOpen, mockOnClose, mockOnOpenAuth)
    fillValidForm(c)
    c.techSheet.value = null
    await c.handleSubmit()
    expect(c.validationErrors.value.techSheet).toBeTruthy()
  })
})
