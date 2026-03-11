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
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="6" :cols="5" />
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
  gap: var(--spacing-4);
  height: 100%;
}

.productos-page.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--bg-secondary);
  padding: var(--spacing-5);
  overflow: auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.count-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

/* Error */
.alert-error {
  padding: var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  padding: var(--spacing-12);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state span {
  color: var(--text-auxiliary);
  font-size: var(--font-size-base);
}
</style>
