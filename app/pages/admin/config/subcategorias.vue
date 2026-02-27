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
      <h2>Subcategorias</h2>
      <button class="btn-primary" @click="openNewModal">+ Nueva</button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando subcategorias...</div>

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
  gap: 12px;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
