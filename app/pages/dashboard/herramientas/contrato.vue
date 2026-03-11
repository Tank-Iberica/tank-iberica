<script setup lang="ts">
/**
 * Dealer Contract Generator Page
 * Adapted from admin/utilidades.vue contract generator.
 * Supports arrendamiento (rental) and compraventa (sale) contracts.
 * Plan gate: basic+ required. Free users see upgrade prompt.
 */
import { useDashboardContrato } from '~/composables/dashboard/useDashboardContrato'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  hasAccess,
  currentPlan,
  activeTab,
  showHistory,
  loading,
  saving,
  saveError,
  saveSuccess,
  contractType,
  contractDate,
  contractLocation,
  lessorRepresentative,
  lessorRepresentativeNIF,
  lessorCompany,
  lessorCIF,
  lessorAddress,
  clientType,
  clientName,
  clientNIF,
  clientCompany,
  clientCIF,
  clientRepresentative,
  clientRepresentativeNIF,
  clientAddress,
  contractVehicle,
  contractVehicleType,
  contractVehiclePlate,
  contractVehicleResidualValue,
  vehicleOptions,
  loadingVehicles,
  onContractVehicleSelected,
  contractMonthlyRent,
  contractDeposit,
  contractDuration,
  contractDurationUnit,
  contractPaymentDays,
  contractHasPurchaseOption,
  contractPurchasePrice,
  contractPurchaseNotice,
  contractRentMonthsToDiscount,
  contractSalePrice,
  contractSalePaymentMethod,
  contractSaleDeliveryConditions,
  contractSaleWarranty,
  contractJurisdiction,
  contracts,
  loadingHistory,
  historyError,
  updateContractStatus,
  generateContract,
  resetForm,
  init,
  hasDraft,
  restoreDraft,
  clearDraft,
} = useDashboardContrato()

useHead({ title: t('dashboard.tools.contract.title') })

onMounted(init)
</script>

<template>
  <div class="contract-page">
    <!-- Plan Gate: Upgrade prompt for free users -->
    <template v-if="!loading && !hasAccess">
      <DashboardHerramientasContratoContratoUpgradeGate :current-plan="currentPlan" />
    </template>

    <!-- Loading -->
    <template v-else-if="loading">
      <div class="loading-state" aria-busy="true">
        <UiSkeletonCard :lines="5" />
      </div>
    </template>

    <!-- Main content -->
    <template v-else>
      <header class="page-header">
        <div class="header-left">
          <h1>{{ t('dashboard.tools.contract.title') }}</h1>
          <p class="subtitle">{{ t('dashboard.tools.contract.subtitle') }}</p>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'nuevo' }" @click="activeTab = 'nuevo'">
          {{ t('dashboard.tools.contract.tabNew') }}
        </button>
        <button class="tab" :class="{ active: activeTab === 'historial' }" @click="showHistory()">
          {{ t('dashboard.tools.contract.tabHistory') }}
          <span v-if="contracts.length" class="tab-count">{{ contracts.length }}</span>
        </button>
      </div>

      <!-- Draft restore banner -->
      <div v-if="hasDraft && activeTab === 'nuevo'" class="draft-banner" role="alert">
        <span>{{ t('common.draftFound') }}</span>
        <div class="draft-banner__actions">
          <button class="btn btn-sm btn-primary" @click="restoreDraft">
            {{ t('common.draftRestore') }}
          </button>
          <button class="btn btn-sm btn-ghost" @click="clearDraft">
            {{ t('common.draftDiscard') }}
          </button>
        </div>
      </div>

      <!-- ==================== NEW CONTRACT ==================== -->
      <div v-if="activeTab === 'nuevo'" class="tool-content">
        <div class="tool-header">
          <h2>{{ t('dashboard.tools.contract.newContract') }}</h2>
          <button class="btn btn-secondary btn-sm" @click="resetForm">
            {{ t('dashboard.tools.contract.reset') }}
          </button>
        </div>

        <div class="contract-form">
          <!-- Contract Type Selector + Date + Location -->
          <DashboardHerramientasContratoContratoFormHeader
            :contract-type="contractType"
            :contract-date="contractDate"
            :contract-location="contractLocation"
            @update:contract-type="contractType = $event"
            @update:contract-date="contractDate = $event"
            @update:contract-location="contractLocation = $event"
          />

          <!-- Vehicle Selection -->
          <ContratoVehiculo
            v-model:contract-vehicle="contractVehicle"
            v-model:contract-vehicle-type="contractVehicleType"
            v-model:contract-vehicle-plate="contractVehiclePlate"
            :vehicle-options="vehicleOptions"
            :loading-vehicles="loadingVehicles"
            @vehicle-selected="onContractVehicleSelected"
          />

          <hr class="divider" >

          <!-- Parties (Lessor/Seller and Client/Buyer) -->
          <ContratoPartes
            v-model:lessor-representative="lessorRepresentative"
            v-model:lessor-representative-n-i-f="lessorRepresentativeNIF"
            v-model:lessor-company="lessorCompany"
            v-model:lessor-c-i-f="lessorCIF"
            v-model:lessor-address="lessorAddress"
            v-model:client-type="clientType"
            v-model:client-name="clientName"
            v-model:client-n-i-f="clientNIF"
            v-model:client-company="clientCompany"
            v-model:client-c-i-f="clientCIF"
            v-model:client-representative="clientRepresentative"
            v-model:client-representative-n-i-f="clientRepresentativeNIF"
            v-model:client-address="clientAddress"
            :contract-type="contractType"
          />

          <hr class="divider" >

          <!-- Rental Terms -->
          <ContratoTerminosArrendamiento
            v-if="contractType === 'arrendamiento'"
            v-model:monthly-rent="contractMonthlyRent"
            v-model:deposit="contractDeposit"
            v-model:payment-days="contractPaymentDays"
            v-model:duration="contractDuration"
            v-model:duration-unit="contractDurationUnit"
            v-model:residual-value="contractVehicleResidualValue"
            v-model:has-purchase-option="contractHasPurchaseOption"
            v-model:purchase-price="contractPurchasePrice"
            v-model:purchase-notice="contractPurchaseNotice"
            v-model:rent-months-to-discount="contractRentMonthsToDiscount"
          />

          <!-- Sale Terms -->
          <ContratoTerminosCompraventa
            v-if="contractType === 'compraventa'"
            v-model:sale-price="contractSalePrice"
            v-model:payment-method="contractSalePaymentMethod"
            v-model:delivery-conditions="contractSaleDeliveryConditions"
            v-model:warranty="contractSaleWarranty"
          />

          <hr class="divider" >

          <!-- Jurisdiction + Feedback + Generate Button -->
          <DashboardHerramientasContratoContratoFormActions
            :contract-jurisdiction="contractJurisdiction"
            :save-error="saveError"
            :save-success="saveSuccess"
            :saving="saving"
            @update:contract-jurisdiction="contractJurisdiction = $event"
            @generate="generateContract"
          />
        </div>
      </div>

      <!-- ==================== HISTORY ==================== -->
      <ContratoHistorial
        v-if="activeTab === 'historial'"
        :contracts="contracts"
        :loading="loadingHistory"
        :error="historyError"
        @update-status="updateContractStatus"
        @create-new="activeTab = 'nuevo'"
      />
    </template>
  </div>
</template>

<style scoped>
.contract-page {
  max-width: 56.25rem;
  margin: 0 auto;
  padding: var(--spacing-4);
}

/* Header */
.page-header {
  margin-bottom: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
}

.page-header h1 {
  margin: 0 0 var(--spacing-1);
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: var(--spacing-4);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border-color-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: var(--spacing-6);
  border-bottom: 2px solid var(--border-color-light);
}

.tab {
  padding: var(--spacing-3) var(--spacing-6);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -0.125rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-height: 2.75rem;
}

.tab:hover {
  color: var(--color-primary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-count {
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 0.7rem;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-md);
  min-width: 1.25rem;
  text-align: center;
}

/* Tool Content */
.tool-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tool-header {
  padding: var(--spacing-4) var(--spacing-5);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

/* Contract Form */
.contract-form {
  padding: var(--spacing-5);
}

.divider {
  border: none;
  border-top: 2px solid var(--color-primary-dark);
  margin: 1.25rem 0;
}

/* Buttons */
.btn {
  padding: 0.625rem var(--spacing-5);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  text-decoration: none;
}

.btn:hover {
  background: var(--color-gray-50);
}

.btn-secondary {
  background: var(--color-gray-500);
  color: var(--color-white);
  border: none;
}

.btn-secondary:hover {
  background: var(--color-gray-600);
}

.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.8rem;
  min-height: 2.25rem;
}

/* Draft banner */
.draft-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  padding: var(--spacing-3) var(--spacing-4);
  margin-bottom: var(--spacing-4);
  background: var(--color-amber-50, #fffbeb);
  border: 1px solid var(--color-amber-300, #fcd34d);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-amber-900, #78350f);
}

.draft-banner__actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-ghost:hover {
  background: var(--color-gray-50);
}

/* ========================= Mobile-first responsive ========================= */
@media (max-width: 48em) {
  .contract-page {
    padding: var(--spacing-3);
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .tabs {
    gap: 0;
  }

  .tab {
    flex: 1;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-4);
    font-size: 0.85rem;
  }
}
</style>
