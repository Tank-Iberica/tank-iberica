<template>
  <div class="home">
    <AnnounceBanner />

    <section class="catalog-section">
      <h1 class="catalog-title">{{ $t('catalog.title') }}</h1>

      <CategoryBar @change="onCategoryChange" />
      <SubcategoryBar @change="onSubcategoryChange" />
      <FilterBar @change="onFilterChange" />

      <VehicleGrid
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

async function onLoadMore() {
  await fetchMore(filters.value)
}

async function onClearFilters() {
  resetCatalog()
  resetFilters()
  await fetchVehicles({})
}

defineOptions({ name: 'index' })

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

.catalog-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-2);
}

@media (min-width: 768px) {
  .catalog-title {
    font-size: var(--font-size-3xl);
  }
}
</style>
