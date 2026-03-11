import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminSubcategoriasPage,
  VEHICLE_CATEGORIES,
} from '../../app/composables/admin/useAdminSubcategoriasPage'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  mockFetchSubcategories,
  mockCreateSubcategory,
  mockUpdateSubcategory,
  mockDeleteSubcategory,
  mockToggleStatus,
  mockMoveUp,
  mockMoveDown,
  mockClearError,
  subcategoriesRef,
  mockFetchFilters,
  filtersRef,
  mockToastWarning,
} = vi.hoisted(() => ({
  mockFetchSubcategories: vi.fn().mockResolvedValue(undefined),
  mockCreateSubcategory: vi.fn().mockResolvedValue('new-id'),
  mockUpdateSubcategory: vi.fn().mockResolvedValue(true),
  mockDeleteSubcategory: vi.fn().mockResolvedValue(true),
  mockToggleStatus: vi.fn().mockResolvedValue(undefined),
  mockMoveUp: vi.fn().mockResolvedValue(undefined),
  mockMoveDown: vi.fn().mockResolvedValue(undefined),
  mockClearError: vi.fn(),
  subcategoriesRef: { value: [] as unknown[] },
  mockFetchFilters: vi.fn().mockResolvedValue(undefined),
  filtersRef: { value: [] as unknown[] },
  mockToastWarning: vi.fn(),
}))

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminSubcategories', () => ({
  useAdminSubcategories: () => ({
    subcategories: subcategoriesRef,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    fetchSubcategories: mockFetchSubcategories,
    createSubcategory: mockCreateSubcategory,
    updateSubcategory: mockUpdateSubcategory,
    deleteSubcategory: mockDeleteSubcategory,
    toggleStatus: mockToggleStatus,
    moveUp: mockMoveUp,
    moveDown: mockMoveDown,
    clearError: mockClearError,
  }),
}))

vi.mock('~/composables/admin/useAdminFilters', () => ({
  useAdminFilters: () => ({
    filters: filtersRef,
    loading: { value: false },
    fetchFilters: mockFetchFilters,
  }),
}))

vi.stubGlobal('useToast', () => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: mockToastWarning,
  info: vi.fn(),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  subcategoriesRef.value = []
  filtersRef.value = []
})

// ─── VEHICLE_CATEGORIES constant ──────────────────────────────────────────

describe('VEHICLE_CATEGORIES', () => {
  it('has 3 entries', () => {
    expect(VEHICLE_CATEGORIES).toHaveLength(3)
  })

  it('includes alquiler, venta, terceros', () => {
    const ids = VEHICLE_CATEGORIES.map((c) => c.id)
    expect(ids).toContain('alquiler')
    expect(ids).toContain('venta')
    expect(ids).toContain('terceros')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('showModal starts as false', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.showModal.value).toBe(false)
  })

  it('editingId starts as null', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.editingId.value).toBeNull()
  })

  it('formData.name_es starts as empty', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.formData.value.name_es).toBe('')
  })

  it('deleteModal.show starts as false', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.deleteModal.value.show).toBe(false)
  })

  it('canDelete starts as false', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.canDelete.value).toBe(false)
  })
})

// ─── getCategoryLabels ────────────────────────────────────────────────────

describe('getCategoryLabels', () => {
  it('returns "-" for empty array', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.getCategoryLabels([])).toBe('-')
  })

  it('returns "-" for undefined', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.getCategoryLabels(undefined)).toBe('-')
  })

  it('returns label for known category id', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.getCategoryLabels(['alquiler'])).toBe('Alquiler')
  })

  it('returns comma-separated labels for multiple ids', () => {
    const c = useAdminSubcategoriasPage()
    const result = c.getCategoryLabels(['alquiler', 'venta'])
    expect(result).toContain('Alquiler')
    expect(result).toContain('Venta')
    expect(result).toContain(',')
  })

  it('returns "-" when all ids are unknown', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.getCategoryLabels(['unknown-cat'])).toBe('-')
  })
})

// ─── getFilterNames ───────────────────────────────────────────────────────

describe('getFilterNames', () => {
  it('returns "-" for empty array', () => {
    const c = useAdminSubcategoriasPage()
    expect(c.getFilterNames([])).toBe('-')
  })

  it('returns label_es when filter found by id', () => {
    filtersRef.value = [
      { id: 'f-1', name: 'km', label_es: 'Kilómetros', status: 'published' },
    ]
    const c = useAdminSubcategoriasPage()
    expect(c.getFilterNames(['f-1'])).toBe('Kilómetros')
  })

  it('falls back to name when label_es is empty', () => {
    filtersRef.value = [{ id: 'f-2', name: 'precio', label_es: null, status: 'published' }]
    const c = useAdminSubcategoriasPage()
    expect(c.getFilterNames(['f-2'])).toBe('precio')
  })

  it('returns "-" when filter not found', () => {
    filtersRef.value = []
    const c = useAdminSubcategoriasPage()
    expect(c.getFilterNames(['unknown-id'])).toBe('-')
  })
})

// ─── openNewModal ─────────────────────────────────────────────────────────

describe('openNewModal', () => {
  it('sets showModal to true', () => {
    const c = useAdminSubcategoriasPage()
    c.openNewModal()
    expect(c.showModal.value).toBe(true)
  })

  it('sets editingId to null', () => {
    const c = useAdminSubcategoriasPage()
    c.editingId.value = 'old-id'
    c.openNewModal()
    expect(c.editingId.value).toBeNull()
  })

  it('resets formData.name_es to empty', () => {
    const c = useAdminSubcategoriasPage()
    c.formData.value.name_es = 'Old'
    c.openNewModal()
    expect(c.formData.value.name_es).toBe('')
  })

  it('sets applicable_categories to all 3 categories', () => {
    const c = useAdminSubcategoriasPage()
    c.openNewModal()
    expect(c.formData.value.applicable_categories).toContain('alquiler')
    expect(c.formData.value.applicable_categories).toContain('venta')
    expect(c.formData.value.applicable_categories).toContain('terceros')
  })

  it('calls clearError', () => {
    const c = useAdminSubcategoriasPage()
    c.openNewModal()
    expect(mockClearError).toHaveBeenCalled()
  })
})

// ─── openEditModal ────────────────────────────────────────────────────────

describe('openEditModal', () => {
  function makeSub(overrides: Record<string, unknown> = {}) {
    return {
      id: 's-1',
      name_es: 'Tractores',
      name_en: 'Tractors',
      slug: 'tractores',
      applicable_categories: ['venta'],
      applicable_filters: ['f-1'],
      status: 'published' as const,
      sort_order: 1,
      ...overrides,
    }
  }

  it('sets showModal to true', () => {
    const c = useAdminSubcategoriasPage()
    c.openEditModal(makeSub() as never)
    expect(c.showModal.value).toBe(true)
  })

  it('sets editingId to subcategory id', () => {
    const c = useAdminSubcategoriasPage()
    c.openEditModal(makeSub({ id: 's-99' }) as never)
    expect(c.editingId.value).toBe('s-99')
  })

  it('populates formData.name_es from subcategory', () => {
    const c = useAdminSubcategoriasPage()
    c.openEditModal(makeSub({ name_es: 'Camiones' }) as never)
    expect(c.formData.value.name_es).toBe('Camiones')
  })

  it('populates formData.applicable_categories', () => {
    const c = useAdminSubcategoriasPage()
    c.openEditModal(makeSub({ applicable_categories: ['alquiler'] }) as never)
    expect(c.formData.value.applicable_categories).toEqual(['alquiler'])
  })
})

// ─── closeModal ───────────────────────────────────────────────────────────

describe('closeModal', () => {
  it('sets showModal to false', () => {
    const c = useAdminSubcategoriasPage()
    c.openNewModal()
    c.closeModal()
    expect(c.showModal.value).toBe(false)
  })

  it('clears editingId', () => {
    const c = useAdminSubcategoriasPage()
    c.editingId.value = 's-1'
    c.closeModal()
    expect(c.editingId.value).toBeNull()
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates name_es', () => {
    const c = useAdminSubcategoriasPage()
    c.updateFormField('name_es', 'Semirremolques')
    expect(c.formData.value.name_es).toBe('Semirremolques')
  })

  it('updates slug', () => {
    const c = useAdminSubcategoriasPage()
    c.updateFormField('slug', 'semirremolques')
    expect(c.formData.value.slug).toBe('semirremolques')
  })

  it('updates sort_order (number)', () => {
    const c = useAdminSubcategoriasPage()
    c.updateFormField('sort_order', 5)
    expect(c.formData.value.sort_order).toBe(5)
  })
})

// ─── toggleFormArrayItem ──────────────────────────────────────────────────

describe('toggleFormArrayItem', () => {
  it('adds item when not in array', () => {
    const c = useAdminSubcategoriasPage()
    c.openNewModal()
    // Remove 'venta' first
    c.formData.value.applicable_categories = []
    c.toggleFormArrayItem('applicable_categories', 'venta')
    expect(c.formData.value.applicable_categories).toContain('venta')
  })

  it('removes item when already in array', () => {
    const c = useAdminSubcategoriasPage()
    c.formData.value.applicable_categories = ['alquiler']
    c.toggleFormArrayItem('applicable_categories', 'alquiler')
    expect(c.formData.value.applicable_categories).not.toContain('alquiler')
  })
})

// ─── Delete modal ─────────────────────────────────────────────────────────

describe('confirmDelete', () => {
  it('opens deleteModal with subcategory', () => {
    const c = useAdminSubcategoriasPage()
    c.confirmDelete({ id: 's-7', name_es: 'Test' } as never)
    expect(c.deleteModal.value.show).toBe(true)
    expect(c.deleteModal.value.subcategory?.id).toBe('s-7')
    expect(c.deleteModal.value.confirmText).toBe('')
  })
})

describe('closeDeleteModal', () => {
  it('resets deleteModal', () => {
    const c = useAdminSubcategoriasPage()
    c.confirmDelete({ id: 's-1' } as never)
    c.closeDeleteModal()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.subcategory).toBeNull()
  })
})

describe('updateDeleteConfirmText', () => {
  it('updates confirmText', () => {
    const c = useAdminSubcategoriasPage()
    c.updateDeleteConfirmText('borrar')
    expect(c.deleteModal.value.confirmText).toBe('borrar')
  })
})

describe('executeDelete', () => {
  it('does nothing when subcategory is null', async () => {
    const c = useAdminSubcategoriasPage()
    await c.executeDelete()
    expect(mockDeleteSubcategory).not.toHaveBeenCalled()
  })

  it('does nothing when canDelete is false (one-shot computed = false initially)', async () => {
    const c = useAdminSubcategoriasPage()
    c.confirmDelete({ id: 's-1' } as never)
    await c.executeDelete()
    expect(mockDeleteSubcategory).not.toHaveBeenCalled()
  })
})

// ─── saveSubcategory (name validation) ───────────────────────────────────

describe('saveSubcategory', () => {
  it('calls toast.warning when name_es is empty', async () => {
    const c = useAdminSubcategoriasPage()
    c.formData.value.name_es = '   '
    await c.saveSubcategory()
    expect(mockToastWarning).toHaveBeenCalled()
  })

  it('calls createSubcategory when editingId is null and name is valid', async () => {
    mockCreateSubcategory.mockResolvedValueOnce('new-id')
    const c = useAdminSubcategoriasPage()
    c.formData.value.name_es = 'Camiones'
    c.formData.value.slug = 'camiones'
    await c.saveSubcategory()
    expect(mockCreateSubcategory).toHaveBeenCalled()
  })

  it('auto-generates slug when empty', async () => {
    mockCreateSubcategory.mockResolvedValueOnce('new-id')
    const c = useAdminSubcategoriasPage()
    c.formData.value.name_es = 'Semirremolques'
    c.formData.value.slug = ''
    await c.saveSubcategory()
    // Slug should be auto-generated from name_es
    expect(c.formData.value.slug).toBe('semirremolques')
  })

  it('calls updateSubcategory when editingId is set', async () => {
    mockUpdateSubcategory.mockResolvedValueOnce(true)
    const c = useAdminSubcategoriasPage()
    c.editingId.value = 's-1'
    c.formData.value.name_es = 'Updated'
    c.formData.value.slug = 'updated'
    await c.saveSubcategory()
    expect(mockUpdateSubcategory).toHaveBeenCalledWith('s-1', expect.objectContaining({ name_es: 'Updated' }))
  })
})

// ─── handleMoveUp / handleMoveDown ────────────────────────────────────────

describe('handleMoveUp', () => {
  it('calls moveUp with the id', async () => {
    const c = useAdminSubcategoriasPage()
    await c.handleMoveUp('s-1')
    expect(mockMoveUp).toHaveBeenCalledWith('s-1')
  })
})

describe('handleMoveDown', () => {
  it('calls moveDown with the id', async () => {
    const c = useAdminSubcategoriasPage()
    await c.handleMoveDown('s-1')
    expect(mockMoveDown).toHaveBeenCalledWith('s-1')
  })
})
