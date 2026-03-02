<script setup lang="ts">
/**
 * Catalog Export Tool
 * Export dealer vehicle catalog as CSV (column-selectable) or professional PDF.
 * Plan: Basico+ (requires canExport from subscription).
 */
import { useDashboardExportar } from '~/composables/dashboard/useDashboardExportar'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  loading,
  exporting,
  error,
  statusFilter,
  categoryFilter,
  exportFormat,
  csvColumns,
  vehicleCount,
  availableCategories,
  selectedColumnsCount,
  canExport,
  dealerProfile,
  getColumnLabel,
  handleExport,
  toggleColumn,
  toggleAllColumns,
  init,
} = useDashboardExportar()

useHead({ title: t('dashboard.tools.export.title') })

onMounted(() => {
  init()
})
</script>

<template>
  <div class="export-page">
    <DashboardHerramientasExportarExportPageHeader />

    <!-- Plan gate -->
    <DashboardHerramientasExportarExportPlanGate v-if="!canExport" />

    <template v-else>
      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <template v-else>
        <DashboardHerramientasExportarExportOptionsCard
          :status-filter="statusFilter"
          :category-filter="categoryFilter"
          :export-format="exportFormat"
          :available-categories="availableCategories"
          :vehicle-count="vehicleCount"
          @update:status-filter="statusFilter = $event"
          @update:category-filter="categoryFilter = $event"
          @update:export-format="exportFormat = $event"
        />

        <!-- CSV Column selection -->
        <DashboardHerramientasExportarExportColumnSelector
          v-if="exportFormat === 'csv'"
          :csv-columns="csvColumns"
          :selected-columns-count="selectedColumnsCount"
          :get-column-label="getColumnLabel"
          @toggle-column="toggleColumn"
          @toggle-all-columns="toggleAllColumns"
        />

        <!-- PDF preview info -->
        <DashboardHerramientasExportarExportPdfPreview
          v-if="exportFormat === 'pdf'"
          :vehicle-count="vehicleCount"
          :company-name="dealerProfile?.company_name || '--'"
        />

        <DashboardHerramientasExportarExportActionButton
          :exporting="exporting"
          :vehicle-count="vehicleCount"
          :export-format="exportFormat"
          @export="handleExport"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.export-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.9rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .export-page {
    padding: 24px;
  }
}
</style>
