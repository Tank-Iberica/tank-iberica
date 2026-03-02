<script setup lang="ts">
/**
 * Visit Management Tool
 * Dealers can configure availability time slots and manage visit bookings.
 * Logic delegated to useDashboardVisitas composable.
 * UI split into VisitasHeader, VisitasSlotConfig, VisitasBookingsTable.
 */
import { useDashboardVisitas } from '~/composables/dashboard/useDashboardVisitas'
import type { SlotFormData, BookingStatus } from '~/composables/dashboard/useDashboardVisitas'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  loading,
  saving,
  error,
  successMsg,
  visitsEnabled,
  slotForm,
  sortedSlots,
  upcomingBookings,
  isSlotFormValid,
  init,
  addSlot,
  deleteSlot,
  updateBookingStatus,
  updateSlotFormField,
} = useDashboardVisitas()

// --- Event handlers ---

function onToggleVisits(value: boolean) {
  visitsEnabled.value = value
}

function onUpdateForm(field: keyof SlotFormData, value: string | number) {
  updateSlotFormField(field, value)
}

function onUpdateStatus(bookingId: string, status: BookingStatus) {
  updateBookingStatus(bookingId, status)
}

// --- Lifecycle ---

onMounted(() => {
  init()
})
</script>

<template>
  <div class="visits-page">
    <!-- Page Header -->
    <DashboardHerramientasVisitasVisitasHeader
      :visits-enabled="visitsEnabled"
      @toggle-visits="onToggleVisits"
    />

    <!-- Success -->
    <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <template v-else-if="visitsEnabled">
      <!-- Time Slots Configuration -->
      <DashboardHerramientasVisitasVisitasSlotConfig
        :sorted-slots="sortedSlots"
        :form-data="slotForm"
        :is-form-valid="isSlotFormValid"
        :saving="saving"
        @add-slot="addSlot"
        @delete-slot="deleteSlot"
        @update-form="onUpdateForm"
      />

      <!-- Upcoming Bookings -->
      <DashboardHerramientasVisitasVisitasBookingsTable
        :bookings="upcomingBookings"
        :saving="saving"
        @update-status="onUpdateStatus"
      />
    </template>

    <!-- Visits disabled state -->
    <div v-else class="disabled-state">
      <p>{{ t('visits.disabledMessage') }}</p>
    </div>
  </div>
</template>

<style scoped>
.visits-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

/* Alerts */
.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.alert-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, #dcfce7);
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-size: var(--font-size-sm);
}

/* Disabled state */
.disabled-state {
  padding: var(--spacing-12) var(--spacing-5);
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.disabled-state p {
  margin: 0;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 60px var(--spacing-5);
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

/* Responsive */
@media (min-width: 768px) {
  .visits-page {
    padding: var(--spacing-6);
    gap: var(--spacing-5);
  }
}

@media (min-width: 1024px) {
  .visits-page {
    padding: var(--spacing-8);
  }
}
</style>
