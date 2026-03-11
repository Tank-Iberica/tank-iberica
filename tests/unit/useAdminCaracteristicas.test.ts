import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminCaracteristicas } from '../../app/composables/admin/useAdminCaracteristicas'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  mockFetchFilters,
  mockCreateFilter,
  mockUpdateFilter,
  mockDeleteFilter,
  mockMoveUp,
  mockMoveDown,
  mockGetAvailableFilters,
  filtersRef,
} = vi.hoisted(() => ({
  mockFetchFilters: vi.fn().mockResolvedValue(undefined),
  mockCreateFilter: vi.fn().mockResolvedValue('new-id'),
  mockUpdateFilter: vi.fn().mockResolvedValue(true),
  mockDeleteFilter: vi.fn().mockResolvedValue(true),
  mockMoveUp: vi.fn().mockResolvedValue(undefined),
  mockMoveDown: vi.fn().mockResolvedValue(undefined),
  mockGetAvailableFilters: vi.fn().mockReturnValue([]),
  filtersRef: { value: [] as unknown[] },
}))

// ─── Mock useAdminFilters ─────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminFilters', () => ({
  FILTER_TYPES: [
    { value: 'caja', label: 'Caja (texto libre)', description: '' },
    { value: 'tick', label: 'Tick (sí/no)', description: '' },
    { value: 'desplegable', label: 'Desplegable', description: '' },
    { value: 'desplegable_tick', label: 'Desplegable con ticks', description: '' },
    { value: 'slider', label: 'Slider (rango)', description: '' },
    { value: 'calc', label: 'Calc (+/-)', description: '' },
  ],
  FILTER_STATUSES: [
    { value: 'published', label: 'Publicado', description: '' },
    { value: 'draft', label: 'Oculto', description: '' },
    { value: 'archived', label: 'Inactivo', description: '' },
  ],
  getFilterTypeOptions: () => [
    { value: 'caja', label: 'Caja (texto libre)' },
    { value: 'tick', label: 'Tick (sí/no)' },
    { value: 'desplegable', label: 'Desplegable' },
    { value: 'desplegable_tick', label: 'Desplegable con ticks' },
    { value: 'slider', label: 'Slider (rango)' },
    { value: 'calc', label: 'Calc (+/-)' },
  ],
  getFilterStatusOptions: () => [
    { value: 'published', label: 'Publicado' },
    { value: 'draft', label: 'Oculto' },
    { value: 'archived', label: 'Inactivo' },
  ],
  useAdminFilters: () => ({
    filters: filtersRef,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    fetchFilters: mockFetchFilters,
    createFilter: mockCreateFilter,
    updateFilter: mockUpdateFilter,
    deleteFilter: mockDeleteFilter,
    moveUp: mockMoveUp,
    moveDown: mockMoveDown,
    getAvailableFilters: mockGetAvailableFilters,
  }),
}))

// ─── Mock useToast ────────────────────────────────────────────────────────

const { mockToastWarning } = vi.hoisted(() => ({
  mockToastWarning: vi.fn(),
}))

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: mockToastWarning,
    info: vi.fn(),
  }),
}))

// useAdminCaracteristicas uses useToast as Nuxt auto-import (no explicit import),
// so vi.mock alone isn't enough — also stub the global.
vi.stubGlobal('useToast', () => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: mockToastWarning,
  info: vi.fn(),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeFilter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f-1',
    name: 'kilometros',
    type: 'caja' as const,
    label_es: 'Kilómetros',
    label_en: 'Kilometres',
    unit: 'km',
    status: 'published' as const,
    is_extra: false,
    is_hidden: false,
    position: 1,
    options: null,
    created_at: '2026-01-01',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  filtersRef.value = []
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('showModal starts as false', () => {
    const c = useAdminCaracteristicas()
    expect(c.showModal.value).toBe(false)
  })

  it('editingId starts as null', () => {
    const c = useAdminCaracteristicas()
    expect(c.editingId.value).toBeNull()
  })

  it('formData.name starts as empty string', () => {
    const c = useAdminCaracteristicas()
    expect(c.formData.value.name).toBe('')
  })

  it('formData.type starts as "caja"', () => {
    const c = useAdminCaracteristicas()
    expect(c.formData.value.type).toBe('caja')
  })

  it('choiceInput starts as empty string', () => {
    const c = useAdminCaracteristicas()
    expect(c.choiceInput.value).toBe('')
  })

  it('deleteModal starts closed', () => {
    const c = useAdminCaracteristicas()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.filter).toBeNull()
    expect(c.deleteModal.value.confirmText).toBe('')
  })

  it('canDelete starts as false', () => {
    const c = useAdminCaracteristicas()
    expect(c.canDelete.value).toBe(false)
  })
})

// ─── openNewModal ─────────────────────────────────────────────────────────

describe('openNewModal', () => {
  it('sets showModal to true', () => {
    const c = useAdminCaracteristicas()
    c.openNewModal()
    expect(c.showModal.value).toBe(true)
  })

  it('clears editingId', () => {
    const c = useAdminCaracteristicas()
    c.editingId.value = 'f-1'
    c.openNewModal()
    expect(c.editingId.value).toBeNull()
  })

  it('resets formData to empty', () => {
    const c = useAdminCaracteristicas()
    c.formData.value.name = 'Old name'
    c.openNewModal()
    expect(c.formData.value.name).toBe('')
  })

  it('clears choiceInput', () => {
    const c = useAdminCaracteristicas()
    c.choiceInput.value = 'diesel'
    c.openNewModal()
    expect(c.choiceInput.value).toBe('')
  })
})

// ─── openEditModal ────────────────────────────────────────────────────────

describe('openEditModal', () => {
  it('sets showModal to true', () => {
    const c = useAdminCaracteristicas()
    c.openEditModal(makeFilter() as never)
    expect(c.showModal.value).toBe(true)
  })

  it('sets editingId to filter.id', () => {
    const c = useAdminCaracteristicas()
    c.openEditModal(makeFilter({ id: 'f-42' }) as never)
    expect(c.editingId.value).toBe('f-42')
  })

  it('populates formData.name from filter', () => {
    const c = useAdminCaracteristicas()
    c.openEditModal(makeFilter({ name: 'potencia' }) as never)
    expect(c.formData.value.name).toBe('potencia')
  })

  it('populates formData.label_es from filter', () => {
    const c = useAdminCaracteristicas()
    c.openEditModal(makeFilter({ label_es: 'Potencia' }) as never)
    expect(c.formData.value.label_es).toBe('Potencia')
  })
})

// ─── closeModal ───────────────────────────────────────────────────────────

describe('closeModal', () => {
  it('sets showModal to false', () => {
    const c = useAdminCaracteristicas()
    c.openNewModal()
    c.closeModal()
    expect(c.showModal.value).toBe(false)
  })

  it('clears editingId', () => {
    const c = useAdminCaracteristicas()
    c.editingId.value = 'f-1'
    c.closeModal()
    expect(c.editingId.value).toBeNull()
  })
})

// ─── addChoice / removeChoice ─────────────────────────────────────────────

describe('addChoice', () => {
  it('adds trimmed value to choices', () => {
    const c = useAdminCaracteristicas()
    c.choiceInput.value = '  diesel  '
    c.addChoice()
    expect(c.formData.value.choices).toContain('diesel')
  })

  it('does not add empty value', () => {
    const c = useAdminCaracteristicas()
    c.choiceInput.value = '  '
    c.addChoice()
    expect(c.formData.value.choices).toHaveLength(0)
  })

  it('does not add duplicate value', () => {
    const c = useAdminCaracteristicas()
    c.formData.value.choices = ['diesel']
    c.choiceInput.value = 'diesel'
    c.addChoice()
    expect(c.formData.value.choices).toHaveLength(1)
  })

  it('clears choiceInput after adding', () => {
    const c = useAdminCaracteristicas()
    c.choiceInput.value = 'gasolina'
    c.addChoice()
    expect(c.choiceInput.value).toBe('')
  })
})

describe('removeChoice', () => {
  it('removes choice at given index', () => {
    const c = useAdminCaracteristicas()
    c.formData.value.choices = ['diesel', 'gasolina', 'electrico']
    c.removeChoice(1) // removes 'gasolina'
    expect(c.formData.value.choices).toEqual(['diesel', 'electrico'])
  })
})

// ─── toggleArrayItem ──────────────────────────────────────────────────────

describe('toggleArrayItem', () => {
  it('adds id to extra_filters when not present', () => {
    const c = useAdminCaracteristicas()
    c.toggleArrayItem('extra_filters', 'f-2')
    expect(c.formData.value.extra_filters).toContain('f-2')
  })

  it('removes id from extra_filters when already present', () => {
    const c = useAdminCaracteristicas()
    c.formData.value.extra_filters = ['f-2']
    c.toggleArrayItem('extra_filters', 'f-2')
    expect(c.formData.value.extra_filters).not.toContain('f-2')
  })

  it('adds id to hides when not present', () => {
    const c = useAdminCaracteristicas()
    c.toggleArrayItem('hides', 'f-3')
    expect(c.formData.value.hides).toContain('f-3')
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates name field', () => {
    const c = useAdminCaracteristicas()
    c.updateFormField('name', 'potencia')
    expect(c.formData.value.name).toBe('potencia')
  })

  it('updates is_extra (boolean)', () => {
    const c = useAdminCaracteristicas()
    c.updateFormField('is_extra', true)
    expect(c.formData.value.is_extra).toBe(true)
  })

  it('updates type', () => {
    const c = useAdminCaracteristicas()
    c.updateFormField('type', 'tick')
    expect(c.formData.value.type).toBe('tick')
  })

  it('updates step (number)', () => {
    const c = useAdminCaracteristicas()
    c.updateFormField('step', 5)
    expect(c.formData.value.step).toBe(5)
  })
})

// ─── Delete modal ─────────────────────────────────────────────────────────

describe('confirmDeleteFilter', () => {
  it('opens deleteModal with the filter', () => {
    const c = useAdminCaracteristicas()
    c.confirmDeleteFilter(makeFilter({ id: 'f-1' }) as never)
    expect(c.deleteModal.value.show).toBe(true)
    expect(c.deleteModal.value.filter?.id).toBe('f-1')
    expect(c.deleteModal.value.confirmText).toBe('')
  })
})

describe('closeDeleteModal', () => {
  it('resets deleteModal to closed state', () => {
    const c = useAdminCaracteristicas()
    c.confirmDeleteFilter(makeFilter() as never)
    c.closeDeleteModal()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.filter).toBeNull()
  })
})

describe('updateDeleteConfirmText', () => {
  it('sets confirmText on deleteModal', () => {
    const c = useAdminCaracteristicas()
    c.updateDeleteConfirmText('borrar')
    expect(c.deleteModal.value.confirmText).toBe('borrar')
  })
})

describe('executeDelete', () => {
  it('does nothing when filter is null', async () => {
    const c = useAdminCaracteristicas()
    await c.executeDelete()
    expect(mockDeleteFilter).not.toHaveBeenCalled()
  })

  it('does nothing when canDelete is false (confirmText != borrar)', async () => {
    const c = useAdminCaracteristicas()
    c.confirmDeleteFilter(makeFilter() as never)
    // canDelete = false (computed one-shot, confirmText starts '')
    await c.executeDelete()
    expect(mockDeleteFilter).not.toHaveBeenCalled()
  })
})

// ─── saveFilter ───────────────────────────────────────────────────────────

describe('saveFilter', () => {
  it('calls toast.warning when name is empty', async () => {
    const c = useAdminCaracteristicas()
    c.formData.value.name = ''
    await c.saveFilter()
    expect(mockToastWarning).toHaveBeenCalled()
    expect(mockCreateFilter).not.toHaveBeenCalled()
  })

  it('calls createFilter when editingId is null', async () => {
    mockCreateFilter.mockResolvedValueOnce('new-id')
    const c = useAdminCaracteristicas()
    c.formData.value.name = 'potencia'
    c.formData.value.type = 'caja'
    await c.saveFilter()
    expect(mockCreateFilter).toHaveBeenCalled()
  })

  it('calls updateFilter when editingId is set', async () => {
    mockUpdateFilter.mockResolvedValueOnce(true)
    const c = useAdminCaracteristicas()
    c.editingId.value = 'f-1'
    c.formData.value.name = 'potencia'
    c.formData.value.type = 'caja'
    await c.saveFilter()
    expect(mockUpdateFilter).toHaveBeenCalledWith('f-1', expect.objectContaining({ name: 'potencia' }))
  })

  it('auto-sets label_es to name when label_es is empty', async () => {
    const c = useAdminCaracteristicas()
    c.formData.value.name = 'potencia'
    c.formData.value.label_es = ''
    c.formData.value.type = 'caja'
    await c.saveFilter()
    expect(mockCreateFilter).toHaveBeenCalledWith(
      expect.objectContaining({ label_es: 'potencia' }),
    )
  })
})

// ─── Display helpers ──────────────────────────────────────────────────────

describe('getTypeLabel', () => {
  it('returns label for known type', () => {
    const c = useAdminCaracteristicas()
    expect(c.getTypeLabel('caja')).toBe('Caja (texto libre)')
  })

  it('falls back to type string for unknown type', () => {
    const c = useAdminCaracteristicas()
    expect(c.getTypeLabel('unknown' as never)).toBe('unknown')
  })
})

describe('getStatusLabel', () => {
  it('returns label for "published"', () => {
    const c = useAdminCaracteristicas()
    expect(c.getStatusLabel('published')).toBe('Publicado')
  })

  it('returns label for "archived"', () => {
    const c = useAdminCaracteristicas()
    expect(c.getStatusLabel('archived')).toBe('Inactivo')
  })
})

describe('getStatusClass', () => {
  it('returns "status-published" for published', () => {
    const c = useAdminCaracteristicas()
    expect(c.getStatusClass('published')).toBe('status-published')
  })

  it('returns "status-draft" for draft', () => {
    const c = useAdminCaracteristicas()
    expect(c.getStatusClass('draft')).toBe('status-draft')
  })

  it('returns "status-archived" for archived', () => {
    const c = useAdminCaracteristicas()
    expect(c.getStatusClass('archived')).toBe('status-archived')
  })

  it('returns empty string for unknown status', () => {
    const c = useAdminCaracteristicas()
    expect(c.getStatusClass('unknown' as never)).toBe('')
  })
})

describe('getExtraFiltersDisplay', () => {
  it('returns "-" when no extra_filters', () => {
    const c = useAdminCaracteristicas()
    const filter = makeFilter({ options: null })
    expect(c.getExtraFiltersDisplay(filter as never)).toBe('-')
  })

  it('returns label_es of referenced filter when found', () => {
    const c = useAdminCaracteristicas()
    filtersRef.value = [makeFilter({ id: 'f-2', name: 'año', label_es: 'Año' })]
    const filter = makeFilter({ options: { extra_filters: ['f-2'] } })
    expect(c.getExtraFiltersDisplay(filter as never)).toBe('Año')
  })

  it('falls back to the raw id when filter not found', () => {
    const c = useAdminCaracteristicas()
    filtersRef.value = []
    const filter = makeFilter({ options: { extra_filters: ['unknown-id'] } })
    expect(c.getExtraFiltersDisplay(filter as never)).toBe('unknown-id')
  })
})

describe('getHidesDisplay', () => {
  it('returns "-" when no hides', () => {
    const c = useAdminCaracteristicas()
    const filter = makeFilter({ options: null })
    expect(c.getHidesDisplay(filter as never)).toBe('-')
  })

  it('returns label_es of referenced filter when found', () => {
    const c = useAdminCaracteristicas()
    filtersRef.value = [makeFilter({ id: 'f-3', name: 'traccion', label_es: 'Tracción' })]
    const filter = makeFilter({ options: { hides: ['f-3'] } })
    expect(c.getHidesDisplay(filter as never)).toBe('Tracción')
  })
})
