import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminAnunciantes } from '../../app/composables/admin/useAdminAnunciantes'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  mockFetchAdvertisements,
  mockUpdateStatus,
  mockUpdateNotes,
  mockDeleteAdvertisement,
  advertisementsRef,
} = vi.hoisted(() => ({
  mockFetchAdvertisements: vi.fn().mockResolvedValue(undefined),
  mockUpdateStatus: vi.fn().mockResolvedValue(true),
  mockUpdateNotes: vi.fn().mockResolvedValue(true),
  mockDeleteAdvertisement: vi.fn().mockResolvedValue(true),
  advertisementsRef: { value: [] as unknown[] },
}))

// ─── Mock useAdminAdvertisements ──────────────────────────────────────────

vi.mock('~/composables/admin/useAdminAdvertisements', () => ({
  ADVERTISEMENT_STATUSES: [
    { value: 'pending', label: 'Pendiente', color: '#ef4444' },
    { value: 'contacted', label: 'Contactado', color: '#f59e0b' },
    { value: 'matched', label: 'Vinculado', color: '#10b981' },
    { value: 'archived', label: 'Archivado', color: '#6b7280' },
  ],
  useAdminAdvertisements: () => ({
    advertisements: advertisementsRef,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    total: { value: 0 },
    fetchAdvertisements: mockFetchAdvertisements,
    updateStatus: mockUpdateStatus,
    updateNotes: mockUpdateNotes,
    deleteAdvertisement: mockDeleteAdvertisement,
  }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeAd(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ad-1',
    contact_name: 'Juan García',
    status: 'pending' as const,
    admin_notes: null,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  advertisementsRef.value = []
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('filters.status starts as null', () => {
    const c = useAdminAnunciantes()
    expect(c.filters.value.status).toBeNull()
  })

  it('filters.search starts as empty string', () => {
    const c = useAdminAnunciantes()
    expect(c.filters.value.search).toBe('')
  })

  it('deleteModal.show starts as false', () => {
    const c = useAdminAnunciantes()
    expect(c.deleteModal.value.show).toBe(false)
  })

  it('deleteModal.advertisement starts as null', () => {
    const c = useAdminAnunciantes()
    expect(c.deleteModal.value.advertisement).toBeNull()
  })

  it('detailModal.show starts as false', () => {
    const c = useAdminAnunciantes()
    expect(c.detailModal.value.show).toBe(false)
  })

  it('canDelete starts as false (empty confirmText)', () => {
    const c = useAdminAnunciantes()
    expect(c.canDelete.value).toBe(false)
  })
})

// ─── getStatusConfig ──────────────────────────────────────────────────────

describe('getStatusConfig', () => {
  it('returns config for "pending"', () => {
    const c = useAdminAnunciantes()
    const cfg = c.getStatusConfig('pending')
    expect(cfg?.label).toBe('Pendiente')
    expect(cfg?.color).toBe('#ef4444')
  })

  it('returns config for "matched"', () => {
    const c = useAdminAnunciantes()
    const cfg = c.getStatusConfig('matched')
    expect(cfg?.label).toBe('Vinculado')
  })

  it('falls back to first status for unknown', () => {
    const c = useAdminAnunciantes()
    const cfg = c.getStatusConfig('unknown' as never)
    expect(cfg).toBeDefined()
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns formatted date string', () => {
    const c = useAdminAnunciantes()
    const result = c.formatDate('2026-06-15T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).toContain('2026')
  })

  it('returns a dd/mm/yyyy style string', () => {
    const c = useAdminAnunciantes()
    const result = c.formatDate('2026-01-05T00:00:00Z')
    // es-ES locale with 2-digit day/month → "05/01/2026"
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})

// ─── Detail modal ─────────────────────────────────────────────────────────

describe('openDetail', () => {
  it('sets detailModal.show to true', () => {
    const c = useAdminAnunciantes()
    c.openDetail(makeAd() as never)
    expect(c.detailModal.value.show).toBe(true)
  })

  it('sets detailModal.advertisement to the ad', () => {
    const c = useAdminAnunciantes()
    const ad = makeAd({ id: 'ad-42' })
    c.openDetail(ad as never)
    expect(c.detailModal.value.advertisement?.id).toBe('ad-42')
  })

  it('sets notes to ad.admin_notes when present', () => {
    const c = useAdminAnunciantes()
    c.openDetail(makeAd({ admin_notes: 'Nota importante' }) as never)
    expect(c.detailModal.value.notes).toBe('Nota importante')
  })

  it('sets notes to empty string when admin_notes is null', () => {
    const c = useAdminAnunciantes()
    c.openDetail(makeAd({ admin_notes: null }) as never)
    expect(c.detailModal.value.notes).toBe('')
  })
})

describe('closeDetail', () => {
  it('resets detailModal to closed state', () => {
    const c = useAdminAnunciantes()
    c.openDetail(makeAd() as never)
    c.closeDetail()
    expect(c.detailModal.value.show).toBe(false)
    expect(c.detailModal.value.advertisement).toBeNull()
    expect(c.detailModal.value.notes).toBe('')
  })
})

describe('updateDetailNotes', () => {
  it('updates notes in detailModal', () => {
    const c = useAdminAnunciantes()
    c.openDetail(makeAd() as never)
    c.updateDetailNotes('Nueva nota')
    expect(c.detailModal.value.notes).toBe('Nueva nota')
  })
})

describe('saveNotes', () => {
  it('does nothing when advertisement is null', async () => {
    const c = useAdminAnunciantes()
    await c.saveNotes()
    expect(mockUpdateNotes).not.toHaveBeenCalled()
  })

  it('calls updateNotes with correct id and notes', async () => {
    const c = useAdminAnunciantes()
    c.openDetail(makeAd({ id: 'ad-55' }) as never)
    c.updateDetailNotes('Nota guardada')
    await c.saveNotes()
    expect(mockUpdateNotes).toHaveBeenCalledWith('ad-55', 'Nota guardada')
  })

  it('closes detail modal on success', async () => {
    mockUpdateNotes.mockResolvedValueOnce(true)
    const c = useAdminAnunciantes()
    c.openDetail(makeAd() as never)
    await c.saveNotes()
    expect(c.detailModal.value.show).toBe(false)
  })

  it('does NOT close modal when updateNotes returns false', async () => {
    mockUpdateNotes.mockResolvedValueOnce(false)
    const c = useAdminAnunciantes()
    c.openDetail(makeAd() as never)
    await c.saveNotes()
    expect(c.detailModal.value.show).toBe(true)
  })
})

// ─── Delete modal ─────────────────────────────────────────────────────────

describe('confirmDelete', () => {
  it('opens deleteModal with the ad', () => {
    const c = useAdminAnunciantes()
    c.confirmDelete(makeAd({ id: 'ad-99' }) as never)
    expect(c.deleteModal.value.show).toBe(true)
    expect(c.deleteModal.value.advertisement?.id).toBe('ad-99')
    expect(c.deleteModal.value.confirmText).toBe('')
  })
})

describe('closeDeleteModal', () => {
  it('resets deleteModal', () => {
    const c = useAdminAnunciantes()
    c.confirmDelete(makeAd() as never)
    c.closeDeleteModal()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.advertisement).toBeNull()
  })
})

describe('updateDeleteConfirmText', () => {
  it('updates deleteModal.confirmText', () => {
    const c = useAdminAnunciantes()
    c.updateDeleteConfirmText('borrar')
    expect(c.deleteModal.value.confirmText).toBe('borrar')
  })
})

describe('executeDelete', () => {
  it('does nothing when advertisement is null', async () => {
    const c = useAdminAnunciantes()
    await c.executeDelete()
    expect(mockDeleteAdvertisement).not.toHaveBeenCalled()
  })

  it('does nothing when canDelete is false', async () => {
    const c = useAdminAnunciantes()
    c.confirmDelete(makeAd() as never)
    // confirmText = '' → canDelete = false (one-shot computed)
    await c.executeDelete()
    expect(mockDeleteAdvertisement).not.toHaveBeenCalled()
  })
})

// ─── Filter helpers ───────────────────────────────────────────────────────

describe('setStatusFilter', () => {
  it('sets filters.status', () => {
    const c = useAdminAnunciantes()
    c.setStatusFilter('contacted')
    expect(c.filters.value.status).toBe('contacted')
  })

  it('can set to null', () => {
    const c = useAdminAnunciantes()
    c.setStatusFilter('contacted')
    c.setStatusFilter(null)
    expect(c.filters.value.status).toBeNull()
  })
})

describe('setSearchFilter', () => {
  it('sets filters.search', () => {
    const c = useAdminAnunciantes()
    c.setSearchFilter('camion')
    expect(c.filters.value.search).toBe('camion')
  })
})

// ─── handleStatusChange ───────────────────────────────────────────────────

describe('handleStatusChange', () => {
  it('calls updateStatus with correct id and status', async () => {
    const c = useAdminAnunciantes()
    await c.handleStatusChange(makeAd({ id: 'ad-1' }) as never, 'contacted')
    expect(mockUpdateStatus).toHaveBeenCalledWith('ad-1', 'contacted')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchAdvertisements', async () => {
    const c = useAdminAnunciantes()
    await c.init()
    expect(mockFetchAdvertisements).toHaveBeenCalled()
  })
})
