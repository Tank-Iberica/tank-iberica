<script setup lang="ts">
import { useAdminProductosPage } from '~/composables/admin/useAdminProductosPage'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // State
  total,
  loading,
  error,
  filters,
  onlineFilter,
  hasActiveFilters,
  subcategories,
  filteredTypes,
  sortField,
  sortOrder,
  sortedVehicles,
  isFullscreen,
  selectedIds,
  activeModal,
  modalData,
  favCounts,
  columnGroups,
  columnOrder,
  allColumns,
  availableColumnsForGroups,
  activeFilterColumns,
  draggedColumn,
  driveConnected,
  driveLoading,
  // Actions
  init,
  cleanup,
  clearFilters,
  toggleSort,
  toggleFullscreen,
  toggleSelection,
  updateSelectAll,
  toggleGroup,
  isGroupActive,
  openDeleteModal,
  openExportModal,
  openTransactionModal,
  openConfigModal,
  closeModal,
  executeDelete,
  executeExport,
  executeTransaction,
  handleStatusChange,
  exportVehicleFicha,
  openDriveFolder,
  connectDrive,
  onDragStart,
  onDragOver,
  onDragEnd,
  createGroup,
  deleteGroup,
  resetConfig,
  // Helpers
  formatPrice,
  getSubcategoryForVehicle,
  getSubcategoryName,
  getFilterValue,
  getStatusClass,
  getCategoryClass,
  getThumbnail,
} = useAdminProductosPage()

onMounted(() => init())
onUnmounted(() => cleanup())
</script>

<template>
  <div class="productos-page" :class="{ fullscreen: isFullscreen }">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>{{ $t('admin.productos.title') }}</h1>
        <span class="count-badge">{{ total }}</span>
      </div>
      <NuxtLink to="/admin/productos/nuevo" class="btn-primary"> + Nuevo Producto </NuxtLink>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <!-- Filters -->
      <AdminProductosFilters
        v-model:filters="filters"
        v-model:online-filter="onlineFilter"
        :subcategories="subcategories"
        :filtered-types="filteredTypes"
        :has-active-filters="hasActiveFilters"
        @clear="clearFilters"
      />

      <!-- Toolbar Actions -->
      <AdminProductosToolbar
        :column-groups="columnGroups"
        :drive-connected="driveConnected"
        :drive-loading="driveLoading"
        :selected-count="selectedIds.size"
        :is-fullscreen="isFullscreen"
        @toggle-group="toggleGroup"
        @connect-drive="connectDrive"
        @open-config="openConfigModal"
        @open-export="openExportModal"
        @toggle-fullscreen="toggleFullscreen"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ $t('admin.productos.loading') }}</span>
    </div>

    <!-- Table -->
    <AdminProductosTable
      v-else
      :vehicles="sortedVehicles"
      :selected-ids="selectedIds"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :is-group-active="isGroupActive"
      :active-filter-columns="activeFilterColumns"
      :fav-counts="favCounts"
      :has-active-filters="hasActiveFilters"
      :drive-loading="driveLoading"
      :get-subcategory-for-vehicle="getSubcategoryForVehicle"
      :get-subcategory-name="getSubcategoryName"
      :format-price="formatPrice"
      :get-filter-value="getFilterValue"
      :get-status-class="getStatusClass"
      :get-category-class="getCategoryClass"
      :get-thumbnail="getThumbnail"
      @update:select-all="updateSelectAll"
      @toggle-selection="toggleSelection"
      @toggle-sort="toggleSort"
      @status-change="handleStatusChange"
      @delete="openDeleteModal"
      @export-ficha="exportVehicleFicha"
      @transaction="openTransactionModal"
      @open-drive-folder="openDriveFolder"
      @clear-filters="clearFilters"
    />

    <!-- Delete Modal -->
    <AdminProductosDeleteModal
      :show="activeModal === 'delete'"
      :vehicle="modalData.vehicle || null"
      :confirm-text="modalData.confirmText || ''"
      @update:confirm-text="(v) => (modalData.confirmText = v)"
      @close="closeModal"
      @confirm="executeDelete"
    />

    <!-- Export Modal -->
    <AdminProductosExportModal
      :show="activeModal === 'export'"
      :export-format="modalData.exportFormat || 'pdf'"
      :export-scope="modalData.exportScope || 'filtered'"
      :filtered-count="sortedVehicles.length"
      :selected-count="selectedIds.size"
      :total-count="total"
      @update:export-format="(v) => (modalData.exportFormat = v)"
      @update:export-scope="(v) => (modalData.exportScope = v)"
      @close="closeModal"
      @confirm="executeExport"
    />

    <!-- Transaction Modal -->
    <AdminProductosTransactionModal
      :show="activeModal === 'transaction'"
      :vehicle="modalData.vehicle || null"
      :transaction-type="modalData.transactionType || 'rent'"
      :rent-from="modalData.rentFrom || ''"
      :rent-to="modalData.rentTo || ''"
      :rent-client="modalData.rentClient || ''"
      :rent-amount="modalData.rentAmount || ''"
      :sell-date="modalData.sellDate || ''"
      :sell-buyer="modalData.sellBuyer || ''"
      :sell-price="modalData.sellPrice || ''"
      @update:transaction-type="(v) => (modalData.transactionType = v)"
      @update:rent-from="(v) => (modalData.rentFrom = v)"
      @update:rent-to="(v) => (modalData.rentTo = v)"
      @update:rent-client="(v) => (modalData.rentClient = v)"
      @update:rent-amount="(v) => (modalData.rentAmount = v)"
      @update:sell-date="(v) => (modalData.sellDate = v)"
      @update:sell-buyer="(v) => (modalData.sellBuyer = v)"
      @update:sell-price="(v) => (modalData.sellPrice = v)"
      @close="closeModal"
      @confirm="executeTransaction"
    />

    <!-- Config Modal -->
    <AdminProductosConfigModal
      :show="activeModal === 'config'"
      :column-groups="columnGroups"
      :column-order="columnOrder"
      :all-columns="allColumns"
      :available-columns-for-groups="availableColumnsForGroups"
      :dragged-column="draggedColumn"
      @update:column-groups="(v) => (columnGroups = v)"
      @update:column-order="(v) => (columnOrder = v)"
      @drag-start="onDragStart"
      @drag-over="onDragOver"
      @drag-end="onDragEnd"
      @create-group="createGroup"
      @delete-group="deleteGroup"
      @reset-config="resetConfig"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
/* Base Layout */
.productos-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.productos-page.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #f8fafc;
  padding: 20px;
  overflow: auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a3238;
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Error */
.alert-error {
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state span {
  color: #64748b;
  font-size: 16px;
}
</style>
