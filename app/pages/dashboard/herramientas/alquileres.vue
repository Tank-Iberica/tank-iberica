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
      <div v-if="loading" class="loading-state" aria-busy="true">
        <UiSkeletonCard :lines="4" />
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
  max-width: 75rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
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
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

/* Plan gate */
.plan-gate {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-5);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

.gate-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
}

.plan-gate h2 {
  margin: 0 0 var(--spacing-2);
  font-size: 1.2rem;
  color: var(--text-primary);
}

.plan-gate p {
  margin: 0 0 var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-5);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  gap: 0.375rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-4);
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

/* Alerts */
.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.9rem;
}

.alert-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-size: 0.9rem;
}

/* Ending soon alerts */
.ending-soon-alert {
  padding: var(--spacing-4);
  background: var(--color-warning-bg, var(--color-warning-bg));
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-md);
}

.ending-soon-alert strong {
  display: block;
  margin-bottom: var(--spacing-2);
  color: var(--color-warning-text);
  font-size: 0.9rem;
}

.ending-soon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
  font-size: 0.85rem;
  color: var(--color-warning-text);
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
  border-radius: var(--border-radius);
  overflow: hidden;
  align-self: flex-start;
}

.toggle-btn {
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-5);
  border: none;
  background: var(--bg-primary);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--border-color-light);
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
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
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
  gap: var(--spacing-4);
}

/* Empty state */
.empty-state {
  padding: var(--spacing-12) var(--spacing-5);
  text-align: center;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0 0 var(--spacing-4);
}

/* Responsive */
@media (min-width: 30em) {
  .rental-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 48em) {
  .rentals-page {
    padding: var(--spacing-6);
    gap: var(--spacing-5);
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

@media (min-width: 64em) {
  .rental-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
