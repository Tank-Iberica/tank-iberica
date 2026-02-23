<template>
  <div class="home">
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

      <CatalogVehicleGrid
        :vehicles="vehicles"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :view-mode="viewMode"
        @load-more="onLoadMore"
        @clear-filters="onClearFilters"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { buildProductName } from '~/utils/productName'

const { t, locale } = useI18n()
const menuVisible = ref(true)
const { vehicles, loading, loadingMore, hasMore, fetchVehicles, fetchMore } = useVehicles()
const { filters, activeCategoryId, activeSubcategoryId, sortBy, viewMode, resetCatalog } =
  useCatalogState()
const {
  fetchByCategoryAndSubcategory,
  clearAll: clearAllFilters,
  reset: resetFilters,
} = useFilters()

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
  await fetchVehicles({ ...filters.value, sortBy: sortBy.value })
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
