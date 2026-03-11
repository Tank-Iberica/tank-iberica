import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminVerificaciones } from '../../app/composables/admin/useAdminVerificaciones'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('~/composables/useLocalized', () => ({
  localizedField: (obj: Record<string, string> | null, _locale: string) =>
    obj?.es ?? (obj as Record<string, string> | null)?.['name_es'] ?? '',
}))

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (val: number) => `${val} €`,
}))

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'order', 'limit', 'single', 'match', 'or',
  ]) {
    chain[m] = () => chain
  }
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'admin-id' } } }),
  },
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useAdminVerificaciones()
    expect(c.loading.value).toBe(true)
  })

  it('documents starts as empty array', () => {
    const c = useAdminVerificaciones()
    expect(c.documents.value).toEqual([])
  })

  it('error starts as null', () => {
    const c = useAdminVerificaciones()
    expect(c.error.value).toBeNull()
  })

  it('search starts as empty string', () => {
    const c = useAdminVerificaciones()
    expect(c.search.value).toBe('')
  })

  it('statusFilter starts as "all"', () => {
    const c = useAdminVerificaciones()
    expect(c.statusFilter.value).toBe('all')
  })

  it('expandedDocId starts as null', () => {
    const c = useAdminVerificaciones()
    expect(c.expandedDocId.value).toBeNull()
  })

  it('rejectionReason starts as empty string', () => {
    const c = useAdminVerificaciones()
    expect(c.rejectionReason.value).toBe('')
  })

  it('actionLoading starts as false', () => {
    const c = useAdminVerificaciones()
    expect(c.actionLoading.value).toBe(false)
  })

  it('filteredDocuments starts as empty (one-shot computed)', () => {
    const c = useAdminVerificaciones()
    expect(c.filteredDocuments.value).toEqual([])
  })

  it('pendingCount starts as 0 (one-shot computed)', () => {
    const c = useAdminVerificaciones()
    expect(c.pendingCount.value).toBe(0)
  })

  it('statusCounts.all starts as 0', () => {
    const c = useAdminVerificaciones()
    expect(c.statusCounts.value.all).toBe(0)
  })

  it('statusCounts.pending starts as 0', () => {
    const c = useAdminVerificaciones()
    expect(c.statusCounts.value.pending).toBe(0)
  })

  it('statusCounts.verified starts as 0', () => {
    const c = useAdminVerificaciones()
    expect(c.statusCounts.value.verified).toBe(0)
  })

  it('statusCounts.rejected starts as 0', () => {
    const c = useAdminVerificaciones()
    expect(c.statusCounts.value.rejected).toBe(0)
  })
})

// ─── fetchDocuments ───────────────────────────────────────────────────────

describe('fetchDocuments', () => {
  it('calls supabase.from("verification_documents")', async () => {
    const c = useAdminVerificaciones()
    await c.fetchDocuments()
    expect(mockFrom).toHaveBeenCalledWith('verification_documents')
  })

  it('populates documents from data', async () => {
    const data = [{ id: 'd-1', status: 'pending', vehicle_id: 'v-1', vehicles: { brand: 'Volvo', model: 'FH', vehicle_images: [] } }]
    mockFrom.mockReturnValue(makeChain({ data, error: null }))
    const c = useAdminVerificaciones()
    await c.fetchDocuments()
    expect(c.documents.value).toHaveLength(1)
    expect(c.documents.value[0]).toMatchObject({ id: 'd-1' })
  })

  it('sets error on fetch failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))
    const c = useAdminVerificaciones()
    await c.fetchDocuments()
    expect(c.error.value).toBe('DB error')
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminVerificaciones()
    await c.fetchDocuments()
    expect(c.loading.value).toBe(false)
  })
})

// ─── toggleExpand ─────────────────────────────────────────────────────────

describe('toggleExpand', () => {
  it('sets expandedDocId when null', () => {
    const c = useAdminVerificaciones()
    c.toggleExpand('d-1')
    expect(c.expandedDocId.value).toBe('d-1')
  })

  it('collapses when same id toggled', () => {
    const c = useAdminVerificaciones()
    c.toggleExpand('d-1')
    c.toggleExpand('d-1')
    expect(c.expandedDocId.value).toBeNull()
  })

  it('clears rejectionReason on collapse', () => {
    const c = useAdminVerificaciones()
    c.toggleExpand('d-1')
    c.rejectionReason.value = 'some reason'
    c.toggleExpand('d-1')
    expect(c.rejectionReason.value).toBe('')
  })

  it('clears rejectionReason when expanding new doc', () => {
    const c = useAdminVerificaciones()
    c.rejectionReason.value = 'old reason'
    c.toggleExpand('d-1')
    expect(c.rejectionReason.value).toBe('')
  })

  it('switches to new id when different id clicked', () => {
    const c = useAdminVerificaciones()
    c.toggleExpand('d-1')
    c.toggleExpand('d-2')
    expect(c.expandedDocId.value).toBe('d-2')
  })
})

// ─── clearFilters ─────────────────────────────────────────────────────────

describe('clearFilters', () => {
  it('resets statusFilter to "all"', () => {
    const c = useAdminVerificaciones()
    c.statusFilter.value = 'pending'
    c.clearFilters()
    expect(c.statusFilter.value).toBe('all')
  })

  it('resets search to empty string', () => {
    const c = useAdminVerificaciones()
    c.search.value = 'volvo'
    c.clearFilters()
    expect(c.search.value).toBe('')
  })
})

// ─── approveDocument ──────────────────────────────────────────────────────

describe('approveDocument', () => {
  it('calls supabase.from("verification_documents")', async () => {
    const c = useAdminVerificaciones()
    await c.approveDocument({ id: 'd-1' } as never)
    expect(mockFrom).toHaveBeenCalledWith('verification_documents')
  })

  it('sets actionLoading to false after completion', async () => {
    const c = useAdminVerificaciones()
    await c.approveDocument({ id: 'd-1' } as never)
    expect(c.actionLoading.value).toBe(false)
  })

  it('clears expandedDocId on success', async () => {
    const c = useAdminVerificaciones()
    c.expandedDocId.value = 'd-1'
    await c.approveDocument({ id: 'd-1' } as never)
    expect(c.expandedDocId.value).toBeNull()
  })

  it('sets error on update failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'approve error' } }))
    const c = useAdminVerificaciones()
    await c.approveDocument({ id: 'd-1' } as never)
    expect(c.error.value).toBe('approve error')
  })
})

// ─── rejectDocument ───────────────────────────────────────────────────────

describe('rejectDocument', () => {
  it('does nothing when rejectionReason is empty', async () => {
    const c = useAdminVerificaciones()
    c.rejectionReason.value = ''
    await c.rejectDocument({ id: 'd-1' } as never)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does nothing when rejectionReason is only whitespace', async () => {
    const c = useAdminVerificaciones()
    c.rejectionReason.value = '   '
    await c.rejectDocument({ id: 'd-1' } as never)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase when rejectionReason is set', async () => {
    const c = useAdminVerificaciones()
    c.rejectionReason.value = 'Missing docs'
    await c.rejectDocument({ id: 'd-1' } as never)
    expect(mockFrom).toHaveBeenCalledWith('verification_documents')
  })

  it('sets actionLoading to false after completion', async () => {
    const c = useAdminVerificaciones()
    c.rejectionReason.value = 'Invalid'
    await c.rejectDocument({ id: 'd-1' } as never)
    expect(c.actionLoading.value).toBe(false)
  })

  it('clears expandedDocId on success', async () => {
    const c = useAdminVerificaciones()
    c.expandedDocId.value = 'd-1'
    c.rejectionReason.value = 'Reason'
    await c.rejectDocument({ id: 'd-1' } as never)
    expect(c.expandedDocId.value).toBeNull()
  })

  it('clears rejectionReason on success', async () => {
    const c = useAdminVerificaciones()
    c.rejectionReason.value = 'Bad doc'
    await c.rejectDocument({ id: 'd-1' } as never)
    expect(c.rejectionReason.value).toBe('')
  })

  it('sets error on update failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'reject error' } }))
    const c = useAdminVerificaciones()
    c.rejectionReason.value = 'Reason'
    await c.rejectDocument({ id: 'd-1' } as never)
    expect(c.error.value).toBe('reject error')
  })
})

// ─── getVehicleThumbnail ──────────────────────────────────────────────────

describe('getVehicleThumbnail', () => {
  it('returns null when no images', () => {
    const c = useAdminVerificaciones()
    expect(c.getVehicleThumbnail({ vehicle_images: [] } as never)).toBeNull()
  })

  it('returns first sorted image URL', () => {
    const c = useAdminVerificaciones()
    const result = c.getVehicleThumbnail({
      vehicle_images: [
        { url: 'http://img2.jpg', position: 2 },
        { url: 'http://img1.jpg', position: 1 },
      ],
    } as never)
    expect(result).toBe('http://img1.jpg')
  })

  it('returns null when vehicle_images is undefined', () => {
    const c = useAdminVerificaciones()
    expect(c.getVehicleThumbnail({} as never)).toBeNull()
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "-" for null', () => {
    const c = useAdminVerificaciones()
    expect(c.formatDate(null)).toBe('-')
  })

  it('returns formatted date string for valid ISO date', () => {
    const c = useAdminVerificaciones()
    const result = c.formatDate('2026-03-15')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('-')
    expect(result).toContain('2026')
  })
})

// ─── getStatusClass ───────────────────────────────────────────────────────

describe('getStatusClass', () => {
  it('returns "status-verified" for verified', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusClass('verified')).toBe('status-verified')
  })

  it('returns "status-rejected" for rejected', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusClass('rejected')).toBe('status-rejected')
  })

  it('returns "status-pending" for pending', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusClass('pending')).toBe('status-pending')
  })

  it('returns "status-pending" for null', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusClass(null)).toBe('status-pending')
  })

  it('returns "status-pending" for unknown status', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusClass('unknown')).toBe('status-pending')
  })
})

// ─── isFileImage ──────────────────────────────────────────────────────────

describe('isFileImage', () => {
  it('returns true for jpg', () => {
    const c = useAdminVerificaciones()
    expect(c.isFileImage('document.jpg')).toBe(true)
  })

  it('returns true for png', () => {
    const c = useAdminVerificaciones()
    expect(c.isFileImage('photo.png')).toBe(true)
  })

  it('returns true for webp', () => {
    const c = useAdminVerificaciones()
    expect(c.isFileImage('image.webp')).toBe(true)
  })

  it('returns true for svg', () => {
    const c = useAdminVerificaciones()
    expect(c.isFileImage('icon.svg')).toBe(true)
  })

  it('returns false for pdf', () => {
    const c = useAdminVerificaciones()
    expect(c.isFileImage('document.pdf')).toBe(false)
  })

  it('returns false for null', () => {
    const c = useAdminVerificaciones()
    expect(c.isFileImage(null)).toBe(false)
  })
})

// ─── getDocTypeLabel ──────────────────────────────────────────────────────

describe('getDocTypeLabel', () => {
  it('returns translated label for ficha_tecnica', () => {
    const c = useAdminVerificaciones()
    const result = c.getDocTypeLabel('ficha_tecnica')
    expect(result).toBeTruthy()
  })

  it('returns "ADR" for adr', () => {
    const c = useAdminVerificaciones()
    expect(c.getDocTypeLabel('adr')).toBe('ADR')
  })

  it('returns "ATP" for atp', () => {
    const c = useAdminVerificaciones()
    expect(c.getDocTypeLabel('atp')).toBe('ATP')
  })

  it('returns "EXOLUM" for exolum', () => {
    const c = useAdminVerificaciones()
    expect(c.getDocTypeLabel('exolum')).toBe('EXOLUM')
  })

  it('returns docType itself for unknown type', () => {
    const c = useAdminVerificaciones()
    expect(c.getDocTypeLabel('custom_type')).toBe('custom_type')
  })
})

// ─── getStatusLabel ───────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns truthy string for verified', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusLabel('verified')).toBeTruthy()
  })

  it('returns truthy string for rejected', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusLabel('rejected')).toBeTruthy()
  })

  it('returns truthy string for null (pending)', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusLabel(null)).toBeTruthy()
  })

  it('returns truthy string for unknown status (falls through to pending)', () => {
    const c = useAdminVerificaciones()
    expect(c.getStatusLabel('unknown')).toBeTruthy()
  })
})

// ─── getVerificationLevelInfo ─────────────────────────────────────────────

describe('getVerificationLevelInfo', () => {
  it('returns level-none for "none"', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo('none')
    expect(info.cssClass).toBe('level-none')
    expect(info.progress).toBe(0)
  })

  it('returns level-verified for "verified"', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo('verified')
    expect(info.cssClass).toBe('level-verified')
    expect(info.progress).toBe(20)
  })

  it('returns level-extended for "extended"', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo('extended')
    expect(info.cssClass).toBe('level-extended')
    expect(info.progress).toBe(40)
  })

  it('returns level-detailed for "detailed"', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo('detailed')
    expect(info.cssClass).toBe('level-detailed')
    expect(info.progress).toBe(60)
  })

  it('returns level-audited for "audited"', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo('audited')
    expect(info.cssClass).toBe('level-audited')
    expect(info.progress).toBe(80)
  })

  it('returns level-certified for "certified"', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo('certified')
    expect(info.cssClass).toBe('level-certified')
    expect(info.progress).toBe(100)
  })

  it('returns level-none for null', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo(null)
    expect(info.cssClass).toBe('level-none')
  })

  it('returns level-none for unknown level', () => {
    const c = useAdminVerificaciones()
    const info = c.getVerificationLevelInfo('unknown')
    expect(info.cssClass).toBe('level-none')
  })

  it('each level has label, icon, progress, and cssClass', () => {
    const c = useAdminVerificaciones()
    for (const level of ['none', 'verified', 'extended', 'detailed', 'audited', 'certified']) {
      const info = c.getVerificationLevelInfo(level)
      expect(info.label).toBeTruthy()
      expect(info.icon).toBeTruthy()
      expect(typeof info.progress).toBe('number')
      expect(info.cssClass).toBe(`level-${level}`)
    }
  })
})

// ─── getDealerName ────────────────────────────────────────────────────────

describe('getDealerName', () => {
  it('returns "-" when dealers is null', () => {
    const c = useAdminVerificaciones()
    expect(c.getDealerName({ vehicles: { dealers: null } } as never)).toBe('-')
  })

  it('returns dealer name when dealers exist', () => {
    const c = useAdminVerificaciones()
    const result = c.getDealerName({
      vehicles: { dealers: { company_name: { es: 'Trucks SA' } } },
    } as never)
    expect(result).toBeTruthy()
  })

  it('returns "-" when localizedField returns empty string', () => {
    const c = useAdminVerificaciones()
    const result = c.getDealerName({
      vehicles: { dealers: { company_name: null } },
    } as never)
    expect(result).toBe('-')
  })
})
