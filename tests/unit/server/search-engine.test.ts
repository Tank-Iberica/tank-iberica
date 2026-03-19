import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  TypesenseAdapter,
  MeilisearchAdapter,
  PostgresFallbackAdapter,
  createSearchAdapter,
  type IndexDocumentPayload,
} from '../../../server/utils/searchEngine'

// ── Fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── Test helpers ─────────────────────────────────────────────────────────────

function makeDoc(overrides: Partial<IndexDocumentPayload> = {}): IndexDocumentPayload {
  return {
    id: 'v-1',
    slug: 'volvo-fh-2024',
    brand: 'Volvo',
    model: 'FH 500',
    year: 2024,
    price: 85000,
    location: 'Madrid',
    location_province: 'Madrid',
    location_country: 'ES',
    category_id: 'cat-1',
    dealer_id: 'dealer-1',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── TypesenseAdapter ─────────────────────────────────────────────────────────

describe('TypesenseAdapter', () => {
  let adapter: TypesenseAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new TypesenseAdapter({
      apiKey: 'test-key',
      host: 'https://typesense.example.com',
      collection: 'vehicles',
    })
  })

  describe('isAvailable', () => {
    it('returns true when health check succeeds', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      expect(await adapter.isAvailable()).toBe(true)
    })

    it('returns false when health check fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await adapter.isAvailable()).toBe(false)
    })

    it('returns false when no apiKey', async () => {
      adapter = new TypesenseAdapter({ apiKey: '', host: 'http://x' })
      expect(await adapter.isAvailable()).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
      expect(await adapter.isAvailable()).toBe(false)
    })
  })

  describe('search', () => {
    it('returns mapped hits from Typesense response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            found: 1,
            hits: [{ document: makeDoc(), text_match: 5000000 }],
            facet_counts: [],
          }),
      })

      const result = await adapter.search({ query: 'volvo' })
      expect(result.adapter).toBe('typesense')
      expect(result.hits).toHaveLength(1)
      expect(result.hits[0].brand).toBe('Volvo')
      expect(result.totalHits).toBe(1)
      expect(result.score).toBeUndefined // score is on hit
      expect(result.hits[0].score).toBeCloseTo(0.5, 1)
    })

    it('includes facets in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            found: 2,
            hits: [],
            facet_counts: [
              {
                field_name: 'brand',
                counts: [
                  { value: 'Volvo', count: 5 },
                  { value: 'MAN', count: 3 },
                ],
              },
            ],
          }),
      })

      const result = await adapter.search({ query: '', facets: ['brand'] })
      expect(result.facets.brand).toHaveLength(2)
      expect(result.facets.brand[0].value).toBe('Volvo')
    })

    it('builds filter string from params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ found: 0, hits: [], facet_counts: [] }),
      })

      await adapter.search({
        query: 'truck',
        filters: { brand: 'Volvo', status: 'active' },
      })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('filter_by=')
      expect(url).toContain('brand')
      expect(url).toContain('Volvo')
    })

    it('applies geo filter and sort', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ found: 0, hits: [], facet_counts: [] }),
      })

      await adapter.search({
        query: '',
        geoPoint: { lat: 40.4, lng: -3.7, radiusKm: 50 },
      })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('location_geo')
      expect(url).toContain('sort_by=')
    })

    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(adapter.search({ query: 'test' })).rejects.toThrow('Typesense search failed')
    })

    it('calculates pagination correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ found: 100, hits: [], facet_counts: [] }),
      })

      const result = await adapter.search({ query: '', page: 3, limit: 10 })
      expect(result.page).toBe(3)
      expect(result.totalPages).toBe(10)
    })
  })

  describe('indexDocuments', () => {
    it('sends NDJSON to Typesense', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{"success":true}\n{"success":true}'),
      })

      const result = await adapter.indexDocuments([makeDoc(), makeDoc({ id: 'v-2' })])
      expect(result.indexed).toBe(2)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })

    it('throws on failed index', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400 })
      await expect(adapter.indexDocuments([makeDoc()])).rejects.toThrow()
    })
  })

  describe('removeDocument', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await adapter.removeDocument('v-1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('ignores 404 (already deleted)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      await expect(adapter.removeDocument('v-1')).resolves.not.toThrow()
    })

    it('throws on other errors', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(adapter.removeDocument('v-1')).rejects.toThrow()
    })
  })
})

// ── MeilisearchAdapter ───────────────────────────────────────────────────────

describe('MeilisearchAdapter', () => {
  let adapter: MeilisearchAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new MeilisearchAdapter({
      apiKey: 'ms-key',
      host: 'https://meili.example.com',
      index: 'vehicles',
    })
  })

  describe('isAvailable', () => {
    it('returns true on health OK', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      expect(await adapter.isAvailable()).toBe(true)
    })

    it('returns false without host', async () => {
      adapter = new MeilisearchAdapter({ host: '' })
      expect(await adapter.isAvailable()).toBe(false)
    })
  })

  describe('search', () => {
    it('returns mapped hits from Meilisearch response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            hits: [{ ...makeDoc(), _rankingScore: 0.95 }],
            estimatedTotalHits: 1,
          }),
      })

      const result = await adapter.search({ query: 'volvo' })
      expect(result.adapter).toBe('meilisearch')
      expect(result.hits).toHaveLength(1)
      expect(result.hits[0].score).toBe(0.95)
    })

    it('includes facet distribution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            hits: [],
            estimatedTotalHits: 0,
            facetDistribution: {
              brand: { Volvo: 5, MAN: 3 },
            },
          }),
      })

      const result = await adapter.search({ query: '', facets: ['brand'] })
      expect(result.facets.brand).toHaveLength(2)
    })

    it('builds filter for arrays', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ hits: [], estimatedTotalHits: 0 }),
      })

      await adapter.search({
        query: '',
        filters: { brand: ['Volvo', 'MAN'] as unknown as string[] },
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(body.filter).toContain('brand = "Volvo"')
      expect(body.filter).toContain('OR')
    })

    it('applies geo radius filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ hits: [], estimatedTotalHits: 0 }),
      })

      await adapter.search({
        query: '',
        geoPoint: { lat: 40.4, lng: -3.7, radiusKm: 100 },
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(body.filter).toContain('_geoRadius')
    })
  })

  describe('indexDocuments', () => {
    it('sends JSON array', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      const result = await adapter.indexDocuments([makeDoc()])
      expect(result.indexed).toBe(1)
    })
  })

  describe('removeDocument', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await adapter.removeDocument('v-1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })
})

// ── PostgresFallbackAdapter ──────────────────────────────────────────────────

describe('PostgresFallbackAdapter', () => {
  let mockQuery: ReturnType<typeof vi.fn>
  let adapter: PostgresFallbackAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = vi.fn()
    adapter = new PostgresFallbackAdapter(mockQuery)
  })

  it('is always available', async () => {
    expect(await adapter.isAvailable()).toBe(true)
  })

  it('name is postgres', () => {
    expect(adapter.name).toBe('postgres')
  })

  it('searches using Supabase RPC', async () => {
    mockQuery.mockResolvedValue({
      data: [{ ...makeDoc(), total_estimate: 42, rank: 1 }],
      error: null,
    })

    const result = await adapter.search({
      query: 'volvo',
      filters: { category_id: 'cat-1', price_min: 1000 },
    })

    expect(mockQuery).toHaveBeenCalledWith(
      'search_vehicles',
      expect.objectContaining({
        search_query: 'volvo',
        filter_category_id: 'cat-1',
        filter_price_min: 1000,
      }),
    )
    expect(result.adapter).toBe('postgres')
    expect(result.hits).toHaveLength(1)
    expect(result.totalHits).toBe(42)
  })

  it('returns empty on null data', async () => {
    mockQuery.mockResolvedValue({ data: null, error: null })
    const result = await adapter.search({ query: '' })
    expect(result.hits).toHaveLength(0)
    expect(result.totalHits).toBe(0)
  })

  it('throws on query error', async () => {
    mockQuery.mockResolvedValue({ data: null, error: new Error('fail') })
    await expect(adapter.search({ query: 'x' })).rejects.toThrow('Postgres search failed')
  })

  it('indexDocuments is no-op', async () => {
    const result = await adapter.indexDocuments([makeDoc()])
    expect(result.indexed).toBe(0)
  })

  it('removeDocument is no-op', async () => {
    await expect(adapter.removeDocument('v-1')).resolves.not.toThrow()
  })

  it('assigns decreasing scores by position', async () => {
    mockQuery.mockResolvedValue({
      data: [
        { ...makeDoc({ id: 'v-1' }), total_estimate: 3 },
        { ...makeDoc({ id: 'v-2' }), total_estimate: 3 },
        { ...makeDoc({ id: 'v-3' }), total_estimate: 3 },
      ],
      error: null,
    })

    const result = await adapter.search({ query: 'truck' })
    expect(result.hits[0].score).toBeGreaterThan(result.hits[1].score)
    expect(result.hits[1].score).toBeGreaterThan(result.hits[2].score)
  })
})

// ── createSearchAdapter factory ──────────────────────────────────────────────

describe('createSearchAdapter', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('returns postgres fallback when no engines configured', async () => {
    delete process.env.SEARCH_ENGINE
    delete process.env.TYPESENSE_API_KEY
    delete process.env.MEILISEARCH_HOST

    const mockQuery = vi.fn()
    const adapter = await createSearchAdapter(undefined, mockQuery)
    expect(adapter.name).toBe('postgres')
  })

  it('throws if no fallback query provided and no engines available', async () => {
    delete process.env.SEARCH_ENGINE
    delete process.env.TYPESENSE_API_KEY
    delete process.env.MEILISEARCH_HOST

    await expect(createSearchAdapter()).rejects.toThrow('No search engine available')
  })

  it('returns typesense when explicitly configured and available', async () => {
    process.env.TYPESENSE_API_KEY = 'test'
    process.env.TYPESENSE_HOST = 'http://localhost:8108'

    mockFetch.mockResolvedValueOnce({ ok: true }) // health check

    const adapter = await createSearchAdapter('typesense')
    expect(adapter.name).toBe('typesense')
  })

  it('falls back to postgres when typesense unavailable', async () => {
    process.env.TYPESENSE_API_KEY = 'test'
    process.env.TYPESENSE_HOST = 'http://localhost:8108'

    mockFetch.mockResolvedValueOnce({ ok: false }) // health check fails

    const mockQuery = vi.fn()
    const adapter = await createSearchAdapter('typesense', mockQuery)
    expect(adapter.name).toBe('postgres')
  })

  it('auto-detects typesense from env vars', async () => {
    process.env.TYPESENSE_API_KEY = 'auto-key'
    process.env.TYPESENSE_HOST = 'http://ts:8108'

    mockFetch.mockResolvedValueOnce({ ok: true })

    const mockQuery = vi.fn()
    const adapter = await createSearchAdapter(undefined, mockQuery)
    expect(adapter.name).toBe('typesense')
  })

  it('auto-detects meilisearch when typesense not available', async () => {
    process.env.TYPESENSE_API_KEY = 'key'
    process.env.TYPESENSE_HOST = 'http://ts:8108'
    process.env.MEILISEARCH_HOST = 'http://meili:7700'

    mockFetch.mockResolvedValueOnce({ ok: false }) // typesense health fail
    mockFetch.mockResolvedValueOnce({ ok: true }) // meilisearch health ok

    const mockQuery = vi.fn()
    const adapter = await createSearchAdapter(undefined, mockQuery)
    expect(adapter.name).toBe('meilisearch')
  })
})
