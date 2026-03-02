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
  // Constants
  FILTER_TYPES,
  FILTER_STATUSES,
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
      <button class="btn-primary" @click="openNewModal">+ Nueva</button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando caracteristicas...</div>

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
      :filter-types="FILTER_TYPES"
      :filter-statuses="FILTER_STATUSES"
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
  gap: 12px;
  margin-bottom: 24px;
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
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.error-banner {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
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
