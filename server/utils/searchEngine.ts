/**
 * Search Engine abstraction with adapter pattern (F6).
 *
 * Adapters: Typesense → Meilisearch → Postgres ilike fallback.
 * Active adapter selected via SEARCH_ENGINE env var.
 *
 * All adapters implement the same SearchAdapter interface.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface SearchParams {
  query: string
  filters?: Record<string, string | number | boolean | string[] | null>
  facets?: string[]
  sort?: string
  page?: number
  limit?: number
  geoPoint?: { lat: number; lng: number; radiusKm?: number }
}

export interface SearchHit {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  location_province: string | null
  location_country: string | null
  category_id: string | null
  dealer_id: string | null
  created_at: string
  /** Relevance score (0-1, 1 = best match) */
  score: number
}

export interface FacetCount {
  value: string
  count: number
}

export interface SearchResponse {
  hits: SearchHit[]
  totalHits: number
  facets: Record<string, FacetCount[]>
  page: number
  totalPages: number
  processingTimeMs: number
  adapter: string
}

export interface IndexDocumentPayload {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  location_province: string | null
  location_country: string | null
  category_id: string | null
  dealer_id: string | null
  created_at: string
  description?: string | null
  title?: string | null
  status?: string
}

export interface SearchAdapter {
  readonly name: string
  search(params: SearchParams): Promise<SearchResponse>
  indexDocuments(docs: IndexDocumentPayload[]): Promise<{ indexed: number }>
  removeDocument(id: string): Promise<void>
  isAvailable(): Promise<boolean>
}

// ── Typesense Adapter ────────────────────────────────────────────────────────

export class TypesenseAdapter implements SearchAdapter {
  readonly name = 'typesense'
  private apiKey: string
  private host: string
  private collection: string

  constructor(config?: { apiKey?: string; host?: string; collection?: string }) {
    this.apiKey = config?.apiKey || process.env.TYPESENSE_API_KEY || ''
    this.host = config?.host || process.env.TYPESENSE_HOST || ''
    this.collection = config?.collection || process.env.TYPESENSE_COLLECTION || 'vehicles'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || !this.host) return false
    try {
      const res = await fetch(`${this.host}/health`, {
        headers: { 'X-TYPESENSE-API-KEY': this.apiKey },
        signal: AbortSignal.timeout(3000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const start = Date.now()
    const limit = params.limit ?? 20
    const page = params.page ?? 1

    const searchParams: Record<string, string> = {
      q: params.query || '*',
      query_by: 'brand,model,title,description,location',
      per_page: String(limit),
      page: String(page),
      num_typos: '2',
    }

    if (params.facets?.length) {
      searchParams.facet_by = params.facets.join(',')
    }

    if (params.sort) {
      searchParams.sort_by = params.sort
    }

    // Build filter string
    const filterParts: string[] = []
    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (value === null || value === undefined) continue
        if (Array.isArray(value)) {
          filterParts.push(`${key}:[${value.join(',')}]`)
        } else {
          filterParts.push(`${key}:=${value}`)
        }
      }
    }

    if (params.geoPoint) {
      const { lat, lng, radiusKm = 100 } = params.geoPoint
      filterParts.push(`location_geo:(${lat}, ${lng}, ${radiusKm} km)`)
      if (!params.sort) {
        searchParams.sort_by = `location_geo(${lat}, ${lng}):asc`
      }
    }

    if (filterParts.length) {
      searchParams.filter_by = filterParts.join(' && ')
    }

    const qs = new URLSearchParams(searchParams).toString()
    const res = await fetch(`${this.host}/collections/${this.collection}/documents/search?${qs}`, {
      headers: { 'X-TYPESENSE-API-KEY': this.apiKey },
    })

    if (!res.ok) {
      throw new Error(`Typesense search failed: ${res.status}`)
    }

    const body = (await res.json()) as {
      found: number
      hits: Array<{ document: Record<string, unknown>; text_match: number }>
      facet_counts?: Array<{ field_name: string; counts: Array<{ value: string; count: number }> }>
    }

    const facets: Record<string, FacetCount[]> = {}
    if (body.facet_counts) {
      for (const fc of body.facet_counts) {
        facets[fc.field_name] = fc.counts.map((c) => ({ value: c.value, count: c.count }))
      }
    }

    return {
      hits: body.hits.map((h) => ({
        id: String(h.document.id ?? ''),
        slug: String(h.document.slug ?? ''),
        brand: String(h.document.brand ?? ''),
        model: String(h.document.model ?? ''),
        year: h.document.year as number | null,
        price: h.document.price as number | null,
        location: h.document.location as string | null,
        location_province: h.document.location_province as string | null,
        location_country: h.document.location_country as string | null,
        category_id: h.document.category_id as string | null,
        dealer_id: h.document.dealer_id as string | null,
        created_at: String(h.document.created_at ?? ''),
        score: h.text_match / 10000000,
      })),
      totalHits: body.found,
      facets,
      page,
      totalPages: Math.ceil(body.found / limit),
      processingTimeMs: Date.now() - start,
      adapter: this.name,
    }
  }

  async indexDocuments(docs: IndexDocumentPayload[]): Promise<{ indexed: number }> {
    const ndjson = docs.map((d) => JSON.stringify(d)).join('\n')
    const res = await fetch(
      `${this.host}/collections/${this.collection}/documents/import?action=upsert`,
      {
        method: 'POST',
        headers: {
          'X-TYPESENSE-API-KEY': this.apiKey,
          'Content-Type': 'text/plain',
        },
        body: ndjson,
      },
    )

    if (!res.ok) {
      throw new Error(`Typesense index failed: ${res.status}`)
    }

    const lines = (await res.text()).trim().split('\n')
    const success = lines.filter((l) => {
      try {
        return JSON.parse(l).success
      } catch {
        return false
      }
    })

    return { indexed: success.length }
  }

  async removeDocument(id: string): Promise<void> {
    const res = await fetch(`${this.host}/collections/${this.collection}/documents/${id}`, {
      method: 'DELETE',
      headers: { 'X-TYPESENSE-API-KEY': this.apiKey },
    })
    if (!res.ok && res.status !== 404) {
      throw new Error(`Typesense delete failed: ${res.status}`)
    }
  }
}

// ── Meilisearch Adapter ──────────────────────────────────────────────────────

export class MeilisearchAdapter implements SearchAdapter {
  readonly name = 'meilisearch'
  private apiKey: string
  private host: string
  private index: string

  constructor(config?: { apiKey?: string; host?: string; index?: string }) {
    this.apiKey = config?.apiKey || process.env.MEILISEARCH_API_KEY || ''
    this.host = config?.host || process.env.MEILISEARCH_HOST || ''
    this.index = config?.index || process.env.MEILISEARCH_INDEX || 'vehicles'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.host) return false
    try {
      const headers: Record<string, string> = {}
      if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`
      const res = await fetch(`${this.host}/health`, {
        headers,
        signal: AbortSignal.timeout(3000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const start = Date.now()
    const limit = params.limit ?? 20
    const page = params.page ?? 1

    const body: Record<string, unknown> = {
      q: params.query || '',
      limit,
      offset: (page - 1) * limit,
    }

    if (params.facets?.length) {
      body.facets = params.facets
    }

    if (params.sort) {
      body.sort = [params.sort]
    }

    // Build filter array
    const filterParts: string[] = []
    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (value === null || value === undefined) continue
        if (Array.isArray(value)) {
          const orParts = value.map((v) => `${key} = "${v}"`)
          filterParts.push(`(${orParts.join(' OR ')})`)
        } else if (typeof value === 'number') {
          filterParts.push(`${key} = ${value}`)
        } else if (typeof value === 'boolean') {
          filterParts.push(`${key} = ${value}`)
        } else {
          filterParts.push(`${key} = "${value}"`)
        }
      }
    }

    if (params.geoPoint) {
      const { lat, lng, radiusKm = 100 } = params.geoPoint
      filterParts.push(`_geoRadius(${lat}, ${lng}, ${radiusKm * 1000})`)
      if (!params.sort) {
        body.sort = [`_geoPoint(${lat}, ${lng}):asc`]
      }
    }

    if (filterParts.length) {
      body.filter = filterParts.join(' AND ')
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`

    const res = await fetch(`${this.host}/indexes/${this.index}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`Meilisearch search failed: ${res.status}`)
    }

    const result = (await res.json()) as {
      hits: Array<Record<string, unknown> & { _rankingScore?: number }>
      estimatedTotalHits: number
      facetDistribution?: Record<string, Record<string, number>>
    }

    const facets: Record<string, FacetCount[]> = {}
    if (result.facetDistribution) {
      for (const [field, dist] of Object.entries(result.facetDistribution)) {
        facets[field] = Object.entries(dist).map(([value, count]) => ({
          value,
          count,
        }))
      }
    }

    return {
      hits: result.hits.map((h) => ({
        id: String(h.id ?? ''),
        slug: String(h.slug ?? ''),
        brand: String(h.brand ?? ''),
        model: String(h.model ?? ''),
        year: h.year as number | null,
        price: h.price as number | null,
        location: h.location as string | null,
        location_province: h.location_province as string | null,
        location_country: h.location_country as string | null,
        category_id: h.category_id as string | null,
        dealer_id: h.dealer_id as string | null,
        created_at: String(h.created_at ?? ''),
        score: (h._rankingScore as number) ?? 0,
      })),
      totalHits: result.estimatedTotalHits,
      facets,
      page,
      totalPages: Math.ceil(result.estimatedTotalHits / limit),
      processingTimeMs: Date.now() - start,
      adapter: this.name,
    }
  }

  async indexDocuments(docs: IndexDocumentPayload[]): Promise<{ indexed: number }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`

    const res = await fetch(`${this.host}/indexes/${this.index}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify(docs),
    })

    if (!res.ok) {
      throw new Error(`Meilisearch index failed: ${res.status}`)
    }

    return { indexed: docs.length }
  }

  async removeDocument(id: string): Promise<void> {
    const headers: Record<string, string> = {}
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`

    const res = await fetch(`${this.host}/indexes/${this.index}/documents/${id}`, {
      method: 'DELETE',
      headers,
    })
    if (!res.ok && res.status !== 404) {
      throw new Error(`Meilisearch delete failed: ${res.status}`)
    }
  }
}

// ── Postgres ilike fallback ──────────────────────────────────────────────────

export class PostgresFallbackAdapter implements SearchAdapter {
  readonly name = 'postgres'
  private supabaseQuery: (
    rpcName: string,
    params: Record<string, unknown>,
  ) => Promise<{
    data: unknown[] | null
    error: unknown
  }>

  constructor(
    supabaseQuery: (
      rpcName: string,
      params: Record<string, unknown>,
    ) => Promise<{
      data: unknown[] | null
      error: unknown
    }>,
  ) {
    this.supabaseQuery = supabaseQuery
  }

  async isAvailable(): Promise<boolean> {
    return true // Always available as fallback
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const start = Date.now()
    const limit = params.limit ?? 20
    const page = params.page ?? 1

    const rpcParams: Record<string, unknown> = {
      search_query: params.query || '',
      filter_category_id: params.filters?.category_id ?? null,
      filter_price_min: params.filters?.price_min ?? null,
      filter_price_max: params.filters?.price_max ?? null,
      filter_year_min: params.filters?.year_min ?? null,
      filter_year_max: params.filters?.year_max ?? null,
      filter_province: params.filters?.province ?? null,
      filter_country: params.filters?.country ?? null,
      cursor_id: null,
      cursor_rank: null,
      page_limit: limit,
    }

    const { data, error } = await this.supabaseQuery('search_vehicles', rpcParams)

    if (error) {
      throw new Error('Postgres search failed')
    }

    const results = (data ?? []) as Array<Record<string, unknown>>
    const totalEstimate =
      results.length > 0 ? ((results[0]!.total_estimate as number) ?? results.length) : 0

    return {
      hits: results.map((r, i) => ({
        id: String(r.id ?? ''),
        slug: String(r.slug ?? ''),
        brand: String(r.brand ?? ''),
        model: String(r.model ?? ''),
        year: r.year as number | null,
        price: r.price as number | null,
        location: r.location as string | null,
        location_province: r.location_province as string | null,
        location_country: r.location_country as string | null,
        category_id: r.category_id as string | null,
        dealer_id: r.dealer_id as string | null,
        created_at: String(r.created_at ?? ''),
        score: 1 - i / Math.max(results.length, 1),
      })),
      totalHits: totalEstimate,
      facets: {},
      page,
      totalPages: Math.ceil(totalEstimate / limit),
      processingTimeMs: Date.now() - start,
      adapter: this.name,
    }
  }

  async indexDocuments(_docs: IndexDocumentPayload[]): Promise<{ indexed: number }> {
    // No-op: Postgres uses live data, no index needed
    return { indexed: 0 }
  }

  async removeDocument(_id: string): Promise<void> {
    // No-op: Postgres uses live data
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

export type SearchEngineType = 'typesense' | 'meilisearch' | 'postgres'

/**
 * Create the appropriate search adapter based on configuration.
 * Priority: explicit type → SEARCH_ENGINE env → auto-detect → postgres fallback.
 */
export async function createSearchAdapter(
  type?: SearchEngineType,
  supabaseQuery?: (
    rpcName: string,
    params: Record<string, unknown>,
  ) => Promise<{
    data: unknown[] | null
    error: unknown
  }>,
): Promise<SearchAdapter> {
  const engineType = type || (process.env.SEARCH_ENGINE as SearchEngineType) || undefined

  if (engineType === 'typesense') {
    const adapter = new TypesenseAdapter()
    if (await adapter.isAvailable()) return adapter
    console.info('[searchEngine] Typesense configured but not available, falling back')
  }

  if (engineType === 'meilisearch') {
    const adapter = new MeilisearchAdapter()
    if (await adapter.isAvailable()) return adapter
    console.info('[searchEngine] Meilisearch configured but not available, falling back')
  }

  // Auto-detect if no explicit type
  if (!engineType) {
    if (process.env.TYPESENSE_API_KEY && process.env.TYPESENSE_HOST) {
      const ts = new TypesenseAdapter()
      if (await ts.isAvailable()) return ts
    }
    if (process.env.MEILISEARCH_HOST) {
      const ms = new MeilisearchAdapter()
      if (await ms.isAvailable()) return ms
    }
  }

  // Postgres fallback
  if (!supabaseQuery) {
    throw new Error(
      'No search engine available and no Supabase query function provided for fallback',
    )
  }
  return new PostgresFallbackAdapter(supabaseQuery)
}
