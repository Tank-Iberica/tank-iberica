<script setup lang="ts">
/**
 * Quote/Budget Generator (Free plan)
 * Generates professional PDF quotes with dealer branding, vehicle info,
 * optional services, and saves to dealer_quotes table.
 */
import { useDashboardPresupuesto } from '~/composables/dashboard/useDashboardPresupuesto'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  loading,
  saving,
  generatingPdf,
  error,
  successMessage,
  searchQuery,
  showDropdown,
  selectedVehicle,
  clientName,
  paymentConditions,
  validityDays,
  quoteNumber,
  optionalServices,
  vehiclePrice,
  totalAmount,
  filteredVehicles,
  vehicleThumbnail,
  vehicleTitle,
  init,
  selectVehicle,
  clearVehicle,
  generatePdf,
  saveQuote,
  handleSearchFocus,
  handleSearchBlur,
  toggleService,
  updateServiceAmount,
} = useDashboardPresupuesto()

onMounted(init)
</script>

<template>
  <div class="quote-page">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">
        {{ t('dashboard.quote.backToDashboard') }}
      </NuxtLink>
      <h1>{{ t('dashboard.quote.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.quote.subtitle') }}</p>
    </header>

    <!-- Error / Success -->
    <div v-if="error" class="alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <!-- Quote number -->
      <div class="quote-number-bar">
        <span class="quote-number-label">{{ t('dashboard.quote.quoteNumber') }}:</span>
        <span class="quote-number-value">{{ quoteNumber }}</span>
      </div>

      <!-- Vehicle selector -->
      <PresupuestoVehicleSelector
        :search-query="searchQuery"
        :show-dropdown="showDropdown"
        :selected-vehicle="selectedVehicle"
        :filtered-vehicles="filteredVehicles"
        :vehicle-thumbnail="vehicleThumbnail"
        :vehicle-title="vehicleTitle"
        :vehicle-price="vehiclePrice"
        @update:search-query="searchQuery = $event"
        @select="selectVehicle"
        @clear="clearVehicle"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
      />

      <!-- Client name -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.clientName') }}</h2>
        <input
          type="text"
          class="input-field"
          :value="clientName"
          :placeholder="t('dashboard.quote.clientNamePlaceholder')"
          @input="clientName = ($event.target as HTMLInputElement).value"
        >
      </section>

      <!-- Optional services -->
      <PresupuestoServicesList
        :services="optionalServices"
        @toggle="toggleService"
        @update-amount="updateServiceAmount"
      />

      <!-- Payment conditions -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.paymentConditions') }}</h2>
        <textarea
          class="input-field textarea-field"
          rows="3"
          :value="paymentConditions"
          @input="paymentConditions = ($event.target as HTMLTextAreaElement).value"
        />
      </section>

      <!-- Validity -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.validityDays') }}</h2>
        <input
          type="number"
          min="1"
          max="90"
          class="input-field input-narrow"
          :value="validityDays"
          @input="validityDays = Number(($event.target as HTMLInputElement).value) || 1"
        >
      </section>

      <!-- Total -->
      <PresupuestoTotalCard :total-amount="totalAmount" />

      <!-- Actions -->
      <PresupuestoActions
        :generating-pdf="generatingPdf"
        :saving="saving"
        @generate-pdf="generatePdf"
        @save-quote="saveQuote"
      />
    </template>
  </div>
</template>

<style scoped>
.quote-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.back-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 0.9rem;
}

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Quote number bar */
.quote-number-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.quote-number-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.quote-number-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  font-variant-numeric: tabular-nums;
}

/* Inline form sections kept in page */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  background: white;
  min-height: 44px;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.textarea-field {
  resize: vertical;
  min-height: 80px;
}

.input-narrow {
  max-width: 120px;
}

/* Responsive */
@media (min-width: 768px) {
  .quote-page {
    padding: 24px;
  }
}
</style>
