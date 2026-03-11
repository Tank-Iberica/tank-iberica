<script setup lang="ts">
import { useAdminTiposPage } from '~/composables/admin/useAdminTiposPage'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  types,
  loading,
  saving,
  error,
  showModal,
  editingId,
  formData,
  deleteModal,
  availableFilters,
  availableSubcategories,
  canDelete,
  init,
  getSubcategoryNames,
  getFilterNames,
  openNewModal,
  openEditModal,
  closeModal,
  updateFormField,
  toggleFormArrayItem,
  saveType,
  confirmDelete,
  closeDeleteModal,
  updateDeleteConfirmText,
  executeDelete,
  handleToggleStatus,
  handleMoveUp,
  handleMoveDown,
} = useAdminTiposPage()

onMounted(() => init())
</script>

<template>
  <div class="admin-tipos">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.configTipos.title') }}</h2>
      <button class="btn-primary" @click="openNewModal">+ Nuevo</button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('common.loadingItems') }}</div>

    <!-- Table -->
    <AdminConfigTiposTiposTable
      v-else
      :types="types"
      :saving="saving"
      :get-subcategory-names="getSubcategoryNames"
      :get-filter-names="getFilterNames"
      @toggle-status="handleToggleStatus"
      @move-up="handleMoveUp"
      @move-down="handleMoveDown"
      @edit="openEditModal"
      @delete="confirmDelete"
    />

    <!-- Edit/Create Modal -->
    <AdminConfigTiposTiposFormModal
      :show="showModal"
      :editing-id="editingId"
      :form-data="formData"
      :saving="saving"
      :available-filters="availableFilters"
      :available-subcategories="availableSubcategories"
      @close="closeModal"
      @save="saveType"
      @update-field="updateFormField"
      @toggle-array-item="toggleFormArrayItem"
    />

    <!-- Delete Confirmation Modal -->
    <AdminConfigTiposTiposDeleteModal
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
.admin-tipos {
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
