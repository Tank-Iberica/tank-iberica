<template>
  <div class="home">
    <section class="catalog-section">
      <CatalogSubcategoryBar
        v-show="menuVisible"
        @subcategory-change="onSubcategoryChange"
        @type-change="onTypeChange"
      />
      <CatalogFilterBar v-show="menuVisible" :vehicles="vehicles" @change="onFilterChange" />
      <CatalogControlsBar
        :vehicle-count="vehicles.length"
        :menu-visible="menuVisible"
        @search="onSearchChange"
        @sort="onSortChange"
        @toggle-menu="menuVisible = !menuVisible"
        @category-change="onCategoryChange"
        @open-favorites="() => { /* favorites filter handled inside ControlsBar */ }"
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
const { t } = useI18n()
const menuVisible = ref(true)
const { vehicles, loading, loadingMore, hasMore, fetchVehicles, fetchMore } = useVehicles()
const { filters, activeSubcategoryId, activeTypeId, sortBy, viewMode, resetCatalog } = useCatalogState()
const { fetchBySubcategoryAndType, clearAll: clearAllFilters, reset: resetFilters } = useFilters()

usePageSeo({
  title: t('seo.homeTitle'),
  description: t('seo.homeDescription'),
  path: '/',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Tank Iberica',
    'url': 'https://tankiberica.com',
    'description': t('seo.homeDescription'),
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://tankiberica.com/?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
})

async function loadVehicles() {
  await fetchVehicles({ ...filters.value, sortBy: sortBy.value })
}

async function onCategoryChange() {
  resetFilters()
  await loadVehicles()
}

async function onSubcategoryChange() {
  clearAllFilters()
  await fetchBySubcategoryAndType(activeSubcategoryId.value, activeTypeId.value)
  await loadVehicles()
}

async function onTypeChange() {
  clearAllFilters()
  await fetchBySubcategoryAndType(activeSubcategoryId.value, activeTypeId.value)
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
