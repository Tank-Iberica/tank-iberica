import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminSolicitantes,
  formatDate,
  formatPriceRange,
  formatYearRange,
  getStatusConfig,
} from '../../app/composables/admin/useAdminSolicitantes'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  demandsRef,
  mockFetchDemands,
  mockUpdateStatus,
  mockUpdateNotes,
  mockDeleteDemand,
} = vi.hoisted(() => ({
  demandsRef: { value: [] as unknown[] },
  mockFetchDemands: vi.fn().mockResolvedValue(undefined),
  mockUpdateStatus: vi.fn().mockResolvedValue(true),
  mockUpdateNotes: vi.fn().mockResolvedValue(true),
  mockDeleteDemand: vi.fn().mockResolvedValue(true),
}))

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminDemands', () => ({
  useAdminDemands: () => ({
    demands: demandsRef,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    total: { value: 0 },
    fetchDemands: mockFetchDemands,
    updateStatus: mockUpdateStatus,
    updateNotes: mockUpdateNotes,
    deleteDemand: mockDeleteDemand,
  }),
  DEMAND_STATUSES: [
    { value: 'pending', label: 'Pendiente', color: '#ef4444' },
    { value: 'contacted', label: 'Contactado', color: '#f59e0b' },
    { value: 'matched', label: 'Vinculado', color: '#10b981' },
    { value: 'archived', label: 'Archivado', color: '#6b7280' },
  ],
}))

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (val: number) => `${val.toLocaleString('es-ES')} €`,
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (obj: { name_es?: string; name_en?: string | null } | null | undefined, _locale: string) =>
    obj?.name_es ?? obj?.name_en ?? '',
}))

vi.stubGlobal('useI18n', () => ({
  locale: { value: 'es' },
  t: (key: string) => key,
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  demandsRef.value = []
})

// ─── Pure exported functions ──────────────────────────────────────────────

describe('getStatusConfig', () => {
  it('returns config for "pending"', () => {
    const result = getStatusConfig('pending')
    expect(result.value).toBe('pending')
    expect(result.label).toBeTruthy()
    expect(result.color).toBeTruthy()
  })

  it('returns config for "matched"', () => {
    const result = getStatusConfig('matched')
    expect(result.value).toBe('matched')
  })

  it('returns first status when not found', () => {
    const result = getStatusConfig('unknown' as never)
    expect(result).toBeDefined()
  })
})

describe('formatDate (exported)', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    const result = formatDate('2026-03-15')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/03|3/)
    expect(result).toMatch(/2026/)
  })

  it('returns a non-empty string', () => {
    expect(typeof formatDate('2025-01-01')).toBe('string')
    expect(formatDate('2025-01-01').length).toBeGreaterThan(0)
  })
})

describe('formatPriceRange', () => {
  it('returns "-" when both null', () => {
    expect(formatPriceRange(null, null)).toBe('-')
  })

  it('returns range when both provided', () => {
    const result = formatPriceRange(10000, 50000)
    expect(result).toContain('-')
    expect(result).not.toBe('-')
  })

  it('returns "Desde X" when only min', () => {
    const result = formatPriceRange(20000, null)
    expect(result).toContain('Desde')
  })

  it('returns "Hasta X" when only max', () => {
    const result = formatPriceRange(null, 80000)
    expect(result).toContain('Hasta')
  })
})

describe('formatYearRange', () => {
  it('returns "-" when both null', () => {
    expect(formatYearRange(null, null)).toBe('-')
  })

  it('returns "YEAR - YEAR" when both provided', () => {
    const result = formatYearRange(2015, 2022)
    expect(result).toContain('2015')
    expect(result).toContain('2022')
    expect(result).toContain('-')
  })

  it('returns "Desde YEAR" when only min', () => {
    expect(formatYearRange(2018, null)).toContain('Desde')
  })

  it('returns "Hasta YEAR" when only max', () => {
    expect(formatYearRange(null, 2023)).toContain('Hasta')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('filters.status starts as null', () => {
    const c = useAdminSolicitantes()
    expect(c.filters.value.status).toBeNull()
  })

  it('filters.search starts as empty string', () => {
    const c = useAdminSolicitantes()
    expect(c.filters.value.search).toBe('')
  })

  it('deleteModal.show starts as false', () => {
    const c = useAdminSolicitantes()
    expect(c.deleteModal.value.show).toBe(false)
  })

  it('deleteModal.demand starts as null', () => {
    const c = useAdminSolicitantes()
    expect(c.deleteModal.value.demand).toBeNull()
  })

  it('deleteModal.confirmText starts as empty', () => {
    const c = useAdminSolicitantes()
    expect(c.deleteModal.value.confirmText).toBe('')
  })

  it('detailModal.show starts as false', () => {
    const c = useAdminSolicitantes()
    expect(c.detailModal.value.show).toBe(false)
  })

  it('detailModal.demand starts as null', () => {
    const c = useAdminSolicitantes()
    expect(c.detailModal.value.demand).toBeNull()
  })

  it('canDelete starts as false (empty confirmText !== "borrar")', () => {
    const c = useAdminSolicitantes()
    expect(c.canDelete.value).toBe(false)
  })
})

// ─── openDetail / closeDetail ─────────────────────────────────────────────

describe('openDetail', () => {
  it('sets detailModal.show to true', () => {
    const c = useAdminSolicitantes()
    c.openDetail({ id: 'd-1', admin_notes: 'some notes' } as never)
    expect(c.detailModal.value.show).toBe(true)
  })

  it('sets detailModal.demand to the demand', () => {
    const c = useAdminSolicitantes()
    c.openDetail({ id: 'd-1', admin_notes: null } as never)
    expect(c.detailModal.value.demand).toMatchObject({ id: 'd-1' })
  })

  it('sets detailModal.notes to admin_notes', () => {
    const c = useAdminSolicitantes()
    c.openDetail({ id: 'd-1', admin_notes: 'my notes' } as never)
    expect(c.detailModal.value.notes).toBe('my notes')
  })

  it('sets detailModal.notes to empty when admin_notes is null', () => {
    const c = useAdminSolicitantes()
    c.openDetail({ id: 'd-1', admin_notes: null } as never)
    expect(c.detailModal.value.notes).toBe('')
  })
})

describe('closeDetail', () => {
  it('resets detailModal', () => {
    const c = useAdminSolicitantes()
    c.openDetail({ id: 'd-1', admin_notes: 'test' } as never)
    c.closeDetail()
    expect(c.detailModal.value.show).toBe(false)
    expect(c.detailModal.value.demand).toBeNull()
    expect(c.detailModal.value.notes).toBe('')
  })
})

// ─── confirmDelete / closeDeleteModal ─────────────────────────────────────

describe('confirmDelete', () => {
  it('sets deleteModal.show to true', () => {
    const c = useAdminSolicitantes()
    c.confirmDelete({ id: 'd-1' } as never)
    expect(c.deleteModal.value.show).toBe(true)
  })

  it('sets deleteModal.demand to the demand', () => {
    const c = useAdminSolicitantes()
    c.confirmDelete({ id: 'd-42' } as never)
    expect(c.deleteModal.value.demand).toMatchObject({ id: 'd-42' })
  })

  it('resets confirmText to empty', () => {
    const c = useAdminSolicitantes()
    c.deleteModal.value.confirmText = 'borrar'
    c.confirmDelete({ id: 'd-1' } as never)
    expect(c.deleteModal.value.confirmText).toBe('')
  })
})

describe('closeDeleteModal', () => {
  it('resets deleteModal', () => {
    const c = useAdminSolicitantes()
    c.confirmDelete({ id: 'd-1' } as never)
    c.closeDeleteModal()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.demand).toBeNull()
    expect(c.deleteModal.value.confirmText).toBe('')
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does nothing when demand is null', async () => {
    const c = useAdminSolicitantes()
    await c.executeDelete()
    expect(mockDeleteDemand).not.toHaveBeenCalled()
  })

  it('does nothing when canDelete is false (one-shot computed = always false)', async () => {
    const c = useAdminSolicitantes()
    c.deleteModal.value.demand = { id: 'd-1' } as never
    await c.executeDelete()
    expect(mockDeleteDemand).not.toHaveBeenCalled()
  })
})

// ─── handleStatusChange ───────────────────────────────────────────────────

describe('handleStatusChange', () => {
  it('calls updateStatus with demand id and new status', async () => {
    const c = useAdminSolicitantes()
    const demand = { id: 'd-1', status: 'pending' }
    await c.handleStatusChange(demand as never, 'contacted')
    expect(mockUpdateStatus).toHaveBeenCalledWith('d-1', 'contacted')
  })
})

// ─── saveNotes ────────────────────────────────────────────────────────────

describe('saveNotes', () => {
  it('does nothing when detailModal.demand is null', async () => {
    const c = useAdminSolicitantes()
    await c.saveNotes()
    expect(mockUpdateNotes).not.toHaveBeenCalled()
  })

  it('calls updateNotes with demand id and notes', async () => {
    mockUpdateNotes.mockResolvedValueOnce(true)
    const c = useAdminSolicitantes()
    c.detailModal.value.demand = { id: 'd-1' } as never
    c.detailModal.value.notes = 'my updated notes'
    await c.saveNotes()
    expect(mockUpdateNotes).toHaveBeenCalledWith('d-1', 'my updated notes')
  })

  it('closes detail modal on success', async () => {
    mockUpdateNotes.mockResolvedValueOnce(true)
    const c = useAdminSolicitantes()
    c.detailModal.value.demand = { id: 'd-1' } as never
    c.detailModal.value.show = true
    await c.saveNotes()
    expect(c.detailModal.value.show).toBe(false)
  })

  it('does not close modal on failure', async () => {
    mockUpdateNotes.mockResolvedValueOnce(false)
    const c = useAdminSolicitantes()
    c.detailModal.value.demand = { id: 'd-1' } as never
    c.detailModal.value.show = true
    await c.saveNotes()
    expect(c.detailModal.value.show).toBe(true)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchDemands', async () => {
    const c = useAdminSolicitantes()
    await c.init()
    expect(mockFetchDemands).toHaveBeenCalled()
  })
})
