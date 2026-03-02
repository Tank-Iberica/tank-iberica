import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { retryQuery } from '~/utils/retryQuery'

export interface VehicleImage {
  id: string
  url: string
  thumbnail_url: string | null
  position: number
  alt_text: string | null
}

export interface Category {
  id: string
  name: Record<string, string> | null
  name_singular: Record<string, string> | null
  /** @deprecated Use JSONB `name` field instead */
  name_es: string
  /** @deprecated Use JSONB `name` field instead */
  name_en: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_es: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_en: string | null
}

export interface SubcategoryCategoryJunction {
  categories: Category
}

export interface VehicleSubcategory {
  id: string
  name: Record<string, string> | null
  name_singular: Record<string, string> | null
  /** @deprecated Use JSONB `name` field instead */
  name_es: string
  /** @deprecated Use JSONB `name` field instead */
  name_en: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_es: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_en: string | null
  slug: string
  subcategory_categories?: SubcategoryCategoryJunction[]
}

export interface Vehicle {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  rental_price: number | null
  category: 'alquiler' | 'venta' | 'terceros'
  action_id: string | null
  category_id: string | null
  location: string | null
  location_en: string | null
  location_data: Record<string, string> | null
  /** @deprecated Will use content_translations */
  description_es: string | null
  /** @deprecated Will use content_translations */
  description_en: string | null
  attributes_json: Record<string, unknown>
  location_country: string | null
  location_province: string | null
  location_region: string | null
  status: string
  featured: boolean
  created_at: string
  updated_at: string
  vehicle_images: VehicleImage[]
  subcategories: VehicleSubcategory | null
}

export interface VehicleFilters {
  category?: 'alquiler' | 'venta' | 'terceros'
  action?: string
  categories?: string[]
  actions?: string[]
  category_id?: string
  subcategory_id?: string
  price_min?: number
  price_max?: number
  year_min?: number
  year_max?: number
  brand?: string
  search?: string
  featured?: boolean
  sortBy?: string
  location_countries?: string[]
  location_regions?: string[]
  location_province_eq?: string
  dealer_id?: string
  [key: string]: unknown
}

const PAGE_SIZE = 20

export function useVehicles() {
  const supabase = useSupabaseClient()

  const vehicles = ref<Vehicle[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const page = ref(0)
  const total = ref(0)

  // Applies catalog filters (location, category, price, year, brand) to any query.
  // Used by both buildQuery (full select) and fetchCount (head-only).
   
  function applyFilters<T extends ReturnType<typeof supabase.from>>(
    query: T,
    filters: VehicleFilters,
  ): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = query as any

    q = q.or('visible_from.is.null,visible_from.lte.' + new Date().toISOString())

    if ((filters.actions || filters.categories)?.length) {
      q = q.in('category', (filters.actions || filters.categories!) as never)
    } else if (filters.action || filters.category) {
      q = q.eq('category', (filters.action || filters.category!) as never)
    }

    if (filters.category_id) q = q.eq('category_id', filters.category_id)
    if (filters.price_min !== undefined) q = q.gte('price', filters.price_min)
    if (filters.price_max !== undefined) q = q.lte('price', filters.price_max)
    if (filters.year_min !== undefined) q = q.gte('year', filters.year_min)
    if (filters.year_max !== undefined) q = q.lte('year', filters.year_max)
    if (filters.brand) q = q.ilike('brand', `%${filters.brand}%`)

    // Location filters (mutually exclusive, most specific wins)
    if (filters.location_province_eq) {
      q = q.eq('location_province', filters.location_province_eq)
    } else if (filters.location_regions?.length) {
      q = q.in('location_region', filters.location_regions)
    } else if (filters.location_countries?.length) {
      q = q.in('location_country', filters.location_countries)
    }

    if (filters.featured) q = q.eq('featured', true)
    if (filters.dealer_id) q = q.eq('dealer_id', filters.dealer_id)

    return q as T
  }

  function buildQuery(filters: VehicleFilters) {
    let query = supabase
      .from('vehicles')
      .select(
        '*, vehicle_images(*), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
        { count: 'exact' },
      )
      .eq('status', 'published')

    query = applyFilters(query, filters)

    // Dynamic sort — featured always first, then sort_boost, then user-selected order
    query = query.order('featured', { ascending: false })
    query = query.order('sort_boost', { ascending: false, nullsFirst: false })

    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true, nullsFirst: false })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false, nullsFirst: false })
        break
      case 'year_asc':
        query = query.order('year', { ascending: true, nullsFirst: false })
        break
      case 'year_desc':
        query = query.order('year', { ascending: false, nullsFirst: false })
        break
      case 'brand_az':
        query = query.order('brand', { ascending: true })
        break
      case 'brand_za':
        query = query.order('brand', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    return query
  }

  // Lightweight count-only query — no data returned, no pagination, no sorting.
  // Used by useGeoFallback and useSimilarSearches to pre-fetch counts for next-level hints.
  async function fetchCount(filters: VehicleFilters): Promise<number> {
    const base = supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    const query = applyFilters(base, filters)
    const { count } = await query
    return count ?? 0
  }

  async function fetchVehicles(filters: VehicleFilters = {}) {
    loading.value = true
    error.value = null
    page.value = 0

    try {
      const from = 0
      const to = PAGE_SIZE - 1

      const result = await retryQuery(async () => await buildQuery(filters).range(from, to))

      if (result.error) throw result.error

      vehicles.value = (result.data as Vehicle[]) || []
      total.value = result.count || 0
      hasMore.value = vehicles.value.length < total.value

      // Log zero-result searches to surface unmet demand
      if (import.meta.client && total.value === 0) {
        void supabase.from('search_logs').insert({
          query: (filters as Record<string, unknown>).q ?? null,
          filters: filters as never,
          results_count: 0,
          session_id: sessionStorage.getItem('analytics_session_id') ?? null,
        } as never)
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching vehicles'
      vehicles.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchMore(filters: VehicleFilters = {}) {
    if (!hasMore.value || loadingMore.value) return

    loadingMore.value = true

    try {
      page.value++
      const from = page.value * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const result = await retryQuery(async () => await buildQuery(filters).range(from, to))

      if (result.error) throw result.error

      const newVehicles = (result.data as Vehicle[]) || []
      vehicles.value = [...vehicles.value, ...newVehicles]
      hasMore.value = vehicles.value.length < total.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching more vehicles'
      page.value--
    } finally {
      loadingMore.value = false
    }
  }

  async function fetchBySlug(slug: string): Promise<Vehicle | null> {
    const { data, error: err } = await supabase
      .from('vehicles')
      .select(
        '*, vehicle_images(*), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .order('position', { referencedTable: 'vehicle_images', ascending: true })
      .single()

    if (err) {
      error.value = err.message
      return null
    }

    return data as Vehicle
  }

  function reset() {
    vehicles.value = []
    page.value = 0
    hasMore.value = true
    error.value = null
    total.value = 0
  }

  return {
    vehicles,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    fetchVehicles,
    fetchMore,
    fetchBySlug,
    fetchCount,
    reset,
  }
}
