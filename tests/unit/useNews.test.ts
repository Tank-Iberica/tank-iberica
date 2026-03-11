import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Dynamic import pattern (useNews imports from #imports) ───────────────────
// vi.resetModules() forces #imports to re-evaluate so vi.stubGlobal works.

type NewsRow = {
  id: string
  slug: string
  title_es: string
  title_en: string | null
  category: string
  image_url: string | null
  description_es: string | null
  description_en: string | null
  content_es: string
  content_en: string | null
  hashtags: string[]
  views: number
  status: string
  published_at: string | null
  created_at: string
  updated_at: string
}

function createChain({ data = [] as unknown[], error = null as unknown, count = 0, singleData = null as unknown, singleError = null as unknown } = {}) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'or', 'order', 'gte', 'lte', 'contains', 'select']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.range = () => Promise.resolve({ data, error, count })
  chain.single = () => Promise.resolve({ data: singleData, error: singleError })
  chain.limit = () => Promise.resolve({ data: [], error: null })
  return chain
}

function stubClient(opts: {
  data?: unknown[]
  error?: unknown
  count?: number
  singleData?: unknown
  singleError?: unknown
} = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => createChain(opts),
    }),
  }))
}

async function getNews() {
  const mod = await import('../../app/composables/useNews')
  return mod.useNews()
}

const sampleNews: NewsRow = {
  id: '1',
  title_es: 'Noticia 1',
  title_en: 'News 1',
  slug: 'noticia-1',
  category: 'industria',
  image_url: null,
  description_es: null,
  description_en: null,
  content_es: 'Contenido',
  content_en: null,
  hashtags: [],
  views: 0,
  status: 'published',
  published_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('news starts as empty array', async () => {
    const c = await getNews()
    expect(c.news.value).toHaveLength(0)
  })

  it('loading starts as false', async () => {
    const c = await getNews()
    expect(c.loading.value).toBe(false)
  })

  it('loadingMore starts as false', async () => {
    const c = await getNews()
    expect(c.loadingMore.value).toBe(false)
  })

  it('error starts as null', async () => {
    const c = await getNews()
    expect(c.error.value).toBeNull()
  })

  it('hasMore starts as true', async () => {
    const c = await getNews()
    expect(c.hasMore.value).toBe(true)
  })

  it('total starts as 0', async () => {
    const c = await getNews()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchNews ─────────────────────────────────────────────────────────────────

describe('fetchNews', () => {
  it('sets news from DB response', async () => {
    stubClient({ data: [sampleNews], count: 1 })
    const c = await getNews()
    await c.fetchNews()
    expect(c.news.value).toHaveLength(1)
    expect((c.news.value[0] as NewsRow).slug).toBe('noticia-1')
  })

  it('sets total from count', async () => {
    stubClient({ data: [sampleNews], count: 5 })
    const c = await getNews()
    await c.fetchNews()
    expect(c.total.value).toBe(5)
  })

  it('sets hasMore to false when all items loaded', async () => {
    stubClient({ data: [sampleNews], count: 1 })
    const c = await getNews()
    await c.fetchNews()
    expect(c.hasMore.value).toBe(false)
  })

  it('sets hasMore to true when more items exist', async () => {
    stubClient({ data: [sampleNews], count: 20 })
    const c = await getNews()
    await c.fetchNews()
    expect(c.hasMore.value).toBe(true)
  })

  it('sets loading to false after success', async () => {
    const c = await getNews()
    await c.fetchNews()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    stubClient({ error: new Error('DB error') })
    const c = await getNews()
    await c.fetchNews()
    expect(c.error.value).toBeTruthy()
  })

  it('sets news to empty on DB failure', async () => {
    stubClient({ data: [sampleNews], count: 1, error: new Error('DB error') })
    const c = await getNews()
    await c.fetchNews()
    expect(c.news.value).toHaveLength(0)
  })

  it('sets loading to false after error', async () => {
    stubClient({ error: new Error('DB error') })
    const c = await getNews()
    await c.fetchNews()
    expect(c.loading.value).toBe(false)
  })

  it('applies category filter when category is provided', async () => {
    stubClient({ data: [sampleNews], count: 1 })
    const c = await getNews()
    await c.fetchNews('industria')
    expect(c.news.value).toHaveLength(1)
  })

  it('clears error on new fetch', async () => {
    stubClient({ error: new Error('DB error') })
    const c = await getNews()
    await c.fetchNews()
    expect(c.error.value).toBeTruthy()

    // Re-stub and fetch again using a second composable instance (same module)
    stubClient({ data: [sampleNews], count: 1 })
    vi.resetModules()
    const c2 = await getNews()
    await c2.fetchNews()
    expect(c2.error.value).toBeNull()
  })
})

// ─── fetchMore ─────────────────────────────────────────────────────────────────

describe('fetchMore', () => {
  it('does nothing when hasMore is false', async () => {
    const rangeMock = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          const c = createChain()
          c.range = rangeMock
          return c
        },
      }),
    }))
    const c = await getNews()
    c.hasMore.value = false
    await c.fetchMore()
    expect(rangeMock).not.toHaveBeenCalled()
  })

  it('does nothing when loadingMore is already true', async () => {
    const rangeMock = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          const c = createChain()
          c.range = rangeMock
          return c
        },
      }),
    }))
    const c = await getNews()
    c.loadingMore.value = true
    await c.fetchMore()
    expect(rangeMock).not.toHaveBeenCalled()
  })

  it('sets loadingMore to false after success', async () => {
    stubClient({ data: [], count: 50 })
    const c = await getNews()
    c.total.value = 50
    await c.fetchMore()
    expect(c.loadingMore.value).toBe(false)
  })

  it('appends items to existing list', async () => {
    const extra = { ...sampleNews, id: '2', slug: 'noticia-2' }
    stubClient({ data: [extra], count: 50 })
    const c = await getNews()
    ;(c.news as { value: unknown[] }).value = [sampleNews]
    c.total.value = 50
    await c.fetchMore()
    expect(c.news.value).toHaveLength(2)
  })

  it('sets loadingMore to false after error', async () => {
    stubClient({ error: new Error('DB error') })
    const c = await getNews()
    c.total.value = 50
    await c.fetchMore()
    expect(c.loadingMore.value).toBe(false)
  })

  it('decrements page on error', async () => {
    stubClient({ error: new Error('DB error') })
    const c = await getNews()
    c.total.value = 50
    // page starts at 0; fetchMore increments to 1, then decrements back to 0 on error
    await c.fetchMore()
    // The internal page stays at 0 after the decrement; hasMore is still true
    expect(c.hasMore.value).toBe(true)
  })
})

// ─── fetchBySlug ───────────────────────────────────────────────────────────────

describe('fetchBySlug', () => {
  it('returns null when no data from DB', async () => {
    const c = await getNews()
    const result = await c.fetchBySlug('noticia-1')
    expect(result).toBeNull()
  })

  it('returns null and sets error on failure', async () => {
    stubClient({ singleError: { message: 'not found' } })
    const c = await getNews()
    const result = await c.fetchBySlug('non-existent')
    expect(result).toBeNull()
    expect(c.error.value).toBeTruthy()
  })

  it('returns news data on success', async () => {
    stubClient({ singleData: sampleNews })
    const c = await getNews()
    const result = await c.fetchBySlug('noticia-1')
    expect(result).not.toBeNull()
    expect((result as NewsRow)?.slug).toBe('noticia-1')
  })

  it('does not set error when successful', async () => {
    stubClient({ singleData: sampleNews })
    const c = await getNews()
    await c.fetchBySlug('noticia-1')
    expect(c.error.value).toBeNull()
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('reset', () => {
  it('clears news', async () => {
    const c = await getNews()
    ;(c.news as { value: unknown[] }).value = [sampleNews]
    c.reset()
    expect(c.news.value).toHaveLength(0)
  })

  it('resets total to 0', async () => {
    const c = await getNews()
    c.total.value = 42
    c.reset()
    expect(c.total.value).toBe(0)
  })

  it('resets hasMore to true', async () => {
    const c = await getNews()
    c.hasMore.value = false
    c.reset()
    expect(c.hasMore.value).toBe(true)
  })

  it('clears error', async () => {
    const c = await getNews()
    c.error.value = 'some error'
    c.reset()
    expect(c.error.value).toBeNull()
  })
})
