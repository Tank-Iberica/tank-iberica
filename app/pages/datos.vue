<script setup lang="ts">
import { useDatos } from '~/composables/useDatos'

definePageMeta({ layout: 'default' })

const { t } = useI18n()

const {
  loading,
  hasData,
  lastUpdated,
  categoryStats,
  selectedCategory,
  selectedCategoryStat,
  brandBreakdown,
  chartData,
  chartOptions,
  sortedProvinces,
  provinceSortKey,
  provinceSortAsc,
  datasetSchema,
  fetchData,
  selectCategory,
  toggleProvinceSort,
} = useDatos()

await fetchData()

usePageSeo({
  title: t('data.seoTitle'),
  description: t('data.seoDescription'),
  path: '/datos',
  type: 'website',
  jsonLd: datasetSchema.value,
})
</script>

<template>
  <div class="datos-page">
    <DatosHero :last-updated="lastUpdated" />

    <div class="datos-content">
      <!-- Loading state -->
      <div v-if="loading" class="datos-loading">
        <div class="datos-loading__spinner" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!hasData" class="datos-empty">
        <div class="datos-empty__icon" aria-hidden="true">&#128202;</div>
        <p class="datos-empty__text">{{ $t('data.noData') }}</p>
      </div>

      <template v-else>
        <DatosCategoryGrid
          :categories="categoryStats"
          :selected-category="selectedCategory"
          @select="selectCategory"
        />

        <DatosCategoryDetail
          :category-stat="selectedCategoryStat"
          :brand-breakdown="brandBreakdown"
        />

        <DatosPriceChart
          :chart-data="chartData"
          :chart-options="chartOptions as Record<string, unknown>"
        />

        <DatosProvinceTable
          :provinces="sortedProvinces"
          :sort-key="provinceSortKey"
          :sort-asc="provinceSortAsc"
          @sort="toggleProvinceSort"
        />

        <DatosCta />

        <!-- Disclaimer -->
        <p class="datos-disclaimer">{{ $t('data.disclaimer') }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.datos-page {
  min-height: 60vh;
  background: var(--bg-secondary);
}

.datos-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-16);
}

.datos-loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-16) 0;
}

.datos-loading__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.datos-empty {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-4);
}

.datos-empty__icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  opacity: 0.5;
}

.datos-empty__text {
  font-size: var(--font-size-lg);
  color: var(--text-auxiliary);
  max-width: 400px;
  margin: 0 auto;
  line-height: var(--line-height-relaxed);
}

.datos-disclaimer {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: center;
  line-height: var(--line-height-relaxed);
  max-width: 640px;
  margin: 0 auto;
  padding-top: var(--spacing-4);
}

@media (min-width: 480px) {
  .datos-content {
    padding-left: var(--spacing-6);
    padding-right: var(--spacing-6);
  }
}
</style>
