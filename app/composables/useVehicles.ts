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

  function buildQuery(filters: VehicleFilters) {
    let query = supabase
      .from('vehicles')
      .select(
        '*, vehicle_images(*), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
        { count: 'exact' },
      )
      .eq('status', 'published')

    // Pro 24h exclusive: non-Pro users only see vehicles past their visible_from date
    // For now, always filter (Pro check will be added when subscription composable is wired)
    query = query.or('visible_from.is.null,visible_from.lte.' + new Date().toISOString())

    // Dynamic sort — featured always first, then sort_boost, then user-selected order
    query = query.order('featured', { ascending: false })

    // Dealer subscription sort boost (Premium=3, Founding=2, Basic=1, Free=0)
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
        // 'recommended' — just by created_at
        query = query.order('created_at', { ascending: false })
    }

    if ((filters.actions || filters.categories)?.length) {
      query = query.in('category', (filters.actions || filters.categories!) as never)
    } else if (filters.action || filters.category) {
      query = query.eq('category', (filters.action || filters.category!) as never)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.price_min !== undefined) {
      query = query.gte('price', filters.price_min)
    }

    if (filters.price_max !== undefined) {
      query = query.lte('price', filters.price_max)
    }

    if (filters.year_min !== undefined) {
      query = query.gte('year', filters.year_min)
    }

    if (filters.year_max !== undefined) {
      query = query.lte('year', filters.year_max)
    }

    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`)
    }

    // search is handled client-side with fuzzy matching (see VehicleGrid)

    // Location filters (mutually exclusive, most specific wins)
    if (filters.location_province_eq) {
      query = query.eq('location_province', filters.location_province_eq)
    } else if (filters.location_regions?.length) {
      query = query.in('location_region', filters.location_regions)
    } else if (filters.location_countries?.length) {
      query = query.in('location_country', filters.location_countries)
    }

    if (filters.featured) {
      query = query.eq('featured', true)
    }

    if (filters.dealer_id) {
      query = query.eq('dealer_id', filters.dealer_id)
    }

    return query
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
    reset,
  }
}
