<script setup lang="ts">
import { useAdminCaracteristicas } from '~/composables/admin/useAdminCaracteristicas'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // State
  filters,
  loading,
  saving,
  error,
  showModal,
  editingId,
  formData,
  choiceInput,
  deleteModal,
  // Computed
  canDelete,
  availableFiltersForSelection,
  showTickOptions,
  showChoicesOptions,
  showCalcOptions,
  showSliderInfo,
  // Options
  filterTypeOptions,
  filterStatusOptions,
  // Modal
  openNewModal,
  openEditModal,
  closeModal,
  saveFilter,
  // Form field updates
  updateFormField,
  toggleArrayItem,
  updateChoiceInput,
  // Choice management
  addChoice,
  removeChoice,
  // Delete
  closeDeleteModal,
  confirmDeleteFilter,
  updateDeleteConfirmText,
  executeDelete,
  // Reorder
  handleMoveUp,
  handleMoveDown,
  // Display helpers
  getTypeLabel,
  getStatusClass,
  getStatusLabel,
  getExtraFiltersDisplay,
  getHidesDisplay,
  // Init
  init,
} = useAdminCaracteristicas()

onMounted(async () => {
  await init()
})
</script>

<template>
  <div class="admin-caracteristicas">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.configCaracteristicas.title') }}</h2>
      <button class="btn-primary" @click="openNewModal">+ {{ $t('common.create') }}</button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('common.loadingItems') }}</div>

    <!-- Table -->
    <AdminConfigCaracteristicasCaracteristicasTable
      v-else
      :filters="filters"
      :saving="saving"
      :get-type-label="getTypeLabel"
      :get-status-class="getStatusClass"
      :get-status-label="getStatusLabel"
      :get-extra-filters-display="getExtraFiltersDisplay"
      :get-hides-display="getHidesDisplay"
      @edit="openEditModal"
      @delete="confirmDeleteFilter"
      @move-up="handleMoveUp"
      @move-down="handleMoveDown"
    />

    <!-- Edit/Create Modal -->
    <AdminConfigCaracteristicasCaracteristicasFormModal
      :show="showModal"
      :editing-id="editingId"
      :form-data="formData"
      :choice-input="choiceInput"
      :saving="saving"
      :show-tick-options="showTickOptions"
      :show-choices-options="showChoicesOptions"
      :show-calc-options="showCalcOptions"
      :show-slider-info="showSliderInfo"
      :available-filters-for-selection="availableFiltersForSelection"
      :filter-types="filterTypeOptions"
      :filter-statuses="filterStatusOptions"
      @close="closeModal"
      @save="saveFilter"
      @update-field="updateFormField"
      @toggle-array-item="toggleArrayItem"
      @update-choice-input="updateChoiceInput"
      @add-choice="addChoice"
      @remove-choice="removeChoice"
    />

    <!-- Delete Confirmation Modal -->
    <AdminConfigCaracteristicasCaracteristicasDeleteModal
      :show="deleteModal.show"
      :filter="deleteModal.filter"
      :confirm-text="deleteModal.confirmText"
      :saving="saving"
      :can-delete="canDelete"
      @close="closeDeleteModal"
      @confirm="executeDelete"
      @update-confirm-text="updateDeleteConfirmText"
    />
  </div>
</template>

<style scoped>
.admin-caracteristicas {
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
