<script setup lang="ts">
import {
  useAdminSubcategoriasPage,
  VEHICLE_CATEGORIES,
} from '~/composables/admin/useAdminSubcategoriasPage'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  subcategories,
  loading,
  saving,
  error,
  showModal,
  editingId,
  formData,
  deleteModal,
  availableFilters,
  canDelete,
  init,
  getFilterNames,
  getCategoryLabels,
  openNewModal,
  openEditModal,
  closeModal,
  updateFormField,
  toggleFormArrayItem,
  saveSubcategory,
  confirmDelete,
  closeDeleteModal,
  updateDeleteConfirmText,
  executeDelete,
  handleToggleStatus,
  handleMoveUp,
  handleMoveDown,
} = useAdminSubcategoriasPage()

onMounted(() => init())
</script>

<template>
  <div class="admin-subcategorias">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.configCatalog.title') }}</h2>
      <button class="btn-primary" @click="openNewModal">+ Nueva</button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('common.loadingItems') }}</div>

    <!-- Table -->
    <AdminConfigSubcategoriasSubcategoriasTable
      v-else
      :subcategories="subcategories"
      :saving="saving"
      :get-category-labels="getCategoryLabels"
      :get-filter-names="getFilterNames"
      @toggle-status="handleToggleStatus"
      @move-up="handleMoveUp"
      @move-down="handleMoveDown"
      @edit="openEditModal"
      @delete="confirmDelete"
    />

    <!-- Edit/Create Modal -->
    <AdminConfigSubcategoriasSubcategoriasFormModal
      :show="showModal"
      :editing-id="editingId"
      :form-data="formData"
      :saving="saving"
      :error="error"
      :available-filters="availableFilters"
      :vehicle-categories="VEHICLE_CATEGORIES"
      @close="closeModal"
      @save="saveSubcategory"
      @update-field="updateFormField"
      @toggle-array-item="toggleFormArrayItem"
    />

    <!-- Delete Confirmation Modal -->
    <AdminConfigSubcategoriasSubcategoriasDeleteModal
      :delete-modal="deleteModal"
      :saving="saving"
      :can-delete="canDelete"
      @close="closeDeleteModal"
      @confirm="executeDelete"
      @update-confirm-text="updateDeleteConfirmText"
    />
  </div>
</template>

<style scoped>
.admin-subcategorias {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: stretch;
  }
}
</style>
