import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { retryQuery } from '~/utils/retryQuery'
import type { Vehicle, VehicleFilters } from './shared/vehiclesTypes'
import { applyFilters } from './shared/vehiclesHelpers'

// Re-export types for backward compatibility
export type {
  VehicleImage,
  Category,
  SubcategoryCategoryJunction,
  VehicleSubcategory,
  Vehicle,
  VehicleFilters,
} from './shared/vehiclesTypes'

const PAGE_SIZE = 20

export function useVehicles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient() as any

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
    const { count } = await query as any // NOSONAR: Supabase builders implement PromiseLike but are not native Promises
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
