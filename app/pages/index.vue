<template>
  <div class="home">
    <h1 class="sr-only">{{ $t('seo.homeH1') }}</h1>
    <section class="catalog-section">
      <CatalogCategoryBar
        v-show="menuVisible"
        @category-change="onCategoryChange"
        @subcategory-change="onSubcategoryChange"
      />
      <CatalogFilterBar v-show="menuVisible" :vehicles="vehicles" @change="onFilterChange" />

      <CatalogControlsBar
        :vehicle-count="vehicles.length"
        :menu-visible="menuVisible"
        @search="onSearchChange"
        @sort="onSortChange"
        @toggle-menu="menuVisible = !menuVisible"
        @action-change="onActionChange"
        @open-favorites="
          () => {
            /* favorites filter handled inside ControlsBar */
          }
        "
        @view-change="() => {}"
      />

      <CatalogActiveFilters @change="onFilterChange" />

      <CatalogVehicleGrid
        :vehicles="vehicles"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :view-mode="viewMode"
        :is-few-results="showFewResults"
        :location-level="locationLevel"
        :next-level="nextLevel"
        :next-level-count="nextLevelCount"
        :next-level-count-loading="nextLevelCountLoading"
        :suggestions="suggestions"
        :suggestions-loading="suggestionsLoading"
        :hidden-count="hiddenCount"
        :hours-until-next="hoursUntilNext"
        :cascade-levels="cascade"
        :has-more-cascade-levels="hasMoreCascadeLevels"
        @load-more="onLoadMore"
        @clear-filters="onClearFilters"
        @open-demand="onOpenDemand"
        @create-alert="onCreateAlert"
        @expand-area="onExpandArea"
        @apply-suggestion="onApplySuggestion"
        @unlock-hidden="onUnlockHidden"
        @load-more-cascade="onLoadMoreCascade"
      />
    </section>

    <!-- DemandModal is provided globally by default.vue layout via provide('openDemandModal') -->
  </div>
</template>

<script setup lang="ts">
import { buildProductName } from '~/utils/productName'
import type { LocationLevel } from '~/utils/geoData'
import type { VehicleFilters } from '~/composables/useVehicles'
import { useGeoFallback } from '~/composables/catalog/useGeoFallback'
import { useSimilarSearches } from '~/composables/catalog/useSimilarSearches'
import { useHiddenVehicles } from '~/composables/catalog/useHiddenVehicles'

const { t, locale } = useI18n()
const menuVisible = ref(true)
const { vehicles, loading, loadingMore, hasMore, total, fetchVehicles, fetchMore } = useVehicles()
const {
  filters,
  activeCategoryId,
  activeSubcategoryId,
  sortBy,
  viewMode,
  locationLevel,
  setLocationLevel,
  resetCatalog,
} = useCatalogState()
const {
  fetchByCategoryAndSubcategory,
  clearAll: clearAllFilters,
  reset: resetFilters,
} = useFilters()

// Geo-fallback
const {
  getNextLevel,
  isFewResults,
  fetchNextLevelCount,
  escalateToNextLevel,
  nextLevelCount,
  nextLevelCountLoading,
} = useGeoFallback()

// Similar searches + cascade
const {
  suggestions,
  loading: suggestionsLoading,
  generateSuggestions,
  clearSuggestions,
  cascade,
  hasMoreCascadeLevels,
  loadCascadeLevel,
  resetCascade,
} = useSimilarSearches()

// Hidden vehicles (early access)
const { hiddenCount, hoursUntilNext, fetchHiddenVehicles } = useHiddenVehicles()

// User location (for pills)
const { location: userLocation } = useUserLocation()

// Track which cascade level to load next
const nextCascadeDepth = ref(1)

// Demand modal — provided globally by default.vue
const openDemandModal = inject<() => void>('openDemandModal', () => {})

const nextLevel = computed(() => getNextLevel(locationLevel.value))
const showFewResults = computed(() => isFewResults(locationLevel.value, total.value))

usePageSeo({
  title: t('seo.homeTitle'),
  description: t('seo.homeDescription'),
  path: '/',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tracciona',
    url: 'https://tracciona.com',
    description: t('seo.homeDescription'),
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://tracciona.com/?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
})

// ItemList JSON-LD — injected dynamically after vehicles load
const itemListJsonLd = computed(() => {
  if (!vehicles.value.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('seo.homeTitle'),
    numberOfItems: vehicles.value.length,
    itemListElement: vehicles.value.slice(0, 20).map((v, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://tracciona.com/vehiculo/${v.slug}`,
      name: buildProductName(v, locale.value, true),
      ...(v.vehicle_images?.[0]?.url ? { image: v.vehicle_images[0].url } : {}),
    })),
  }
})

useHead({
  script: computed(() => {
    if (!itemListJsonLd.value) return []
    return [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(itemListJsonLd.value),
      },
    ]
  }),
})

async function loadVehicles() {
  clearSuggestions()
  resetCascade()
  nextCascadeDepth.value = 1
  await fetchVehicles({ ...filters.value, sortBy: sortBy.value })

  // Fetch hidden vehicles count (for the split card)
  void fetchHiddenVehicles(filters.value)

  // After load: if 0 or few results, pre-fetch next level count and generate suggestions
  if (total.value === 0 || isFewResults(locationLevel.value, total.value)) {
    await fetchNextLevelCount(filters.value)
    await generateSuggestions(filters.value, total.value)
  }

  // Pre-load cascade level 1 for end-of-catalog suggestions
  void loadCascadeLevel(1, filters.value, total.value)
}

// User chose a pill level directly (called from FilterBarLocationPicker via inject)
async function onLevelChange(level: LocationLevel) {
  const country = userLocation.value?.country ?? 'ES'
  const province = userLocation.value?.province ?? null
  const region = userLocation.value?.region ?? null
  setLocationLevel(level, country, province, region)
  await loadVehicles()
}
provide('onLevelChange', onLevelChange)

// User clicked "expand area" card
async function onExpandArea() {
  escalateToNextLevel()
  await loadVehicles()
}

// User clicked a similar search suggestion
async function onApplySuggestion(suggFilters: VehicleFilters) {
  // Merge suggestion filters into catalog state
  Object.assign(filters.value, suggFilters)
  await loadVehicles()
}

// Open the global demand modal
function onOpenDemand() {
  openDemandModal()
}

// Create alert reuses the existing save-search logic in ControlsBar
function onCreateAlert() {
  const saveBtn = document.querySelector<HTMLButtonElement>('[data-save-search]')
  saveBtn?.click()
}

// Unlock hidden vehicles — navigate to credits page (flow TBD)
function onUnlockHidden() {
  navigateTo('/precios#creditos')
}

// Load more cascade levels (lazy)
async function onLoadMoreCascade() {
  nextCascadeDepth.value++
  if (nextCascadeDepth.value <= 3) {
    await loadCascadeLevel(nextCascadeDepth.value, filters.value, total.value)
  }
}

async function onActionChange() {
  resetFilters()
  await loadVehicles()
}

async function onCategoryChange() {
  clearAllFilters()
  await fetchByCategoryAndSubcategory(activeCategoryId.value, activeSubcategoryId.value)
  await loadVehicles()
}

async function onSubcategoryChange() {
  clearAllFilters()
  await fetchByCategoryAndSubcategory(activeCategoryId.value, activeSubcategoryId.value)
  await loadVehicles()
}

async function onFilterChange() {
  await loadVehicles()
}

function onSearchChange() {
  // Search is client-side fuzzy — no refetch needed
}

async function onSortChange() {
  await loadVehicles()
}

async function onLoadMore() {
  await fetchMore({ ...filters.value, sortBy: sortBy.value })
}

async function onClearFilters() {
  resetCatalog()
  resetFilters()
  await fetchVehicles({})
}

defineOptions({ name: 'Index' })

const { saveScrollPosition, scrollPosition } = useCatalogState()

onMounted(loadVehicles)

onActivated(() => {
  if (scrollPosition.value) {
    nextTick(() => {
      window.scrollTo(0, scrollPosition.value)
    })
  }
})

onDeactivated(() => {
  saveScrollPosition(window.scrollY)
})
</script>

<style scoped>
.home {
  min-height: calc(100vh - var(--header-height));
}

.catalog-section {
  padding-bottom: var(--spacing-8);
}
</style>
