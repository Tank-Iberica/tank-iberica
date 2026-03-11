<script setup lang="ts">
/**
 * Dealer Sales History Page
 * Shows sold vehicles for the current dealer with filters, summary, and export.
 */
import { useDashboardHistorico } from '~/composables/dashboard/useDashboardHistorico'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  loading,
  saving,
  error,
  availableYears,
  availableBrands,
  filters,
  sortCol,
  sortAsc,
  showDetailModal,
  detailEntry,
  showRestoreModal,
  restoreTarget,
  restoreConfirm,
  showExportModal,
  exportDataScope,
  canRestore,
  summary,
  sortedEntries,
  fetchEntries,
  handleRestore,
  exportCSV,
  openDetailModal,
  closeDetailModal,
  openRestoreModal,
  closeRestoreModal,
  openExportModal,
  closeExportModal,
  toggleSort,
  getSortIcon,
  fmt,
  fmtDate,
  clearFilters,
  setFilterYear,
  setFilterBrand,
  setFilterSearch,
  setRestoreConfirm,
  setExportDataScope,
  init,
} = useDashboardHistorico()

onMounted(init)

watch(
  filters,
  () => {
    fetchEntries()
  },
  { deep: true },
)
</script>

<template>
  <div class="historico-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('dashboard.historico.title') }}</h1>
      <button class="btn btn-export" @click="openExportModal">
        {{ t('dashboard.historico.export') }}
      </button>
    </header>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <!-- Summary Cards -->
    <HistoricoSummaryCards :summary="summary" :fmt="fmt" />

    <!-- Filters -->
    <HistoricoFilters
      :filter-year="filters.year"
      :filter-brand="filters.brand"
      :search-query="filters.search"
      :available-years="availableYears"
      :available-brands="availableBrands"
      @update:filter-year="setFilterYear"
      @update:filter-brand="setFilterBrand"
      @update:search-query="setFilterSearch"
      @clear="clearFilters"
    />

    <!-- Record count -->
    <div class="record-count">
      {{ sortedEntries.length }} {{ t('dashboard.historico.records') }}
    </div>

    <!-- Table -->
    <HistoricoTable
      :entries="sortedEntries"
      :loading="loading"
      :sort-col="sortCol"
      :sort-asc="sortAsc"
      :fmt="fmt"
      :fmt-date="fmtDate"
      :get-sort-icon="getSortIcon"
      @toggle-sort="toggleSort"
      @view-detail="openDetailModal"
      @restore-entry="openRestoreModal"
    />

    <!-- Detail Modal -->
    <HistoricoDetailModal
      :show="showDetailModal"
      :entry="detailEntry"
      :fmt="fmt"
      :fmt-date="fmtDate"
      @close="closeDetailModal"
    />

    <!-- Restore Modal -->
    <HistoricoRestoreModal
      :show="showRestoreModal"
      :target="restoreTarget"
      :confirm-text="restoreConfirm"
      :can-restore="canRestore"
      :saving="saving"
      @close="closeRestoreModal"
      @confirm="handleRestore"
      @update:confirm-text="setRestoreConfirm"
    />

    <!-- Export Modal -->
    <HistoricoExportModal
      :show="showExportModal"
      :export-scope="exportDataScope"
      @close="closeExportModal"
      @confirm="exportCSV"
      @update:export-scope="setExportDataScope"
    />
  </div>
</template>

<style scoped>
.historico-page {
  max-width: 75rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.btn-export {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-export:hover {
  background: var(--color-primary-dark);
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.9rem;
}

.record-count {
  font-size: 0.85rem;
  color: var(--color-gray-500);
}

@media (min-width: 48em) {
  .historico-page {
    padding: var(--spacing-6);
    gap: var(--spacing-5);
  }
}
</style>
