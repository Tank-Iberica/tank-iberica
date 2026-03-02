import { ref } from 'vue'
import type { VehicleFilters } from '~/composables/useVehicles'

/**
 * Counts vehicles matching current filters that are published but not yet visible
 * (visible_from > now). These are "early access" vehicles that Pro users or
 * credit holders can unlock before they become publicly visible.
 */
export function useHiddenVehicles() {
  const supabase = useSupabaseClient()

  const hiddenCount = ref(0)
  const hoursUntilNext = ref<number | null>(null)
  const loading = ref(false)

  /**
   * Fetch count of hidden vehicles and the earliest visible_from.
   * Uses the same filter shape as useVehicles but inverts the visible_from condition.
   */
  async function fetchHiddenVehicles(filters: VehicleFilters): Promise<void> {
    // DEV MOCK — simula 3 vehículos ocultos llegando en 12h
    // Eliminar cuando haya datos reales en BD con visible_from futuro
    if (import.meta.dev) {
      loading.value = true
      await new Promise((r) => setTimeout(r, 300)) // simula latencia
      hiddenCount.value = 3
      hoursUntilNext.value = 12
      loading.value = false
      return
    }

    loading.value = true
    try {
      const now = new Date().toISOString()

      // Count hidden vehicles
      let countQuery = supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gt('visible_from', now)

      countQuery = applyNonLocationFilters(countQuery, filters)
      countQuery = applyLocationFilters(countQuery, filters)

      const { count, error: countErr } = await countQuery
      if (countErr) throw countErr
      hiddenCount.value = count ?? 0

      // Get earliest visible_from to compute hours
      if (hiddenCount.value > 0) {
        let earliestQuery = supabase
          .from('vehicles')
          .select('visible_from')
          .eq('status', 'published')
          .gt('visible_from', now)
          .order('visible_from', { ascending: true })
          .limit(1)

        earliestQuery = applyNonLocationFilters(earliestQuery, filters)
        earliestQuery = applyLocationFilters(earliestQuery, filters)

        const { data } = await earliestQuery.maybeSingle()
        if (data?.visible_from) {
          const diff = new Date(data.visible_from).getTime() - Date.now()
          hoursUntilNext.value = Math.max(1, Math.round(diff / (1000 * 60 * 60)))
        } else {
          hoursUntilNext.value = null
        }
      } else {
        hoursUntilNext.value = null
      }
    } catch {
      hiddenCount.value = 0
      hoursUntilNext.value = null
    } finally {
      loading.value = false
    }
  }

  /** Apply non-location filters (category, price, year, brand) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyNonLocationFilters(query: any, filters: VehicleFilters) {
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters.subcategory_id) {
      query = query.eq('subcategory_id', filters.subcategory_id)
    }
    if ((filters.actions || filters.categories)?.length) {
      query = query.in('category', (filters.actions || filters.categories!) as never)
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
      query = query.ilike('brand', filters.brand)
    }
    return query
  }

  /** Apply location filters */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyLocationFilters(query: any, filters: VehicleFilters) {
    if (filters.location_province_eq) {
      query = query.eq('location_province', filters.location_province_eq)
    }
    if (filters.location_regions?.length) {
      query = query.in('location_region', filters.location_regions)
    }
    if (filters.location_countries?.length) {
      query = query.in('location_country', filters.location_countries)
    }
    return query
  }

  const showHidden = computed(() => hiddenCount.value > 0 && !loading.value)

  return {
    hiddenCount,
    hoursUntilNext,
    loading,
    showHidden,
    fetchHiddenVehicles,
  }
}
