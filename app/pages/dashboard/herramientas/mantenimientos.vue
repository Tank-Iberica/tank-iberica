<script setup lang="ts">
/**
 * Maintenance Records Tool
 * CRUD for maintenance_records table scoped to dealer.
 * Plan: Basico+
 */
import { useDashboardMantenimientos } from '~/composables/dashboard/useDashboardMantenimientos'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  // State
  vehicleOptions,
  loading,
  saving,
  error,
  successMsg,
  filterVehicle,
  filterType,
  sortCol,
  sortAsc,
  showForm,
  editingId,
  form,
  showDeleteModal,
  deleteTarget,
  // Computed
  sortedRecords,
  summaryTotalCostThisYear,
  summaryTotalRecords,
  summaryAvgCost,
  isFormValid,
  // Functions
  loadData,
  openCreateForm,
  openEditForm,
  handleSave,
  confirmDelete,
  handleDelete,
  toggleSort,
  getSortIcon,
  exportCSV,
  fmt,
  fmtDate,
  fmtKm,
  getTypeBadgeClass,
  clearFilters,
  updateForm,
  // Dependencies
  canExport,
  fetchSubscription,
} = useDashboardMantenimientos()

onMounted(async () => {
  await Promise.all([loadData(), fetchSubscription()])
})
</script>

<template>
  <div class="maintenance-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.tools.maintenance.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.tools.maintenance.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportCSV">
          {{ t('dashboard.tools.maintenance.exportCSV') }}
        </button>
        <button class="btn-primary" @click="openCreateForm">
          + {{ t('dashboard.tools.maintenance.addRecord') }}
        </button>
      </div>
    </header>

    <!-- Plan gate -->
    <div v-if="!canExport" class="plan-gate">
      <div class="gate-icon">&#128274;</div>
      <h2>{{ t('dashboard.tools.maintenance.planRequired') }}</h2>
      <p>{{ t('dashboard.tools.maintenance.planRequiredDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
        {{ t('dashboard.tools.maintenance.upgradePlan') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Success -->
      <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Summary Cards -->
      <DashboardHerramientasMantenimientosMantenimientosSummaryCards
        :summary-total-cost-this-year="summaryTotalCostThisYear"
        :summary-total-records="summaryTotalRecords"
        :summary-avg-cost="summaryAvgCost"
        :fmt="fmt"
      />

      <!-- Filters -->
      <DashboardHerramientasMantenimientosMantenimientosFilters
        :filter-vehicle="filterVehicle"
        :filter-type="filterType"
        :vehicle-options="vehicleOptions"
        @update:filter-vehicle="filterVehicle = $event"
        @update:filter-type="filterType = $event"
        @clear="clearFilters"
      />

      <!-- Table -->
      <DashboardHerramientasMantenimientosMantenimientosTable
        :records="sortedRecords"
        :loading="loading"
        :sort-col="sortCol"
        :sort-asc="sortAsc"
        :get-sort-icon="getSortIcon"
        :fmt="fmt"
        :fmt-date="fmtDate"
        :fmt-km="fmtKm"
        :get-type-badge-class="getTypeBadgeClass"
        @toggle-sort="toggleSort"
        @edit="openEditForm"
        @delete="confirmDelete"
        @create="openCreateForm"
      />

      <!-- Create/Edit Form Modal -->
      <DashboardHerramientasMantenimientosMantenimientosFormModal
        :show="showForm"
        :editing-id="editingId"
        :form="form"
        :vehicle-options="vehicleOptions"
        :is-form-valid="isFormValid"
        :saving="saving"
        @save="handleSave"
        @close="showForm = false"
        @update:form="updateForm"
      />

      <!-- Delete Confirmation Modal -->
      <DashboardHerramientasMantenimientosMantenimientosDeleteModal
        :show="showDeleteModal"
        :delete-target="deleteTarget"
        :saving="saving"
        :fmt="fmt"
        :fmt-date="fmtDate"
        @confirm="handleDelete"
        @close="showDeleteModal = false"
      />
    </template>
  </div>
</template>

<style scoped>
.maintenance-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Plan gate */
.plan-gate {
  text-align: center;
  padding: 48px 20px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.gate-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.plan-gate h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.plan-gate p {
  margin: 0 0 20px;
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  gap: 6px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.9rem;
}

.alert-success {
  padding: 12px 16px;
  background: var(--color-success-bg, #dcfce7);
  border: 1px solid var(--color-success-border);
  border-radius: 8px;
  color: var(--color-success);
  font-size: 0.9rem;
}

/* Responsive */
@media (min-width: 768px) {
  .maintenance-page {
    padding: 24px;
    gap: 20px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
