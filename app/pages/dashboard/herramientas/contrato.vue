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
      <div class="loading-state">
        <div class="spinner" />
        <p>{{ t('dashboard.tools.contract.loading') }}</p>
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
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}

/* Header */
.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #23424a;
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
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}

.tab:hover {
  color: #23424a;
}

.tab.active {
  color: #23424a;
  border-bottom-color: #23424a;
}

.tab-count {
  background: #23424a;
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

/* Tool Content */
.tool-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tool-header {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

/* Contract Form */
.contract-form {
  padding: 20px;
}

.divider {
  border: none;
  border-top: 2px solid #0f2a2e;
  margin: 20px 0;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.btn:hover {
  background: #f9fafb;
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
  border: none;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.8rem;
  min-height: 36px;
}

/* ========================= Mobile-first responsive ========================= */
@media (max-width: 768px) {
  .contract-page {
    padding: 12px;
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
    padding: 12px 16px;
    font-size: 0.85rem;
  }
}
</style>
