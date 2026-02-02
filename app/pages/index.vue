<template>
  <div class="home">
    <section class="catalog-section">
      <CatalogCategoryBar @change="onCategoryChange" />
      <CatalogSubcategoryBar @change="onSubcategoryChange" />
      <CatalogFilterBar @change="onFilterChange" />
      <CatalogCatalogControls
        :vehicle-count="vehicles.length"
        @search="onSearchChange"
        @sort="onSortChange"
        @toggle-menu="menuVisible = !menuVisible"
        @open-solicitar="() => {}"
        @open-favorites="() => {}"
        @view-change="() => {}"
      />

      <CatalogVehicleGrid
        :vehicles="vehicles"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
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
const { filters, activeSubcategoryId, resetCatalog } = useCatalogState()
const { fetchBySubcategory, clearAll: clearAllFilters, reset: resetFilters } = useFilters()

useSeoMeta({
  title: 'Tank Iberica',
  description: t('site.description'),
  ogTitle: 'Tank Iberica',
  ogDescription: t('site.description'),
})

async function loadVehicles() {
  await fetchVehicles(filters.value)
}

async function onCategoryChange() {
  resetFilters()
  await loadVehicles()
}

async function onSubcategoryChange() {
  clearAllFilters()
  if (activeSubcategoryId.value) {
    await fetchBySubcategory(activeSubcategoryId.value)
  }
  else {
    resetFilters()
  }
  await loadVehicles()
}

async function onFilterChange() {
  await loadVehicles()
}

async function onSearchChange() {
  await loadVehicles()
}

async function onSortChange() {
  await loadVehicles()
}

async function onLoadMore() {
  await fetchMore(filters.value)
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
