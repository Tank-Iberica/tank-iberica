<script setup lang="ts">
import { useAdminBalanceUI } from '~/composables/admin/useAdminBalanceUI'
import type { BalanceFilters } from '~/composables/admin/useAdminBalance'

const { locale } = useI18n()

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // Data layer (re-exported from useAdminBalance)
  loading,
  saving,
  error,
  total,
  availableYears,
  summary,
  fetchEntries,
  calculateProfit,

  // Related data
  types,
  fetchTypes,
  subcategories,
  fetchSubcategories,
  vehicles,
  fetchVehicles,

  // Filters
  filters,
  clearFilters,

  // Modal state
  showModal,
  editingId,
  formData,
  showDeleteModal,
  deleteTarget,
  deleteConfirm,
  canDelete,

  // Export state
  showExportModal,
  showExportResumenModal,
  exportFormat,
  exportDataScope,
  exportColumns,
  resumenOptions,

  // View state
  showDesglose,
  showCharts,
  chartType,
  isFullscreen,
  balanceSection,

  // Sort
  sortedEntries,
  toggleSort,
  getSortIcon,

  // Modal actions
  openNewModal,
  openEditModal,
  handleSave,
  openDeleteModal,
  handleDelete,

  // Export
  exportBalance,
  exportResumen,

  // Chart data
  chartRazonData,
  chartSubcatData,

  // Options
  reasonOptions,
  statusOptions,

  // Fullscreen
  toggleFullscreen,
} = useAdminBalanceUI()

// Load data
onMounted(async () => {
  await Promise.all([fetchEntries(filters), fetchSubcategories(), fetchTypes(), fetchVehicles()])
})

// Watch filters
watch(
  filters,
  () => {
    fetchEntries(filters)
  },
  { deep: true },
)

// Filter update handler from FiltersBar child
function updateFilters(newFilters: BalanceFilters & { type_id?: string | null }) {
  Object.assign(filters, newFilters)
}
</script>

<template>
  <div ref="balanceSection" class="balance-page" :class="{ fullscreen: isFullscreen }">
    <!-- Header -->
    <header class="page-header">
      <h1>Balance</h1>
      <div class="header-actions">
        <button class="btn btn-icon-only" title="Pantalla completa" @click="toggleFullscreen">
          &#x26F6;
        </button>
        <button class="btn" @click="showExportResumenModal = true">
          &#x1F4CA; Exportar Resumen
        </button>
        <button class="btn" @click="showExportModal = true">&#x1F4E5; Exportar</button>
        <button class="btn btn-primary" @click="openNewModal">+ Nueva Transaccion</button>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Summary Cards -->
    <AdminBalanceSummaryCards :summary="summary" />

    <!-- Filters -->
    <AdminBalanceFiltersBar
      :filters="filters"
      :available-years="availableYears"
      :reason-options="reasonOptions"
      :status-options="statusOptions"
      :subcategories="subcategories"
      :types="types"
      :locale="locale"
      @update:filters="updateFilters"
      @clear="clearFilters"
    />

    <!-- View Toggles -->
    <AdminBalanceViewToggles
      :show-desglose="showDesglose"
      :show-charts="showCharts"
      :chart-type="chartType"
      :total="total"
      @update:show-desglose="showDesglose = $event"
      @update:show-charts="showCharts = $event"
      @update:chart-type="chartType = $event"
    />

    <!-- Desglose -->
    <AdminBalanceDesgloseGrid
      :show-desglose="showDesglose"
      :reason-options="reasonOptions"
      :summary="summary"
    />

    <!-- Charts -->
    <AdminBalanceCharts
      :show-charts="showCharts"
      :chart-type="chartType"
      :chart-razon-data="chartRazonData"
      :chart-subcat-data="chartSubcatData"
    />

    <!-- Data Table -->
    <AdminBalanceDataTable
      :loading="loading"
      :sorted-entries="sortedEntries"
      :locale="locale"
      :get-sort-icon="getSortIcon"
      :calculate-profit="calculateProfit"
      @toggle-sort="toggleSort"
      @edit="openEditModal"
      @delete="openDeleteModal"
    />

    <!-- Entry Form Modal -->
    <AdminBalanceFormModal
      v-model:form-data="formData"
      :show="showModal"
      :editing-id="editingId"
      :saving="saving"
      :reason-options="reasonOptions"
      :status-options="statusOptions"
      :vehicles="vehicles"
      :types="types"
      :locale="locale"
      :calculate-profit="calculateProfit"
      @close="showModal = false"
      @save="handleSave"
    />

    <!-- Delete Modal -->
    <AdminBalanceDeleteModal
      :show="showDeleteModal"
      :delete-target="deleteTarget"
      :delete-confirm="deleteConfirm"
      :can-delete="canDelete"
      :saving="saving"
      @close="showDeleteModal = false"
      @confirm-delete="handleDelete"
      @update:delete-confirm="deleteConfirm = $event"
    />

    <!-- Export Balance Modal -->
    <AdminBalanceExportModal
      :show="showExportModal"
      :export-format="exportFormat"
      :export-data-scope="exportDataScope"
      :export-columns="exportColumns"
      @close="showExportModal = false"
      @export="exportBalance"
      @update:export-format="exportFormat = $event"
      @update:export-data-scope="exportDataScope = $event"
      @update:export-columns="Object.assign(exportColumns, $event)"
    />

    <!-- Export Resumen Modal -->
    <AdminBalanceExportResumenModal
      :show="showExportResumenModal"
      :export-format="exportFormat"
      :resumen-options="resumenOptions"
      @close="showExportResumenModal = false"
      @export="exportResumen"
      @update:export-format="exportFormat = $event"
      @update:resumen-options="Object.assign(resumenOptions, $event)"
    />
  </div>
</template>

<style scoped>
.balance-page {
  max-width: 1200px;
  margin: 0 auto;
}
.balance-page.fullscreen {
  max-width: none;
  padding: 20px;
  background: #f9fafb;
  min-height: 100vh;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Page-level buttons */
.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}
.btn-icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

/* Error */
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
}

/* Mobile */
@media (max-width: 768px) {
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
