import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

export interface VehicleImage {
  id: string
  url: string
  thumbnail_url: string | null
  position: number
  alt_text: string | null
}

export interface VehicleType {
  id: string
  name_es: string
  name_en: string | null
  slug: string
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
  type_id: string | null
  location: string | null
  description_es: string | null
  description_en: string | null
  filters_json: Record<string, unknown>
  location_country: string | null
  location_province: string | null
  location_region: string | null
  status: string
  featured: boolean
  created_at: string
  updated_at: string
  vehicle_images: VehicleImage[]
  types: VehicleType | null
}

export interface VehicleFilters {
  category?: 'alquiler' | 'venta' | 'terceros'
  categories?: string[]
  type_id?: string
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
      .select('*, vehicle_images(*), types(*)', { count: 'exact' })
      .eq('status', 'published')

    // Dynamic sort — featured always first, then user-selected order
    query = query.order('featured', { ascending: false })

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

    if (filters.categories?.length) {
      query = query.in('category', filters.categories)
    }
    else if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.type_id) {
      query = query.eq('type_id', filters.type_id)
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
    }
    else if (filters.location_regions?.length) {
      query = query.in('location_region', filters.location_regions)
    }
    else if (filters.location_countries?.length) {
      query = query.in('location_country', filters.location_countries)
    }

    if (filters.featured) {
      query = query.eq('featured', true)
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

      const { data, error: err, count } = await buildQuery(filters).range(from, to)

      if (err) throw err

      vehicles.value = (data as Vehicle[]) || []
      total.value = count || 0
      hasMore.value = vehicles.value.length < total.value
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching vehicles'
      vehicles.value = []
    }
    finally {
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

      const { data, error: err } = await buildQuery(filters).range(from, to)

      if (err) throw err

      const newVehicles = (data as Vehicle[]) || []
      vehicles.value = [...vehicles.value, ...newVehicles]
      hasMore.value = vehicles.value.length < total.value
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching more vehicles'
      page.value--
    }
    finally {
      loadingMore.value = false
    }
  }

  async function fetchBySlug(slug: string): Promise<Vehicle | null> {
    const { data, error: err } = await supabase
      .from('vehicles')
      .select('*, vehicle_images(*), types(*)')
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
