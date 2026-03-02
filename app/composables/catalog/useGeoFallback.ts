import { ref } from 'vue'
import { type LocationLevel, getCountriesForLevel, getRegionsForLevel } from '~/utils/geoData'
import { useVehicles, type VehicleFilters } from '~/composables/useVehicles'
import { useCatalogState } from '~/composables/useCatalogState'
import { useUserLocation } from '~/composables/useUserLocation'

// Ordered from most specific to widest
const LEVEL_ORDER: LocationLevel[] = [
  'provincia',
  'comunidad',
  'limitrofes',
  'nacional',
  'suroeste_europeo',
  'union_europea',
  'europa',
  'mundo',
]

// Minimum results before we show "few results" cards
const FEW_RESULTS_THRESHOLDS: Record<LocationLevel, number> = {
  provincia: 3,
  comunidad: 5,
  limitrofes: 8,
  nacional: 10,
  suroeste_europeo: 15,
  union_europea: 20,
  europa: 20,
  mundo: 0, // never show "few results" at world level
}

export function useGeoFallback() {
  const { fetchCount } = useVehicles()
  const { locationLevel, setLocationLevel } = useCatalogState()
  const { location: userLocation } = useUserLocation()

  const nextLevelCount = ref(0)
  const nextLevelCountLoading = ref(false)

  function getNextLevel(current: LocationLevel | null): LocationLevel | null {
    if (!current) return null
    const idx = LEVEL_ORDER.indexOf(current)
    if (idx === -1 || idx >= LEVEL_ORDER.length - 1) return null
    return LEVEL_ORDER[idx + 1]!
  }

  function isFewResults(level: LocationLevel | null, count: number): boolean {
    if (!level) return false
    const threshold = FEW_RESULTS_THRESHOLDS[level] ?? 0
    return count > 0 && count < threshold
  }

  // Builds VehicleFilters for the next level up, keeping non-location filters from current
  function getNextLevelFilters(
    currentFilters: VehicleFilters,
    current: LocationLevel | null,
  ): VehicleFilters | null {
    const next = getNextLevel(current)
    if (!next) return null

    const country = userLocation.value?.country ?? 'ES'
    const province = userLocation.value?.province ?? null
    const region = userLocation.value?.region ?? null

    // Strip location keys from current filters and apply next level
    const { location_province_eq, location_regions, location_countries, ...rest } = currentFilters

    const nextFilters: VehicleFilters = { ...rest }

    if (next === 'provincia' && province) {
      nextFilters.location_province_eq = province
    } else if (next === 'comunidad' || next === 'limitrofes') {
      const regions = getRegionsForLevel(next, region)
      if (regions) nextFilters.location_regions = regions
    } else {
      const countries = getCountriesForLevel(next, country)
      if (countries) nextFilters.location_countries = countries
      // 'mundo' → no location filter (getCountriesForLevel returns null)
    }

    return nextFilters
  }

  // Pre-fetch count for the next geo level — call after a low/zero-result fetch
  async function fetchNextLevelCount(currentFilters: VehicleFilters): Promise<void> {
    const current = locationLevel.value
    const nextFilters = getNextLevelFilters(currentFilters, current)
    if (!nextFilters) {
      nextLevelCount.value = 0
      return
    }

    nextLevelCountLoading.value = true
    try {
      nextLevelCount.value = await fetchCount(nextFilters)
    } finally {
      nextLevelCountLoading.value = false
    }
  }

  // Escalate the catalog to the next geo level and return the new filters
  function escalateToNextLevel(): VehicleFilters | null {
    const current = locationLevel.value
    const next = getNextLevel(current)
    if (!next) return null

    const country = userLocation.value?.country ?? 'ES'
    const province = userLocation.value?.province ?? null
    const region = userLocation.value?.region ?? null

    setLocationLevel(next, country, province, region)
    return null
  }

  // Human-readable label for a level, injecting province/region names where relevant
  function getLevelLabel(
    level: LocationLevel,
    province?: string | null,
    region?: string | null,
    country?: string | null,
  ): string {
    const countryName = country ?? userLocation.value?.country ?? 'ES'
    switch (level) {
      case 'provincia':
        return province ?? 'Mi provincia'
      case 'comunidad':
        return region ?? 'Mi comunidad'
      case 'limitrofes':
        return 'Cercanías'
      case 'nacional':
        return countryName === 'ES' ? 'España' : countryName
      case 'suroeste_europeo':
        return 'Suroeste de Europa'
      case 'union_europea':
        return 'Unión Europea'
      case 'europa':
        return 'Europa'
      case 'mundo':
        return 'Todo el mundo'
    }
  }

  return {
    LEVEL_ORDER,
    FEW_RESULTS_THRESHOLDS,
    nextLevelCount,
    nextLevelCountLoading,
    getNextLevel,
    isFewResults,
    getNextLevelFilters,
    fetchNextLevelCount,
    escalateToNextLevel,
    getLevelLabel,
  }
}
