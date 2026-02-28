<template>
  <div class="vehicle-form-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <NuxtLink to="/admin/vehiculos" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </NuxtLink>
        <h1 class="page-title">
          {{
            isNew ? $t('admin.vehiculosIndex.newVehicle') : $t('admin.vehiculosIndex.editVehicle')
          }}
        </h1>
      </div>
      <div class="header-actions">
        <button
          v-if="!isNew"
          class="btn-secondary btn-rent"
          @click="openTransactionModal('alquiler')"
        >
          Alquilar
        </button>
        <button v-if="!isNew" class="btn-secondary btn-sell" @click="openTransactionModal('venta')">
          Vender
        </button>
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.save') }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ $t('admin.vehiculosIndex.loadingDetail') }}</span>
    </div>

    <!-- Form -->
    <form v-else class="vehicle-form" @submit.prevent="handleSave">
      <!-- Status selector -->
      <AdminVehiculoStatusBar
        :status="form.status"
        :featured="form.featured"
        :status-options="statusOptions"
        @update:status="form.status = $event"
        @update:featured="form.featured = $event"
      />

      <!-- Images -->
      <AdminVehiculoImages
        :images="formImages"
        @upload="handleImageUpload"
        @remove="removeImage"
        @drag-start="handleDragStart"
        @drop="handleDrop"
      />

      <!-- Form fields (category, basic info, prices, location, description, financial) -->
      <AdminVehiculoFormFields
        :form="form"
        :category-options="categoryOptions"
        :subcategories="subcategories"
        :selected-subcategory-id="selectedSubcategoryId"
        :types="types"
        :locale="locale"
        @update:form="form = $event"
        @update:selected-subcategory-id="selectedSubcategoryId = $event"
      />

      <!-- Dynamic filters (based on type) -->
      <AdminVehiculoDynamicFilters
        :filters="activeFilters"
        :attributes-json="form.attributes_json"
        @update:attributes-json="form.attributes_json = $event"
      />

      <!-- Error display -->
      <div v-if="error" class="form-error">
        {{ error }}
      </div>
    </form>

    <!-- Transaction modal (Venta / Alquiler) -->
    <AdminVehiculoTransactionModal
      :visible="showTransactionModal"
      :tab="txTab"
      :sell-form="sellForm"
      :rental-form="rentalForm"
      :saving="saving"
      :acquisition-cost="form.acquisition_cost"
      :format-currency="formatCurrency"
      :calc-beneficio="calcBeneficio"
      @close="showTransactionModal = false"
      @update:tab="txTab = $event"
      @update:sell-form="sellForm = $event"
      @update:rental-form="rentalForm = $event"
      @sell="handleSell"
      @rent="handleRent"
    />
  </div>
</template>

<script setup lang="ts">
import {
  useAdminVehicleDetail,
  statusOptions,
  categoryOptions,
} from '~/composables/admin/useAdminVehicleDetail'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { locale } = useI18n()
const route = useRoute()

const vehicleIdParam = computed(() => String(route.params.id))

const {
  // State
  loading,
  saving,
  error,
  isNew,
  form,
  formImages,

  // Transaction modal
  showTransactionModal,
  txTab,
  sellForm,
  rentalForm,

  // DB-loaded options
  subcategories,
  selectedSubcategoryId,
  types,
  activeFilters,

  // Helpers
  formatCurrency,
  calcBeneficio,

  // Actions
  openTransactionModal,
  handleSave,
  handleSell,
  handleRent,
  handleImageUpload,
  removeImage,
  handleDragStart,
  handleDrop,

  // Init
  init,
} = useAdminVehicleDetail(vehicleIdParam)

onMounted(() => {
  init()
})
</script>

<style scoped>
.vehicle-form-page {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-3);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius);
  min-height: 44px;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12);
  gap: var(--spacing-4);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Form */
.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* Error */
.form-error {
  padding: var(--spacing-4);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

/* Button variants */
.btn-sell {
  background: var(--color-primary, #23424a) !important;
  color: var(--color-white) !important;
}

.btn-rent {
  border-color: #2563eb !important;
  color: #2563eb !important;
}

.btn-rent:hover {
  background: #eff6ff !important;
}
</style>
