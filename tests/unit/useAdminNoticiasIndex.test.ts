import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminNoticiasIndex } from '../../app/composables/admin/useAdminNoticiasIndex'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  newsRef,
  mockFetchNews,
  mockDeleteNews,
  mockUpdateStatus,
} = vi.hoisted(() => ({
  newsRef: { value: [] as unknown[] },
  mockFetchNews: vi.fn().mockResolvedValue(undefined),
  mockDeleteNews: vi.fn().mockResolvedValue(true),
  mockUpdateStatus: vi.fn().mockResolvedValue(true),
}))

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminNews', () => ({
  useAdminNews: () => ({
    news: newsRef,
    loading: { value: false },
    error: { value: null },
    total: { value: 0 },
    fetchNews: mockFetchNews,
    deleteNews: mockDeleteNews,
    updateStatus: mockUpdateStatus,
  }),
}))

vi.mock('~/composables/admin/useSeoScore', () => ({
  calculateMiniSeoScore: vi.fn().mockReturnValue({ score: 50, level: 'warning' }),
}))

vi.stubGlobal('useRouter', () => ({
  push: vi.fn(),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  newsRef.value = []
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('filters.status starts as null', () => {
    const c = useAdminNoticiasIndex()
    expect(c.filters.value.status).toBeNull()
  })

  it('filters.search starts as empty string', () => {
    const c = useAdminNoticiasIndex()
    expect(c.filters.value.search).toBe('')
  })

  it('sortField starts as "created_at"', () => {
    const c = useAdminNoticiasIndex()
    expect(c.sortField.value).toBe('created_at')
  })

  it('sortOrder starts as "desc"', () => {
    const c = useAdminNoticiasIndex()
    expect(c.sortOrder.value).toBe('desc')
  })

  it('hasActiveFilters starts as false (one-shot computed)', () => {
    const c = useAdminNoticiasIndex()
    expect(c.hasActiveFilters.value).toBeFalsy()
  })

  it('deleteModal starts as false', () => {
    const c = useAdminNoticiasIndex()
    expect(c.deleteModal.value).toBe(false)
  })

  it('deleteTarget starts as null', () => {
    const c = useAdminNoticiasIndex()
    expect(c.deleteTarget.value).toBeNull()
  })

  it('deleteConfirmText starts as empty string', () => {
    const c = useAdminNoticiasIndex()
    expect(c.deleteConfirmText.value).toBe('')
  })

  it('sortedNews starts as empty (news is empty)', () => {
    const c = useAdminNoticiasIndex()
    expect(c.sortedNews.value).toEqual([])
  })
})

// ─── statusOptions ────────────────────────────────────────────────────────

describe('statusOptions', () => {
  it('has 4 options', () => {
    const c = useAdminNoticiasIndex()
    expect(c.statusOptions).toHaveLength(4)
  })

  it('includes null, draft, published, archived', () => {
    const c = useAdminNoticiasIndex()
    const values = c.statusOptions.map((o) => o.value)
    expect(values).toContain(null)
    expect(values).toContain('draft')
    expect(values).toContain('published')
    expect(values).toContain('archived')
  })
})

// ─── categoryOptions ──────────────────────────────────────────────────────

describe('categoryOptions', () => {
  it('has 5 options (including null)', () => {
    const c = useAdminNoticiasIndex()
    expect(c.categoryOptions).toHaveLength(5)
  })

  it('includes prensa, eventos, destacados, general', () => {
    const c = useAdminNoticiasIndex()
    const values = c.categoryOptions.map((o) => o.value)
    expect(values).toContain('prensa')
    expect(values).toContain('eventos')
    expect(values).toContain('destacados')
    expect(values).toContain('general')
  })
})

// ─── categoryLabels ───────────────────────────────────────────────────────

describe('categoryLabels', () => {
  it('has label for prensa', () => {
    const c = useAdminNoticiasIndex()
    expect(c.categoryLabels['prensa']).toBe('Prensa')
  })

  it('has label for eventos', () => {
    const c = useAdminNoticiasIndex()
    expect(c.categoryLabels['eventos']).toBe('Eventos')
  })
})

// ─── clearFilters ─────────────────────────────────────────────────────────

describe('clearFilters', () => {
  it('resets status to null', () => {
    const c = useAdminNoticiasIndex()
    c.filters.value.status = 'published'
    c.clearFilters()
    expect(c.filters.value.status).toBeNull()
  })

  it('resets category to null', () => {
    const c = useAdminNoticiasIndex()
    c.filters.value.category = 'prensa'
    c.clearFilters()
    expect(c.filters.value.category).toBeNull()
  })

  it('resets search to empty string', () => {
    const c = useAdminNoticiasIndex()
    c.filters.value.search = 'trucks'
    c.clearFilters()
    expect(c.filters.value.search).toBe('')
  })
})

// ─── toggleSort ───────────────────────────────────────────────────────────

describe('toggleSort', () => {
  it('changes sortField when different field clicked', () => {
    const c = useAdminNoticiasIndex()
    c.toggleSort('title_es')
    expect(c.sortField.value).toBe('title_es')
    expect(c.sortOrder.value).toBe('desc')
  })

  it('toggles sortOrder from desc to asc on same field', () => {
    const c = useAdminNoticiasIndex()
    // sortField='created_at', sortOrder='desc'
    c.toggleSort('created_at')
    expect(c.sortOrder.value).toBe('asc')
  })

  it('toggles sortOrder from asc to desc on same field', () => {
    const c = useAdminNoticiasIndex()
    c.toggleSort('created_at') // now asc
    c.toggleSort('created_at') // back to desc
    expect(c.sortOrder.value).toBe('desc')
  })

  it('resets sortOrder to desc when switching fields', () => {
    const c = useAdminNoticiasIndex()
    c.toggleSort('created_at') // asc
    c.toggleSort('views')      // new field → desc
    expect(c.sortOrder.value).toBe('desc')
    expect(c.sortField.value).toBe('views')
  })
})

// ─── getSortIcon ──────────────────────────────────────────────────────────

describe('getSortIcon', () => {
  it('returns ⇕ for inactive field', () => {
    const c = useAdminNoticiasIndex()
    expect(c.getSortIcon('title_es')).toBe('\u21D5')
  })

  it('returns ↓ for active field with desc order', () => {
    const c = useAdminNoticiasIndex()
    // sortField='created_at', sortOrder='desc'
    expect(c.getSortIcon('created_at')).toBe('\u2193')
  })

  it('returns ↑ for active field with asc order', () => {
    const c = useAdminNoticiasIndex()
    c.toggleSort('created_at') // now asc
    expect(c.getSortIcon('created_at')).toBe('\u2191')
  })
})

// ─── openDeleteModal / closeDeleteModal ───────────────────────────────────

describe('openDeleteModal', () => {
  it('sets deleteModal to true', () => {
    const c = useAdminNoticiasIndex()
    c.openDeleteModal({ id: 'n-1', title_es: 'Article 1' })
    expect(c.deleteModal.value).toBe(true)
  })

  it('sets deleteTarget', () => {
    const c = useAdminNoticiasIndex()
    c.openDeleteModal({ id: 'n-99', title_es: 'My article' })
    expect(c.deleteTarget.value?.id).toBe('n-99')
    expect(c.deleteTarget.value?.title_es).toBe('My article')
  })

  it('resets deleteConfirmText to empty', () => {
    const c = useAdminNoticiasIndex()
    c.deleteConfirmText.value = 'borrar'
    c.openDeleteModal({ id: 'n-1', title_es: 'Article' })
    expect(c.deleteConfirmText.value).toBe('')
  })
})

describe('closeDeleteModal', () => {
  it('sets deleteModal to false', () => {
    const c = useAdminNoticiasIndex()
    c.openDeleteModal({ id: 'n-1', title_es: 'Article' })
    c.closeDeleteModal()
    expect(c.deleteModal.value).toBe(false)
  })

  it('clears deleteTarget', () => {
    const c = useAdminNoticiasIndex()
    c.openDeleteModal({ id: 'n-1', title_es: 'Article' })
    c.closeDeleteModal()
    expect(c.deleteTarget.value).toBeNull()
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does nothing when deleteTarget is null', async () => {
    const c = useAdminNoticiasIndex()
    await c.executeDelete()
    expect(mockDeleteNews).not.toHaveBeenCalled()
  })

  it('does nothing when confirmText is not "borrar"', async () => {
    const c = useAdminNoticiasIndex()
    c.openDeleteModal({ id: 'n-1', title_es: 'Article' })
    c.deleteConfirmText.value = 'delete'
    await c.executeDelete()
    expect(mockDeleteNews).not.toHaveBeenCalled()
  })

  it('calls deleteNews when confirmText is exactly "borrar"', async () => {
    const c = useAdminNoticiasIndex()
    c.openDeleteModal({ id: 'n-1', title_es: 'Article' })
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(mockDeleteNews).toHaveBeenCalledWith('n-1')
  })

  it('closes modal after successful delete', async () => {
    const c = useAdminNoticiasIndex()
    c.openDeleteModal({ id: 'n-1', title_es: 'Article' })
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(c.deleteModal.value).toBe(false)
  })
})

// ─── getSeoScore ──────────────────────────────────────────────────────────

describe('getSeoScore', () => {
  it('returns score and level for a news item', () => {
    const c = useAdminNoticiasIndex()
    const result = c.getSeoScore({
      id: 'n-1',
      title_es: 'Title',
      content_es: 'Content',
      slug: 'title',
      image_url: null,
      hashtags: [],
    } as never)
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('level')
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "—" for null', () => {
    const c = useAdminNoticiasIndex()
    expect(c.formatDate(null)).toBe('\u2014')
  })

  it('returns formatted string for ISO date', () => {
    const c = useAdminNoticiasIndex()
    const result = c.formatDate('2026-03-15')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('\u2014')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchNews', () => {
    const c = useAdminNoticiasIndex()
    c.init()
    expect(mockFetchNews).toHaveBeenCalled()
  })
})
