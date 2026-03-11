import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminNews } from '../../app/composables/admin/useAdminNews'

vi.mock('~/utils/fileNaming', () => ({ slugify: vi.fn().mockReturnValue('mocked-slug') }))

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'or', 'order', 'range', 'single', 'insert', 'update', 'delete']

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

function makeArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'n-1',
    title_es: 'Artículo test',
    title_en: 'Test article',
    slug: 'articulo-test',
    category: 'mercado',
    status: 'published',
    created_at: '2026-01-01',
    ...overrides,
  }
}

function makeFormData() {
  return {
    title_es: 'Nuevo artículo',
    title_en: null,
    slug: 'nuevo-articulo',
    category: 'mercado',
    image_url: null,
    description_es: null,
    description_en: null,
    content_es: 'Contenido...',
    content_en: null,
    hashtags: [],
    status: 'draft',
    published_at: null,
    section: 'general',
    faq_schema: null,
    excerpt_es: null,
    excerpt_en: null,
    scheduled_at: null,
    social_post_text: null,
    related_categories: null,
    target_markets: null,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('news starts as empty array', () => {
    const c = useAdminNews()
    expect(c.news.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminNews()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminNews()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminNews()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminNews()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchNews ────────────────────────────────────────────────────────────

describe('fetchNews', () => {
  it('sets news and total on success', async () => {
    const article = makeArticle()
    mockFrom.mockReturnValue(makeChain({ data: [article], error: null, count: 1 }))
    const c = useAdminNews()
    await c.fetchNews()
    expect(c.news.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error and empties news on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' }, count: null }))
    const c = useAdminNews()
    await c.fetchNews()
    expect(c.error.value).toBe('DB error')
    expect(c.news.value).toEqual([])
  })

  it('applies status filter (eq)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    await c.fetchNews({ status: 'published' })
    expect(chain.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('applies category filter (eq)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    await c.fetchNews({ category: 'mercado' })
    expect(chain.eq).toHaveBeenCalledWith('category', 'mercado')
  })

  it('applies search filter (or)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    await c.fetchNews({ search: 'camion' })
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('title_es.ilike.%camion%'))
  })

  it('defaults total to 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: null }))
    const c = useAdminNews()
    await c.fetchNews()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns article on success', async () => {
    const article = makeArticle()
    mockFrom.mockReturnValue(makeChain({ data: article, error: null }))
    const c = useAdminNews()
    const result = await c.fetchById('n-1')
    expect(result).toEqual(article)
  })

  it('returns null and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminNews()
    const result = await c.fetchById('ghost')
    expect(result).toBeNull()
    expect(c.error.value).toBe('Not found')
  })
})

// ─── createNews ───────────────────────────────────────────────────────────

describe('createNews', () => {
  it('returns new id on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'new-n' }, error: null }))
    const c = useAdminNews()
    const id = await c.createNews(makeFormData())
    expect(id).toBe('new-n')
    expect(c.saving.value).toBe(false)
  })

  it('uses provided slug when non-empty', async () => {
    const chain = makeChain({ data: { id: 'new-n' }, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    const formData = { ...makeFormData(), slug: '  mi-slug  ' }
    await c.createNews(formData)
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'mi-slug' }),
    )
  })

  it('calls slugify when slug is empty', async () => {
    const chain = makeChain({ data: { id: 'new-n' }, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    const formData = { ...makeFormData(), slug: '' }
    await c.createNews(formData)
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'mocked-slug' }),
    )
  })

  it('auto-sets published_at when status is published and no date given', async () => {
    const chain = makeChain({ data: { id: 'new-n' }, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    const formData = { ...makeFormData(), status: 'published', published_at: null }
    await c.createNews(formData)
    const payload = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(typeof payload.published_at).toBe('string')
  })

  it('returns null and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Slug conflict' } }))
    const c = useAdminNews()
    const id = await c.createNews(makeFormData())
    expect(id).toBeNull()
    expect(c.error.value).toBe('Slug conflict')
  })
})

// ─── updateNews ───────────────────────────────────────────────────────────

describe('updateNews', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminNews()
    const ok = await c.updateNews('n-1', { status: 'draft' })
    expect(ok).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('sets pending_translations when publishing', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    await c.updateNews('n-1', { status: 'published' })
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ pending_translations: true }),
    )
  })

  it('sets pending_translations when scheduling', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    await c.updateNews('n-1', { status: 'scheduled' })
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ pending_translations: true }),
    )
  })

  it('auto-sets published_at when publishing without date', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const c = useAdminNews()
    await c.updateNews('n-1', { status: 'published', published_at: null })
    const payload = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(typeof payload.published_at).toBe('string')
  })

  it('returns false and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Conflict' } }))
    const c = useAdminNews()
    const ok = await c.updateNews('n-1', { status: 'published' })
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Conflict')
  })
})

// ─── deleteNews ───────────────────────────────────────────────────────────

describe('deleteNews', () => {
  it('returns true and removes article from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminNews()
    c.news.value.push(makeArticle({ id: 'n-1' }) as never)
    c.news.value.push(makeArticle({ id: 'n-2' }) as never)
    c.total.value = 2
    const ok = await c.deleteNews('n-1')
    expect(ok).toBe(true)
    expect(c.news.value).toHaveLength(1)
    expect(c.news.value[0]!.id).toBe('n-2')
    expect(c.total.value).toBe(1)
  })

  it('returns false and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'FK error' } }))
    const c = useAdminNews()
    const ok = await c.deleteNews('n-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('FK error')
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────

describe('updateStatus', () => {
  it('delegates to updateNews with the provided status', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminNews()
    const ok = await c.updateStatus('n-1', 'archived')
    expect(ok).toBe(true)
  })
})
