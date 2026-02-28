import { getSortedEuropeanCountries, getSortedProvinces } from '~/utils/geoData'
import type { Vehicle } from '~/composables/useVehicles'
import type { AttributeDefinition, ActiveFilters } from '~/composables/useFilters'

export type { AttributeDefinition, ActiveFilters }

export type EuropeanCountriesData = ReturnType<typeof getSortedEuropeanCountries>

export function useFilterBar(
  getVehicles: () => readonly Vehicle[] | undefined,
  onEmit: () => void,
) {
  const { t, locale } = useI18n()
  const { visibleFilters, activeFilters, setFilter, clearFilter, clearAll } = useFilters()
  const { updateFilters, filters, locationLevel, setLocationLevel, setCategory, setSubcategory } =
    useCatalogState()
  const { location: userLocation, detect: detectLocation, setManualLocation } = useUserLocation()

  const open = ref(false)
  const advancedOpen = ref(false)

  const editCountry = ref(userLocation.value.country || '')
  const editProvince = ref(userLocation.value.province || '')

  const europeanCountriesData = computed(() => getSortedEuropeanCountries(locale.value))
  const provinces = computed(() => getSortedProvinces())

  const locationTriggerText = computed(() => {
    if (editProvince.value) return editProvince.value
    if (editCountry.value) {
      const all = [...europeanCountriesData.value.priority, ...europeanCountriesData.value.rest]
      const country = all.find((c) => c.code === editCountry.value)
      return country ? `${country.flag} ${country.name}` : editCountry.value
    }
    return t('catalog.locationAll')
  })

  watch(
    () => userLocation.value,
    (newLoc) => {
      if (newLoc.country && !editCountry.value) {
        editCountry.value = newLoc.country
        setLocationLevel('nacional', newLoc.country, null, null)
      }
      if (newLoc.province && !editProvince.value) {
        editProvince.value = newLoc.province
      }
    },
    { deep: true },
  )

  function onCountrySelect(e: Event) {
    const code = (e.target as HTMLSelectElement).value
    editCountry.value = code
    editProvince.value = ''
    if (code) {
      setManualLocation('', code)
      setLocationLevel('nacional', code, null, null)
    } else {
      setLocationLevel(null, '', null, null)
    }
    onEmit()
  }

  function onProvinceSelect(e: Event) {
    const prov = (e.target as HTMLSelectElement).value
    editProvince.value = prov
    if (prov) {
      setManualLocation(prov, 'ES', prov)
      setLocationLevel('provincia', 'ES', prov, null)
    } else {
      setLocationLevel('nacional', 'ES', null, null)
    }
    onEmit()
  }

  onMounted(async () => {
    await detectLocation()
    if (userLocation.value.country && !editCountry.value) {
      editCountry.value = userLocation.value.country
    }
    if (userLocation.value.province && !editProvince.value) {
      editProvince.value = userLocation.value.province
    }
  })

  const currentYear = new Date().getFullYear()
  const hasFilters = computed(() => true)

  const priceMin = computed(() => filters.value.price_min ?? null)
  const priceMax = computed(() => filters.value.price_max ?? null)
  const yearMin = computed(() => filters.value.year_min ?? null)
  const yearMax = computed(() => filters.value.year_max ?? null)
  const selectedBrand = computed(() => filters.value.brand ?? '')

  const brands = computed(() => {
    const set = new Set<string>()
    for (const v of getVehicles() ?? []) {
      if (v.brand) set.add(v.brand)
    }
    return [...set].sort()
  })

  const totalActiveCount = computed(() => {
    let count = Object.keys(activeFilters.value).length
    if (priceMin.value) count++
    if (priceMax.value) count++
    if (yearMin.value) count++
    if (yearMax.value) count++
    if (selectedBrand.value) count++
    if (locationLevel.value && locationLevel.value !== 'mundo') count++
    return count
  })

  const dynamicActiveCount = computed(() => Object.keys(activeFilters.value).length)
  const filtersForFilterBar = computed<AttributeDefinition[]>(() => visibleFilters.value)

  function formatPriceLabel(n: number): string {
    if (n >= 1000) return `${Math.round(n / 1000)}k`
    return String(n)
  }

  function onPriceSliderMin(val: number | null) {
    updateFilters({ price_min: val ?? undefined })
    onEmit()
  }

  function onPriceSliderMax(val: number | null) {
    updateFilters({ price_max: val ?? undefined })
    onEmit()
  }

  function onYearSliderMin(val: number | null) {
    updateFilters({ year_min: val ?? undefined })
    onEmit()
  }

  function onYearSliderMax(val: number | null) {
    updateFilters({ year_max: val ?? undefined })
    onEmit()
  }

  function onBrandChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value
    updateFilters({ brand: val || undefined })
    onEmit()
  }

  function onDynamicSelect(name: string, value: string) {
    if (value) setFilter(name, value)
    else clearFilter(name)
    onEmit()
  }

  function onDynamicCheck(name: string, option: string) {
    const current = (activeFilters.value[name] as string[]) || []
    const index = current.indexOf(option)
    if (index >= 0) {
      const next = current.filter((v) => v !== option)
      if (next.length) setFilter(name, next)
      else clearFilter(name)
    } else {
      setFilter(name, [...current, option])
    }
    onEmit()
  }

  function onDynamicTick(name: string) {
    if (activeFilters.value[name]) clearFilter(name)
    else setFilter(name, true)
    onEmit()
  }

  function onDynamicRange(name: string, value: number | null) {
    if (value) setFilter(name, value)
    else clearFilter(name)
    onEmit()
  }

  function onDynamicText(name: string, value: string) {
    if (value) setFilter(name, value)
    else clearFilter(name)
    onEmit()
  }

  function handleClearAll() {
    clearAll()
    setCategory(null, null)
    setSubcategory(null, null)
    updateFilters({
      price_min: undefined,
      price_max: undefined,
      year_min: undefined,
      year_max: undefined,
      brand: undefined,
      location_countries: undefined,
      location_regions: undefined,
      location_province_eq: undefined,
      category_id: undefined,
      subcategory_id: undefined,
    })
    setLocationLevel('nacional', 'ES', null, null)
    editCountry.value = 'ES'
    editProvince.value = ''
    open.value = false
    onEmit()
  }

  // Body scroll lock when mobile advanced sheet is open
  watch(open, (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
  })

  onUnmounted(() => {
    document.body.style.overflow = ''
  })

  return {
    open,
    advancedOpen,
    editCountry,
    editProvince,
    europeanCountriesData,
    provinces,
    locationTriggerText,
    currentYear,
    hasFilters,
    priceMin,
    priceMax,
    yearMin,
    yearMax,
    selectedBrand,
    brands,
    totalActiveCount,
    dynamicActiveCount,
    filtersForFilterBar,
    activeFilters,
    formatPriceLabel,
    onCountrySelect,
    onProvinceSelect,
    onPriceSliderMin,
    onPriceSliderMax,
    onYearSliderMin,
    onYearSliderMax,
    onBrandChange,
    onDynamicSelect,
    onDynamicCheck,
    onDynamicTick,
    onDynamicRange,
    onDynamicText,
    handleClearAll,
  }
}
