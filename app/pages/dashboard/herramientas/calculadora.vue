<script setup lang="ts">
/**
 * Calculator page with 3 tabs:
 * 1. Rental Profitability
 * 2. Financing simulator
 * 3. Total cost of ownership
 */
import { useDashboardCalculadora } from '~/composables/dashboard/useDashboardCalculadora'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  LazyLine,
  activeTab,
  tabs,
  purchasePrice,
  monthlyRent,
  annualInsurance,
  annualMaintenance,
  annualTaxes,
  hasValidInputs,
  grossAnnualIncome,
  annualCosts,
  netAnnualProfit,
  monthsToRecover,
  annualRoi,
  breakEvenMonth,
  residualValue3y,
  totalProfitability3y,
  chartData,
  chartOptions,
  finVehiclePrice,
  finDownPaymentPct,
  finInterestRate,
  finTermMonths,
  termOptions,
  finDownPaymentAmount,
  hasValidFinancing,
  financingResult,
  amortizationPreview,
  tcPurchasePrice,
  tcYears,
  tcInsuranceEstimate,
  tcMaintenanceEstimate,
  selectedComunidad,
  itpRates,
  hasValidTotalCost,
  itpRate,
  itpAmount,
  totalCostResult,
  autoEstimate,
  formatMonths,
  printResults,
} = useDashboardCalculadora()
</script>

<template>
  <div class="calculator-page">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">
        {{ t('dashboard.calculator.backToDashboard') }}
      </NuxtLink>
      <h1>{{ t('dashboard.calculator.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.calculator.subtitle') }}</p>
    </header>

    <!-- Tab bar -->
    <nav class="tab-bar" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        class="tab-button"
        :class="{ 'tab-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Tab 1: Profitability -->
    <CalculadoraProfitabilityTab
      v-if="activeTab === 'profitability'"
      :purchase-price="purchasePrice"
      :monthly-rent="monthlyRent"
      :annual-insurance="annualInsurance"
      :annual-maintenance="annualMaintenance"
      :annual-taxes="annualTaxes"
      :has-valid-inputs="hasValidInputs"
      :gross-annual-income="grossAnnualIncome"
      :annual-costs="annualCosts"
      :net-annual-profit="netAnnualProfit"
      :months-to-recover="monthsToRecover"
      :annual-roi="annualRoi"
      :break-even-month="breakEvenMonth"
      :residual-value3y="residualValue3y"
      :total-profitability3y="totalProfitability3y"
      :chart-data="chartData"
      :chart-options="chartOptions"
      :lazy-line-component="LazyLine"
      :format-months="formatMonths"
      :month-label="t('dashboard.calculator.month')"
      :annual-taxes-label="t('dashboard.calculator.annualTaxes')"
      @update:purchase-price="purchasePrice = $event"
      @update:monthly-rent="monthlyRent = $event"
      @update:annual-insurance="annualInsurance = $event"
      @update:annual-maintenance="annualMaintenance = $event"
      @update:annual-taxes="annualTaxes = $event"
      @print="printResults"
    />

    <!-- Tab 2: Financing -->
    <CalculadoraFinancingTab
      v-if="activeTab === 'financing'"
      :fin-vehicle-price="finVehiclePrice"
      :fin-down-payment-pct="finDownPaymentPct"
      :fin-interest-rate="finInterestRate"
      :fin-term-months="finTermMonths"
      :term-options="termOptions"
      :fin-down-payment-amount="finDownPaymentAmount"
      :has-valid-financing="hasValidFinancing"
      :financing-result="financingResult"
      :amortization-preview="amortizationPreview"
      @update:fin-vehicle-price="finVehiclePrice = $event"
      @update:fin-down-payment-pct="finDownPaymentPct = $event"
      @update:fin-interest-rate="finInterestRate = $event"
      @update:fin-term-months="finTermMonths = $event"
      @print="printResults"
    />

    <!-- Tab 3: Total Cost -->
    <CalculadoraTotalCostTab
      v-if="activeTab === 'totalCost'"
      :tc-purchase-price="tcPurchasePrice"
      :tc-years="tcYears"
      :tc-insurance-estimate="tcInsuranceEstimate"
      :tc-maintenance-estimate="tcMaintenanceEstimate"
      :selected-comunidad="selectedComunidad"
      :itp-rates="itpRates"
      :has-valid-total-cost="hasValidTotalCost"
      :itp-rate="itpRate"
      :itp-amount="itpAmount"
      :total-cost-result="totalCostResult"
      :year-label="t('dashboard.calculator.year')"
      :years-label="t('dashboard.calculator.years')"
      @update:tc-purchase-price="tcPurchasePrice = $event"
      @update:tc-years="tcYears = $event"
      @update:tc-insurance-estimate="tcInsuranceEstimate = $event"
      @update:tc-maintenance-estimate="tcMaintenanceEstimate = $event"
      @update:selected-comunidad="selectedComunidad = $event"
      @auto-estimate="autoEstimate"
      @print="printResults"
    />
  </div>
</template>

<style scoped>
.calculator-page {
  max-width: 900px;
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

/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  flex: 1;
  min-width: 0;
  padding: 12px 8px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition:
    color 0.2s,
    border-color 0.2s;
  text-align: center;
}

.tab-button:hover {
  color: var(--color-primary, #23424a);
}

.tab-active {
  color: var(--color-primary, #23424a);
  border-bottom-color: var(--color-primary, #23424a);
}

/* Print styles */
@media print {
  .back-link,
  .tab-bar {
    display: none;
  }

  .calculator-page {
    padding: 0;
  }
}

/* Responsive */
@media (min-width: 480px) {
  .tab-button {
    font-size: 0.95rem;
    padding: 12px 16px;
  }
}

@media (min-width: 768px) {
  .calculator-page {
    padding: 24px;
  }
}
</style>
