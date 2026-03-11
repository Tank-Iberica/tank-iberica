import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminComentarios,
  STATUS_TABS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../app/composables/admin/useAdminComentarios'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'order', 'range', 'update', 'delete']

function makeChain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    vertical: 'tracciona',
    article_id: 'a-1',
    user_id: null,
    author_name: 'Pedro',
    author_email: 'pedro@example.com',
    content: 'Muy buen artículo',
    status: 'pending' as const,
    parent_id: null,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    news: null,
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
})

// ─── Constants ────────────────────────────────────────────────────────────

describe('STATUS_TABS', () => {
  it('has 5 entries (null + 4 statuses)', () => {
    expect(STATUS_TABS).toHaveLength(5)
  })

  it('first entry has null value (show all)', () => {
    expect(STATUS_TABS[0]!.value).toBeNull()
  })

  it('includes pending, approved, spam, rejected', () => {
    const values = STATUS_TABS.map((t) => t.value).filter(Boolean)
    expect(values).toContain('pending')
    expect(values).toContain('approved')
    expect(values).toContain('spam')
    expect(values).toContain('rejected')
  })
})

describe('STATUS_COLORS', () => {
  it('has entries for all 4 statuses', () => {
    expect(STATUS_COLORS).toHaveProperty('pending')
    expect(STATUS_COLORS).toHaveProperty('approved')
    expect(STATUS_COLORS).toHaveProperty('spam')
    expect(STATUS_COLORS).toHaveProperty('rejected')
  })
})

describe('STATUS_LABELS', () => {
  it('has entries for all 4 statuses', () => {
    expect(STATUS_LABELS.pending).toBe('Pendiente')
    expect(STATUS_LABELS.approved).toBe('Aprobado')
    expect(STATUS_LABELS.spam).toBe('Spam')
    expect(STATUS_LABELS.rejected).toBe('Rechazado')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('comments starts as empty array', () => {
    const c = useAdminComentarios()
    expect(c.comments.value).toEqual([])
  })

  it('loading starts as true', () => {
    const c = useAdminComentarios()
    expect(c.loading.value).toBe(true)
  })

  it('error starts as null', () => {
    const c = useAdminComentarios()
    expect(c.error.value).toBeNull()
  })

  it('activeFilter starts as null', () => {
    const c = useAdminComentarios()
    expect(c.activeFilter.value).toBeNull()
  })

  it('hasMore starts as true', () => {
    const c = useAdminComentarios()
    expect(c.hasMore.value).toBe(true)
  })

  it('deleteModal starts closed with no comment', () => {
    const c = useAdminComentarios()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.comment).toBeNull()
  })
})

// ─── fetchComments ────────────────────────────────────────────────────────

describe('fetchComments', () => {
  it('sets comments and totalCount on success', async () => {
    const comment = makeComment()
    mockFrom.mockReturnValue(makeChain({ data: [comment], error: null, count: 1 }))
    const c = useAdminComentarios()
    await c.fetchComments(true)
    expect(c.comments.value).toHaveLength(1)
    expect(c.totalCount.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error on failure — message is preserved via new Error wrapper', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' }, count: null }))
    const c = useAdminComentarios()
    await c.fetchComments(true)
    expect(c.error.value).toBe('DB error')
    expect(c.comments.value).toEqual([])
  })

  it('applies activeFilter when set', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminComentarios()
    c.activeFilter.value = 'approved'
    await c.fetchComments(true)
    expect(chain.eq).toHaveBeenCalledWith('status', 'approved')
  })

  it('reset=false appends to comments and sets loadingMore', async () => {
    const comment1 = makeComment({ id: 'c-1' })
    const comment2 = makeComment({ id: 'c-2' })
    mockFrom.mockReturnValue(makeChain({ data: [comment2], error: null, count: 2 }))
    const c = useAdminComentarios()
    c.comments.value = [comment1 as never]
    await c.fetchComments(false)
    expect(c.comments.value).toHaveLength(2)
  })

  it('sets hasMore=false when fetched count < PAGE_SIZE (20)', async () => {
    const data = Array.from({ length: 5 }, (_, i) => makeComment({ id: `c-${i}` }))
    mockFrom.mockReturnValue(makeChain({ data, error: null, count: 5 }))
    const c = useAdminComentarios()
    await c.fetchComments(true)
    expect(c.hasMore.value).toBe(false)
  })

  it('resets page to 0 and clears comments on reset=true', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: 0 }))
    const c = useAdminComentarios()
    c.page.value = 3
    c.comments.value = [makeComment() as never]
    await c.fetchComments(true)
    expect(c.page.value).toBe(0)
    expect(c.comments.value).toHaveLength(0)
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('updates local comment status on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminComentarios()
    c.comments.value.push(makeComment({ id: 'c-1', status: 'pending' }) as never)
    await c.updateStatus('c-1', 'approved')
    expect(c.comments.value[0]!.status).toBe('approved')
    expect(c.actionLoading.value).toBeNull()
  })

  it('sets error on failure and clears actionLoading', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update error' } }))
    const c = useAdminComentarios()
    await c.updateStatus('c-1', 'spam')
    expect(c.error.value).toBe('Update error')
    expect(c.actionLoading.value).toBeNull()
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does nothing when deleteModal.comment is null', async () => {
    const c = useAdminComentarios()
    await c.executeDelete()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('removes comment from list and closes modal on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminComentarios()
    const comment = makeComment({ id: 'c-1' })
    c.comments.value.push(comment as never)
    c.totalCount.value = 1
    c.confirmDelete(comment as never)
    await c.executeDelete()
    expect(c.comments.value).toHaveLength(0)
    expect(c.totalCount.value).toBe(0)
    expect(c.deleteModal.value.show).toBe(false)
  })

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'FK error' } }))
    const c = useAdminComentarios()
    c.confirmDelete(makeComment({ id: 'c-1' }) as never)
    await c.executeDelete()
    expect(c.error.value).toBe('FK error')
  })
})

// ─── confirmDelete / closeDeleteModal ─────────────────────────────────────

describe('confirmDelete', () => {
  it('sets deleteModal.show=true and stores comment', () => {
    const c = useAdminComentarios()
    const comment = makeComment()
    c.confirmDelete(comment as never)
    expect(c.deleteModal.value.show).toBe(true)
    expect(c.deleteModal.value.comment?.id).toBe('c-1')
  })
})

describe('closeDeleteModal', () => {
  it('resets deleteModal to closed state', () => {
    const c = useAdminComentarios()
    c.confirmDelete(makeComment() as never)
    c.closeDeleteModal()
    expect(c.deleteModal.value.show).toBe(false)
    expect(c.deleteModal.value.comment).toBeNull()
  })
})

// ─── toggleExpand ─────────────────────────────────────────────────────────

describe('toggleExpand', () => {
  it('adds comment id to expandedComments Set', () => {
    const c = useAdminComentarios()
    c.toggleExpand('c-1')
    expect(c.expandedComments.value.has('c-1')).toBe(true)
  })

  it('removes comment id on second toggle', () => {
    const c = useAdminComentarios()
    c.toggleExpand('c-1')
    c.toggleExpand('c-1')
    expect(c.expandedComments.value.has('c-1')).toBe(false)
  })
})

// ─── relativeDate ─────────────────────────────────────────────────────────

describe('relativeDate', () => {
  it('returns "ahora" for very recent date (< 1 min ago)', () => {
    const c = useAdminComentarios()
    const now = new Date().toISOString()
    expect(c.relativeDate(now)).toBe('ahora')
  })

  it('returns "hace Xm" for minutes-ago date', () => {
    const c = useAdminComentarios()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(c.relativeDate(fiveMinAgo)).toBe('hace 5m')
  })

  it('returns "hace Xh" for hours-ago date', () => {
    const c = useAdminComentarios()
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(c.relativeDate(twoHoursAgo)).toBe('hace 2h')
  })

  it('returns "hace Xd" for days-ago date (< 30 days)', () => {
    const c = useAdminComentarios()
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(c.relativeDate(threeDaysAgo)).toBe('hace 3d')
  })
})

// ─── getArticleTitle ──────────────────────────────────────────────────────

describe('getArticleTitle', () => {
  it('returns news.title_es when present', () => {
    const c = useAdminComentarios()
    const comment = makeComment({ news: { id: 'a-1', title_es: 'Mi artículo', slug: 'mi-articulo' } })
    expect(c.getArticleTitle(comment as never)).toBe('Mi artículo')
  })

  it('returns "Articulo eliminado" when news is null', () => {
    const c = useAdminComentarios()
    const comment = makeComment({ news: null })
    expect(c.getArticleTitle(comment as never)).toBe('Articulo eliminado')
  })
})
