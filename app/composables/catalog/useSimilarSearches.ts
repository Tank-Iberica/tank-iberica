import { ref } from 'vue'
import { useVehicles, type VehicleFilters } from '~/composables/useVehicles'
import { useGeoFallback } from '~/composables/catalog/useGeoFallback'
import { useCatalogState } from '~/composables/useCatalogState'

export interface SearchSuggestion {
  /** i18n key for the label */
  labelKey: string
  /** params to pass to $t(labelKey, params) */
  labelParams?: Record<string, unknown>
  filters: VehicleFilters
  count: number
}

/** A cascade level groups suggestions by number of relaxed filters */
export interface CascadeLevel {
  /** How many filters were relaxed (1, 2, or 3) */
  depth: number
  suggestions: SearchSuggestion[]
  loaded: boolean
  loading: boolean
}

const PRICE_RANGE_FACTOR = 0.2 // ±20%
const YEAR_RANGE_DELTA = 2 // ±2 years

// Max suggestions per cascade level (depth 1/2/3)
const MAX_PER_LEVEL: Record<number, number> = { 1: 8, 2: 6, 3: 4 }

type RelaxationKey = 'brand' | 'price' | 'year' | 'location'

interface Relaxation {
  key: RelaxationKey
  labelKey: string
  labelParams?: Record<string, unknown>
  apply: (f: VehicleFilters) => VehicleFilters
}

export function useSimilarSearches() {
  const { fetchCount } = useVehicles()
  const { getNextLevelFilters } = useGeoFallback()
  const { locationLevel } = useCatalogState()

  // Simple mode (backward compat): flat list, max 3
  const suggestions = ref<SearchSuggestion[]>([])
  const loading = ref(false)

  // Cascade mode: grouped by depth
  const cascade = ref<CascadeLevel[]>([
    { depth: 1, suggestions: [], loaded: false, loading: false },
    { depth: 2, suggestions: [], loaded: false, loading: false },
    { depth: 3, suggestions: [], loaded: false, loading: false },
  ])

  // Build available single-filter relaxations for the current filters
  function buildRelaxations(filters: VehicleFilters): Relaxation[] {
    const relaxations: Relaxation[] = []

    // Location is priority — always first if available
    const nextFilters = getNextLevelFilters(filters, locationLevel.value)
    if (nextFilters) {
      relaxations.push({
        key: 'location',
        labelKey: 'catalog.similarWiderArea',
        apply: () => nextFilters,
      })
    }

    // Remove brand
    if (filters.brand) {
      relaxations.push({
        key: 'brand',
        labelKey: 'catalog.similarNoBrand',
        labelParams: { brand: filters.brand },
        apply: (f) => {
          const { brand: _b, ...rest } = f
          return rest
        },
      })
    }

    // Widen price
    if (filters.price_min !== undefined || filters.price_max !== undefined) {
      relaxations.push({
        key: 'price',
        labelKey: 'catalog.similarWiderPrice',
        apply: (f) => {
          const widened = { ...f }
          if (f.price_min !== undefined)
            widened.price_min = Math.floor(f.price_min * (1 - PRICE_RANGE_FACTOR))
          if (f.price_max !== undefined)
            widened.price_max = Math.ceil(f.price_max * (1 + PRICE_RANGE_FACTOR))
          return widened
        },
      })
    }

    // Widen year
    if (filters.year_min !== undefined || filters.year_max !== undefined) {
      relaxations.push({
        key: 'year',
        labelKey: 'catalog.similarWiderYear',
        apply: (f) => {
          const widened = { ...f }
          if (f.year_min !== undefined) widened.year_min = f.year_min - YEAR_RANGE_DELTA
          if (f.year_max !== undefined) widened.year_max = f.year_max + YEAR_RANGE_DELTA
          return widened
        },
      })
    }

    return relaxations
  }

  // Generate combinations of N items from an array
  function combinations<T>(arr: T[], n: number): T[][] {
    if (n === 0) return [[]]
    if (n > arr.length) return []
    const result: T[][] = []
    for (let i = 0; i <= arr.length - n; i++) {
      const rest = combinations(arr.slice(i + 1), n - 1)
      for (const combo of rest) {
        result.push([arr[i]!, ...combo])
      }
    }
    return result
  }

  // Build label for a multi-relaxation combo
  function buildComboLabel(relaxations: Relaxation[]): {
    labelKey: string
    labelParams?: Record<string, unknown>
  } {
    // For single relaxation, use its own label
    if (relaxations.length === 1) {
      return { labelKey: relaxations[0]!.labelKey, labelParams: relaxations[0]!.labelParams }
    }

    // For multi: combine into a comma-separated i18n key
    const keys = relaxations.map((r) => r.key).sort()
    return {
      labelKey: `catalog.similarCombo.${keys.join('_')}`,
      labelParams: relaxations[0]?.labelParams,
    }
  }

  // Apply multiple relaxations to filters (compose left-to-right)
  function applyRelaxations(filters: VehicleFilters, relaxations: Relaxation[]): VehicleFilters {
    let result = { ...filters }
    for (const r of relaxations) {
      result = r.apply(result)
    }
    return result
  }

  // ── Simple mode — backward compatible (used in CatalogEmptyState / few results) ──

  async function generateSuggestions(filters: VehicleFilters, currentCount = 0): Promise<void> {
    loading.value = true
    suggestions.value = []

    const relaxations = buildRelaxations(filters)
    const results: SearchSuggestion[] = []

    for (const r of relaxations) {
      const relaxedFilters = r.apply({ ...filters })
      const count = await fetchCount(relaxedFilters)
      if (count > currentCount) {
        results.push({
          labelKey: r.labelKey,
          labelParams: r.labelParams,
          filters: relaxedFilters,
          count,
        })
      }
    }

    suggestions.value = results.sort((a, b) => b.count - a.count).slice(0, 3)

    loading.value = false
  }

  // ── Cascade mode — for end-of-catalog alternative searches ──

  function resetCascade() {
    for (const level of cascade.value) {
      level.suggestions = []
      level.loaded = false
      level.loading = false
    }
  }

  /**
   * Load one cascade level (depth 1, 2, or 3).
   * Called lazily: depth 1 on first load, depth 2 when user scrolls / clicks "more".
   */
  async function loadCascadeLevel(
    depth: number,
    filters: VehicleFilters,
    currentCount = 0,
  ): Promise<void> {
    const levelIdx = depth - 1
    const level = cascade.value[levelIdx]
    if (!level || level.loaded || level.loading) return

    level.loading = true
    const relaxations = buildRelaxations(filters)
    const combos = combinations(relaxations, depth)
    const max = MAX_PER_LEVEL[depth] ?? 4

    const results: SearchSuggestion[] = []

    for (const combo of combos) {
      if (results.length >= max) break

      const relaxedFilters = applyRelaxations(filters, combo)
      const count = await fetchCount(relaxedFilters)

      if (count > currentCount) {
        const { labelKey, labelParams } = buildComboLabel(combo)
        results.push({
          labelKey,
          labelParams,
          filters: relaxedFilters,
          count,
        })
      }
    }

    level.suggestions = results.sort((a, b) => b.count - a.count)
    level.loaded = true
    level.loading = false
  }

  function clearSuggestions() {
    suggestions.value = []
    resetCascade()
  }

  /** Total number of cascade suggestions across all loaded levels */
  const cascadeTotal = computed(() =>
    cascade.value.reduce((sum, l) => sum + l.suggestions.length, 0),
  )

  /** Whether there are more cascade levels to load */
  const hasMoreCascadeLevels = computed(() => cascade.value.some((l) => !l.loaded))

  return {
    // Simple mode
    suggestions,
    loading,
    generateSuggestions,
    clearSuggestions,

    // Cascade mode
    cascade,
    cascadeTotal,
    hasMoreCascadeLevels,
    loadCascadeLevel,
    resetCascade,
  }
}
