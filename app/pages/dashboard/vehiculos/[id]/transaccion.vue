<script setup lang="ts">
/**
 * Rent / Sell Transaction Page
 * Critical business flow for fleet dealers.
 * Two tabs: Rent (register a rental) and Sell (archive vehicle with sale).
 */
import { useDashboardTransaccion } from '~/composables/dashboard/useDashboardTransaccion'
import type { RentFormField, SellFormField } from '~/composables/dashboard/useDashboardTransaccion'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const route = useRoute()
const vehicleId = route.params.id as string

const {
  activeTab,
  loading,
  submitting,
  error,
  successMessage,
  vehicle,
  rentForm,
  sellForm,
  vehicleTitle,
  totalCost,
  estimatedBenefit,
  init,
  submitRental,
  submitSale,
} = useDashboardTransaccion(vehicleId)

onMounted(init)

function onRentUpdate(field: RentFormField, value: string | number): void {
  if (field === 'amount') {
    rentForm.value[field] = value as number
  } else {
    rentForm.value[field] = value as string
  }
}

function onSellUpdate(field: SellFormField, value: string | number | boolean): void {
  if (field === 'sale_price') {
    sellForm.value[field] = value as number
  } else if (field === 'exportacion') {
    sellForm.value[field] = value as boolean
  } else {
    sellForm.value[field] = value as string
  }
}
</script>

<template>
  <div class="transaction-page">
    <TransaccionHeader :vehicle-id="vehicleId" :vehicle-title="vehicleTitle" />

    <!-- Loading -->
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard :lines="5" />
    </div>

    <!-- Error when vehicle not found -->
    <div v-else-if="!vehicle" class="alert-error">
      {{ error || $t('dashboard.vehicles.notFound') }}
    </div>

    <!-- Main content -->
    <div v-else class="transaction-content">
      <!-- Alerts -->
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>

      <TransaccionTabSwitcher :active-tab="activeTab" @select="activeTab = $event" />

      <!-- Rent Tab -->
      <TransaccionRentForm
        v-if="activeTab === 'rent'"
        :from-date="rentForm.from_date"
        :to-date="rentForm.to_date"
        :client-name="rentForm.client_name"
        :client-contact="rentForm.client_contact"
        :amount="rentForm.amount"
        :invoice-url="rentForm.invoice_url"
        :notes="rentForm.notes"
        :submitting="submitting"
        :vehicle-id="vehicleId"
        @update="onRentUpdate"
        @submit="submitRental"
      />

      <!-- Sell Tab -->
      <TransaccionSellForm
        v-if="activeTab === 'sell'"
        :sale-date="sellForm.sale_date"
        :buyer-name="sellForm.buyer_name"
        :buyer-contact="sellForm.buyer_contact"
        :sale-price="sellForm.sale_price"
        :invoice-url="sellForm.invoice_url"
        :exportacion="sellForm.exportacion"
        :submitting="submitting"
        :vehicle-id="vehicleId"
        :total-cost="totalCost"
        :estimated-benefit="estimatedBenefit"
        @update="onSellUpdate"
        @submit="submitSale"
      />
    </div>
  </div>
</template>

<style scoped>
.transaction-page {
  max-width: 50rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

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

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.alert-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
}

.transaction-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

@media (min-width: 48em) {
  .transaction-page {
    padding: var(--spacing-6);
  }
}
</style>
