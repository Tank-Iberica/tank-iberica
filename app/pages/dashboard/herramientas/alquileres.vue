<script setup lang="ts">
import { useDashboardAlquileres } from '~/composables/dashboard/useDashboardAlquileres'

/**
 * Rental Records Tool
 * CRUD for rental_records table scoped to dealer.
 * Plan: Basico+
 *
 * All business logic lives in useDashboardAlquileres composable.
 * Template sections are delegated to subcomponents.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  // State
  loading,
  saving,
  error,
  successMsg,
  viewMode,
  showForm,
  editingId,
  form,
  vehicleOptions,
  showDeleteModal,
  deleteTarget,

  // Computed
  totalActiveRentals,
  totalMonthlyIncome,
  endingSoonRentals,
  vehiclesAvailableSoon,
  sortedRecords,
  isFormValid,

  // Functions
  openCreateForm,
  openEditForm,
  handleSave,
  confirmDelete,
  handleDelete,
  exportCSV,
  fmt,
  fmtDate,
  getStatusClass,
  isEndingSoon,
  daysUntilEnd,
  loadData,

  // Dependencies
  canExport,
  fetchSubscription,
} = useDashboardAlquileres()

// ---------- Lifecycle ----------

onMounted(async () => {
  await Promise.all([loadData(), fetchSubscription()])
})

function onFormClose() {
  showForm.value = false
}

function onDeleteClose() {
  showDeleteModal.value = false
}
</script>

<template>
  <div class="rentals-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.tools.rentals.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.tools.rentals.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportCSV">
          {{ t('dashboard.tools.rentals.exportCSV') }}
        </button>
        <button class="btn-primary" @click="openCreateForm">
          + {{ t('dashboard.tools.rentals.addRental') }}
        </button>
      </div>
    </header>

    <!-- Plan gate -->
    <div v-if="!canExport" class="plan-gate">
      <div class="gate-icon">&#128274;</div>
      <h2>{{ t('dashboard.tools.rentals.planRequired') }}</h2>
      <p>{{ t('dashboard.tools.rentals.planRequiredDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
        {{ t('dashboard.tools.rentals.upgradePlan') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Success -->
      <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Summary Cards -->
      <DashboardHerramientasAlquileresAlquilerSummaryCards
        :total-active-rentals="totalActiveRentals"
        :total-monthly-income="totalMonthlyIncome"
        :vehicles-available-soon="vehiclesAvailableSoon"
        :fmt="fmt"
      />

      <!-- Ending Soon Alerts -->
      <div v-if="endingSoonRentals.length > 0" class="ending-soon-alert">
        <strong>{{ t('dashboard.tools.rentals.endingSoonTitle') }}</strong>
        <div v-for="r in endingSoonRentals" :key="r.id" class="ending-soon-item">
          <span>{{ r.vehicle_brand }} {{ r.vehicle_model }} &mdash; {{ r.client_name }}</span>
          <span class="days-remaining">
            {{ daysUntilEnd(r) }} {{ t('dashboard.tools.rentals.daysLeft') }}
          </span>
        </div>
      </div>

      <!-- View toggle -->
      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'cards' }"
          @click="viewMode = 'cards'"
        >
          {{ t('dashboard.tools.rentals.viewCards') }}
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'table' }"
          @click="viewMode = 'table'"
        >
          {{ t('dashboard.tools.rentals.viewTable') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <!-- Card View -->
      <div v-else-if="viewMode === 'cards'">
        <div v-if="sortedRecords.length === 0" class="empty-state">
          <p>{{ t('dashboard.tools.rentals.empty') }}</p>
          <button class="btn-primary" @click="openCreateForm">
            + {{ t('dashboard.tools.rentals.addFirst') }}
          </button>
        </div>

        <div v-else class="rental-cards-grid">
          <DashboardHerramientasAlquileresAlquilerCard
            v-for="r in sortedRecords"
            :key="r.id"
            :record="r"
            :is-ending-soon="isEndingSoon"
            :days-until-end="daysUntilEnd"
            :get-status-class="getStatusClass"
            :fmt="fmt"
            :fmt-date="fmtDate"
            @edit="openEditForm"
            @delete="confirmDelete"
          />
        </div>
      </div>

      <!-- Table View -->
      <DashboardHerramientasAlquileresAlquilerTable
        v-else-if="viewMode === 'table'"
        :sorted-records="sortedRecords"
        :get-status-class="getStatusClass"
        :fmt="fmt"
        :fmt-date="fmtDate"
        :is-ending-soon="isEndingSoon"
        :days-until-end="daysUntilEnd"
        @edit="openEditForm"
        @delete="confirmDelete"
      />

      <!-- Create/Edit Form Modal -->
      <DashboardHerramientasAlquileresAlquilerFormModal
        :show="showForm"
        :editing-id="editingId"
        :form="form"
        :vehicle-options="vehicleOptions"
        :is-form-valid="isFormValid"
        :saving="saving"
        @save="handleSave"
        @close="onFormClose"
        @update:form="Object.assign(form, $event)"
      />

      <!-- Delete Confirmation Modal -->
      <DashboardHerramientasAlquileresAlquilerDeleteModal
        :show="showDeleteModal"
        :delete-target="deleteTarget"
        :saving="saving"
        @confirm="handleDelete"
        @close="onDeleteClose"
      />
    </template>
  </div>
</template>

<style scoped>
.rentals-page {
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

/* Ending soon alerts */
.ending-soon-alert {
  padding: 16px;
  background: var(--color-warning-bg, #fef3c7);
  border: 1px solid #fbbf24;
  border-radius: 12px;
}

.ending-soon-alert strong {
  display: block;
  margin-bottom: 8px;
  color: var(--color-warning-text);
  font-size: 0.9rem;
}

.ending-soon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.85rem;
  color: #78350f;
}

.days-remaining {
  font-weight: 700;
  color: var(--color-error);
}

/* View toggle */
.view-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
  align-self: flex-start;
}

.toggle-btn {
  min-height: 44px;
  padding: 10px 20px;
  border: none;
  background: var(--bg-primary);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid #e5e7eb;
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Rental Cards Grid */
.rental-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Empty state */
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0 0 16px;
}

/* Responsive */
@media (min-width: 480px) {
  .rental-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .rentals-page {
    padding: 24px;
    gap: 20px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .rental-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
